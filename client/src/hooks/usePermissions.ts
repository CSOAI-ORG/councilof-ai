import { useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { 
  SubscriptionTier, 
  TIER_PERMISSIONS, 
  FeaturePermissions,
  hasFeature,
  getLimit,
  isAtLimit,
  getUpgradeMessage 
} from '../../../shared/permissions';

/**
 * Hook to check user's subscription tier and feature permissions
 */
export function usePermissions() {
  const { data: user } = trpc.auth.me.useQuery();
  
  const tier: SubscriptionTier = useMemo(() => {
    if (!user) return 'free';
    return (user.subscriptionTier as SubscriptionTier) || 'free';
  }, [user]);
  
  const permissions = useMemo(() => TIER_PERMISSIONS[tier], [tier]);
  
  return {
    tier,
    permissions,
    
    /**
     * Check if user has access to a feature
     */
    can: (feature: string): boolean => {
      return hasFeature(tier, feature);
    },

    /**
     * Get the limit for a numeric feature
     */
    limit: (feature: string): number => {
      return getLimit(tier, feature);
    },

    /**
     * Check if user has reached their limit
     */
    atLimit: (feature: string, currentCount: number): boolean => {
      return isAtLimit(tier, feature, currentCount);
    },
    
    /**
     * Get upgrade message for a feature
     */
    upgradeMessage: (feature: string): string => {
      return getUpgradeMessage(tier, feature);
    },

    /**
     * Check if user is on free tier
     */
    isFree: tier === 'free',

    /**
     * Check if user is on pro/professional tier
     */
    isPro: tier === 'professional',

    /**
     * Check if user is on enterprise tier
     */
    isEnterprise: tier === 'enterprise',

    /**
     * Check if user has at least pro tier
     */
    isProOrHigher: tier === 'professional' || tier === 'enterprise',
  };
}

/**
 * Hook to get feature gate component props
 */
export function useFeatureGate(feature: string) {
  const { can, upgradeMessage, tier } = usePermissions();
  
  const hasAccess = can(feature);
  const message = upgradeMessage(feature);
  
  return {
    hasAccess,
    message,
    tier,
    showUpgrade: !hasAccess,
  };
}
