import { useEffect, useState } from 'react';
import { majorUsCities } from '../data/majorUsCities';

let viewerLocationRequest;
let gpsLocationRequest;

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

// GPS/Wi-Fi based position is far more precise than an IP lookup (meters vs.
// city-level), but triggers the browser's native permission prompt, so it's
// only requested after the visitor interacts with the page — never on a
// cold page load.
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

function loadGpsLocation() {
  if (!gpsLocationRequest) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12_000);
    gpsLocationRequest = getLocationFromGps(controller.signal)
      .finally(() => {
        window.clearTimeout(timeout);
        gpsLocationRequest = undefined;
      });
  }

  return gpsLocationRequest;
}

const EARTH_RADIUS_MILES = 3958.8;
const NEARBY_CITY_RADIUS_MILES = 50;

function milesBetween(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(a));
}

// The exact resolved town (from an IP lookup or even GPS) is often a small,
// unfamiliar place — the way a highway sign points to the nearest big city
// rather than the tiny hamlet you're actually passing through. This finds
// that "sign" name instead of showing the literal resolved locality.
function nearestRecognizableCity(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  let nearest = null;
  for (const city of majorUsCities) {
    const distance = milesBetween(latitude, longitude, city.lat, city.lon);
    if (!nearest || distance < nearest.distance) nearest = { city, distance };
  }
  return nearest && nearest.distance <= NEARBY_CITY_RADIUS_MILES ? nearest.city : null;
}

export function getViewerLocationName({ city, region, regionCode, latitude, longitude }) {
  const nearby = nearestRecognizableCity(latitude, longitude);
  if (nearby) return `${nearby.name}, ${nearby.state}`;
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

    const upgradeWithGps = () => {
      window.removeEventListener('pointerdown', upgradeWithGps);
      window.removeEventListener('keydown', upgradeWithGps);
      loadGpsLocation().then((result) => {
        if (active && result) setLocation(result);
      });
    };
    window.addEventListener('pointerdown', upgradeWithGps, { once: true, passive: true });
    window.addEventListener('keydown', upgradeWithGps, { once: true });

    return () => {
      active = false;
      window.clearTimeout(retryTimer);
      window.removeEventListener('pointerdown', upgradeWithGps);
      window.removeEventListener('keydown', upgradeWithGps);
    };
  }, []);

  return location;
}
