import React from 'react';
import { useGlobal } from './GlobalProvider';
import { getSupportedRegions } from '@/config/regionalCompliance';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';

const RegionSelector: React.FC = () => {
  const { region, setRegion } = useGlobal();
  const regions = getSupportedRegions();

  const handleRegionChange = (code: string) => {
    setRegion(code);
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={region?.country || 'UK'} onValueChange={handleRegionChange}>
        <SelectTrigger className="w-[140px] h-8 text-sm border-border/50 bg-transparent">
          <SelectValue placeholder="Select region" />
        </SelectTrigger>
        <SelectContent>
          {regions.map((r) => (
            <SelectItem key={r.code} value={r.code}>
              <span className="flex items-center gap-2">
                <span>{r.flag}</span>
                <span>{r.code}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RegionSelector;
