import { useState, useEffect } from 'react';

export interface CurrencyConfig {
  currency: 'RM' | 'SGD';
  basePrice: number;
  minPrice: number;
  countryCode: string;
}

const DEFAULT_CONFIG: CurrencyConfig = {
  currency: 'RM',
  basePrice: 60,
  minPrice: 60,
  countryCode: 'MY'
};

const SINGAPORE_CONFIG: CurrencyConfig = {
  currency: 'SGD',
  basePrice: 25,
  minPrice: 25,
  countryCode: 'SG'
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
        const response = await fetch('https://ipapi.co/json/');

        if (!response.ok) {
          throw new Error('Failed to fetch location data');
        }

        const data = await response.json();

        // Check if user is in Singapore
        if (data.country_code === 'SG' || data.country === 'SG') {
          setCurrencyConfig(SINGAPORE_CONFIG);
        } else {
          // Default to Malaysia/RM for all other countries
          setCurrencyConfig(DEFAULT_CONFIG);
        }
      } catch (err) {
        console.error('Error detecting currency:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Fallback to default (RM) on error
        setCurrencyConfig(DEFAULT_CONFIG);
      } finally {
        setLoading(false);
      }
    };

    detectCurrency();
  }, []);

  return { currencyConfig, loading, error };
};
