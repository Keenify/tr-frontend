import { useState, useEffect } from 'react';

export interface CurrencyConfig {
  currency: 'RM' | 'SGD';
  basePrice: number;
  minPrice: number;
  countryCode: string;
}

// Default config for Singapore and rest of the world
const DEFAULT_CONFIG: CurrencyConfig = {
  currency: 'SGD',
  basePrice: 25,
  minPrice: 25,
  countryCode: 'SG'
};

// Special config only for Malaysia
const MALAYSIA_CONFIG: CurrencyConfig = {
  currency: 'RM',
  basePrice: 60,
  minPrice: 60,
  countryCode: 'MY'
};

/**
 * Custom hook to detect user's country by IP and return appropriate currency configuration
 * Uses ipapi.co for IP geolocation (no API key required)
 */
export const useCurrencyDetection = () => {
  const [currencyConfig, setCurrencyConfig] = useState<CurrencyConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detectCurrency = async () => {
      try {
        console.log('🌍 Fetching location data from geojs.io...');
        const response = await fetch('https://get.geojs.io/v1/ip/country.json');

        if (!response.ok) {
          throw new Error('Failed to fetch location data');
        }

        const data = await response.json();
        console.log('📍 Location data received:', {
          country: data.country,
          country_code: data.country,
          name: data.name,
          ip: data.ip
        });

        // Check if user is in Malaysia
        if (data.country === 'MY') {
          console.log('✅ Malaysia detected! Using RM currency config');
          setCurrencyConfig(MALAYSIA_CONFIG);
        } else {
          console.log('✅ Non-Malaysia location detected! Using SGD currency config');
          // Default to Singapore/SGD for Singapore and all other countries
          setCurrencyConfig(DEFAULT_CONFIG);
        }
      } catch (err) {
        console.error('❌ Error detecting currency:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.warn('⚠️ Falling back to default SGD currency config');
        // Fallback to default (Singapore/SGD) on error
        setCurrencyConfig(DEFAULT_CONFIG);
      } finally {
        setLoading(false);
      }
    };

    detectCurrency();
  }, []);

  return { currencyConfig, loading, error };
};
