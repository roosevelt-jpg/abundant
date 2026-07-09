'use client';

import { useEffect, useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { loadGoogleMaps, getGoogleMapsApiKeyFromEnv } from '@/lib/google-maps';

export function useGoogleMaps() {
  const { settings } = useSettings();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiKey =
    settings?.integrations?.googlePlaces?.apiKey ||
    getGoogleMapsApiKeyFromEnv() ||
    '';

  useEffect(() => {
    if (!apiKey) {
      setReady(false);
      setError(null);
      return;
    }

    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then(() => {
        if (!cancelled) {
          setReady(true);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setReady(false);
          setError(err.message || 'Failed to load Google Maps');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  return { ready, error, apiKey, configured: !!apiKey };
}
