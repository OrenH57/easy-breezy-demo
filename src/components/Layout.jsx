import { Link, NavLink } from 'react-router-dom';
import { Menu, Phone } from 'lucide-react';
import { useState } from 'react';
import { Brand } from './Brand';
import { HelperAgent } from './HelperAgent';

const nav = [['/services', 'Services'], ['/pricing', 'Pricing'], ['/before-after', 'Results'], ['/service-areas', 'Service Areas']];

export function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  return <>
    <div className="utility">Air duct, dryer vent & chimney services across Maryland and Washington, DC</div>
    <header>
      <Link to="/" className="logo" aria-label="Easy Breezy home"><Brand /></Link>
      <nav aria-label="Main navigation">{nav.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}</nav>
      <div className="header-actions"><Link className="phone-link" to="/booking"><Phone /> Request a call</Link><Link className="button header-book" to="/booking">Get Free Quote <span>→</span></Link><button className="mobile-menu-toggle" type="button" aria-label={menuOpen ? 'Close site menu' : 'Open site menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}><Menu /></button></div>
    </header>
    {menuOpen && <nav className="mobile-nav" aria-label="Mobile navigation">{nav.map(([to, label]) => <NavLink key={to} to={to} onClick={closeMenu}>{label}</NavLink>)}<Link className="mobile-phone" to="/booking" onClick={closeMenu}><Phone /> Request a call</Link></nav>}
    {children}
    <HelperAgent />
    <footer><Brand /><p>Professional air duct, dryer vent and chimney cleaning for Maryland and Washington, DC.</p><div><Link to="/services">Services</Link><Link to="/pricing">Pricing</Link><Link to="/service-areas">Service areas</Link><Link to="/admin">Owner sign in</Link></div></footer>
  </>;
}
