import { MapPin } from 'lucide-react';
import { getViewerLocationName, useViewerLocation } from '../hooks/useViewerLocation';

const defaultLabel = 'Local Maryland & DC team';

export function TrustLocation() {
  const viewerLocation = useViewerLocation();
  const locationName = viewerLocation?.city && viewerLocation.countryCode === 'US'
    ? getViewerLocationName(viewerLocation)
    : '';
  const label = locationName ? `Local ${locationName} team` : defaultLabel;

  return <><MapPin aria-hidden="true" /><strong aria-live="polite">{label}</strong></>;
}
