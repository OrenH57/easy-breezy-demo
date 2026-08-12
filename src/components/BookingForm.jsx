import { useState } from 'react';
import { api, stateCode } from '../lib/api';

export function BookingForm({ compact = false }) {
  const [status, setStatus] = useState('');
  async function submit(event) {
    event.preventDefault();
    setStatus('');
    const details = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await api('/api/leads', { method: 'POST', body: JSON.stringify({
        ...details,
        reminderConsent: details.reminderConsent === 'on',
        stateCode,
      }) });
      event.currentTarget.reset();
      setStatus('Request received — we will contact you shortly.');
    } catch (error) { setStatus(error.message); }
  }
  return <form className="booking" onSubmit={submit}>
    <input name="name" placeholder="Full name" required />
    <input name="phone" placeholder="Phone number" required />
    <input name="email" type="email" placeholder="Email address" required />
    <select name="service"><option>Air duct cleaning</option><option>Dryer vent cleaning</option><option>Filter replacement & care</option><option>Chimney repair & sweep</option><option>Commercial cleaning</option></select>
    <input name="preferredDate" type="date" />
    <textarea name="notes" rows="3" placeholder="Tell us anything helpful (optional)" />
    <label style={{display:'flex',alignItems:'flex-start',gap:8,color:'var(--muted)',fontSize:12,lineHeight:1.4}}><input name="reminderConsent" type="checkbox" required style={{width:'auto',minWidth:14,margin:'2px 0 0',padding:0}} /> Yes, email me a yearly service reminder. I can unsubscribe anytime.</label>
    <button className="button">Request appointment</button>
    {status && <small className="form-status">{status}</small>}
  </form>;
}
