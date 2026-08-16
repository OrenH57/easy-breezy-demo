import { useEffect, useState } from 'react';

let viewerLocationRequest;

const normalizeLocation = ({ city, region, regionCode, countryCode, latitude, longitude }) => city && countryCode
  ? { city, region, regionCode, countryCode, latitude: Number(latitude), longitude: Number(longitude) }
  : null;

async function getLocationFromProviders(signal) {
  const providers = [
    async () => {
      const response = await fetch('https://ipapi.co/json/', { signal });
      if (!response.ok) throw new Error('Primary location provider unavailable');
      const data = await response.json();
      return normalizeLocation({ city: data.city, region: data.region, regionCode: data.region_code, countryCode: data.country_code, latitude: data.latitude, longitude: data.longitude });
    },
    async () => {
      const response = await fetch('https://ipwho.is/', { signal });
      if (!response.ok) throw new Error('Backup location provider unavailable');
      const data = await response.json();
      return normalizeLocation({ city: data.city, region: data.region, regionCode: data.region_code, countryCode: data.country_code, latitude: data.latitude, longitude: data.longitude });
    },
  ];

  for (const getLocation of providers) {
    try {
      const location = await getLocation();
      if (location) return location;
    } catch {
      // Try the next provider before falling back to the default service-area copy.
    }
  }

  return null;
}

function loadViewerLocation() {
  if (!viewerLocationRequest) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4500);
    viewerLocationRequest = getLocationFromProviders(controller.signal)
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
