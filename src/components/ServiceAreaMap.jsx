import './ServiceAreaMap.css';
import { US_STATES_PATH } from './usMapPath.js';
import { getViewerLocationName, useViewerLocation } from '../hooks/useViewerLocation';

// A real, data-derived outline of the continental United States (via public
// domain state-boundary GeoJSON, projected and simplified at build time),
// not a hand-drawn approximation. Kept as a self-contained inline SVG with
// no external mapping library or tile service.
export default function ServiceAreaMap() {
  const viewerLocation = useViewerLocation();
  const hasViewerCity = viewerLocation?.city && viewerLocation.countryCode === 'US';
  const locationName = hasViewerCity ? getViewerLocationName(viewerLocation) : '';
  const caption = locationName ? `Proudly serving ${locationName}` : 'Proudly serving homes nationwide';

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
            A map of the continental United States, the region Easy Breezy
            Air Duct and Chimney Services serves.
          </desc>

          <path className="sam-state" d={US_STATES_PATH} />
        </svg>
      </figure>
      <div className="sam-caption">
        <h3 aria-live="polite">{caption}</h3>
        <p>
          Easy Breezy provides air duct, dryer vent, chimney and furnace
          cleaning wherever you are. Tell us about your home or business and
          we will confirm the details for your area.
        </p>
      </div>
    </section>
  );
}
