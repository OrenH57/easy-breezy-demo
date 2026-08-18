import { useEffect, useState } from 'react';

let viewerLocationRequest;

const normalizeLocation = ({ city, region, regionCode, countryCode, latitude, longitude }) => city && countryCode
  ? { city, region, regionCode, countryCode, latitude: Number(latitude), longitude: Number(longitude) }
  : null;

async function getLocationFromServer(signal) {
  try {
    const response = await fetch('/api/location', { signal, cache: 'no-store' });
    if (!response.ok) return null;
    const { location } = await response.json();
    return normalizeLocation(location || {});
  } catch {
    return null;
  }
}

// GPS/Wi-Fi based position is far more precise than an IP lookup (meters vs.
// city-level), but requires the visitor to grant the browser permission
// prompt, so it's tried first and the IP lookup is kept as the fallback.
function getGpsPosition(timeoutMs = 8000) {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 5 * 60 * 1000 },
    );
  });
}

async function getLocationFromGps(signal) {
  const coords = await getGpsPosition();
  if (!coords) return null;
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`;
    const response = await fetch(url, { signal, cache: 'no-store' });
    if (!response.ok) return null;
    const data = await response.json();
    return normalizeLocation({
      city: data.city || data.locality,
      region: data.principalSubdivision,
      regionCode: String(data.principalSubdivisionCode || '').split('-').pop(),
      countryCode: data.countryCode,
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
  } catch {
    return null;
  }
}

function loadViewerLocation() {
  if (!viewerLocationRequest) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12_000);
    viewerLocationRequest = getLocationFromGps(controller.signal)
      .then((gpsLocation) => gpsLocation || getLocationFromServer(controller.signal))
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
