import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, MessageCircle, Mail, Phone } from 'lucide-react';
import { useGlobal } from '@/components/GlobalProvider';

interface SupportRegion {
  name: string;
  timezone: string;
  offset: number; // UTC offset in hours
  startHour: number;
  endHour: number;
  phone?: string;
}

const SUPPORT_REGIONS: Record<string, SupportRegion> = {
  UK: { name: 'UK Support', timezone: 'GMT/BST', offset: 0, startHour: 8, endHour: 18, phone: '+44 800 123 4567' },
  EU: { name: 'EU Support', timezone: 'CET', offset: 1, startHour: 8, endHour: 18, phone: '+49 800 123 4567' },
  SG: { name: 'Asia Support', timezone: 'SGT', offset: 8, startHour: 9, endHour: 18, phone: '+65 800 123 4567' },
  IN: { name: 'India Support', timezone: 'IST', offset: 5.5, startHour: 9, endHour: 18, phone: '+91 800 123 4567' },
  US: { name: 'Americas Support', timezone: 'EST', offset: -5, startHour: 8, endHour: 20, phone: '+1 800 123 4567' },
  AE: { name: 'Middle East Support', timezone: 'GST', offset: 4, startHour: 9, endHour: 18, phone: '+971 800 123 4567' },
  AU: { name: 'Australia Support', timezone: 'AEST', offset: 10, startHour: 8, endHour: 17, phone: '+61 800 123 4567' },
  BR: { name: 'Brazil Support', timezone: 'BRT', offset: -3, startHour: 8, endHour: 18, phone: '+55 800 123 4567' },
  ZA: { name: 'Africa Support', timezone: 'SAST', offset: 2, startHour: 8, endHour: 17, phone: '+27 800 123 4567' },
};

const REGION_MAP: Record<string, string> = {
  UK: 'UK', GB: 'UK', 
  DE: 'EU', FR: 'EU', IT: 'EU', ES: 'EU', NL: 'EU', BE: 'EU', AT: 'EU', CH: 'EU', PL: 'EU',
  SG: 'SG', MY: 'SG', TH: 'SG', VN: 'SG', PH: 'SG', ID: 'SG', JP: 'SG', KR: 'SG', HK: 'SG',
  IN: 'IN', PK: 'IN', BD: 'IN', LK: 'IN',
  US: 'US', CA: 'US', MX: 'US',
  AE: 'AE', SA: 'AE', QA: 'AE', KW: 'AE', BH: 'AE', OM: 'AE',
  AU: 'AU', NZ: 'AU',
  BR: 'BR', AR: 'BR', CL: 'BR', CO: 'BR', PE: 'BR',
  ZA: 'ZA', NG: 'ZA', KE: 'ZA', EG: 'ZA',
};

interface SupportHoursIndicatorProps {
  compact?: boolean;
  showPhone?: boolean;
  className?: string;
}

export const SupportHoursIndicator = ({ 
  compact = false, 
  showPhone = false,
  className = '' 
}: SupportHoursIndicatorProps) => {
  const { region } = useGlobal();
  const [isLive, setIsLive] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [nextAvailable, setNextAvailable] = useState('');

  const regionString = typeof region === 'string' ? region : 'UK';
  const supportRegionKey = REGION_MAP[regionString] || 'UK';
  const supportRegion = SUPPORT_REGIONS[supportRegionKey];

  useEffect(() => {
    const checkSupportHours = () => {
      const now = new Date();
      const utcHour = now.getUTCHours() + now.getUTCMinutes() / 60;
      const regionHour = (utcHour + supportRegion.offset + 24) % 24;
      
      const isWithinHours = regionHour >= supportRegion.startHour && regionHour < supportRegion.endHour;
      const isWeekday = now.getUTCDay() >= 1 && now.getUTCDay() <= 5;
      
      setIsLive(isWithinHours && isWeekday);
      
      // Format current time in support region
      const regionTime = new Date(now.getTime() + supportRegion.offset * 3600000);
      setCurrentTime(regionTime.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }));
      
      // Calculate next available time
      if (!isLive) {
        if (!isWeekday) {
          setNextAvailable('Monday ' + supportRegion.startHour + ':00');
        } else if (regionHour < supportRegion.startHour) {
          setNextAvailable(`Today at ${supportRegion.startHour}:00`);
        } else {
          setNextAvailable(`Tomorrow at ${supportRegion.startHour}:00`);
        }
      }
    };

    checkSupportHours();
    const interval = setInterval(checkSupportHours, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [supportRegion]);

  if (compact) {
    return (
      <Badge 
        variant={isLive ? "default" : "secondary"} 
        className={`gap-1 ${isLive ? 'bg-green-600 hover:bg-green-700' : ''} ${className}`}
      >
        <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-300 animate-pulse' : 'bg-muted-foreground'}`} />
        {isLive ? 'Live Support' : 'Email Only'}
      </Badge>
    );
  }

  return (
    <div className={`bg-muted/50 rounded-lg p-3 space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{supportRegion.name}</span>
        </div>
        <Badge 
          variant={isLive ? "default" : "secondary"}
          className={isLive ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          <span className={`w-2 h-2 rounded-full mr-1.5 ${isLive ? 'bg-green-300 animate-pulse' : 'bg-muted-foreground'}`} />
          {isLive ? 'Live Now' : 'Offline'}
        </Badge>
      </div>
      
      <div className="text-xs text-muted-foreground">
        <p>Local time: {currentTime} {supportRegion.timezone}</p>
        <p>Hours: {supportRegion.startHour}:00 - {supportRegion.endHour}:00 (Mon-Fri)</p>
        {!isLive && nextAvailable && (
          <p className="text-primary mt-1">Next available: {nextAvailable}</p>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        {isLive ? (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Live chat available</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            <span>Email response within 24h</span>
          </div>
        )}
        {showPhone && supportRegion.phone && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
            <Phone className="h-3.5 w-3.5" />
            <span>{supportRegion.phone}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportHoursIndicator;
