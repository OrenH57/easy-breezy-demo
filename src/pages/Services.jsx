import { Link, useParams } from 'react-router-dom';
import technicianImage from '../assets/service-technician.jpg';
import './services.css';

const items = [
  ['Air duct cleaning', 'A thorough whole-home duct cleaning to help reduce dust, allergens, and buildup in your HVAC system.'],
  ['Dryer vent cleaning', 'Lint and debris removal that helps your dryer vent move air safely and efficiently.'],
  ['Filter replacement & care', 'Simple filter replacement and guidance to keep your heating and cooling system protected between visits.'],
  ['Chimney repair & sweep', 'Professional chimney cleaning and repair for a safer, better-maintained home.'],
  ['Commercial cleaning', 'Flexible air-duct and vent-cleaning plans designed around your building access and business hours.'],
];

export default function Services() {
  const { state } = useParams();
  const bookingPath = state ? `/${state}/booking` : '/booking';

  return <section className="page"><p className="eyebrow">Our services</p><h1>Clear work.<br /><em>Clear results.</em></h1><div className="services-intro"><div><p className="lede">Choose the service that fits your home or business. We will confirm the right scope before we arrive.</p><p className="services-note">A trained technician assesses the system and completes the work carefully, with respect for your space.</p></div><figure><img src={technicianImage} alt="HVAC technician servicing an air conditioning unit" /><figcaption>Professional care, from the equipment to your home.</figcaption></figure></div><div className="service-list">{items.map(([title, text], index) => <article key={title}><b>0{index + 1}</b><h2>{title}</h2><p>{text}</p><Link to={`${bookingPath}?service=${encodeURIComponent(title)}`}>Book this service →</Link></article>)}</div></section>;
}
