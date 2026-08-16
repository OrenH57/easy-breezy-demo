// Small drifting marks, built the same way as the leaves: plain CSS shapes
// positioned with keyframed left/top/rotate, no SVG viewBox scaling involved.
// See reference-style.css for the .hero-breeze / .wind-* / .leaf-* rules.
export function WindStreaks() {
  return (
    <div className="hero-breeze" aria-hidden="true">
      <span className="wind-mark wind-mark-1" />
      <span className="wind-mark wind-mark-2" />
      <span className="wind-mark wind-mark-3" />
      <span className="wind-leaf wind-leaf-1" />
      <span className="wind-leaf wind-leaf-2" />
      <span className="wind-leaf wind-leaf-3" />
      <span className="wind-leaf wind-leaf-4" />
    </div>
  );
}
