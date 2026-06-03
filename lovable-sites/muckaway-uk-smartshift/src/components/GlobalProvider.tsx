import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useGlobalSettings, RegionInfo } from '@/hooks/useGlobalSettings';
import i18n from '@/i18n/config';

interface GlobalContextType {
  region: RegionInfo | null;
  currency: string;
  language: string;
  isLoading: boolean;
  formatCurrency: (amount: number) => string;
  setRegion: (countryCode: string) => void;
  setLanguage: (langCode: string) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
};

interface GlobalProviderProps {
  children: ReactNode;
}

const COUNTRY_TO_REGION: Record<string, RegionInfo> = {
  UK: { country: 'UK', currency: 'GBP', currencySymbol: '£', language: 'en' },
  GB: { country: 'UK', currency: 'GBP', currencySymbol: '£', language: 'en' },
  US: { country: 'US', currency: 'USD', currencySymbol: '$', language: 'en' },
  AU: { country: 'AU', currency: 'AUD', currencySymbol: 'A$', language: 'en' },
  CA: { country: 'CA', currency: 'CAD', currencySymbol: 'C$', language: 'en' },
  NZ: { country: 'NZ', currency: 'NZD', currencySymbol: 'NZ$', language: 'en' },
  DE: { country: 'DE', currency: 'EUR', currencySymbol: '€', language: 'de' },
  FR: { country: 'FR', currency: 'EUR', currencySymbol: '€', language: 'fr' },
  ES: { country: 'ES', currency: 'EUR', currencySymbol: '€', language: 'es' },
  EU: { country: 'EU', currency: 'EUR', currencySymbol: '€', language: 'en' },
  BR: { country: 'BR', currency: 'BRL', currencySymbol: 'R$', language: 'pt' },
  IN: { country: 'IN', currency: 'INR', currencySymbol: '₹', language: 'en' },
  SG: { country: 'SG', currency: 'SGD', currencySymbol: 'S$', language: 'en' },
  AE: { country: 'AE', currency: 'AED', currencySymbol: 'د.إ', language: 'en' },
  ZA: { country: 'ZA', currency: 'ZAR', currencySymbol: 'R', language: 'en' },
  CN: { country: 'CN', currency: 'CNY', currencySymbol: '¥', language: 'zh' },
};

export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
  const settings = useGlobalSettings();
  const [overrideRegion, setOverrideRegion] = useState<RegionInfo | null>(null);
  const [overrideLanguage, setOverrideLanguage] = useState<string | null>(null);

  // Load saved preferences on mount
  useEffect(() => {
    const savedRegion = localStorage.getItem('muckaway-region');
    const savedLanguage = localStorage.getItem('muckaway-language');
    
    if (savedRegion && COUNTRY_TO_REGION[savedRegion]) {
      setOverrideRegion(COUNTRY_TO_REGION[savedRegion]);
    }
    if (savedLanguage) {
      setOverrideLanguage(savedLanguage);
      i18n.changeLanguage(savedLanguage);
    }
  }, []);

  const region = overrideRegion || settings.region;
  const language = overrideLanguage || settings.language;
  const currency = region?.currency || 'GBP';

  const setRegion = (countryCode: string) => {
    const newRegion = COUNTRY_TO_REGION[countryCode.toUpperCase()];
    if (newRegion) {
      setOverrideRegion(newRegion);
      localStorage.setItem('muckaway-region', countryCode.toUpperCase());
    }
  };

  const setLanguage = (langCode: string) => {
    setOverrideLanguage(langCode);
    localStorage.setItem('muckaway-language', langCode);
    i18n.changeLanguage(langCode);
  };

  const formatCurrency = (amount: number): string => {
    if (!region) return `£${amount}`; // Default to GBP for UK primary market
    
    const localeMap: Record<string, string> = {
      'UK': 'en-GB', 'GB': 'en-GB',
      'US': 'en-US',
      'AU': 'en-AU',
      'CA': 'en-CA',
      'NZ': 'en-NZ',
      'DE': 'de-DE',
      'FR': 'fr-FR',
      'ES': 'es-ES',
      'EU': 'en-IE'
    };
    
    try {
      return new Intl.NumberFormat(localeMap[region.country] || 'en-US', {
        style: 'currency',
        currency: region.currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    } catch (error) {
      return `${region.currencySymbol}${amount}`;
    }
  };

  return (
    <GlobalContext.Provider
      value={{
        region,
        currency,
        language,
        isLoading: settings.isLoading,
        formatCurrency,
        setRegion,
        setLanguage,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};
