import { Link } from 'react-router-dom';
import { BadgeCheck, CalendarDays, Clock3, House, Leaf, ShieldCheck, Sparkles, Wind } from 'lucide-react';
import livingRoomImage from '../assets/living-room-unsplash.jpg';
import marylandHomeImage from '../assets/maryland-brick-home.jpg';
import { BookingForm } from '../components/BookingForm';

const trust = [
  [ShieldCheck, 'Trusted professionals', 'Trained, insured, and respectful'],
  [Leaf, 'Healthier home', 'Helps reduce dust and allergens'],
  [House, 'Care for your home', 'Clean work from arrival to finish'],
  [BadgeCheck, 'Satisfaction first', 'We make it right if it is not right'],
];
const benefits = [
  [Wind, 'Cleaner air for your family', 'We remove dust, pollen, pet dander, and more from the system you use every day.'],
  [Sparkles, 'More efficient heating and cooling', 'Clear ducts can help your heating and cooling system run more efficiently, which may help lower energy bills.'],
  [Leaf, 'Less dust in your home', 'Removing buildup from your ducts helps reduce the dust circulating through your living spaces.'],
];

export default function Home() {
  return <>
    <section className="hero">
      <div className="hero-content">
        <div className="hero-copy">
          <h1>Professional<br />air duct cleaning.<br />A healthier home.</h1>
          <p className="lede">Easy Breezy provides professional air duct cleaning for Maryland homes—clear communication, respectful service, and a cleaner home when we are done.</p>
          <div className="hero-actions"><Link className="button" to="/booking">Book your service</Link><a className="text-link" href="tel:+14435553827">Call (443) 555-3827</a></div>
        </div>
        <div className="hero-form">
          <p className="form-kicker">Book your service</p>
          <p className="form-intro">Pick a time to get started. We will confirm the right scope before we arrive.</p>
          <BookingForm compact />
        </div>
      </div>
      <figure className="hero-image"><img src={livingRoomImage} alt="Sunlit, carefully kept living room" /><figcaption>Less dust in the air.<br /><strong>More comfort at home.</strong></figcaption></figure>
    </section>
    <section className="trust-rail">{trust.map(([Icon, title, text]) => <article key={title}><Icon /><div><strong>{title}</strong><span>{text}</span></div></article>)}</section>
    <section className="story-section">
      <div className="story-photo"><img src={marylandHomeImage} alt="A well-kept brick Maryland home" /></div>
      <div className="story-content"><p className="eyebrow">Our approach</p><h2>Local care. Professional results you can feel.</h2><p>From the first call through your next reminder, we make home air care feel simple. We explain what matters, show up with respect, and leave you with a clear next step.</p><Link className="text-link" to="/about">Learn why it matters <span>→</span></Link></div>
    </section>
    <section className="benefit-section"><div className="section-top"><p className="eyebrow">What clean air changes</p><h2>Useful service.<br />Real benefits.</h2></div><div className="benefit-grid">{benefits.map(([Icon, title, text]) => <article className="benefit" key={title}><Icon /><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section className="dark-cta"><div><h2>Start with a cleaner, healthier home.</h2><p>Book your air-duct cleaning today.</p></div><div className="cta-details"><span><CalendarDays /> Easy online booking</span><span><Clock3 /> A time that works for you</span></div><Link className="button light" to="/booking">Book service <span>→</span></Link></section>
  </>;
}
