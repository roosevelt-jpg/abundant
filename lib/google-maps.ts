let loadPromise: Promise<void> | null = null;
let loadedKey: string | null = null;

export function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.maps?.places && loadedKey === apiKey) return Promise.resolve();
  if (loadPromise && loadedKey === apiKey) return loadPromise;

  loadedKey = apiKey;
  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-maps]');
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = 'true';
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load Google Maps'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function getGoogleMapsApiKeyFromEnv(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
}
