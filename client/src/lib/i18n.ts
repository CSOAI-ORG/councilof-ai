import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initializeRegionalSettings } from './geoDetection';

// Import all translation files
import enUS from '../locales/en-US.json';
import enGB from '../locales/en-GB.json';
import fr from '../locales/fr.json';
import de from '../locales/de.json';
import es from '../locales/es.json';
import it from '../locales/it.json';
import nl from '../locales/nl.json';
import pl from '../locales/pl.json';
import pt from '../locales/pt.json';
import sv from '../locales/sv.json';
import da from '../locales/da.json';
import fi from '../locales/fi.json';
import zhCN from '../locales/zh-CN.json';

export const SUPPORTED_LANGUAGES = {
  'en-US': { name: 'English (US)', flag: '🇺🇸', currency: 'USD', region: 'US' },
  'en-GB': { name: 'English (UK)', flag: '🇬🇧', currency: 'GBP', region: 'UK' },
  'fr': { name: 'Français', flag: '🇫🇷', currency: 'EUR', region: 'EU' },
  'de': { name: 'Deutsch', flag: '🇩🇪', currency: 'EUR', region: 'EU' },
  'es': { name: 'Español', flag: '🇪🇸', currency: 'EUR', region: 'EU' },
  'it': { name: 'Italiano', flag: '🇮🇹', currency: 'EUR', region: 'EU' },
  'nl': { name: 'Nederlands', flag: '🇳🇱', currency: 'EUR', region: 'EU' },
  'pl': { name: 'Polski', flag: '🇵🇱', currency: 'EUR', region: 'EU' },
  'pt': { name: 'Português', flag: '🇵🇹', currency: 'EUR', region: 'EU' },
  'sv': { name: 'Svenska', flag: '🇸🇪', currency: 'EUR', region: 'EU' },
  'da': { name: 'Dansk', flag: '🇩🇰', currency: 'EUR', region: 'EU' },
  'fi': { name: 'Suomi', flag: '🇫🇮', currency: 'EUR', region: 'EU' },
  'zh-CN': { name: '中文 (简体)', flag: '🇨🇳', currency: 'CNY', region: 'CN' },
};

export const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CNY: '¥',
};

export const DEFAULT_LANGUAGE = 'en-US';

const resources = {
  'en-US': { translation: enUS },
  'en-GB': { translation: enGB },
  'fr': { translation: fr },
  'de': { translation: de },
  'es': { translation: es },
  'it': { translation: it },
  'nl': { translation: nl },
  'pl': { translation: pl },
  'pt': { translation: pt },
  'sv': { translation: sv },
  'da': { translation: da },
  'fi': { translation: fi },
  'zh-CN': { translation: zhCN },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

// Initialize regional settings on app load
initializeRegionalSettings().catch(err => {
  console.error('Failed to initialize regional settings:', err);
});

// Export initialization function for use in App
export async function initI18n() {
  await initializeRegionalSettings();
}

export default i18n;
