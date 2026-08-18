import { MapPin } from 'lucide-react';
import { getViewerLocationName, useViewerLocation } from '../hooks/useViewerLocation';

const defaultLocation = {
  heading: 'Proudly serving your area',
};

export function HeroLocation() {
  const viewerLocation = useViewerLocation();
  const locationName = viewerLocation?.city && viewerLocation.countryCode === 'US'
    ? getViewerLocationName(viewerLocation)
    : '';
  const location = locationName
    ? { heading: `Proudly serving ${locationName}` }
    : defaultLocation;

  return <figcaption className="hero-location" aria-live="polite"><MapPin aria-hidden="true" /><span><strong>{location.heading}</strong></span></figcaption>;
}
