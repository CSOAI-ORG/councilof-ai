import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUsageMetering } from '@/hooks/useUsageMetering';

interface UsageWarningBannerProps {
  featureType: 'job' | 'ai_request';
}

export function UsageWarningBanner({ featureType }: UsageWarningBannerProps) {
  const { getUsageWarningLevel, usage } = useUsageMetering();
  const navigate = useNavigate();
  const level = getUsageWarningLevel(featureType);

  if (level === 'none') return null;

  const feature = featureType === 'job' ? usage?.jobs : usage?.ai_requests;
  const featureLabel = featureType === 'job' ? 'jobs' : 'AI requests';

  return (
    <Alert 
      variant={level === 'exceeded' ? 'destructive' : 'default'}
      className={level === 'exceeded' ? '' : 'border-yellow-500 bg-yellow-500/10'}
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between w-full">
        <span>
          {level === 'exceeded' 
            ? `You've reached your ${featureLabel} limit. Upgrade to continue.`
            : `You're at ${feature?.percentage}% of your monthly ${featureLabel} limit.`}
        </span>
        <Button 
          size="sm" 
          variant={level === 'exceeded' ? 'default' : 'outline'}
          onClick={() => navigate('/subscribe')}
          className="ml-4"
        >
          <TrendingUp className="h-3 w-3 mr-1" />
          Upgrade
        </Button>
      </AlertDescription>
    </Alert>
  );
}
