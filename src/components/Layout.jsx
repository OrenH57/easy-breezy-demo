import { Link, NavLink } from 'react-router-dom';
import { Menu, Phone } from 'lucide-react';
import { useState } from 'react';
import { Brand } from './Brand';

const nav = [['/', 'Home'], ['/services', 'Services'], ['/booking', 'Book service'], ['/about', 'Why it matters']];

export function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return <>
    <div className="utility">Residential and commercial air duct cleaning</div>
    <header>
      <Link to="/" className="logo" aria-label="Easy Breezy home"><Brand /></Link>
      <nav aria-label="Main navigation">{nav.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}</nav>
      <div className="header-actions">
        <a className="phone-link" href="tel:+14435553827"><Phone /> (443) 555-3827</a>
        <Link className="button header-book" to="/booking">Book service</Link>
        <button className="mobile-menu-toggle" type="button" aria-label={menuOpen ? 'Close site menu' : 'Open site menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}><Menu /></button>
      </div>
    </header>
    {menuOpen && <nav className="mobile-nav" aria-label="Mobile navigation">
      {nav.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'} onClick={closeMenu}>{label}</NavLink>)}
      <a className="mobile-phone" href="tel:+14435553827"><Phone /> Call (443) 555-3827</a>
    </nav>}
    {children}
    <footer><Brand /><p>Professional air duct and vent cleaning for Maryland homes and businesses.</p><div><Link to="/services">Services</Link><Link to="/booking">Book service</Link><Link to="/admin">Owner sign in</Link></div></footer>
  </>;
}
