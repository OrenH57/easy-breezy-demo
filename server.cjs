const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = __dirname;
const distDir = path.join(root, 'dist');
const dataDir = process.env.DATA_DIR || path.join(root, 'data');
const dbFile = path.join(dataDir, 'business.json');
const statesFile = path.join(root, 'states.json');
fs.mkdirSync(dataDir, { recursive: true });

const config = {
  phone: process.env.BUSINESS_PHONE || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  fromEmail: process.env.FROM_EMAIL || '',
  resendKey: process.env.RESEND_API_KEY || '',
};
const empty = () => ({ clients: [], messages: [], payments: [], reminders: [] });
let db = fs.existsSync(dbFile) ? JSON.parse(fs.readFileSync(dbFile, 'utf8')) : empty();
const sessions = new Map();
const loginAttempts = new Map();
const isProduction = process.env.NODE_ENV === 'production';
const sessionLifetime = 8 * 60 * 60 * 1000;
const loginWindow = 15 * 60 * 1000;
const maxLoginAttempts = 5;
const save = () => fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
const states = () => JSON.parse(fs.readFileSync(statesFile, 'utf8'));
const serviceState = (code) => states()[String(code || 'md').toLowerCase()];
const id = () => crypto.randomUUID();
const date = (d) => new Date(d).toISOString().slice(0, 10);
const plusYear = (d) => { const value = new Date(d || Date.now()); value.setFullYear(value.getFullYear() + 1); return date(value); };
const clean = (value) => String(value || '').trim().slice(0, 2000);
const cookies = (req) => Object.fromEntries((req.headers.cookie || '').split(';').map((value) => value.trim().split('=').map(decodeURIComponent)).filter((value) => value[0]));
const clientAddress = (req) => req.socket.remoteAddress || 'unknown';
function authed(req) { const token = cookies(req).eb_session; const expiresAt = sessions.get(token); if (!expiresAt || expiresAt <= Date.now()) { sessions.delete(token); return false; } return true; }
function sessionCookie(token, maxAge = Math.floor(sessionLifetime / 1000)) { return `eb_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${isProduction ? '; Secure' : ''}`; }
function loginAllowed(req) { const attempt = loginAttempts.get(clientAddress(req)); return !attempt || attempt.until <= Date.now() || attempt.count < maxLoginAttempts; }
function recordFailedLogin(req) { const address = clientAddress(req); const attempt = loginAttempts.get(address); const active = attempt && attempt.until > Date.now() ? attempt : { count: 0, until: Date.now() + loginWindow }; loginAttempts.set(address, { count: active.count + 1, until: active.until }); }
function clearFailedLogins(req) { loginAttempts.delete(clientAddress(req)); }

function json(res, status, body) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(body)); }
function body(req) { return new Promise((resolve, reject) => { let raw = ''; req.on('data', (chunk) => { raw += chunk; if (raw.length > 1e6) reject(Error('Request too large')); }); req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(Error('Invalid request')); } }); }); }
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

const passwordHash = (value) => crypto.createHash('sha256').update(value).digest();
const server = http.createServer(async (req, res) => {
  try {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    const url = new URL(req.url, 'http://localhost');
    const stateRoute = url.pathname.match(/^\/([a-z]{2})\/?$/);
    if (req.method === 'GET' && url.pathname === '/api/site') { const state = serviceState(url.searchParams.get('state')); return state?.enabled ? json(res, 200, { name: state.name, phone: config.phone || state.phone, serviceAreas: state.serviceAreas }) : json(res, 404, { error: 'This service area is not live yet.' }); }
    if (req.method === 'GET' && !url.pathname.startsWith('/api/')) {
      if (stateRoute && !serviceState(stateRoute[1])?.enabled) return json(res, 404, { error: 'This service area is not live yet.' });
      const requested = path.resolve(distDir, `.${url.pathname}`);
      if (requested.startsWith(distDir) && fs.existsSync(requested) && fs.statSync(requested).isFile()) return sendFile(res, requested);
      return productionPage(res);
    }
    if (req.method === 'POST' && url.pathname === '/api/leads') {
      const input = await body(req); const state = serviceState(input.stateCode);
      if (!state?.enabled) return json(res, 400, { error: 'This service area is not live yet.' });
      if (!clean(input.name) || !clean(input.phone) || !clean(input.email)) return json(res, 400, { error: 'Name, phone, and email are required.' });
      const client = { id: id(), stateCode: clean(input.stateCode), stateName: state.name, name: clean(input.name), phone: clean(input.phone), email: clean(input.email), service: clean(input.service) || 'Air duct cleaning', preferredDate: clean(input.preferredDate), notes: clean(input.notes), createdAt: new Date().toISOString() };
      db.clients.push(client);
      if (input.reminderConsent === true) db.reminders.push({ id: id(), clientId: client.id, clientName: client.name, stateName: state.name, service: client.service, dueDate: plusYear(client.preferredDate), sentAt: null });
      save(); return json(res, 201, { ok: true });
    }
    if (req.method === 'POST' && url.pathname === '/api/chat') {
      const input = await body(req); const state = serviceState(input.stateCode);
      if (!state?.enabled) return json(res, 400, { error: 'This service area is not live yet.' });
      if (!clean(input.name) || !clean(input.phone) || !clean(input.message)) return json(res, 400, { error: 'Name, phone, and a message are required.' });
      db.messages.push({ id: id(), stateCode: clean(input.stateCode), stateName: state.name, name: clean(input.name), phone: clean(input.phone), message: clean(input.message), createdAt: new Date().toISOString() }); save(); return json(res, 201, { ok: true });
    }
    if (req.method === 'POST' && url.pathname === '/api/admin/login') { if (!config.adminPassword) return json(res, 503, { error: 'Owner access is not configured yet. Set ADMIN_PASSWORD before signing in.' }); if (!loginAllowed(req)) return json(res, 429, { error: 'Too many attempts. Please wait 15 minutes, then try again.' }); const input = await body(req); if (!crypto.timingSafeEqual(passwordHash(clean(input.password)), passwordHash(config.adminPassword))) { recordFailedLogin(req); return json(res, 401, { error: 'We could not sign you in. Check your password and try again.' }); } clearFailedLogins(req); const token = id(); sessions.set(token, Date.now() + sessionLifetime); res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Set-Cookie': sessionCookie(token), 'X-Content-Type-Options': 'nosniff' }); return res.end('{"ok":true}'); }
    if (req.method === 'POST' && url.pathname === '/api/admin/logout') { sessions.delete(cookies(req).eb_session); res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Set-Cookie': sessionCookie('', 0), 'X-Content-Type-Options': 'nosniff' }); return res.end('{"ok":true}'); }
    if (url.pathname.startsWith('/api/admin/')) {
      if (!authed(req)) return json(res, 401, { error: 'Please sign in.' });
      if (req.method === 'GET' && url.pathname === '/api/admin/summary') return json(res, 200, summary());
      if (req.method === 'POST' && url.pathname === '/api/admin/payments') { const input = await body(req); const amount = Number(input.amount); if (!clean(input.clientName) || !Number.isFinite(amount) || amount < 0) return json(res, 400, { error: 'Client name and valid amount are required.' }); db.payments.push({ id: id(), clientName: clean(input.clientName), amount: amount.toFixed(2), method: clean(input.method) || 'Other', reference: clean(input.reference), createdAt: new Date().toISOString() }); save(); return json(res, 201, { ok: true }); }
      const match = url.pathname.match(/^\/api\/admin\/reminders\/([^/]+)\/send$/); if (req.method === 'POST' && match) { const reminder = db.reminders.find((item) => item.id === match[1]); if (!reminder) return json(res, 404, { error: 'Reminder not found.' }); return json(res, 200, await sendReminder(reminder)); }
    }
    return json(res, 404, { error: 'Not found' });
  } catch (error) { console.error(error); return json(res, 500, { error: error.message || 'Server error' }); }
});
async function runDueReminderSweep() { for (const reminder of db.reminders.filter((item) => !item.sentAt && item.dueDate <= date(Date.now()))) { try { await sendReminder(reminder); } catch (error) { console.error('Reminder not sent:', error.message); } } }
server.listen(process.env.PORT || 4173, process.env.HOST || '0.0.0.0', () => { console.log(`Easy Breezy running on port ${process.env.PORT || 4173}`); if (!config.adminPassword) console.warn('Owner sign-in is disabled until ADMIN_PASSWORD is set.'); runDueReminderSweep(); setInterval(runDueReminderSweep, 24 * 60 * 60 * 1000); setInterval(() => { const now = Date.now(); for (const [token, expiresAt] of sessions) if (expiresAt <= now) sessions.delete(token); for (const [address, attempt] of loginAttempts) if (attempt.until <= now) loginAttempts.delete(address); }, 60 * 60 * 1000); });
