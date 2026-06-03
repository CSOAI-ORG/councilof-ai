import { useMemo } from 'react';
import { useGlobal } from '@/components/GlobalProvider';
import { getRegionalTerminology, getTerm, type TerminologyMapping } from '@/config/regionalTerminology';

export const useRegionalTerminology = () => {
  const { region } = useGlobal();
  const countryCode = region?.country?.toUpperCase() || 'UK';

  const terminology = useMemo(() => {
    return getRegionalTerminology(countryCode);
  }, [countryCode]);

  const t = useMemo(() => {
    return (term: keyof TerminologyMapping): string => {
      return getTerm(countryCode, term);
    };
  }, [countryCode]);

  return {
    terminology,
    t,
    countryCode,
  };
};

export default useRegionalTerminology;
