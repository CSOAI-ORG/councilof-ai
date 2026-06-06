import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export interface RegionInfo {
  country: string;
  countryCode?: string;
  currency: string;
  currencySymbol: string;
  timezone?: string;
  language: string;
}

interface GlobalSettings {
  region: RegionInfo | null;
  currency: string;
  language: string;
  isLoading: boolean;
}

const currencyMap: Record<string, { symbol: string; code: string }> = {
  'US': { symbol: '$', code: 'USD' },
  'GB': { symbol: '£', code: 'GBP' },
  'UK': { symbol: '£', code: 'GBP' },
  'DE': { symbol: '€', code: 'EUR' },
  'FR': { symbol: '€', code: 'EUR' },
  'ES': { symbol: '€', code: 'EUR' },
  'IT': { symbol: '€', code: 'EUR' },
  'NL': { symbol: '€', code: 'EUR' },
  'BE': { symbol: '€', code: 'EUR' },
  'IE': { symbol: '€', code: 'EUR' },
  'AT': { symbol: '€', code: 'EUR' },
  'PT': { symbol: '€', code: 'EUR' },
  'CA': { symbol: 'C$', code: 'CAD' },
  'AU': { symbol: 'A$', code: 'AUD' },
  'NZ': { symbol: 'NZ$', code: 'NZD' },
  'JP': { symbol: '¥', code: 'JPY' },
  'CN': { symbol: '¥', code: 'CNY' },
  'BR': { symbol: 'R$', code: 'BRL' },
  'MX': { symbol: '$', code: 'MXN' },
  'IN': { symbol: '₹', code: 'INR' },
  'ZA': { symbol: 'R', code: 'ZAR' },
  'SG': { symbol: 'S$', code: 'SGD' },
  'AE': { symbol: 'د.إ', code: 'AED' },
};

const languageMap: Record<string, string> = {
  'US': 'en',
  'GB': 'en',
  'UK': 'en',
  'CA': 'en',
  'AU': 'en',
  'NZ': 'en',
  'IE': 'en',
  'SG': 'en',
  'DE': 'de',
  'AT': 'de',
  'FR': 'fr',
  'BE': 'fr',
  'ES': 'es',
  'MX': 'es',
  'IT': 'it',
  'PT': 'pt',
  'BR': 'pt',
  'NL': 'nl',
  'JP': 'ja',
  'CN': 'zh',
  'IN': 'en',
  'ZA': 'en',
  'AE': 'en',
};

export const useGlobalSettings = (): GlobalSettings => {
  const [region, setRegion] = useState<RegionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { i18n } = useTranslation();

  const detectRegion = async (): Promise<RegionInfo | null> => {
    try {
      // First try IP-based geolocation
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.country_code) {
        const currency = currencyMap[data.country_code] || { symbol: '$', code: 'USD' };
        const detectedLanguage = languageMap[data.country_code] || 'en';
        
        return {
          country: data.country_name || 'Unknown',
          countryCode: data.country_code,
          currency: currency.code,
          currencySymbol: currency.symbol,
          timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: detectedLanguage,
        };
      }
    } catch (error) {
      console.error('IP-based detection failed:', error);
    }

    try {
      // Fallback to browser timezone detection
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const locale = navigator.language || 'en-US';
      const [lang, countryCode] = locale.split('-');
      
      if (countryCode) {
        const currency = currencyMap[countryCode.toUpperCase()] || { symbol: '$', code: 'USD' };
        
        return {
          country: new Intl.DisplayNames([locale], { type: 'region' }).of(countryCode.toUpperCase()) || 'Unknown',
          countryCode: countryCode.toUpperCase(),
          currency: currency.code,
          currencySymbol: currency.symbol,
          timezone,
          language: lang,
        };
      }
    } catch (error) {
      console.error('Browser-based detection failed:', error);
    }

    // Final fallback - UK is the primary market
    return {
      country: 'United Kingdom',
      countryCode: 'GB',
      currency: 'GBP',
      currencySymbol: '£',
      timezone: 'Europe/London',
      language: 'en',
    };
  };

  useEffect(() => {
    const initializeRegion = async () => {
      setIsLoading(true);
      
      // Check localStorage first
      const savedRegion = localStorage.getItem('muckaway-region');
      if (savedRegion) {
        try {
          const parsed = JSON.parse(savedRegion);
          setRegion(parsed);
          i18n.changeLanguage(parsed.language);
          setIsLoading(false);
          return;
        } catch (error) {
          console.error('Failed to parse saved region:', error);
        }
      }

      // Auto-detect region
      const detectedRegion = await detectRegion();
      if (detectedRegion) {
        setRegion(detectedRegion);
        localStorage.setItem('muckaway-region', JSON.stringify(detectedRegion));
        i18n.changeLanguage(detectedRegion.language);
      }
      
      setIsLoading(false);
    };

    initializeRegion();
  }, [i18n]);

  return {
    region,
    currency: region?.currency || 'USD',
    language: region?.language || 'en',
    isLoading,
  };
};