import windGust from '../assets/wind-gust.png';
import windGust2 from '../assets/wind-gust-2.png';

// Real illustrated wind-gust wisps (cropped + recolored from a stock asset,
// see wind.jpg at the project root) drifting behind the hero heading,
// plus the small CSS leaf marks. See reference-style.css for .hero-breeze /
// .wind-gust / .wind-leaf rules.
export function WindStreaks() {
  return (
    <div className="hero-breeze" aria-hidden="true">
      <img src={windGust} className="wind-gust wind-gust-1" alt="" />
      <img src={windGust2} className="wind-gust wind-gust-2" alt="" />
      <span className="wind-leaf wind-leaf-1" />
      <span className="wind-leaf wind-leaf-2" />
      <span className="wind-leaf wind-leaf-3" />
      <span className="wind-leaf wind-leaf-4" />
    </div>
  );
}
