import { useMemo, useCallback } from 'react';
import { useGlobal } from '@/components/GlobalProvider';
import { 
  getTaxConfig, 
  formatPriceWithTax, 
  calculateTax, 
  getTaxLabel, 
  getTaxDisplayText,
  type TaxDisplayConfig 
} from '@/utils/taxDisplay';
import { getPricingForCurrency } from '@/config/regionalPricing';

export const useRegionalTax = () => {
  const { region, currency } = useGlobal();
  const countryCode = region?.country?.toUpperCase() || 'UK';

  const config = useMemo((): TaxDisplayConfig => {
    return getTaxConfig(countryCode);
  }, [countryCode]);

  const pricing = useMemo(() => {
    return getPricingForCurrency(currency);
  }, [currency]);

  const formatWithTax = useCallback((price: number): string => {
    return formatPriceWithTax(price, countryCode, pricing.symbol);
  }, [countryCode, pricing.symbol]);

  const calculate = useCallback((amount: number, priceIncludesTax: boolean = true) => {
    return calculateTax(amount, countryCode, priceIncludesTax);
  }, [countryCode]);

  const taxLabel = useMemo(() => {
    return getTaxLabel(countryCode);
  }, [countryCode]);

  const taxDisplayText = useMemo(() => {
    return getTaxDisplayText(countryCode);
  }, [countryCode]);

  return {
    config,
    formatWithTax,
    calculate,
    taxLabel,
    taxDisplayText,
    taxRate: config.taxRate,
    isInclusive: config.taxInclusive,
  };
};

export default useRegionalTax;
