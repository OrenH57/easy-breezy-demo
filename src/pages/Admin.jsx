import { useEffect, useState } from 'react';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { api } from '../lib/api';
import './admin-login.css';

const sections = ['Overview', 'Clients', 'Service reminders', 'Payments', 'Messages'];
const cols = {
  Clients: ['name', 'phone', 'email', 'stateName', 'service'],
  Messages: ['name', 'phone', 'stateName', 'message', 'createdAt'],
  Payments: ['clientName', 'amount', 'method', 'reference', 'createdAt'],
};

function Login({ onLogin }) {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setError(''); setSubmitting(true);
    try { await api('/api/admin/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) }); onLogin(); }
    catch (reason) { setError(reason.message); } finally { setSubmitting(false); }
  }
  return <main className="login-page"><form className="login-card" onSubmit={submit} aria-describedby="signin-note"><div className="login-icon"><LockKeyhole aria-hidden="true" /></div><p className="eyebrow">Easy Breezy owner</p><h1>Sign in to your business center.</h1><p id="signin-note" className="muted">Use your owner password. For your security, access ends automatically after 8 hours.</p><label htmlFor="owner-password">Password</label><div className="password-field"><input id="owner-password" required autoFocus autoComplete="current-password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password"/><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button></div>{error && <p className="login-error" role="alert">{error}</p>}<button className="button login-submit" disabled={submitting}>{submitting ? 'Signing in...' : 'Sign in securely'}</button><small className="login-help">Keep your password private and use a password manager when possible.</small></form></main>;
}

function Table({ rows, columns }) {
  return rows.length ? <div className="table-wrap" tabIndex="0" aria-label="Scrollable data table"><table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.id || index}>{columns.map((column) => <td key={column}>{row[column] || '-'}</td>)}</tr>)}</tbody></table></div> : <p className="muted">Nothing here yet.</p>;
}

export default function Admin() {
  const [data, setData] = useState(null);
  const [active, setActive] = useState('Overview');
  async function load() { try { setData(await api('/api/admin/summary')); } catch { setData(false); } }
  async function logout() { await api('/api/admin/logout', { method: 'POST' }); setData(false); }
  useEffect(() => { load(); }, []);
  if (data === null) return <main className="loading">Loading business center...</main>;
  if (data === false) return <Login onLogin={load}/>;
  const reminders = <Table rows={data.reminders} columns={['clientName', 'stateName', 'service', 'dueDate', 'sentAt']}/>;
  return <main className="admin-page"><div className="admin-mobile-bar"><b>Easy Breezy</b><label className="sr-only" htmlFor="admin-section">Business center section</label><select id="admin-section" value={active} onChange={(event) => setActive(event.target.value)}>{sections.map((section) => <option key={section}>{section}</option>)}</select><button type="button" onClick={logout}>Sign out</button></div><aside className="admin-side"><b>Easy Breezy</b><div className="admin-side-nav">{sections.map((section) => <button key={section} className={active === section ? 'active' : ''} onClick={() => setActive(section)}>{section}</button>)}</div><button className="admin-signout" onClick={logout}>Sign out</button></aside><section className="admin-content"><div className="admin-title"><div><p className="eyebrow">Business center</p><h1>{active}</h1></div><button className="button ghost admin-header-signout" onClick={logout}>Sign out</button></div>{active === 'Overview' && <><div className="metrics"><div><small>Clients</small><b>{data.clients.length}</b></div><div><small>Due reminders</small><b>{data.reminders.filter((item) => !item.sentAt).length}</b></div><div><small>Payments</small><b>{data.payments.length}</b></div></div><div className="admin-panel"><h2>One shared system, ready for many states.</h2><p>Every client, message, service reminder, and payment reference is stored with its service state.</p></div></>}{active === 'Service reminders' ? reminders : active !== 'Overview' && <div className="admin-panel"><Table rows={data[active.toLowerCase()]} columns={cols[active]}/></div>}</section></main>;
}
