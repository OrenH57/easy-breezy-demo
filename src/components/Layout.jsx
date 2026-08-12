import { Link, NavLink } from 'react-router-dom';
import { Leaf, MessageCircle, Phone, X } from 'lucide-react';
import { useState } from 'react';
import { Brand } from './Brand';
import { api, stateCode } from '../lib/api';
const nav = [['/', 'Home'], ['/services', 'Services'], ['/booking', 'Book service'], ['/about', 'Why it matters']];
export function Layout({ children }) {
  const [open, setOpen] = useState(false); const [notice, setNotice] = useState('');
  async function send(e) { e.preventDefault(); try { await api('/api/chat', { method: 'POST', body: JSON.stringify({ ...Object.fromEntries(new FormData(e.currentTarget)), stateCode }) }); e.currentTarget.reset(); setNotice('Message received. We will be in touch soon.'); } catch (error) { setNotice(error.message); } }
  return <><div className="utility"><Leaf aria-hidden="true" /> Summer special: <strong>$40 off air duct cleaning</strong>. Book by May 31.</div><header><Link to="/" className="logo"><Brand /></Link><nav>{nav.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}</nav><div className="header-actions"><a className="phone-link" href="tel:+14435553827"><Phone /> (443) 555-3827</a><Link className="button header-book" to="/booking">Book service</Link></div></header>{children}<footer><Brand /><p>Cleaner air. Easier living.</p><div><Link to="/services">Services</Link><Link to="/booking">Book service</Link><Link to="/admin">Owner sign in</Link></div></footer><button className="chat-float" aria-label="Chat with Easy Breezy" onClick={() => setOpen(true)}><MessageCircle /></button>{open && <aside className="chat-drawer"><button className="close" aria-label="Close chat" onClick={() => setOpen(false)}><X /></button><p className="eyebrow">Easy Breezy team</p><h2>How can we help?</h2><p className="muted">Leave a note and a real person will follow up.</p><form onSubmit={send}><input required name="name" placeholder="Your name" /><input required name="phone" placeholder="Phone number" /><textarea required name="message" rows="4" placeholder="How can we help?" /><button className="button">Send message</button>{notice && <small>{notice}</small>}</form></aside>}</>;
}
