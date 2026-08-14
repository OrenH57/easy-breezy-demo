import { CalendarDays, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const services = ['Air duct cleaning', 'Dryer vent cleaning', 'Chimney cleaning', 'Commercial cleaning'];

export function AvailabilityCard() {
  const [service, setService] = useState(services[0]);
  const [zip, setZip] = useState('');
  const [checked, setChecked] = useState(false);
  const validZip = /^\d{5}$/.test(zip);
  return <aside className="availability-card" aria-labelledby="availability-title">
    <div className="availability-heading"><span><CalendarDays aria-hidden="true" /></span><div><strong id="availability-title">Check your next available appointment</strong><small>We confirm every time window with a local coordinator.</small></div></div>
    <label>Service<select value={service} onChange={(event) => setService(event.target.value)}>{services.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label>ZIP code<input value={zip} onChange={(event) => { setZip(event.target.value.replace(/\D/g, '').slice(0, 5)); setChecked(false); }} inputMode="numeric" placeholder="e.g. 20850" aria-describedby="availability-note" /></label>
    <button type="button" className="button" onClick={() => setChecked(true)} disabled={!validZip}>See availability <span>→</span></button>
    {checked && <div className="availability-result" id="availability-note"><MapPin aria-hidden="true" /><span>We serve this area. <Link to={`/booking?service=${encodeURIComponent(service)}&zip=${zip}`}>Choose a preferred time →</Link></span></div>}
    {!checked && <small id="availability-note">No payment or commitment required.</small>}
  </aside>;
}
