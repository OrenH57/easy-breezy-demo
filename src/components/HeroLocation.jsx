import { MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

const defaultLocation = {
  heading: 'Local, trusted service',
  detail: 'Proudly serving Maryland & Washington, DC',
};

export function HeroLocation() {
  const [location, setLocation] = useState(defaultLocation);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 3500);

    fetch('https://ipapi.co/json/', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('Location unavailable'))))
      .then(({ city, region_code: regionCode, region, country_code: countryCode, latitude, longitude }) => {
        if (!city || countryCode !== 'US') return;

        const isLongIsland = latitude >= 40.45 && latitude <= 41.3 && longitude >= -74.15 && longitude <= -71.75;
        if (regionCode === 'MD' || regionCode === 'DC' || isLongIsland) {
          setLocation({
            heading: 'Yes — we serve your area!',
            detail: `Serving ${city}${region ? `, ${region}` : ''}`,
          });
          return;
        }

        setLocation({
          heading: `Near ${city}?`,
          detail: 'Check availability with our local team today',
        });
      })
      .catch(() => {})
      .finally(() => window.clearTimeout(timer));

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, []);

  return <figcaption className="hero-location" aria-live="polite"><MapPin aria-hidden="true" /><span><strong>{location.heading}</strong>{location.detail}</span></figcaption>;
}
