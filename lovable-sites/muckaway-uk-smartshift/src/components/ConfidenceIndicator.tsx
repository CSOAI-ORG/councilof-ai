import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfidenceIndicatorProps {
  confidence: number; // 0-100 or 0-1 (will auto-detect)
  showLabel?: boolean;
  showBar?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  showLabel = true,
  showBar = true,
  size = 'md',
  className
}) => {
  // Normalize confidence to 0-100
  const normalizedConfidence = confidence <= 1 ? Math.round(confidence * 100) : Math.round(confidence);
  
  // Determine confidence level and styling
  const getConfidenceLevel = () => {
    if (normalizedConfidence >= 90) return { level: 'excellent', color: 'text-green-500', bgColor: 'bg-green-500', label: 'Excellent' };
    if (normalizedConfidence >= 75) return { level: 'high', color: 'text-emerald-500', bgColor: 'bg-emerald-500', label: 'High' };
    if (normalizedConfidence >= 60) return { level: 'good', color: 'text-yellow-500', bgColor: 'bg-yellow-500', label: 'Good' };
    if (normalizedConfidence >= 40) return { level: 'moderate', color: 'text-orange-500', bgColor: 'bg-orange-500', label: 'Moderate' };
    return { level: 'low', color: 'text-red-500', bgColor: 'bg-red-500', label: 'Low' };
  };

  const { level, color, bgColor, label } = getConfidenceLevel();

  const getIcon = () => {
    const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
    switch (level) {
      case 'excellent':
      case 'high':
        return <CheckCircle className={cn(iconSize, color)} />;
      case 'good':
        return <AlertCircle className={cn(iconSize, color)} />;
      case 'moderate':
        return <AlertTriangle className={cn(iconSize, color)} />;
      default:
        return <HelpCircle className={cn(iconSize, color)} />;
    }
  };

  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm';
  const badgeSize = size === 'sm' ? 'text-xs px-1.5 py-0.5' : size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5';

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {getIcon()}
          <span className={cn('font-bold', textSize, color)}>
            {normalizedConfidence}%
          </span>
          {showLabel && (
            <Badge 
              variant="outline" 
              className={cn(badgeSize, 'border-current', color)}
            >
              {label}
            </Badge>
          )}
        </div>
      </div>
      
      {showBar && (
        <div className="relative">
          <Progress 
            value={normalizedConfidence} 
            className={cn(
              'h-2',
              size === 'sm' && 'h-1',
              size === 'lg' && 'h-3'
            )}
          />
          <div 
            className={cn(
              'absolute top-0 left-0 h-full rounded-full transition-all duration-500',
              bgColor
            )}
            style={{ width: `${normalizedConfidence}%` }}
          />
        </div>
      )}
      
      {normalizedConfidence < 75 && (
        <p className={cn('text-muted-foreground', size === 'sm' ? 'text-xs' : 'text-xs')}>
          {normalizedConfidence < 60 
            ? 'Consider manual verification or additional photos'
            : 'Classification may benefit from additional photos'
          }
        </p>
      )}
    </div>
  );
};

export default ConfidenceIndicator;
