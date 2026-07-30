import { SUPPORTED_LANGUAGES } from './i18n';

// Map country codes to language codes
const COUNTRY_TO_LANGUAGE: Record<string, string> = {
  // US
  'US': 'en-US',
  // UK
  'GB': 'en-GB',
  // EU - France
  'FR': 'fr',
  // EU - Germany
  'DE': 'de',
  // EU - Spain
  'ES': 'es',
  // EU - Italy
  'IT': 'it',
  // EU - Netherlands
  'NL': 'nl',
  // EU - Poland
  'PL': 'pl',
  // EU - Portugal
  'PT': 'pt',
  // EU - Sweden
  'SE': 'sv',
  // EU - Denmark
  'DK': 'da',
  // EU - Finland
  'FI': 'fi',
  // China
  'CN': 'zh-CN',
};

export async function detectUserRegion(): Promise<{ country: string; language: string }> {
  try {
    // Try to get country from IP geolocation API
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    const countryCode = data.country_code as string;
    
    if (countryCode && COUNTRY_TO_LANGUAGE[countryCode]) {
      return {
        country: countryCode,
        language: COUNTRY_TO_LANGUAGE[countryCode],
      };
    }
  } catch (error) {
    console.warn('Failed to detect region from IP:', error);
  }

  // Fallback to browser locale detection
  return detectBrowserLocale();
}

export function detectBrowserLocale(): { country: string; language: string } {
  const browserLang = navigator.language || 'en-US';
  
  // Try exact match first
  if (SUPPORTED_LANGUAGES[browserLang as keyof typeof SUPPORTED_LANGUAGES]) {
    return {
      country: getCountryFromLanguage(browserLang),
      language: browserLang,
    };
  }

  // Try language prefix (e.g., 'en' from 'en-US')
  const langPrefix = browserLang.split('-')[0];
  
  // Map common language prefixes to supported languages
  const langPrefixMap: Record<string, string> = {
    'en': 'en-US',
    'fr': 'fr',
    'de': 'de',
    'es': 'es',
    'it': 'it',
    'nl': 'nl',
    'pl': 'pl',
    'pt': 'pt',
    'sv': 'sv',
    'da': 'da',
    'fi': 'fi',
    'zh': 'zh-CN',
  };

  const mappedLanguage = langPrefixMap[langPrefix] || 'en-US';
  
  return {
    country: getCountryFromLanguage(mappedLanguage),
    language: mappedLanguage,
  };
}

function getCountryFromLanguage(language: string): string {
  const langInfo = SUPPORTED_LANGUAGES[language as keyof typeof SUPPORTED_LANGUAGES];
  if (!langInfo) return 'US';

  const regionToCountry: Record<string, string> = {
    'US': 'US',
    'UK': 'GB',
    'EU': 'FR',
    'CN': 'CN',
  };

  return regionToCountry[langInfo.region] || 'US';
}

export async function initializeRegionalSettings(): Promise<void> {
  // Check if user has already set preferences
  const savedLanguage = localStorage.getItem('language');
  const savedCurrency = localStorage.getItem('currency');

  if (savedLanguage && savedCurrency) {
    // User has preferences saved, don't override
    return;
  }

  try {
    const { language, country } = await detectUserRegion();
    
    if (!savedLanguage) {
      localStorage.setItem('language', language);
    }
    
    if (!savedCurrency) {
      const langInfo = SUPPORTED_LANGUAGES[language as keyof typeof SUPPORTED_LANGUAGES];
      if (langInfo) {
        localStorage.setItem('currency', langInfo.currency);
      }
    }
  } catch (error) {
    console.warn('Failed to initialize regional settings:', error);
    // Fallback to defaults
    if (!savedLanguage) localStorage.setItem('language', 'en-US');
    if (!savedCurrency) localStorage.setItem('currency', 'USD');
  }
}
