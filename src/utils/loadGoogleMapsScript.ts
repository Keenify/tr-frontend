let googleMapsPromise: Promise<void> | null = null;

export const loadGoogleMapsScript = () => {
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  // Check if the API is already loaded
  if (window.google?.maps) {
    return Promise.resolve();
  }

  googleMapsPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.addEventListener('load', () => resolve());
    script.addEventListener('error', (e) => reject(e));

    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

declare global {
  interface Window {
    google?: {
      maps?: unknown;
    };
  }
} 