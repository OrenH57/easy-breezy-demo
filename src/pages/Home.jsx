import { Link } from 'react-router-dom';
import { BadgeCheck, CalendarDays, Clock3, House, Leaf, MapPin, ShieldCheck } from 'lucide-react';
import { useParams } from 'react-router-dom';
import originalHero from '../assets/air-duct-cleaning-hero.png';
import residentialImage from '../assets/service/residential-duct-cleaning.png';
import dryerImage from '../assets/service/dryer-vent-cleaning.png';
import chimneyImage from '../assets/service/chimney-sweep.png';
import commercialImage from '../assets/service/commercial-duct-cleaning.png';
import ductBefore from '../assets/original/duct-before.webp';
import ductAfter from '../assets/original/duct-after.webp';
import { BookingForm } from '../components/BookingForm';

const trust = [
  [ShieldCheck, 'Free estimates', 'Clear scope before work begins'],
  [Leaf, 'Easy scheduling', 'A simple booking experience'],
  [House, 'Home & business service', 'Residential and commercial options'],
  [BadgeCheck, 'Straightforward care', 'Respectful service from start to finish'],
];
const services = [
  [residentialImage, 'Residential Duct Cleaning', 'Remove accumulated dust and debris from the ductwork serving your home.'],
  [dryerImage, 'Dryer Vent Cleaning', 'Remove lint buildup and help maintain better exhaust airflow from your dryer.'],
  [chimneyImage, 'Chimney Repair & Sweep', 'Sweeping, visible-condition evaluation and repair options for chimney systems.'],
  [commercialImage, 'Commercial Duct Cleaning', 'Cleaning solutions for offices, retail spaces and commercial facilities.'],
];

export default function Home() {
  const { state } = useParams();
  const serviceState = state?.toLowerCase() === 'md' || !state ? 'Maryland' : state.toUpperCase();
  return <>
    <section className="original-hero">
      <div className="original-hero-copy">
        <p className="original-eyebrow">Air care for your home</p>
        <h1>Cleaner air.<br /><span>Made easy.</span></h1>
        <p className="lede">Professional air duct, dryer vent, commercial duct and chimney services—with a simple booking experience from the first click.</p>
        <div className="hero-actions"><Link className="button original-primary" to="/booking">Get a free estimate</Link><a className="original-call" href="tel:+14435553827">Call (443) 555-3827</a></div>
        <div className="mini-trust"><span>Free estimates</span><span>Easy scheduling</span><span>Dirty ducts? Easy Breezy.</span></div>
      </div>
      <figure className="original-hero-image"><img src={originalHero} alt="Professional technician cleaning a ceiling air vent in a home" /><div className="service-area-card"><span className="service-area-icon"><MapPin /></span><div><small>Now serving</small><strong>{serviceState}</strong><span>and surrounding areas</span></div><Link to="/booking">Get an estimate →</Link></div></figure>
    </section>
    <section className="trust-rail">{trust.map(([Icon, title, text]) => <article key={title}><Icon /><div><strong>{title}</strong><span>{text}</span></div></article>)}</section>
    <section className="original-services">
      <div className="section-top"><p className="eyebrow">Services</p><h2>What can we clean?</h2><p>Four clear categories. Choose one to see what it helps with and go straight to an estimate.</p></div>
      <div className="service-card-grid">{services.map(([image, title, text]) => <article className="service-card" key={title}><img src={image} alt={title} /><div><h3>{title}</h3><p>{text}</p><Link className="text-link" to="/booking">Get an estimate →</Link></div></article>)}</div>
    </section>
    <section className="results-section">
      <div className="section-top"><p className="eyebrow">A clearer system</p><h2>See the difference.</h2><p>Keep this section simple and visual. Replace these presentation images with your own Easy Breezy job photos as you collect them.</p></div>
      <div className="before-after"><figure><img src={ductBefore} alt="Example dirty duct before cleaning" /><figcaption>Before <strong>Visible buildup</strong></figcaption></figure><figure><img src={ductAfter} alt="Example clean duct after cleaning" /><figcaption>After <strong>Cleaner interior</strong></figcaption></figure></div>
      <p className="photo-note">Presentation examples only—not represented as real Easy Breezy customer jobs.</p>
    </section>
    <section className="quote-section"><div><p className="eyebrow">Free estimate</p><h2>Ready to make it Easy Breezy?</h2><p>Tell us about your home or business, and we’ll follow up with a clear estimate.</p></div><div className="quote-form"><BookingForm /></div></section>
    <section className="dark-cta"><div><h2>Dirty ducts? Easy Breezy.</h2><p>Book the service that makes your home feel easier.</p></div><div className="cta-details"><span><CalendarDays /> Easy online booking</span><span><Clock3 /> A time that works for you</span></div><Link className="button light" to="/booking">Book service <span>→</span></Link></section>
  </>;
}
