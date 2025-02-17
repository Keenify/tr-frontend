let googleMapsPromise: Promise<void> | null = null;

export const loadGoogleMapsScript = () => {
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  // Check if script is already in the document
  const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
  if (existingScript) {
    return Promise.resolve();
  }

  googleMapsPromise = new Promise<void>((resolve) => {
    // Create a unique callback name
    const callbackName = `googleMapsCallback${Date.now()}`;

    window[callbackName] = () => {
      resolve();
      delete window[callbackName];
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;

    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

declare global {
  interface Window {
    [key: string]: unknown;
  }
} 