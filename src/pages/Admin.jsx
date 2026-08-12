import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const sections = ['Overview', 'Clients', 'Service reminders', 'Payments', 'Messages'];
const cols = {
  Clients: ['name', 'phone', 'email', 'stateName', 'service'],
  Messages: ['name', 'phone', 'stateName', 'message', 'createdAt'],
  Payments: ['clientName', 'amount', 'method', 'reference', 'createdAt'],
};

function Login({ onLogin }) {
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    try {
      await api('/api/admin/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
      onLogin();
    } catch (reason) { setError(reason.message); }
  }
  return <main className="login-page"><form onSubmit={submit}><p className="eyebrow">Easy Breezy owner</p><h1>Welcome back.</h1><input required name="password" type="password" placeholder="Password"/><button className="button">Sign in</button><small>{error}</small></form></main>;
}

function Table({ rows, columns }) {
  return rows.length ? <div className="table-wrap"><table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.id || index}>{columns.map((column) => <td key={column}>{row[column] || '—'}</td>)}</tr>)}</tbody></table></div> : <p className="muted">Nothing here yet.</p>;
}

export default function Admin() {
  const [data, setData] = useState(null);
  const [active, setActive] = useState('Overview');
  async function load() { try { setData(await api('/api/admin/summary')); } catch { setData(false); } }
  async function logout() { await api('/api/admin/logout', { method: 'POST' }); setData(false); }
  useEffect(() => { load(); }, []);
  if (data === null) return <main className="loading">Loading business center…</main>;
  if (data === false) return <Login onLogin={load}/>;
  const reminders = <Table rows={data.reminders} columns={['clientName', 'stateName', 'service', 'dueDate', 'sentAt']}/>;
  return <main className="admin-page"><aside className="admin-side"><b>Easy Breezy</b><button className="admin-signout" onClick={logout}>Sign out</button>{sections.map((section) => <button key={section} className={active === section ? 'active' : ''} onClick={() => setActive(section)}>{section}</button>)}</aside><section className="admin-content"><div className="admin-title"><div><p className="eyebrow">Business center</p><h1>{active}</h1></div><button className="button ghost admin-header-signout" onClick={logout}>Sign out</button></div>{active === 'Overview' && <><div className="metrics"><div><small>Clients</small><b>{data.clients.length}</b></div><div><small>Due reminders</small><b>{data.reminders.filter((item) => !item.sentAt).length}</b></div><div><small>Payments</small><b>{data.payments.length}</b></div></div><div className="admin-panel"><h2>One shared system, ready for many states.</h2><p>Every client, message, service reminder, and payment reference is stored with its service state.</p></div></>}{active === 'Service reminders' ? reminders : active !== 'Overview' && <div className="admin-panel"><Table rows={data[active.toLowerCase()]} columns={cols[active]}/></div>}</section></main>;
}
