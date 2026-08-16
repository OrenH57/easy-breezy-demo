// Two hand-composed S-curve paths animated with CSS (stroke-dasharray flow +
// a gentle sway), the way flowing-line effects are typically built for real
// sites: one deliberate, art-directed shape, not a procedural simulation.
// Leaves are plain HTML siblings (not nested in the SVG) so they aren't
// distorted by the SVG's non-uniform preserveAspectRatio="none" stretch.
// See reference-style.css for the .hero-breeze / .wind-* rules.
const BAND_A = 'M -30 118 C 40 53, 95 53, 150 103 C 205 153, 245 153, 300 93 C 340 53, 375 53, 430 98';
const BAND_B = 'M -30 65 C 30 105, 80 105, 130 70 C 185 30, 230 30, 280 75 C 325 115, 365 115, 420 70';

export function WindStreaks() {
  return (
    <div className="hero-breeze" aria-hidden="true">
      <svg className="wind-svg" viewBox="0 0 400 160" preserveAspectRatio="none">
        <defs>
          <filter id="wind-glow" x="-40%" y="-200%" width="180%" height="500%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <linearGradient id="wind-fade-glow" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#7c6df0" stopOpacity="0" />
            <stop offset="16%" stopColor="#7c6df0" stopOpacity=".85" />
            <stop offset="84%" stopColor="#7c6df0" stopOpacity=".85" />
            <stop offset="100%" stopColor="#7c6df0" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="wind-fade-core" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
            <stop offset="16%" stopColor="#fff" stopOpacity=".95" />
            <stop offset="84%" stopColor="#fff" stopOpacity=".95" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g className="wind-band wind-band-a">
          <path d={BAND_A} className="wind-glow" stroke="url(#wind-fade-glow)" strokeWidth="14" fill="none" filter="url(#wind-glow)" />
          <path d={BAND_A} className="wind-core" stroke="url(#wind-fade-core)" strokeWidth="2.4" fill="none" />
        </g>
        <g className="wind-band wind-band-b">
          <path d={BAND_B} className="wind-glow" stroke="url(#wind-fade-glow)" strokeWidth="10" fill="none" filter="url(#wind-glow)" />
          <path d={BAND_B} className="wind-core" stroke="url(#wind-fade-core)" strokeWidth="1.8" fill="none" />
        </g>
      </svg>

      <div className="wind-leaves">
        <span className="wind-leaf wind-leaf-1" />
        <span className="wind-leaf wind-leaf-2" />
        <span className="wind-leaf wind-leaf-3" />
        <span className="wind-leaf wind-leaf-4" />
      </div>
    </div>
  );
}
