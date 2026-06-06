// Regional date formatting utilities
// Formats dates according to regional conventions

export interface DateFormatConfig {
  locale: string;
  dateFormat: 'DMY' | 'MDY' | 'YMD';
  separator: string;
  timeFormat: '12h' | '24h';
}

export const REGIONAL_DATE_CONFIG: Record<string, DateFormatConfig> = {
  // UK - DD/MM/YYYY
  UK: { locale: 'en-GB', dateFormat: 'DMY', separator: '/', timeFormat: '24h' },
  GB: { locale: 'en-GB', dateFormat: 'DMY', separator: '/', timeFormat: '24h' },
  
  // USA - MM/DD/YYYY
  US: { locale: 'en-US', dateFormat: 'MDY', separator: '/', timeFormat: '12h' },
  USA: { locale: 'en-US', dateFormat: 'MDY', separator: '/', timeFormat: '12h' },
  
  // Germany - DD.MM.YYYY
  DE: { locale: 'de-DE', dateFormat: 'DMY', separator: '.', timeFormat: '24h' },
  
  // France - DD/MM/YYYY
  FR: { locale: 'fr-FR', dateFormat: 'DMY', separator: '/', timeFormat: '24h' },
  
  // Spain - DD/MM/YYYY
  ES: { locale: 'es-ES', dateFormat: 'DMY', separator: '/', timeFormat: '24h' },
  
  // Australia - DD/MM/YYYY
  AU: { locale: 'en-AU', dateFormat: 'DMY', separator: '/', timeFormat: '12h' },
  
  // Canada - YYYY-MM-DD (ISO standard)
  CA: { locale: 'en-CA', dateFormat: 'YMD', separator: '-', timeFormat: '12h' },
  
  // Singapore - DD/MM/YYYY
  SG: { locale: 'en-SG', dateFormat: 'DMY', separator: '/', timeFormat: '12h' },
  
  // Brazil - DD/MM/YYYY
  BR: { locale: 'pt-BR', dateFormat: 'DMY', separator: '/', timeFormat: '24h' },
  
  // UAE - DD/MM/YYYY
  AE: { locale: 'ar-AE', dateFormat: 'DMY', separator: '/', timeFormat: '12h' },
  
  // South Africa - YYYY/MM/DD
  ZA: { locale: 'en-ZA', dateFormat: 'YMD', separator: '/', timeFormat: '24h' },
  
  // India - DD/MM/YYYY
  IN: { locale: 'en-IN', dateFormat: 'DMY', separator: '/', timeFormat: '12h' },
  
  // New Zealand - DD/MM/YYYY
  NZ: { locale: 'en-NZ', dateFormat: 'DMY', separator: '/', timeFormat: '12h' },
  
  // Japan - YYYY/MM/DD
  JP: { locale: 'ja-JP', dateFormat: 'YMD', separator: '/', timeFormat: '24h' },
  
  // China - YYYY-MM-DD
  CN: { locale: 'zh-CN', dateFormat: 'YMD', separator: '-', timeFormat: '24h' },
};

// Get date config for a region
export const getDateConfig = (countryCode: string): DateFormatConfig => {
  const upperCode = countryCode?.toUpperCase() || 'UK';
  return REGIONAL_DATE_CONFIG[upperCode] || REGIONAL_DATE_CONFIG['UK'];
};

// Format date for region
export const formatDateForRegion = (date: Date | string, countryCode: string): string => {
  const config = getDateConfig(countryCode);
  const d = typeof date === 'string' ? new Date(date) : date;
  
  try {
    return new Intl.DateTimeFormat(config.locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    // Fallback to manual formatting
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    
    switch (config.dateFormat) {
      case 'MDY':
        return `${month}${config.separator}${day}${config.separator}${year}`;
      case 'YMD':
        return `${year}${config.separator}${month}${config.separator}${day}`;
      default:
        return `${day}${config.separator}${month}${config.separator}${year}`;
    }
  }
};

// Format date and time for region
export const formatDateTimeForRegion = (date: Date | string, countryCode: string): string => {
  const config = getDateConfig(countryCode);
  const d = typeof date === 'string' ? new Date(date) : date;
  
  try {
    return new Intl.DateTimeFormat(config.locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: config.timeFormat === '12h',
    }).format(d);
  } catch {
    return formatDateForRegion(d, countryCode);
  }
};

// Format relative date (e.g., "2 days ago")
export const formatRelativeDate = (date: Date | string, countryCode: string): string => {
  const config = getDateConfig(countryCode);
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  try {
    const rtf = new Intl.RelativeTimeFormat(config.locale, { numeric: 'auto' });
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return rtf.format(-diffMinutes, 'minute');
      }
      return rtf.format(-diffHours, 'hour');
    } else if (diffDays < 30) {
      return rtf.format(-diffDays, 'day');
    } else if (diffDays < 365) {
      return rtf.format(-Math.floor(diffDays / 30), 'month');
    } else {
      return rtf.format(-Math.floor(diffDays / 365), 'year');
    }
  } catch {
    return formatDateForRegion(d, countryCode);
  }
};
