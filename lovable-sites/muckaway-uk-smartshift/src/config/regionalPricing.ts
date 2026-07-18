export interface RegionalPrice {
  starter: number;
  professional: number;
  enterprise: number;
  symbol: string;
  code: string;
  locale: string;
}

export const REGIONAL_PRICING: Record<string, RegionalPrice> = {
  GBP: {
    starter: 29,
    professional: 79,
    enterprise: 199,
    symbol: '£',
    code: 'GBP',
    locale: 'en-GB'
  },
  USD: {
    starter: 37,
    professional: 99,
    enterprise: 249,
    symbol: '$',
    code: 'USD',
    locale: 'en-US'
  },
  AUD: {
    starter: 55,
    professional: 149,
    enterprise: 379,
    symbol: 'A$',
    code: 'AUD',
    locale: 'en-AU'
  },
  CAD: {
    starter: 49,
    professional: 129,
    enterprise: 329,
    symbol: 'C$',
    code: 'CAD',
    locale: 'en-CA'
  },
  NZD: {
    starter: 59,
    professional: 159,
    enterprise: 399,
    symbol: 'NZ$',
    code: 'NZD',
    locale: 'en-NZ'
  },
  EUR: {
    starter: 34,
    professional: 94,
    enterprise: 239,
    symbol: '€',
    code: 'EUR',
    locale: 'de-DE'
  },
  // New currencies for global expansion
  SGD: {
    starter: 49,
    professional: 129,
    enterprise: 329,
    symbol: 'S$',
    code: 'SGD',
    locale: 'en-SG'
  },
  BRL: {
    starter: 149,
    professional: 399,
    enterprise: 999,
    symbol: 'R$',
    code: 'BRL',
    locale: 'pt-BR'
  },
  AED: {
    starter: 139,
    professional: 369,
    enterprise: 929,
    symbol: 'د.إ',
    code: 'AED',
    locale: 'ar-AE'
  },
  ZAR: {
    starter: 549,
    professional: 1449,
    enterprise: 3649,
    symbol: 'R',
    code: 'ZAR',
    locale: 'en-ZA'
  },
  INR: {
    starter: 2499,
    professional: 6499,
    enterprise: 16499,
    symbol: '₹',
    code: 'INR',
    locale: 'en-IN'
  },
  // New currencies for Phase 2 expansion
  CNY: {
    starter: 199,
    professional: 549,
    enterprise: 1399,
    symbol: '¥',
    code: 'CNY',
    locale: 'zh-CN'
  },
  MXN: {
    starter: 599,
    professional: 1599,
    enterprise: 3999,
    symbol: 'MX$',
    code: 'MXN',
    locale: 'es-MX'
  },
  JPY: {
    starter: 4900,
    professional: 12900,
    enterprise: 32900,
    symbol: '¥',
    code: 'JPY',
    locale: 'ja-JP'
  },
  // Southeast Asia currencies
  MYR: {
    starter: 129,
    professional: 349,
    enterprise: 879,
    symbol: 'RM',
    code: 'MYR',
    locale: 'ms-MY'
  },
  IDR: {
    starter: 449000,
    professional: 1199000,
    enterprise: 2999000,
    symbol: 'Rp',
    code: 'IDR',
    locale: 'id-ID'
  },
  PHP: {
    starter: 1699,
    professional: 4499,
    enterprise: 11299,
    symbol: '₱',
    code: 'PHP',
    locale: 'en-PH'
  },
  THB: {
    starter: 1099,
    professional: 2899,
    enterprise: 7299,
    symbol: '฿',
    code: 'THB',
    locale: 'th-TH'
  },
  VND: {
    starter: 749000,
    professional: 1999000,
    enterprise: 4999000,
    symbol: '₫',
    code: 'VND',
    locale: 'vi-VN'
  },
  // Saudi Arabia
  SAR: {
    starter: 139,
    professional: 369,
    enterprise: 929,
    symbol: 'ر.س',
    code: 'SAR',
    locale: 'ar-SA'
  }
};

export const CURRENCY_TO_COUNTRY: Record<string, string[]> = {
  GBP: ['GB', 'UK'],
  USD: ['US', 'USA'],
  AUD: ['AU', 'AUS'],
  CAD: ['CA', 'CAN'],
  NZD: ['NZ', 'NZL'],
  EUR: ['DE', 'FR', 'NL', 'BE', 'IE', 'ES', 'IT', 'AT', 'PT', 'FI', 'GR'],
  SGD: ['SG'],
  BRL: ['BR'],
  AED: ['AE', 'UAE'],
  ZAR: ['ZA'],
  INR: ['IN'],
  CNY: ['CN'],
  MXN: ['MX'],
  JPY: ['JP'],
  MYR: ['MY'],
  IDR: ['ID'],
  PHP: ['PH'],
  THB: ['TH'],
  VND: ['VN'],
  SAR: ['SA']
};

export const getPricingForCurrency = (currencyCode: string): RegionalPrice => {
  const upperCode = currencyCode?.toUpperCase() || 'GBP';
  return REGIONAL_PRICING[upperCode] || REGIONAL_PRICING['GBP'];
};

export const formatPrice = (amount: number, currencyCode: string): string => {
  const pricing = getPricingForCurrency(currencyCode);
  try {
    return new Intl.NumberFormat(pricing.locale, {
      style: 'currency',
      currency: pricing.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return `${pricing.symbol}${amount}`;
  }
};

// Real Stripe price IDs mapped by currency
export const STRIPE_PRICE_IDS: Record<string, Record<string, string>> = {
  GBP: {
    starter: 'price_1SeSfOLToiah1qKAsTWUwQ17',
    professional: 'price_1SeSfQLToiah1qKAFumMVrNJ',
    enterprise: 'price_1SDHvVLToiah1qKA5PToeR8x'
  },
  USD: {
    starter: 'price_1SeuwULToiah1qKAZylp2ABp',
    professional: 'price_1SeuwYLToiah1qKAr24DfHOt',
    enterprise: 'price_1SD0OlLToiah1qKANgSpQDei'
  },
  AUD: {
    starter: 'price_1SeuwVLToiah1qKAsMiSbm0Q',
    professional: 'price_1SeuwaLToiah1qKAN1vQUIj2',
    enterprise: 'price_1SfEmKLToiah1qKARc5bN3Ak'
  },
  CAD: {
    starter: 'price_1SeuwWLToiah1qKAenJEqtCj',
    professional: 'price_1SeuwbLToiah1qKAbpNwPpPP',
    enterprise: 'price_1SfEmLLToiah1qKA0K5EYBzl'
  },
  NZD: {
    starter: 'price_1SeuwXLToiah1qKAblaJHhTt',
    professional: 'price_1SeuwdLToiah1qKAdlc2Kl4l',
    enterprise: 'price_1SfEmMLToiah1qKAk4PBfbX0'
  },
  EUR: {
    starter: 'price_1SeuwVLToiah1qKAKnLfWDbv',
    professional: 'price_1SeuwZLToiah1qKAeOJfqOaN',
    enterprise: 'price_1SfEmNLToiah1qKA8EjqRDFN'
  },
  SGD: {
    starter: 'price_1SghQDLToiah1qKASKayWHL3',
    professional: 'price_1SghQFLToiah1qKA5RolyFFR',
    enterprise: 'price_1SghQGLToiah1qKAYQrXHh5e'
  },
  BRL: {
    starter: 'price_1SghQILToiah1qKAplzCIepz',
    professional: 'price_1SghQJLToiah1qKAktvrQ9Xl',
    enterprise: 'price_1SghQLLToiah1qKAegoc54gE'
  },
  AED: {
    starter: 'price_1SghQMLToiah1qKAkOllVP2r',
    professional: 'price_1SghQOLToiah1qKA20ZWeK16',
    enterprise: 'price_1SghQPLToiah1qKAiZV3BujU'
  },
  ZAR: {
    starter: 'price_1SghQRLToiah1qKADly7DXWA',
    professional: 'price_1SghQSLToiah1qKAeSuIAXMN',
    enterprise: 'price_1SghQULToiah1qKAwyaHhnwV'
  },
  INR: {
    starter: 'price_1SghQVLToiah1qKA1vwZXbVr',
    professional: 'price_1SghQXLToiah1qKALWqFS5zG',
    enterprise: 'price_1SghQYLToiah1qKAt2tNQ7Ex'
  },
  CNY: {
    starter: '0',
    professional: '0',
    enterprise: '0'
  },
  MXN: {
    starter: '0',
    professional: '0',
    enterprise: '0'
  },
  JPY: {
    starter: '0',
    professional: '0',
    enterprise: '0'
  },
  // Southeast Asia
  MYR: {
    starter: '0',
    professional: '0',
    enterprise: '0'
  },
  IDR: {
    starter: '0',
    professional: '0',
    enterprise: '0'
  },
  PHP: {
    starter: '0',
    professional: '0',
    enterprise: '0'
  },
  THB: {
    starter: '0',
    professional: '0',
    enterprise: '0'
  },
  VND: {
    starter: '0',
    professional: '0',
    enterprise: '0'
  },
  SAR: {
    starter: '0',
    professional: '0',
    enterprise: '0'
  }
};

// Get the correct Stripe price ID based on currency and tier
export const getStripePriceId = (currencyCode: string, tier: 'starter' | 'professional' | 'enterprise'): string => {
  const upperCode = currencyCode?.toUpperCase() || 'GBP';
  const currencyPrices = STRIPE_PRICE_IDS[upperCode] || STRIPE_PRICE_IDS['GBP'];
  return currencyPrices[tier] || currencyPrices.starter;
};

// Map country code to currency code
export const getCountryCurrency = (countryCode: string): string => {
  const upperCode = countryCode?.toUpperCase();
  
  const countryToCurrency: Record<string, string> = {
    'GB': 'GBP', 'UK': 'GBP',
    'US': 'USD', 'USA': 'USD',
    'AU': 'AUD', 'AUS': 'AUD',
    'CA': 'CAD', 'CAN': 'CAD',
    'NZ': 'NZD', 'NZL': 'NZD',
    'DE': 'EUR', 'FR': 'EUR', 'NL': 'EUR', 'BE': 'EUR', 'IE': 'EUR', 
    'ES': 'EUR', 'IT': 'EUR', 'AT': 'EUR', 'PT': 'EUR', 'FI': 'EUR', 'GR': 'EUR',
    'SG': 'SGD',
    'BR': 'BRL',
    'AE': 'AED', 'UAE': 'AED',
    'ZA': 'ZAR',
    'IN': 'INR',
    'CN': 'CNY', 'CHN': 'CNY',
    'MX': 'MXN', 'MEX': 'MXN',
    'JP': 'JPY', 'JPN': 'JPY',
    'MY': 'MYR', 'MYS': 'MYR',
    'ID': 'IDR', 'IDN': 'IDR',
    'PH': 'PHP', 'PHL': 'PHP',
    'TH': 'THB', 'THA': 'THB',
    'VN': 'VND', 'VNM': 'VND',
    'SA': 'SAR', 'SAU': 'SAR'
  };

  return countryToCurrency[upperCode] || 'GBP';
};
