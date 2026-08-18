import { Link } from 'react-router-dom';
import { BadgeCheck, CalendarDays, CircleDollarSign, Heart, Sparkles } from 'lucide-react';
import familyHero from '../assets/easy-breezy-family-hero-v2.webp';
import residentialImage from '../assets/service/easy-breezy-duct-technician.webp';
import dryerImage from '../assets/service/easy-breezy-dryer-technician.webp';
import chimneyImage from '../assets/service/easy-breezy-chimney-technician.webp';
import commercialImage from '../assets/service/easy-breezy-commercial-back.webp';
import { HeroLocation } from '../components/HeroLocation';
import { BookingForm } from '../components/BookingForm';
import { TrustLocation } from '../components/TrustLocation';
import { getViewerLocationName, useViewerLocation } from '../hooks/useViewerLocation';
import workerWithLogo from '../assets/before-after/worker-with-logo.jpg';
import chimneyCapBefore2 from '../assets/before-after/chimney-cap-before-2.jpg';
import chimneyCapAfter1 from '../assets/before-after/chimney-cap-after-1.jpg';
import dryerVentBefore from '../assets/before-after/dryer-vent-before.jpg';
import dryerVentAfter from '../assets/before-after/dryer-vent-after.jpg';
import ductBefore from '../assets/before-after/duct-before.jpg';
import ductAfter from '../assets/before-after/duct-after.jpg';

const trust = [[CircleDollarSign, 'Free estimates'], [BadgeCheck, 'Respectful in-home service'], [CalendarDays, 'Easy online booking']];
const services = [
  [residentialImage, 'Air Duct Cleaning', '/air-duct-cleaning/', "Dust and allergens build up fast — most homeowners are surprised at what actually comes out. Breathe easier with a full duct cleaning, not just a surface wipe."],
  [dryerImage, 'Dryer Vent Cleaning', '/dryer-vent-cleaning/', "Trapped lint is a leading cause of house fires, and it's slowing your dryer down right now. One visit fixes both."],
  [chimneyImage, 'Chimney Cleaning', '/chimney-cleaning/', "Creosote buildup turns a cozy fireplace into a fire hazard. Get swept and inspected before burning season starts."],
  [commercialImage, 'Commercial Duct Cleaning', '/commercial-air-duct-cleaning/', "Poor air quality sends employees home sick and drives up energy costs. We work around your hours so operations never stop."],
];
const beforeAfterPairs = [
  [chimneyCapBefore2, chimneyCapAfter1, 'One less way for water to get in', 'Corroded flashing meant water was working its way into the chase. A full replacement — not a patch — closes that off.'],
  [dryerVentBefore, ductAfter, 'A real fire risk, removed', 'Years of trapped lint made this a fire hazard waiting to happen. Clear now, and the dryer runs like new.', 'center 20%'],
  [ductBefore, dryerVentAfter, 'Air can finally move again', 'Built-up dust was choking this line. Cleared out, so conditioned air actually reaches the room it was meant for.', 'center', 'contain'],
];

export default function Home() {
  const viewerLocation = useViewerLocation();
  const hasViewerCity = viewerLocation?.city && viewerLocation.countryCode === 'US';
  const locationName = hasViewerCity ? getViewerLocationName(viewerLocation) : '';
  const beforeAfterLocationText = locationName ? `${locationName} homes` : 'homes just like yours';
  return <>
  <section className="original-hero upgraded-hero">
    <div className="original-hero-copy"><h1>A fresher home<br />starts with <span>clean air ducts.</span></h1><p className="lede">Professional air duct, dryer vent, and chimney service for homes that deserve clean, comfortable air.</p><div className="hero-points"><span><Sparkles aria-hidden="true" />Clear next steps.</span><span><Heart aria-hidden="true" />Respectful service.</span></div><div className="hero-actions"><Link className="button original-primary" to="/services">Explore services <span>→</span></Link></div></div>
    <div className="hero-availability" id="hero-availability">
      <aside className="availability-card hero-quote-card" aria-labelledby="hero-quote-title">
        <div className="availability-heading"><span><CalendarDays aria-hidden="true" /></span><div><strong id="hero-quote-title">Get your free estimate</strong><small>Tell us a bit about your home and we&apos;ll follow up with next steps.</small></div></div>
        <BookingForm />
      </aside>
    </div>
    <figure className="original-hero-image"><img src={familyHero} fetchPriority="high" alt="Family relaxing in a clean, bright living room" /><HeroLocation /></figure>
  </section>
  <section className="trust-rail" aria-label="Easy Breezy service promises"><article className="trust-location"><TrustLocation /></article>{trust.map(([Icon, title]) => <article key={title}><Icon aria-hidden="true" /><strong>{title}</strong></article>)}</section>
  <section className="original-services"><div className="section-top"><h2>How can we help?</h2><p>Simple, respectful service from quote to clean finish.</p></div><div className="service-card-grid">{services.map(([image, title, href, blurb]) => <article className="service-card" key={title}><img src={image} alt={title} /><div><h3>{title}</h3><p>{blurb}</p><Link className="text-link" to={href}>Learn more →</Link></div></article>)}</div></section>
  <section className="results-section">
    <div className="results-intro">
      <div className="section-top"><h2>Real jobs, real before &amp; after.</h2><p>No stock photography and no staged photos — every picture here came from an actual job in {beforeAfterLocationText}, start to finish. If we wouldn't put our name on it, it doesn't go in this gallery.</p></div>
      <figure className="crew-photo"><img src={workerWithLogo} loading="lazy" alt="Easy Breezy technician cutting in a new duct access point, wearing the Easy Breezy logo" /><figcaption>Improving your home's air quality, one job at a time.</figcaption></figure>
    </div>
    <div className="before-after-grid">{beforeAfterPairs.map(([before, after, title, text, beforePosition, beforeFit]) => <article className="before-after-pair" key={title}>
      <div className="before-after-images">
        <figure><img src={before} loading="lazy" alt={`${title} — before`} style={beforePosition || beforeFit ? { objectPosition: beforePosition || 'center', objectFit: beforeFit || 'cover' } : undefined} /><span className="ba-tag ba-before">Before</span></figure>
        <figure><img src={after} loading="lazy" alt={`${title} — after`} /><span className="ba-tag ba-after">After</span></figure>
      </div>
      <div className="before-after-caption"><strong>{title}</strong><span>{text}</span></div>
    </article>)}</div>
    <p className="muted results-trust-note">Ask your technician to walk you through the same kind of before-and-after on your own job — we're glad to show you exactly what changed and why.</p>
  </section>
  <section className="dark-cta"><div><h2>Dirty ducts? Easy Breezy.</h2><p>Book the service that makes your home feel easier.</p></div><div className="cta-details"><span><CalendarDays /> Easy online booking</span></div><a className="button light" href="#hero-availability">Get your free estimate <span>→</span></a></section>
</>; }
