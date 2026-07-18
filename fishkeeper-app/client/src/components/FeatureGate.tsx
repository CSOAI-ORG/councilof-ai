import { ReactNode } from 'react';
import { useFeatureGate } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Sparkles, Building2 } from 'lucide-react';
import { useLocation } from 'wouter';

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradeCard?: boolean;
}

/**
 * Component to gate features based on subscription tier
 * 
 * Usage:
 * <FeatureGate feature="pdfReports">
 *   <DownloadPDFButton />
 * </FeatureGate>
 */
export function FeatureGate({ 
  feature, 
  children, 
  fallback,
  showUpgradeCard = true 
}: FeatureGateProps) {
  const { hasAccess, message, tier } = useFeatureGate(feature);
  const [, navigate] = useLocation();
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (!showUpgradeCard) {
    return null;
  }
  
  return (
    <Card className="border-dashed border-2 border-muted-foreground/25 bg-muted/5">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-2 p-3 rounded-full bg-primary/10 w-fit">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-lg">Feature Locked</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button onClick={() => navigate('/billing')} className="gap-2">
          {tier === 'free' ? (
            <>
              <Sparkles className="h-4 w-4" />
              Upgrade to Pro
            </>
          ) : (
            <>
              <Building2 className="h-4 w-4" />
              Upgrade to Enterprise
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Inline upgrade prompt for smaller UI elements
 */
interface UpgradePromptProps {
  feature: string;
  size?: 'sm' | 'md' | 'lg';
}

export function UpgradePrompt({ feature, size = 'md' }: UpgradePromptProps) {
  const { hasAccess, message, tier } = useFeatureGate(feature);
  const [, navigate] = useLocation();
  
  if (hasAccess) return null;
  
  const sizeClasses = {
    sm: 'text-xs p-2',
    md: 'text-sm p-3',
    lg: 'text-base p-4',
  };
  
  return (
    <div className={`flex items-center justify-between gap-3 rounded-lg bg-primary/5 border border-primary/20 ${sizeClasses[size]}`}>
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4 text-primary" />
        <span className="text-muted-foreground">{message}</span>
      </div>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={() => navigate('/billing')}
        className="shrink-0"
      >
        Upgrade
      </Button>
    </div>
  );
}

/**
 * Badge to show feature tier requirement
 */
interface TierBadgeProps {
  tier: 'pro' | 'enterprise';
  className?: string;
}

export function TierBadge({ tier, className = '' }: TierBadgeProps) {
  if (tier === 'pro') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ${className}`}>
        <Sparkles className="h-3 w-3" />
        Pro
      </span>
    );
  }
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 ${className}`}>
      <Building2 className="h-3 w-3" />
      Enterprise
    </span>
  );
}

/**
 * Wrapper to disable and show tooltip on locked features
 */
interface LockedFeatureProps {
  feature: string;
  children: ReactNode;
}

export function LockedFeature({ feature, children }: LockedFeatureProps) {
  const { hasAccess, message } = useFeatureGate(feature);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  return (
    <div className="relative group">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
        <div className="text-center p-2">
          <Lock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-xs text-muted-foreground max-w-[200px]">{message}</p>
        </div>
      </div>
    </div>
  );
}
