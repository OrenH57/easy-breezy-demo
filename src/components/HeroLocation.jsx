import { MapPin } from 'lucide-react';
import { getViewerLocationName, useViewerLocation } from '../hooks/useViewerLocation';

const defaultLocation = {
  heading: 'Local, trusted service',
  detail: 'Proudly serving Maryland & Washington, DC',
};

export function HeroLocation() {
  const viewerLocation = useViewerLocation();
  const locationName = viewerLocation?.city && viewerLocation.countryCode === 'US'
    ? getViewerLocationName(viewerLocation)
    : '';
  const location = locationName
    ? { heading: defaultLocation.heading, detail: `Proudly serving ${locationName}` }
    : defaultLocation;

  return <figcaption className="hero-location" aria-live="polite"><MapPin aria-hidden="true" /><span><strong>{location.heading}</strong>{location.detail}</span></figcaption>;
}
