import { Camera, ImagePlus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Results() { return <main className="results-page page">
  <section className="results-intro"><p className="eyebrow">Work, not stock imagery</p><h1>Real results deserve real photos.</h1><p className="lede">This is where we will share approved before-and-after work from local homes and businesses—grouped by service and area.</p></section>
  <section className="photo-waiting" aria-labelledby="photos-title"><div className="photo-waiting-icon"><Camera aria-hidden="true" /></div><div><h2 id="photos-title">Real job photos coming soon</h2><p>We are building this gallery carefully, with customer permission and clear context for each job.</p></div><ImagePlus aria-hidden="true" className="photo-waiting-mark" /></section>
  <section className="proof-promise"><h2>What each result will show</h2><ul><li>The service completed</li><li>The local area</li><li>What was found and cleaned</li><li>Clear before-and-after context</li></ul><Link className="button" to="/booking">Request your service <span>→</span></Link></section>
</main>; }
