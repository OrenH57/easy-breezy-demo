import { useEffect, useState } from 'react';

let viewerLocationRequest;

const normalizeLocation = ({ city, region, regionCode, countryCode, latitude, longitude }) => city && countryCode
  ? { city, region, regionCode, countryCode, latitude: Number(latitude), longitude: Number(longitude) }
  : null;

async function getLocationFromServer(signal) {
  const response = await fetch('/api/location', { signal, cache: 'no-store' });
  if (!response.ok) throw new Error('Location service unavailable');
  const { location } = await response.json();
  return normalizeLocation(location || {});
}

function loadViewerLocation() {
  if (!viewerLocationRequest) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4500);
    viewerLocationRequest = getLocationFromServer(controller.signal)
      .finally(() => {
        window.clearTimeout(timeout);
        viewerLocationRequest = undefined;
      });
  }

  return viewerLocationRequest;
}

export function isLocalServiceArea({ regionCode, latitude, longitude }) {
  const isLongIsland = latitude >= 40.45 && latitude <= 41.3 && longitude >= -74.15 && longitude <= -71.75;
  return regionCode === 'MD' || regionCode === 'DC' || isLongIsland;
}

export function getViewerLocationName({ city, region }) {
  return city ? `${city}${region ? `, ${region}` : ''}` : '';
}

export function useViewerLocation() {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    let active = true;
    let retryTimer;
    let attempts = 0;

    const locate = () => {
      loadViewerLocation().then((result) => {
        if (!active) return;
        if (result) {
          setLocation(result);
          return;
        }

        if (attempts < 2) {
          attempts += 1;
          retryTimer = window.setTimeout(locate, attempts * 900);
        }
      });
    };

    locate();

    return () => {
      active = false;
      window.clearTimeout(retryTimer);
    };
  }, []);

  return location;
}
