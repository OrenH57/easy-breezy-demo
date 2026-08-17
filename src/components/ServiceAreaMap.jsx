import './ServiceAreaMap.css';
import { US_STATES_PATH, MD_DC_PATH } from './usMapPath.js';
import { getViewerLocationName, useViewerLocation } from '../hooks/useViewerLocation';

// A real, data-derived outline of the continental United States (via public
// domain state-boundary GeoJSON, projected and simplified at build time),
// not a hand-drawn approximation. Kept as a self-contained inline SVG with
// no external mapping library or tile service.
export default function ServiceAreaMap() {
  const viewerLocation = useViewerLocation();
  const hasViewerCity = viewerLocation?.city && viewerLocation.countryCode === 'US';
  const locationName = hasViewerCity ? getViewerLocationName(viewerLocation) : '';
  const caption = locationName ? `Proudly serving ${locationName}` : 'Proudly serving Maryland & Washington, DC';

  return (
    <section className="service-area-map">
      <figure>
        <svg
          viewBox="0 0 960 600"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-labelledby="sam-title sam-desc"
        >
          <title id="sam-title">Map of the continental United States</title>
          <desc id="sam-desc">
            A map highlighting Maryland and Washington, DC, the region Easy
            Breezy Air Duct and Chimney Services serves.
          </desc>

          <path className="sam-state" d={US_STATES_PATH} />
          <path className="sam-highlight" d={MD_DC_PATH} />

          <g transform="translate(784,266)">
            <circle className="sam-pin-ring" cx="0" cy="0" r="14" />
            <circle className="sam-pin-dot" cx="0" cy="0" r="5" />
          </g>

          <text className="sam-label" x="836" y="230" textAnchor="middle">
            MD &amp; DC
          </text>
        </svg>
      </figure>
      <div className="sam-caption">
        <h3 aria-live="polite">{caption}</h3>
        <p>
          The highlighted region shows where Easy Breezy provides air duct,
          dryer vent, chimney and furnace cleaning services. See the specific
          communities we serve listed below.
        </p>
        <div className="sam-legend">
          <span>
            <i className="sam-swatch highlight" /> Maryland &amp; DC service area
          </span>
          <span>
            <i className="sam-swatch base" /> Outside current service area
          </span>
        </div>
      </div>
    </section>
  );
}
