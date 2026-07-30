// Lightweight, dependency-free i18n layer for OpenGridWorks.
//
// Why not react-i18next? The map page is self-contained and its file set is owned
// independently of the rest of the app. A small typed dictionary + context keeps the
// translations co-located, type-checked (every locale must satisfy `Dict`), and trivially
// extensible — adding a language is "drop a file, register it" with zero global config.
//
// Adding a language:
//   1. cp locales/en.ts locales/<lang>.ts and translate the values (keep keys + {tokens}).
//   2. import it below and add it to LOCALES + LANGUAGE_NAMES (+ RTL_LOCALES if right-to-left).
// That's it — the switcher and persistence pick it up automatically.

import { createContext, createElement, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Dict } from './locales/en';
import en from './locales/en';
import es from './locales/es';
import fr from './locales/fr';
import de from './locales/de';
import zh from './locales/zh';
import ja from './locales/ja';
import ko from './locales/ko';
import pt from './locales/pt';
import it from './locales/it';
import ar from './locales/ar';
import hi from './locales/hi';
import ru from './locales/ru';

export type Locale = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'ko' | 'pt' | 'it' | 'ar' | 'hi' | 'ru';

export const LOCALES: Record<Locale, Dict> = { en, es, fr, de, zh, ja, ko, pt, it, ar, hi, ru };

// Language names rendered in their own script (for the switcher).
export const LANGUAGE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  pt: 'Português',
  it: 'Italiano',
  ar: 'العربية',
  hi: 'हिन्दी',
  ru: 'Русский',
};

// Right-to-left locales — the page wrapper sets dir="rtl" for these.
export const RTL_LOCALES: ReadonlySet<Locale> = new Set<Locale>(['ar']);

export const isRTL = (l: Locale) => RTL_LOCALES.has(l);

const STORAGE_KEY = 'ogw.locale';
const SUPPORTED = new Set(Object.keys(LOCALES) as Locale[]);

function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  // 1. persisted choice wins
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.has(saved as Locale)) return saved as Locale;
  } catch {
    /* localStorage may be unavailable (private mode) — fall through */
  }
  // 2. navigator.language, matched on the primary subtag (e.g. "pt-BR" -> "pt")
  const langs = (typeof navigator !== 'undefined' && navigator.languages) || [];
  for (const tag of [...langs, (typeof navigator !== 'undefined' && navigator.language) || '']) {
    const base = String(tag).toLowerCase().split('-')[0];
    if (SUPPORTED.has(base as Locale)) return base as Locale;
  }
  // 3. English fallback
  return 'en';
}

type I18nValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  dir: 'ltr' | 'rtl';
  t: (key: keyof Dict, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

// {token} interpolation. Missing vars are left as literal {token} so gaps are visible.
function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore persistence failures */
    }
  }, []);

  const t = useCallback(
    (key: keyof Dict, vars?: Record<string, string | number>) => {
      const dict = LOCALES[locale] || en;
      const template = dict[key] ?? en[key] ?? String(key);
      return interpolate(template, vars);
    },
    [locale],
  );

  const value = useMemo<I18nValue>(
    () => ({ locale, setLocale, dir: isRTL(locale) ? 'rtl' : 'ltr', t }),
    [locale, setLocale, t],
  );

  return createElement(I18nContext.Provider, { value }, children);
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>');
  return ctx;
}

// Convenience hook returning just the translate function.
export function useT() {
  return useI18n().t;
}
