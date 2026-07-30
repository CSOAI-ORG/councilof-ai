// Exchange rates (updated regularly in production)
// Using approximate rates as of December 2025
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CNY: 7.25,
};

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const amountInUSD = amount / (EXCHANGE_RATES[fromCurrency] || 1);
  const convertedAmount = amountInUSD * (EXCHANGE_RATES[toCurrency] || 1);

  return Math.round(convertedAmount * 100) / 100;
}

export function formatPrice(
  amount: number,
  currency: string,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function getPriceByCurrency(
  basePrice: number,
  baseCurrency: string,
  targetCurrency: string,
  locale: string = 'en-US'
): string {
  const converted = convertCurrency(basePrice, baseCurrency, targetCurrency);
  return formatPrice(converted, targetCurrency, locale);
}

// Get user's currency based on language
export function getCurrencyForLanguage(language: string): string {
  const currencyMap: Record<string, string> = {
    'en-US': 'USD',
    'en-GB': 'GBP',
    'fr': 'EUR',
    'de': 'EUR',
    'es': 'EUR',
    'it': 'EUR',
    'nl': 'EUR',
    'pl': 'EUR',
    'pt': 'EUR',
    'sv': 'EUR',
    'da': 'EUR',
    'fi': 'EUR',
    'zh-CN': 'CNY',
  };

  return currencyMap[language] || 'USD';
}
