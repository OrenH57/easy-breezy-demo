import { useState } from 'react';
import { api, retryRequest, stateCode } from '../lib/api';

const services = ['Air duct cleaning', 'Dryer vent cleaning', 'Filter replacement & care', 'Chimney repair & sweep', 'Commercial cleaning'];

export function BookingForm({ compact = false, selectedService }) {
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setStatus('');
    setStatusType('');
    const details = Object.fromEntries(new FormData(event.currentTarget));
    if (!details.phone.trim() && !details.email.trim()) {
      setStatusType('error');
      setStatus('Please add either a phone number or an email address so we can get back to you.');
      return;
    }
    const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    setSubmitting(true);
    try {
      await retryRequest(() => api('/api/leads', { method: 'POST', headers: { 'Idempotency-Key': requestId }, body: JSON.stringify({ ...details, stateCode, requestId }) }), {
        onRetry: (attempt, retries) => setStatus(`Still trying to send your request (${attempt}/${retries})…`),
      });
      event.currentTarget.reset();
      setStatusType('success');
      setStatus('Request received — we will contact you shortly.');
    } catch (error) {
      setStatusType('error');
      setStatus(error.message || 'We could not send your request. Please try again in a moment.');
    } finally { setSubmitting(false); }
  }
  return <form className="booking" onSubmit={submit}>
    <label>Full name<input name="name" autoComplete="name" placeholder="Your full name" required /></label>
    <label>Phone number<input name="phone" autoComplete="tel" inputMode="tel" placeholder="Best number to reach you" /></label>
    <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" /></label>
    <label>Service<select name="service" defaultValue={services.includes(selectedService) ? selectedService : services[0]}>{services.map((service) => <option key={service}>{service}</option>)}</select></label>
    <label>Preferred date <span className="field-optional">(optional)</span><input name="preferredDate" type="date" /></label>
    <label>Anything helpful? <span className="field-optional">(optional)</span><textarea name="notes" rows="3" placeholder="Home type, concern, or timing" /></label>
    <button className="button" disabled={submitting}>{submitting ? 'Sending request…' : 'Request appointment'}</button>
    {status && <small className={`form-status${statusType === 'error' ? ' form-status-error' : ''}`} role={statusType === 'error' ? 'alert' : 'status'}>{status}</small>}
  </form>;
}
