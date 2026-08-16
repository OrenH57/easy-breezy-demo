import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Wind, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { Brand } from '../components/Brand';
import familyHero from '../assets/easy-breezy-family-hero-final.webp';
import ductTech from '../assets/service/easy-breezy-duct-technician.webp';
import dryerTech from '../assets/service/easy-breezy-dryer-technician.webp';
import chimneyTech from '../assets/service/easy-breezy-chimney-technician.webp';

const services = [
  [Wind, 'Air duct cleaning'],
  [Sparkles, 'Dryer vent cleaning'],
  [Flame, 'Chimney cleaning'],
];

export default function Redesign() {
  useEffect(() => {
    const items = document.querySelectorAll('.redesign-reveal');
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: .16 });
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return <main className="redesign-page">
    <header className="redesign-header">
      <Link to="/" aria-label="Easy Breezy home"><Brand /></Link>
      <nav aria-label="Redesign navigation"><Link to="/services">Services</Link><Link to="/before-after">Results</Link><Link to="/service-areas">Service areas</Link></nav>
      <Link className="redesign-button" to="/booking">Book a service <ArrowRight /></Link>
    </header>

    <section className="redesign-hero">
      <div className="redesign-hero-copy redesign-hero-enter">
        <h1>A fresher home<br />starts with <span>clean air ducts.</span></h1>
        <p>Professional air duct, dryer vent, and chimney service for homes that deserve clean, comfortable air.</p>
        <Link className="redesign-button" to="/booking">Get Free Quote <ArrowRight /></Link>
      </div>
      <figure className="redesign-hero-image"><img src={familyHero} alt="Family relaxing in a clean, bright living room" /></figure>
    </section>

    <section className="redesign-services redesign-reveal" aria-labelledby="redesign-services-title">
      <div><h2 id="redesign-services-title">Clear air, made simple.</h2><p>Local service with clear next steps and respectful care in your home.</p></div>
      <div className="redesign-service-list">{services.map(([Icon, title]) => <Link to="/services" key={title}><Icon aria-hidden="true" /><span>{title}</span><ArrowRight aria-hidden="true" /></Link>)}</div>
    </section>

    <section className="redesign-proof redesign-reveal">
      <div className="redesign-proof-copy"><h2>Local. Respectful.<br />Focused on the work.</h2><p>Proudly serving Maryland and Washington, DC with straightforward estimates and a cleaner finish.</p><Link to="/before-after">See our approach <ArrowRight /></Link></div>
      <div className="redesign-proof-images"><img src={ductTech} alt="Technician cleaning an air duct" /><img src={dryerTech} alt="Technician cleaning a dryer vent" /><img src={chimneyTech} alt="Technician cleaning a chimney" /></div>
    </section>

    <section className="redesign-cta redesign-reveal"><div><h2>Ready for cleaner air?</h2><p>Tell us what you need and we’ll follow up with a clear estimate.</p></div><Link className="redesign-button" to="/booking">Request a quote <ArrowRight /></Link></section>

    <footer className="redesign-footer"><Brand /><p>Professional air duct, dryer vent and chimney cleaning for Maryland and Washington, DC.</p><div><Link to="/services">Services</Link><Link to="/booking">Book service</Link><Link to="/admin">Owner sign in</Link></div></footer>
  </main>;
}
