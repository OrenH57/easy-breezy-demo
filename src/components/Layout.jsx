import { Link, NavLink } from 'react-router-dom';
import { Menu, Phone } from 'lucide-react';
import { useState } from 'react';
import { Brand } from './Brand';
import { HelperAgent } from './HelperAgent';
import { PageLeaves } from './PageLeaves';
import { getViewerLocationName, useViewerLocation } from '../hooks/useViewerLocation';

const nav = [['/services', 'Services'], ['/pricing', 'Pricing'], ['/service-areas', 'Service Areas']];

export function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const viewerLocation = useViewerLocation();
  const closeMenu = () => setMenuOpen(false);
  const hasViewerCity = viewerLocation?.city && viewerLocation.countryCode === 'US';
  const locationName = hasViewerCity ? getViewerLocationName(viewerLocation) : '';
  const utilityText = hasViewerCity ? `Air duct, dryer vent & chimney services across ${locationName}` : 'Air duct, dryer vent & chimney services across Maryland and Washington, DC';
  const footerText = hasViewerCity ? `Professional air duct, dryer vent and chimney cleaning for ${locationName}.` : 'Professional air duct, dryer vent and chimney cleaning for Maryland and Washington, DC.';
  return <>
    <PageLeaves />
    <div className="utility" aria-live="polite">{utilityText}</div>
    <header>
      <Link to="/" className="logo" aria-label="Easy Breezy home"><Brand /></Link>
      <nav aria-label="Main navigation">{nav.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}</nav>
      <div className="header-actions"><Link className="phone-link" to="/booking"><Phone /> Request a call</Link><Link className="button header-book" to="/booking">Get Free Quote <span>→</span></Link><button className="mobile-menu-toggle" type="button" aria-label={menuOpen ? 'Close site menu' : 'Open site menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}><Menu /></button></div>
    </header>
    {menuOpen && <nav className="mobile-nav" aria-label="Mobile navigation">{nav.map(([to, label]) => <NavLink key={to} to={to} onClick={closeMenu}>{label}</NavLink>)}<Link className="mobile-phone" to="/booking" onClick={closeMenu}><Phone /> Request a call</Link></nav>}
    {children}
    <HelperAgent />
    <footer><Brand /><p aria-live="polite">{footerText}</p><div><Link to="/services">Services</Link><Link to="/pricing">Pricing</Link><Link to="/service-areas">Service areas</Link><a href="mailto:hello@easybreezyservices.com">hello@easybreezyservices.com</a><Link to="/admin">Owner sign in</Link></div></footer>
  </>;
}
