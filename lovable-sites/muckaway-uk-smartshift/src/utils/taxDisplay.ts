// Regional tax display utilities
// Formats tax labels according to regional conventions

export interface TaxDisplayConfig {
  taxRate: number;
  taxLabel: string;
  taxInclusive: boolean;
  taxPrefix: string;
  taxSuffix: string;
}

export const REGIONAL_TAX_CONFIG: Record<string, TaxDisplayConfig> = {
  // UK - VAT
  UK: {
    taxRate: 0.20,
    taxLabel: 'VAT',
    taxInclusive: false,
    taxPrefix: '',
    taxSuffix: 'incl. VAT',
  },
  GB: {
    taxRate: 0.20,
    taxLabel: 'VAT',
    taxInclusive: false,
    taxPrefix: '',
    taxSuffix: 'incl. VAT',
  },
  // Germany - MwSt
  DE: {
    taxRate: 0.19,
    taxLabel: 'MwSt.',
    taxInclusive: true,
    taxPrefix: 'Inkl.',
    taxSuffix: 'MwSt.',
  },
  // France - TVA
  FR: {
    taxRate: 0.20,
    taxLabel: 'TVA',
    taxInclusive: true,
    taxPrefix: 'TTC',
    taxSuffix: 'TVA incluse',
  },
  // Spain - IVA
  ES: {
    taxRate: 0.21,
    taxLabel: 'IVA',
    taxInclusive: true,
    taxPrefix: '',
    taxSuffix: 'IVA incluido',
  },
  // USA - Sales Tax (varies by state, using average)
  US: {
    taxRate: 0.08,
    taxLabel: 'Sales Tax',
    taxInclusive: false,
    taxPrefix: '',
    taxSuffix: '+ tax',
  },
  USA: {
    taxRate: 0.08,
    taxLabel: 'Sales Tax',
    taxInclusive: false,
    taxPrefix: '',
    taxSuffix: '+ tax',
  },
  // Australia - GST
  AU: {
    taxRate: 0.10,
    taxLabel: 'GST',
    taxInclusive: true,
    taxPrefix: '',
    taxSuffix: 'incl. GST',
  },
  // Canada - GST/HST
  CA: {
    taxRate: 0.13,
    taxLabel: 'HST',
    taxInclusive: false,
    taxPrefix: '',
    taxSuffix: '+ HST',
  },
  // Singapore - GST
  SG: {
    taxRate: 0.08,
    taxLabel: 'GST',
    taxInclusive: true,
    taxPrefix: '',
    taxSuffix: 'incl. 8% GST',
  },
  // Brazil - Combined taxes
  BR: {
    taxRate: 0.18,
    taxLabel: 'Impostos',
    taxInclusive: true,
    taxPrefix: '',
    taxSuffix: 'c/ impostos',
  },
  // UAE - VAT
  AE: {
    taxRate: 0.05,
    taxLabel: 'VAT',
    taxInclusive: true,
    taxPrefix: '',
    taxSuffix: 'incl. 5% VAT',
  },
  // South Africa - VAT
  ZA: {
    taxRate: 0.15,
    taxLabel: 'VAT',
    taxInclusive: true,
    taxPrefix: '',
    taxSuffix: 'incl. VAT',
  },
  // India - GST
  IN: {
    taxRate: 0.18,
    taxLabel: 'GST',
    taxInclusive: true,
    taxPrefix: '',
    taxSuffix: 'incl. 18% GST',
  },
  // New Zealand - GST
  NZ: {
    taxRate: 0.15,
    taxLabel: 'GST',
    taxInclusive: true,
    taxPrefix: '',
    taxSuffix: 'incl. GST',
  },
  // Netherlands - BTW
  NL: {
    taxRate: 0.21,
    taxLabel: 'BTW',
    taxInclusive: true,
    taxPrefix: 'Incl.',
    taxSuffix: 'BTW',
  },
  // Italy - IVA
  IT: {
    taxRate: 0.22,
    taxLabel: 'IVA',
    taxInclusive: true,
    taxPrefix: '',
    taxSuffix: 'IVA inclusa',
  },
};

// Get tax config for a region
export const getTaxConfig = (countryCode: string): TaxDisplayConfig => {
  const upperCode = countryCode?.toUpperCase() || 'UK';
  return REGIONAL_TAX_CONFIG[upperCode] || REGIONAL_TAX_CONFIG['UK'];
};

// Format price with tax label
export const formatPriceWithTax = (
  price: number,
  countryCode: string,
  currencySymbol: string
): string => {
  const config = getTaxConfig(countryCode);
  const formattedPrice = `${currencySymbol}${price.toLocaleString()}`;
  
  if (config.taxPrefix) {
    return `${config.taxPrefix} ${config.taxRate * 100}% ${config.taxLabel} ${formattedPrice}`;
  }
  
  return `${formattedPrice} ${config.taxSuffix}`;
};

// Calculate tax amount
export const calculateTax = (
  amount: number,
  countryCode: string,
  priceIncludesTax: boolean = true
): { net: number; tax: number; gross: number } => {
  const config = getTaxConfig(countryCode);
  
  if (priceIncludesTax) {
    const net = amount / (1 + config.taxRate);
    const tax = amount - net;
    return { net, tax, gross: amount };
  } else {
    const tax = amount * config.taxRate;
    return { net: amount, tax, gross: amount + tax };
  }
};

// Get tax label for display
export const getTaxLabel = (countryCode: string): string => {
  const config = getTaxConfig(countryCode);
  return `${config.taxRate * 100}% ${config.taxLabel}`;
};

// Get full tax display text
export const getTaxDisplayText = (countryCode: string): string => {
  const config = getTaxConfig(countryCode);
  if (config.taxPrefix) {
    return `${config.taxPrefix} ${config.taxRate * 100}% ${config.taxLabel}`;
  }
  return config.taxSuffix;
};
