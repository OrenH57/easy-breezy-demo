import { useState } from 'react';
import { api, stateCode } from '../lib/api';

const services = ['Air duct cleaning', 'Dryer vent cleaning', 'Filter replacement & care', 'Chimney repair & sweep', 'Commercial cleaning'];

export function BookingForm({ compact = false, selectedService }) {
  const [status, setStatus] = useState('');
  async function submit(event) {
    event.preventDefault();
    setStatus('');
    const details = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await api('/api/leads', { method: 'POST', body: JSON.stringify({
        ...details,
        stateCode,
      }) });
      event.currentTarget.reset();
      setStatus('Request received — we will contact you shortly.');
    } catch (error) { setStatus(error.message); }
  }
  return <form className="booking" onSubmit={submit}>
    <label>Full name<input name="name" autoComplete="name" placeholder="Your full name" required /></label>
    <label>Phone number<input name="phone" autoComplete="tel" inputMode="tel" placeholder="Best number to reach you" required /></label>
    <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
    <label>Service<select name="service" defaultValue={services.includes(selectedService) ? selectedService : services[0]}>{services.map((service) => <option key={service}>{service}</option>)}</select></label>
    <label>Preferred date <span className="field-optional">(optional)</span><input name="preferredDate" type="date" /></label>
    <label>Anything helpful? <span className="field-optional">(optional)</span><textarea name="notes" rows="3" placeholder="Home type, concern, or timing" /></label>
    <button className="button">Request appointment</button>
    {status && <small className="form-status">{status}</small>}
  </form>;
}
