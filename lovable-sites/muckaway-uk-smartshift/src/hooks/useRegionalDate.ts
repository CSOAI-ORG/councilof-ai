import { useMemo, useCallback } from 'react';
import { useGlobal } from '@/components/GlobalProvider';
import { 
  getDateConfig, 
  formatDateForRegion, 
  formatDateTimeForRegion, 
  formatRelativeDate,
  type DateFormatConfig 
} from '@/utils/dateFormatter';

export const useRegionalDate = () => {
  const { region } = useGlobal();
  const countryCode = region?.country?.toUpperCase() || 'UK';

  const config = useMemo((): DateFormatConfig => {
    return getDateConfig(countryCode);
  }, [countryCode]);

  const formatDate = useCallback((date: Date | string): string => {
    return formatDateForRegion(date, countryCode);
  }, [countryCode]);

  const formatDateTime = useCallback((date: Date | string): string => {
    return formatDateTimeForRegion(date, countryCode);
  }, [countryCode]);

  const formatRelative = useCallback((date: Date | string): string => {
    return formatRelativeDate(date, countryCode);
  }, [countryCode]);

  return {
    config,
    formatDate,
    formatDateTime,
    formatRelative,
    locale: config.locale,
    is24Hour: config.timeFormat === '24h',
  };
};

export default useRegionalDate;
