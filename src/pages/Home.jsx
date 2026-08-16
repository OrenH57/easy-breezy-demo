import { Link } from 'react-router-dom';
import { BadgeCheck, CalendarDays, CircleDollarSign, Heart, MapPin, Sparkles, Wind } from 'lucide-react';
import familyHero from '../assets/easy-breezy-family-hero-final.webp';
import residentialImage from '../assets/service/easy-breezy-duct-technician.webp';
import dryerImage from '../assets/service/easy-breezy-dryer-technician.webp';
import chimneyImage from '../assets/service/easy-breezy-chimney-technician.webp';
import commercialImage from '../assets/service/easy-breezy-commercial-back.webp';
import cleanDuctInterior from '../assets/clean-duct-interior.webp';
import cleanCeilingVent from '../assets/clean-ceiling-vent.webp';
import cleanFloorVent from '../assets/clean-floor-vent.png';
import { BookingForm } from '../components/BookingForm';
import { HeroLocation } from '../components/HeroLocation';
import { AvailabilityCard } from '../components/AvailabilityCard';
import { TrustLocation } from '../components/TrustLocation';

const trust = [[CircleDollarSign, 'Free estimates'], [BadgeCheck, 'Respectful in-home service'], [CalendarDays, 'Easy online booking']];
const services = [[residentialImage, 'Air Duct Cleaning', '/air-duct-cleaning/'], [dryerImage, 'Dryer Vent Cleaning', '/dryer-vent-cleaning/'], [chimneyImage, 'Chimney Cleaning', '/chimney-cleaning/'], [commercialImage, 'Commercial Duct Cleaning', '/commercial-air-duct-cleaning/']];
const cleanGallery = [[cleanDuctInterior, 'Inside the system', 'A cleaner system supports fresher air throughout your home.'], [cleanCeilingVent, 'Clean finishes', 'Fresh-looking vents help a room feel cared for.']];

export default function Home() { return <>
  <section className="original-hero upgraded-hero">
    <div className="original-hero-copy"><div className="hero-breeze" aria-hidden="true">{[1, 2, 3, 4].map(n => <Wind key={n} className={`wind-icon wind-icon-${n}`} aria-hidden="true" />)}</div><h1>A fresher home<br />starts with <span>clean air ducts.</span></h1><p className="lede">Professional air duct, dryer vent, and chimney service for homes that deserve clean, comfortable air.</p><div className="hero-points"><span><Sparkles aria-hidden="true" />Clear next steps.</span><span><Heart aria-hidden="true" />Respectful service.</span><span><MapPin aria-hidden="true" />Local coordination.</span></div><div className="hero-actions"><Link className="button original-primary" to="/booking">Get Free Quote <span>→</span></Link><Link className="hero-secondary" to="/services">Explore services</Link></div></div>
    <figure className="original-hero-image"><img src={familyHero} fetchPriority="high" alt="Family relaxing in a clean, bright living room" /><HeroLocation /></figure>
    <div className="hero-availability"><AvailabilityCard /></div>
  </section>
  <section className="trust-rail" aria-label="Easy Breezy service promises"><article className="trust-location"><TrustLocation /></article>{trust.map(([Icon, title]) => <article key={title}><Icon aria-hidden="true" /><strong>{title}</strong></article>)}</section>
  <section className="original-services"><div className="section-top"><h2>How can we help?</h2><p>Simple, respectful service from quote to clean finish.</p></div><div className="service-card-grid">{services.map(([image, title, href]) => <article className="service-card" key={title}><img src={image} alt={title} /><div><h3>{title}</h3><p>Professional cleaning with clear expectations and a straightforward estimate.</p><Link className="text-link" to={href}>Learn more →</Link></div></article>)}</div></section>
  <section className="results-section"><div className="section-top"><h2>Proof belongs in the work.</h2><p>Our gallery is being prepared with real, approved job photos—never made-up before-and-afters.</p></div><div className="clean-gallery">{cleanGallery.map(([image, title, text]) => <figure key={title}><img src={image} loading="lazy" alt={title} /><figcaption><strong>{title}</strong><span>{text}</span></figcaption></figure>)}</div><div className="real-photo-note"><strong>Real job photos coming soon.</strong><span>We will add clear before-and-after context, service details, and local-area information as approved photos arrive.</span><Link to="/before-after">See how the gallery will work →</Link></div></section>
  <section className="quote-section"><div className="quote-copy"><p className="quote-kicker">Simple booking. Clear next steps.</p><h2>Ready to make it Easy Breezy?</h2><p>Tell us about your home or business, and we’ll follow up with a clear estimate.</p><ul className="quote-reassurance"><li>Clear pricing before we start</li><li>Respectful service in your home</li><li>A time that works for your schedule</li></ul></div><div className="quote-form"><BookingForm /></div></section>
  <section className="dark-cta"><div><h2>Dirty ducts? Easy Breezy.</h2><p>Book the service that makes your home feel easier.</p></div><div className="cta-details"><span><CalendarDays /> Easy online booking</span></div><Link className="button light" to="/booking">Book service <span>→</span></Link></section>
</>; }
