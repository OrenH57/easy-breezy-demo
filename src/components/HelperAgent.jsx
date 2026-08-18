import { ArrowRight, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import helperAgent from '../assets/easy-breezy-helper-agent.webp';
import { api, ApiError } from '../lib/api';

const greeting = "Hi, I'm Maya. I help Easy Breezy customers figure out the right service and get a free estimate — what's going on with your home or business?";
const quickReplies = ['My dryer takes forever to dry', 'The air in my house feels dusty', 'I need my chimney swept', 'I run a business and need commercial cleaning'];
const services = ['Dryer vent cleaning', 'Air duct cleaning', 'Chimney repair & sweep', 'Commercial duct cleaning'];
const detectService = (text) => services.find((service) => text.toLowerCase().includes(service.split(' ')[0].toLowerCase())) || '';

export function HelperAgent() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [need, setNeed] = useState('');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState('');
  const chatLogRef = useRef(null);
  useEffect(() => {
    const log = chatLogRef.current;
    if (log) log.scrollTo({ top: log.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);
  const close = () => { setIsOpen(false); setNeed(''); setMessages([]); setDraft(''); setChatError(''); };
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
  async function send(text) {
    if (!text || sending) return;
    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, { role: 'user', content: text }]);
    setDraft(''); setChatError(''); setSending(true);
    try {
      const { reply } = await api('/api/maya', { method: 'POST', body: JSON.stringify({ message: text, history }) });
      setMessages((current) => [...current, { role: 'assistant', content: reply }]);
      const detected = detectService(`${text} ${reply}`);
      if (detected) setNeed(detected);
    } catch (error) {
      setChatError(error instanceof ApiError ? error.message : 'Maya could not respond just now. Please try again.');
    } finally {
      setSending(false);
    }
  }
  function sendMessage(event) {
    event.preventDefault();
    send(draft.trim());
  }
  return <aside className="eb-helper" aria-label="Easy Breezy service guide">
    {isOpen ? <div className="helper-card"><div className="helper-heading"><div className="helper-avatar"><img src={helperAgent} alt="Maya from Easy Breezy" /></div><div><p className="helper-title">Chat with Maya</p><p className="helper-byline">Our AI assistant — here to help you find the right service.</p></div><button className="helper-close" type="button" aria-label="Close Easy Breezy helper" onClick={close}><X aria-hidden="true" /></button></div>
      <div className="helper-chat-log" role="log" aria-live="polite" ref={chatLogRef}>
        <p className="helper-chat-turn helper-chat-assistant">{greeting}</p>
        {messages.map((turn, index) => <p key={index} className={`helper-chat-turn helper-chat-${turn.role}`}>{turn.content}</p>)}
        {sending && <p className="helper-chat-turn helper-chat-assistant helper-chat-pending">Maya is typing…</p>}
      </div>
      {messages.length === 0 && <div className="helper-actions">{quickReplies.map((label) => <button key={label} className="helper-action" type="button" onClick={() => send(label)} disabled={sending}>{label}</button>)}</div>}
      {need && <div className="helper-actions"><p className="helper-match">Sounds like a good fit: <strong>{need}</strong>. Ready when you are.</p><Link to={`/booking?service=${encodeURIComponent(need)}`} className="helper-action helper-action-primary" onClick={() => setIsOpen(false)}>Request a free quote <ArrowRight aria-hidden="true" /></Link></div>}
      {chatError && <p className="helper-chat-error" role="alert">{chatError}</p>}
      <form className="helper-chat-form" onSubmit={sendMessage}>
        <label className="helper-chat-label" htmlFor="helper-chat-input">Ask Maya a question</label>
        <input id="helper-chat-input" type="text" placeholder="Ask Maya anything about our services…" value={draft} onChange={(event) => setDraft(event.target.value)} disabled={sending} autoComplete="off" />
        <button type="submit" className="helper-chat-send" aria-label="Send message to Maya" disabled={sending || !draft.trim()}><Send aria-hidden="true" /></button>
      </form>
    </div> : <div className="helper-launcher-wrap"><span className={`helper-sign${canContinueBooking ? ' helper-sign-continue' : ''}`}>{canContinueBooking ? 'Perfect — tell us a little about your home and we’ll take it from here.' : 'Hi, I’m Maya — I’m here to help.'}</span><button className="helper-launcher helper-avatar-launcher" type="button" aria-label={canContinueBooking ? 'Continue your booking' : 'Ask Maya to help choose a service'} onClick={canContinueBooking ? continueBooking : () => setIsOpen(true)}><span className="helper-avatar-frame"><img src={helperAgent} alt="Maya from Easy Breezy" /></span></button></div>}
  </aside>;
}
