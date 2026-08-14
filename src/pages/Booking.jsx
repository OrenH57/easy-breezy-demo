import { useSearchParams } from 'react-router-dom';
import { BookingForm } from '../components/BookingForm';

export default function Booking() {
  const [searchParams] = useSearchParams();
  return <section className="booking-page"><div><p className="eyebrow">Easy scheduling</p><h1>Let’s make a plan.</h1><p className="lede">Send the basics and a local coordinator will contact you to confirm the right scope and time.</p><div className="contact-rail"><b>Prefer to talk?</b><p>Request a callback in the form and we will be in touch shortly.</p></div></div><div className="booking-shell"><h2>Request your service</h2><BookingForm selectedService={searchParams.get('service')} /></div></section>;
}
