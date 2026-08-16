import { useEffect, useRef, useState } from 'react';

// Two hand-composed S-curve bands, drawn in real pixel space rather than a
// fixed viewBox. Control points are defined once at DESIGN_WIDTH and scaled
// uniformly by the container's actual width; each band's vertical position
// is a separate height-fraction *offset* (translation only). This keeps the
// curve's proportions constant on any box shape — a fixed viewBox stretched
// with preserveAspectRatio="none" blew up into distorted blobs on tall
// mobile boxes because x and y were scaled by different factors.
const DESIGN_WIDTH = 400;

// [x, yOffset] control points around each band's own baseline, in design units.
const BAND_A_POINTS = [
  [-30, 18], [40, -47], [95, -47], [150, 3],
  [205, 53], [245, 53], [300, -7], [340, -47], [375, -47], [430, -2],
];
const BAND_B_POINTS = [
  [-30, -15], [30, 25], [80, 25], [130, -10],
  [185, -50], [230, -50], [280, -5], [325, 35], [365, 35], [420, -10],
];

function toPath(points, scale, baselineY) {
  const p = points.map(([x, y]) => [x * scale, baselineY + y * scale]);
  let d = `M ${p[0][0]} ${p[0][1]}`;
  for (let i = 1; i < p.length; i += 3) {
    d += ` C ${p[i][0]} ${p[i][1]}, ${p[i + 1][0]} ${p[i + 1][1]}, ${p[i + 2][0]} ${p[i + 2][1]}`;
  }
  return d;
}

export function WindStreaks() {
  const rootRef = useRef(null);
  const [box, setBox] = useState(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setBox({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = box ? box.width / DESIGN_WIDTH : 1;
  const width = box ? box.width : DESIGN_WIDTH;
  const height = box ? box.height : 160;
  const bandA = toPath(BAND_A_POINTS, scale, height * 0.42);
  const bandB = toPath(BAND_B_POINTS, scale, height * 0.24);
  const blur = Math.min(5, Math.max(2, 4 * scale));

  return (
    <div className="hero-breeze" ref={rootRef} aria-hidden="true">
      {box && (
        <svg className="wind-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <filter id="wind-glow" x="-20%" y="-200%" width="140%" height="500%">
              <feGaussianBlur stdDeviation={blur} />
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
            <path d={bandA} className="wind-glow" stroke="url(#wind-fade-glow)" strokeWidth={7 * scale} fill="none" filter="url(#wind-glow)" />
            <path d={bandA} className="wind-core" stroke="url(#wind-fade-core)" strokeWidth={Math.max(1.2, 1.6 * scale)} fill="none" />
          </g>
          <g className="wind-band wind-band-b">
            <path d={bandB} className="wind-glow" stroke="url(#wind-fade-glow)" strokeWidth={5 * scale} fill="none" filter="url(#wind-glow)" />
            <path d={bandB} className="wind-core" stroke="url(#wind-fade-core)" strokeWidth={Math.max(1, 1.2 * scale)} fill="none" />
          </g>
        </svg>
      )}

      <div className="wind-leaves">
        <span className="wind-leaf wind-leaf-1" />
        <span className="wind-leaf wind-leaf-2" />
        <span className="wind-leaf wind-leaf-3" />
        <span className="wind-leaf wind-leaf-4" />
      </div>
    </div>
  );
}
