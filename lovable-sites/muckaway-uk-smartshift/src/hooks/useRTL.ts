import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Languages that use Right-to-Left text direction
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

export const useRTL = () => {
  const { i18n } = useTranslation();
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    const currentLang = i18n.language?.split('-')[0] || 'en';
    const shouldBeRTL = RTL_LANGUAGES.includes(currentLang);
    setIsRTL(shouldBeRTL);

    // Update document direction
    document.documentElement.dir = shouldBeRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;

    // Add/remove RTL class for additional styling hooks
    if (shouldBeRTL) {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  }, [i18n.language]);

  return {
    isRTL,
    direction: isRTL ? 'rtl' : 'ltr',
    textAlign: isRTL ? 'right' : 'left',
  };
};

export default useRTL;
