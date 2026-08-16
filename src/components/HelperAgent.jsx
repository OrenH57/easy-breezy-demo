import { ArrowRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import helperAgent from '../assets/easy-breezy-helper-agent.webp';

const choices = [['My dryer takes too long', 'Dryer vent cleaning'], ['The air feels dusty', 'Air duct cleaning'], ['I need chimney service', 'Chimney repair & sweep'], ['I am not sure yet', 'Air duct cleaning']];

export function HelperAgent() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [need, setNeed] = useState('');
  const [isAvailabilityVisible, setIsAvailabilityVisible] = useState(false);
  const close = () => { setIsOpen(false); setNeed(''); };
  const canContinueBooking = Boolean(need && location.pathname === '/booking');
  const continueBooking = () => {
    const form = document.querySelector('.booking');
    if (!form) return;
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => {
      const firstUnfinished = [...form.querySelectorAll('input, select, textarea')].find((field) => field.required && !field.value);
      (firstUnfinished || form.querySelector('input, select, textarea'))?.focus({ preventScroll: true });
    }, 350);
  };
  useEffect(() => {
    const target = document.querySelector('.availability-card');
    if (!target || !('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver(([entry]) => setIsAvailabilityVisible(entry.isIntersecting), { threshold: 0.25 });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  return <aside className={`eb-helper${isAvailabilityVisible ? ' eb-helper-paused' : ''}`} aria-label="Easy Breezy service guide">
    {isOpen ? <div className="helper-card"><div className="helper-heading"><div className="helper-avatar"><img src={helperAgent} alt="Maya from Easy Breezy" /></div><div><p className="helper-title">Need help choosing a service?</p><p className="helper-byline">Maya can point you in the right direction.</p></div><button className="helper-close" type="button" aria-label="Close Easy Breezy helper" onClick={close}><X aria-hidden="true" /></button></div>
      {!need ? <div className="helper-actions">{choices.map(([label, service]) => <button key={label} className="helper-action" type="button" onClick={() => setNeed(service)}>{label}</button>)}</div> : <div className="helper-actions"><p className="helper-match">Based on that, start with <strong>{need}</strong>. We will confirm the right scope before work begins.</p><Link to={`/booking?service=${encodeURIComponent(need)}`} className="helper-action helper-action-primary" onClick={() => setIsOpen(false)}>Request a free quote <ArrowRight aria-hidden="true" /></Link><button className="helper-action helper-back" type="button" onClick={() => setNeed('')}>Choose another concern</button></div>}
    </div> : <div className="helper-launcher-wrap"><span className={`helper-sign${canContinueBooking ? ' helper-sign-continue' : ''}`}>{canContinueBooking ? 'Continue booking' : 'Hi, I’m Maya — I’m here to help.'}</span><button className="helper-launcher helper-avatar-launcher" type="button" aria-label={canContinueBooking ? 'Continue your booking' : 'Ask Maya to help choose a service'} onClick={canContinueBooking ? continueBooking : () => setIsOpen(true)}><span className="helper-avatar-frame"><img src={helperAgent} alt="Maya from Easy Breezy" /></span></button></div>}
  </aside>;
}
