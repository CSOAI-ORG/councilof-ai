import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { getCurrencyForLanguage } from '@/lib/currencyConverter';

export function useLanguage() {
  const { i18n, t } = useTranslation();
  const [currency, setCurrency] = useState<string>('USD');
  const [region, setRegion] = useState<string>('US');

  useEffect(() => {
    const currentLanguage = i18n.language || 'en-US';
    const langInfo = SUPPORTED_LANGUAGES[currentLanguage as keyof typeof SUPPORTED_LANGUAGES];
    
    if (langInfo) {
      setCurrency(langInfo.currency);
      setRegion(langInfo.region);
    }
  }, [i18n.language]);

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem('language', languageCode);
    
    const newCurrency = getCurrencyForLanguage(languageCode);
    setCurrency(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  return {
    language: i18n.language || 'en-US',
    currency,
    region,
    t,
    changeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
}
