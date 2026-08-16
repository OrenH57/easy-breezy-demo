import windGust from '../assets/wind-gust.png';
import windGust2 from '../assets/wind-gust-2.png';

// Real illustrated wind-gust wisps (cropped from a stock asset, see wind.jpg
// at the project root), kept as their original white/transparent shading. A
// violet tint is layered on top via a separate masked+blended element
// (not baked into the pixels), and each gust sweeps quickly across the hero.
// See reference-style.css for .hero-breeze / .wind-gust-* / .wind-leaf rules.
function Gust({ src, className }) {
  return (
    <span className={`wind-gust-wrap ${className}`}>
      <img src={src} className="wind-gust-img" alt="" />
      <span className="wind-gust-tint" style={{ '--gust-mask': `url(${src})` }} />
    </span>
  );
}

export function WindStreaks() {
  return (
    <div className="hero-breeze" aria-hidden="true">
      <Gust src={windGust} className="wind-gust-1" />
      <Gust src={windGust2} className="wind-gust-2" />
      <span className="wind-leaf wind-leaf-1" />
      <span className="wind-leaf wind-leaf-2" />
      <span className="wind-leaf wind-leaf-3" />
      <span className="wind-leaf wind-leaf-4" />
    </div>
  );
}
