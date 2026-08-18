const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const net = require('node:net');

const root = __dirname;
const distDir = path.join(root, 'dist');
const dataDir = process.env.DATA_DIR || path.join(root, 'data');
const dbFile = path.join(dataDir, 'business.json');
fs.mkdirSync(dataDir, { recursive: true });

const config = {
  phone: process.env.BUSINESS_PHONE || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  fromEmail: process.env.FROM_EMAIL || '',
  resendKey: process.env.RESEND_API_KEY || '',
  ownerEmail: process.env.OWNER_EMAIL || '',
  openaiKey: process.env.OPENAI_API_KEY || '',
};
const empty = () => ({ clients: [], messages: [], payments: [], reminders: [] });
let db = fs.existsSync(dbFile) ? JSON.parse(fs.readFileSync(dbFile, 'utf8')) : empty();
const sessions = new Map();
const loginAttempts = new Map();
const requestLimits = new Map();
const locationCache = new Map();
const isProduction = process.env.NODE_ENV === 'production';
const trustProxy = String(process.env.TRUST_PROXY || '').trim().toLowerCase() === 'true';
const secureCookies = isProduction || trustProxy;
const sessionLifetime = 8 * 60 * 60 * 1000;
const loginWindow = 15 * 60 * 1000;
const maxLoginAttempts = 5;
const publicWriteWindow = 15 * 60 * 1000;
const maxPublicWrites = 10;
const locationCacheLifetime = 6 * 60 * 60 * 1000;
const save = () => fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
const id = () => crypto.randomUUID();
const date = (d) => new Date(d).toISOString().slice(0, 10);
const plusYear = (d) => { const value = new Date(d || Date.now()); value.setFullYear(value.getFullYear() + 1); return date(value); };
const clean = (value) => String(value || '').trim().slice(0, 2000);
const cookies = (req) => Object.fromEntries((req.headers.cookie || '').split(';').map((value) => value.trim().split('=').map(decodeURIComponent)).filter((value) => value[0]));
const clientAddress = (req) => {
  // Only trust proxy-provided addresses when the app is deployed behind a proxy
  // configured by us. Trusting this header on a directly exposed server lets an
  // attacker pick a new IP address for every request.
  // Proxies append the immediate client address. Use the rightmost entry so a
  // forged value supplied earlier in X-Forwarded-For cannot pick the limiter key.
  if (trustProxy) return String(req.headers['x-forwarded-for'] || '').split(',').at(-1).trim() || req.socket.remoteAddress || 'unknown';
  return req.socket.remoteAddress || 'unknown';
};
const isPublicAddress = (value) => {
  const address = String(value || '').trim().replace(/^::ffff:/i, '');
  const type = net.isIP(address);
  if (!type) return false;
  if (type === 4) {
    const parts = address.split('.').map(Number);
    return parts[0] !== 0 && parts[0] !== 10 && parts[0] !== 127 && !(parts[0] === 169 && parts[1] === 254) && !(parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) && !(parts[0] === 192 && parts[1] === 168);
  }
  const normalized = address.toLowerCase();
  return normalized !== '::1' && normalized !== '::' && !normalized.startsWith('fc') && !normalized.startsWith('fd') && !normalized.startsWith('fe80:');
};
const viewerAddress = (req) => {
  if (!trustProxy) return req.socket.remoteAddress || '';
  // This endpoint is informational only. Prefer Cloudflare's visitor header,
  // then the first forwarded address, which is the original visitor.
  const cloudflareAddress = String(req.headers['cf-connecting-ip'] || '').trim();
  if (isPublicAddress(cloudflareAddress)) return cloudflareAddress;
  return String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
};
const locationFromProvider = async (address) => {
  const cached = locationCache.get(address);
  if (cached && cached.expiresAt > Date.now()) return cached.location;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3_500);
  try {
    const response = await fetch(`https://ipwho.is/${encodeURIComponent(address)}`, { signal: controller.signal });
    if (!response.ok) throw Error('Location provider unavailable');
    const data = await response.json();
    if (data.success === false || !data.city || !data.country_code) return null;
    const location = { city: data.city, region: data.region || '', regionCode: data.region_code || '', countryCode: data.country_code, latitude: Number(data.latitude), longitude: Number(data.longitude) };
    locationCache.set(address, { location, expiresAt: Date.now() + locationCacheLifetime });
    return location;
  } finally {
    clearTimeout(timeout);
  }
};
function authed(req) { const token = cookies(req).eb_session; const expiresAt = sessions.get(token); if (!expiresAt || expiresAt <= Date.now()) { sessions.delete(token); return false; } return true; }
function sessionCookie(token, maxAge = Math.floor(sessionLifetime / 1000)) { return `eb_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}; Priority=High${secureCookies ? '; Secure' : ''}`; }
function loginAllowed(req) { const attempt = loginAttempts.get(clientAddress(req)); return !attempt || attempt.until <= Date.now() || attempt.count < maxLoginAttempts; }
function recordFailedLogin(req) { const address = clientAddress(req); const attempt = loginAttempts.get(address); const active = attempt && attempt.until > Date.now() ? attempt : { count: 0, until: Date.now() + loginWindow }; loginAttempts.set(address, { count: active.count + 1, until: active.until }); }
function clearFailedLogins(req) { loginAttempts.delete(clientAddress(req)); }
function requestAllowed(req, scope, limit, window) { const key = `${scope}:${clientAddress(req)}`; const now = Date.now(); const existing = requestLimits.get(key); const active = existing && existing.until > now ? existing : { count: 0, until: now + window }; if (active.count >= limit) return false; requestLimits.set(key, { count: active.count + 1, until: active.until }); return true; }
function validSameOrigin(req) { const origin = req.headers.origin; return !origin || new URL(origin).host === req.headers.host; }

function json(res, status, body) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(body)); }
function body(req) { return new Promise((resolve, reject) => { let raw = ''; let size = 0; let done = false; const fail = (message, status = 400) => { if (!done) { done = true; const error = Error(message); error.status = status; reject(error); } }; if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) return fail('Invalid request'); if (Number(req.headers['content-length']) > 1e6) return fail('Request too large', 413); req.on('data', (chunk) => { if (done) return; size += chunk.length; if (size > 1e6) { fail('Request too large', 413); req.destroy(); return; } raw += chunk; }); req.on('end', () => { if (done) return; try { const parsed = raw ? JSON.parse(raw) : {}; done = true; resolve(parsed); } catch { fail('Invalid request'); } }); req.on('error', () => fail('Invalid request')); }); }
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp', '.woff2': 'font/woff2' };
function sendFile(res, file, cache = 'public, max-age=3600') { res.writeHead(200, { 'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': cache }); fs.createReadStream(file).pipe(res); }
function productionPage(res) { const file = path.join(distDir, 'index.html'); if (!fs.existsSync(file)) return json(res, 503, { error: 'Site is building. Please try again in a moment.' }); sendFile(res, file, 'no-store'); }
function summary() { return { clients: db.clients.slice().reverse(), messages: db.messages.slice().reverse(), payments: db.payments.slice().reverse(), reminders: db.reminders.slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate)) }; }

async function sendReminder(reminder) {
  const client = db.clients.find((item) => item.id === reminder.clientId);
  if (!client?.email) throw Error('This client has no email address.');
  if (reminder.sentAt) throw Error('This reminder has already been sent.');
  if (!config.resendKey || !config.fromEmail) return { sent: false, message: 'Reminder is due, but email is not configured yet.' };
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${config.resendKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: config.fromEmail, to: [client.email], subject: 'A friendly Easy Breezy service reminder', text: `Hi ${client.name},\n\nIt has been about a year since your ${reminder.service}. If you would like to schedule your next service, call ${config.phone}.\n\nEasy Breezy Air Duct Cleaning` }) });
  if (!response.ok) throw Error('Email provider rejected the reminder.');
  reminder.sentAt = new Date().toISOString();
  db.reminders.push({ id: id(), clientId: client.id, clientName: client.name, stateName: client.stateName, service: client.service, dueDate: plusYear(reminder.dueDate), sentAt: null });
  save();
  return { sent: true, message: 'Reminder email sent. The next annual reminder has been scheduled.' };
}

async function notifyOwner(subject, lines) {
  if (!config.resendKey || !config.fromEmail || !config.ownerEmail) return;
  try {
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${config.resendKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: config.fromEmail, to: [config.ownerEmail], subject, text: lines.filter(Boolean).join('\n') }) });
    if (!response.ok) console.error('Owner notification email was rejected by the provider.');
  } catch (error) { console.error('Owner notification email failed:', error.message); }
}

const mayaSystemPrompt = [
  'You are Maya, the on-site sales and support assistant for Easy Breezy Air Duct and Chimney Services, a home-services company serving homeowners and businesses wherever they are located.',
  '',
  'Your job: help visitors quickly figure out which service fits their situation, answer their questions using only the facts below, build enough confidence that they submit the estimate request form, and do it in a way that feels like a genuinely helpful local expert, not a pushy salesperson.',
  '',
  'Services offered, and why each matters:',
  '- Air duct cleaning: clears dust, debris, and allergens from the full duct run so air actually moves evenly to every room, not just the vents closest to the unit.',
  '- Dryer vent cleaning: trapped lint is a leading cause of house fires and slows drying time; clearing the line fixes both.',
  '- Chimney cleaning & sweep: removes built-up creosote and soot so a fireplace is safe to use, not just tidy-looking.',
  '- Furnace cleaning: cleans the blower compartment and surrounding components so the furnace runs cleaner and quieter.',
  '- Carpet cleaning: deep extraction of ground-in stains, pet dander, and trapped allergens.',
  '- Commercial air duct cleaning: scheduled around business hours, coordinated for multi-unit or multi-tenant access.',
  '',
  'Pricing and process facts (do not invent numbers beyond this):',
  '- Estimates are always free and given before any work begins.',
  '- The price depends on system size / number of vents, how easy the system is to access, its current condition, and any add-ons requested.',
  '- No hidden fees; if anything changes once work starts, the customer is told and approves it before extra charges apply.',
  '- Easy Breezy serves homeowners and businesses wherever they are located.',
  '',
  'How to run the conversation:',
  '1. If it is not already obvious, ask one short, natural question to understand what is going on (e.g. what they are noticing, and whether it is a home or business).',
  '2. Match what they describe to the right service and briefly explain why it matters, in plain language, using the facts above.',
  '3. Once you have a sense of what they need, invite them to book a free estimate.',
  '4. If asked something outside these facts (exact price, exact appointment times, guarantees), be honest that you cannot promise that from chat and point them to requesting an estimate or calling, rather than guessing.',
  '5. Never ask the visitor what city, state, or area they are in. Their location is detected automatically from their connection, not from anything they tell you.',
  '',
  'Booking an appointment: once the visitor agrees to book, collect these one at a time, asking for only one missing piece of information per reply: full name, phone number, which service, and their preferred date (they can say "flexible"). Do not call the book_appointment tool until you have all of them. Once you have everything, call book_appointment. The visitor\'s location is supplied automatically — confirm the booking in one short sentence.',
  '',
  'Style: warm, direct, plain language, no corporate jargon, no emojis. Keep every reply to at most 2 sentences. Ask at most one question per reply. Never fabricate prices, availability, timelines, or guarantees not listed above.',
].join('\n');

const mayaTools = [{
  type: 'function',
  function: {
    name: 'book_appointment',
    description: 'Book a free estimate appointment once the visitor has agreed to book and every required field has been collected in conversation. Their location is detected automatically from their connection — do not ask for it.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: "Visitor's full name." },
        phone: { type: 'string', description: "Visitor's phone number." },
        service: { type: 'string', description: 'The service being requested, e.g. "Air duct cleaning".' },
        preferredDate: { type: 'string', description: 'Preferred date for the appointment, or "flexible" if the visitor has no preference.' },
        email: { type: 'string', description: "Visitor's email address, if they gave one." },
        notes: { type: 'string', description: 'Any other relevant detail the visitor mentioned.' },
      },
      required: ['name', 'phone', 'service', 'preferredDate'],
    },
  },
}];

function bookAppointmentFromMaya(args, region) {
  const name = clean(args?.name);
  const phone = clean(args?.phone);
  if (!name || !phone) return { ok: false, message: 'A name and phone number are both required.' };
  const client = { id: id(), requestId: '', stateCode: region?.regionCode || '', stateName: region?.region || '', name, phone, email: clean(args?.email), service: clean(args?.service) || 'Air duct cleaning', preferredDate: clean(args?.preferredDate), notes: clean(args?.notes), createdAt: new Date().toISOString() };
  db.clients.push(client);
  save();
  notifyOwner(`New lead: ${client.name}`, [`Name: ${client.name}`, `Phone: ${client.phone}`, `Email: ${client.email}`, `Service: ${client.service}`, `State: ${client.stateName}`, `Preferred date: ${client.preferredDate}`, `Notes: ${client.notes}`]);
  return { ok: true, message: 'Appointment request booked.' };
}

async function viewerRegion(req) {
  const address = viewerAddress(req);
  if (!isPublicAddress(address)) return null;
  const location = await locationFromProvider(address);
  return location ? { regionCode: location.regionCode || '', region: location.region || '' } : null;
}

async function callOpenAi(messages, controller) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', signal: controller.signal, headers: { Authorization: `Bearer ${config.openaiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'gpt-4o-mini', messages, tools: mayaTools, temperature: 0.5, max_tokens: 260 }) });
  if (!response.ok) { const error = Error('Maya is temporarily unavailable. Please try again shortly.'); error.status = 502; throw error; }
  return response.json();
}

async function askMaya(message, history, region) {
  if (!config.openaiKey) { const error = Error('Maya is not configured yet. Set OPENAI_API_KEY before enabling the assistant.'); error.status = 503; throw error; }
  const safeHistory = Array.isArray(history) ? history.slice(-8).filter((turn) => turn && (turn.role === 'user' || turn.role === 'assistant') && typeof turn.content === 'string').map((turn) => ({ role: turn.role, content: clean(turn.content) })) : [];
  const messages = [{ role: 'system', content: mayaSystemPrompt }, ...safeHistory, { role: 'user', content: clean(message) }];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    let data = await callOpenAi(messages, controller);
    let toolCalls = data?.choices?.[0]?.message?.tool_calls;
    let rounds = 0;
    while (Array.isArray(toolCalls) && toolCalls.length && rounds < 3) {
      messages.push(data.choices[0].message);
      for (const call of toolCalls) {
        let result = { ok: false, message: 'Unknown tool.' };
        if (call.function?.name === 'book_appointment') {
          let args = {};
          try { args = JSON.parse(call.function.arguments || '{}'); } catch { args = {}; }
          result = bookAppointmentFromMaya(args, region);
        }
        messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
      }
      data = await callOpenAi(messages, controller);
      toolCalls = data?.choices?.[0]?.message?.tool_calls;
      rounds += 1;
    }
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) { const error = Error('Maya is temporarily unavailable. Please try again shortly.'); error.status = 502; throw error; }
    return reply;
  } finally {
    clearTimeout(timeout);
  }
}

const passwordHash = (value) => crypto.createHash('sha256').update(value).digest();
const server = http.createServer(async (req, res) => {
  try {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
    res.setHeader('Content-Security-Policy', "default-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.bigdatacloud.net");
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    if (isProduction) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'GET' && url.pathname === '/api/site') { return json(res, 200, { name: 'Easy Breezy', phone: config.phone }); }
    if (req.method === 'GET' && url.pathname === '/api/location') {
      const address = viewerAddress(req);
      if (!isPublicAddress(address)) return json(res, 200, { location: null });
      return json(res, 200, { location: await locationFromProvider(address) });
    }
    if (req.method === 'GET' && !url.pathname.startsWith('/api/')) {
      const requested = path.resolve(distDir, `.${url.pathname}`);
      if (requested.startsWith(distDir) && fs.existsSync(requested) && fs.statSync(requested).isFile()) return sendFile(res, requested);
      return productionPage(res);
    }
    if (req.method === 'POST' && url.pathname === '/api/leads') {
      if (!requestAllowed(req, 'lead', maxPublicWrites, publicWriteWindow)) return json(res, 429, { error: 'Too many requests. Please try again later.' });
      const input = await body(req);
      if (!clean(input.name) || (!clean(input.phone) && !clean(input.email))) return json(res, 400, { error: 'Please provide your name and either a phone number or email address.' });
      const requestId = clean(req.headers['idempotency-key'] || input.requestId);
      if (requestId && db.clients.some((client) => client.requestId === requestId)) return json(res, 200, { ok: true, duplicate: true });
      const client = { id: id(), requestId, stateCode: clean(input.stateCode), stateName: clean(input.stateName), name: clean(input.name), phone: clean(input.phone), email: clean(input.email), service: clean(input.service) || 'Air duct cleaning', preferredDate: clean(input.preferredDate), notes: clean(input.notes), createdAt: new Date().toISOString() };
      db.clients.push(client);
      if (input.reminderConsent === true) db.reminders.push({ id: id(), clientId: client.id, clientName: client.name, stateName: client.stateName, service: client.service, dueDate: plusYear(client.preferredDate), sentAt: null });
      save();
      notifyOwner(`New lead: ${client.name}`, [`Name: ${client.name}`, `Phone: ${client.phone}`, `Email: ${client.email}`, `Service: ${client.service}`, `State: ${client.stateName}`, `Preferred date: ${client.preferredDate}`, `Notes: ${client.notes}`]);
      return json(res, 201, { ok: true });
    }
    if (req.method === 'POST' && url.pathname === '/api/chat') {
      if (!requestAllowed(req, 'chat', maxPublicWrites, publicWriteWindow)) return json(res, 429, { error: 'Too many requests. Please try again later.' });
      const input = await body(req);
      if (!clean(input.name) || !clean(input.phone) || !clean(input.message)) return json(res, 400, { error: 'Name, phone, and a message are required.' });
      const contact = { id: id(), stateCode: clean(input.stateCode), stateName: clean(input.stateName), name: clean(input.name), phone: clean(input.phone), message: clean(input.message), createdAt: new Date().toISOString() };
      db.messages.push(contact); save();
      notifyOwner(`New message: ${contact.name}`, [`Name: ${contact.name}`, `Phone: ${contact.phone}`, `State: ${contact.stateName}`, `Message: ${contact.message}`]);
      return json(res, 201, { ok: true });
    }
    if (req.method === 'POST' && url.pathname === '/api/maya') {
      if (!requestAllowed(req, 'maya', maxPublicWrites, publicWriteWindow)) return json(res, 429, { error: 'Too many requests. Please try again later.' });
      if (!config.openaiKey) return json(res, 503, { error: 'Maya is not configured yet. Set OPENAI_API_KEY before enabling the assistant.' });
      const input = await body(req);
      if (!clean(input.message)) return json(res, 400, { error: 'Please include a message.' });
      const region = await viewerRegion(req);
      const reply = await askMaya(input.message, input.history, region);
      return json(res, 200, { reply });
    }
    if (req.method === 'POST' && url.pathname === '/api/admin/login') { if (!config.adminPassword) return json(res, 503, { error: 'Owner access is not configured yet. Set ADMIN_PASSWORD before signing in.' }); if (!loginAllowed(req)) return json(res, 429, { error: 'Too many attempts. Please wait 15 minutes, then try again.' }); const input = await body(req); if (!crypto.timingSafeEqual(passwordHash(clean(input.password)), passwordHash(config.adminPassword))) { recordFailedLogin(req); return json(res, 401, { error: 'We could not sign you in. Check your password and try again.' }); } clearFailedLogins(req); const token = id(); sessions.set(token, Date.now() + sessionLifetime); res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Set-Cookie': sessionCookie(token), 'X-Content-Type-Options': 'nosniff' }); return res.end('{"ok":true}'); }
    if (req.method === 'POST' && url.pathname === '/api/admin/logout') { if (!validSameOrigin(req)) return json(res, 403, { error: 'Invalid request origin.' }); sessions.delete(cookies(req).eb_session); res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Set-Cookie': sessionCookie('', 0), 'X-Content-Type-Options': 'nosniff' }); return res.end('{"ok":true}'); }
    if (url.pathname.startsWith('/api/admin/')) {
      if (!authed(req)) return json(res, 401, { error: 'Please sign in.' });
      if (req.method !== 'GET' && !validSameOrigin(req)) return json(res, 403, { error: 'Invalid request origin.' });
      if (req.method === 'GET' && url.pathname === '/api/admin/summary') return json(res, 200, summary());
      if (req.method === 'POST' && url.pathname === '/api/admin/payments') { const input = await body(req); const amount = Number(input.amount); if (!clean(input.clientName) || !Number.isFinite(amount) || amount < 0) return json(res, 400, { error: 'Client name and valid amount are required.' }); db.payments.push({ id: id(), clientName: clean(input.clientName), amount: amount.toFixed(2), method: clean(input.method) || 'Other', reference: clean(input.reference), createdAt: new Date().toISOString() }); save(); return json(res, 201, { ok: true }); }
      const match = url.pathname.match(/^\/api\/admin\/reminders\/([^/]+)\/send$/); if (req.method === 'POST' && match) { const reminder = db.reminders.find((item) => item.id === match[1]); if (!reminder) return json(res, 404, { error: 'Reminder not found.' }); return json(res, 200, await sendReminder(reminder)); }
    }
    return json(res, 404, { error: 'Not found' });
  } catch (error) { console.error(error); return json(res, error.status || 500, { error: error.status ? error.message : 'Server error' }); }
});
async function runDueReminderSweep() { for (const reminder of db.reminders.filter((item) => !item.sentAt && item.dueDate <= date(Date.now()))) { try { await sendReminder(reminder); } catch (error) { console.error('Reminder not sent:', error.message); } } }
server.requestTimeout = 15_000;
server.headersTimeout = 10_000;
server.keepAliveTimeout = 5_000;
server.listen(process.env.PORT || 4173, process.env.HOST || '0.0.0.0', () => { console.log(`Easy Breezy running on port ${process.env.PORT || 4173}`); if (!config.adminPassword) console.warn('Owner sign-in is disabled until ADMIN_PASSWORD is set.'); if (config.adminPassword && config.adminPassword.length < 16) console.warn('ADMIN_PASSWORD is shorter than 16 characters; replace it with a password-manager-generated secret.'); runDueReminderSweep(); setInterval(runDueReminderSweep, 24 * 60 * 60 * 1000); setInterval(() => { const now = Date.now(); for (const [token, expiresAt] of sessions) if (expiresAt <= now) sessions.delete(token); for (const [address, attempt] of loginAttempts) if (attempt.until <= now) loginAttempts.delete(address); for (const [key, limit] of requestLimits) if (limit.until <= now) requestLimits.delete(key); }, 60 * 60 * 1000); });
