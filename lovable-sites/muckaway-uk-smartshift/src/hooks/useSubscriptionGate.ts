import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PRICING_TIERS, PricingTier } from '@/config/pricing';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export type FeatureType = 
  | 'basic_quote'
  | 'ai_classification' 
  | 'voice_ai'
  | 'advanced_image_analysis'
  | 'fleet_management'
  | 'predictive_maintenance'
  | 'api_access'
  | 'custom_integrations'
  | 'weighbridge_ocr';

// Feature-to-tier mapping - which tiers can access which features
const FEATURE_TIERS: Record<FeatureType, PricingTier[]> = {
  'basic_quote': ['starter', 'professional', 'enterprise'],
  'ai_classification': ['starter', 'professional', 'enterprise'],
  'voice_ai': ['professional', 'enterprise'],
  'advanced_image_analysis': ['professional', 'enterprise'],
  'fleet_management': ['professional', 'enterprise'],
  'predictive_maintenance': ['professional', 'enterprise'],
  'api_access': ['enterprise'],
  'custom_integrations': ['enterprise'],
  'weighbridge_ocr': ['professional', 'enterprise'],
};

// Feature display names for upgrade prompts
const FEATURE_NAMES: Record<FeatureType, string> = {
  'basic_quote': 'Quote Generation',
  'ai_classification': 'AI Classification',
  'voice_ai': 'Voice AI (MuckBot Pro)',
  'advanced_image_analysis': 'Advanced Image Analysis',
  'fleet_management': 'Fleet Management',
  'predictive_maintenance': 'Predictive Maintenance',
  'api_access': 'API Access',
  'custom_integrations': 'Custom Integrations',
  'weighbridge_ocr': 'Weighbridge OCR',
};

interface SubscriptionGateResult {
  isLoading: boolean;
  isSubscribed: boolean;
  currentTier: PricingTier | null;
  productId: string | null;
  canAccessFeature: (feature: FeatureType) => boolean;
  requiresUpgrade: (feature: FeatureType) => boolean;
  showUpgradePrompt: (feature: FeatureType) => void;
  getMinimumTierForFeature: (feature: FeatureType) => PricingTier | null;
  refreshSubscription: () => Promise<void>;
}

export const useSubscriptionGate = (): SubscriptionGateResult => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currentTier, setCurrentTier] = useState<PricingTier | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const checkSubscription = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsSubscribed(false);
        setCurrentTier(null);
        setProductId(null);
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        setIsSubscribed(false);
        setCurrentTier(null);
        return;
      }

      setIsSubscribed(data?.subscribed ?? false);
      setProductId(data?.product_id ?? null);

      // Determine tier from product_id
      if (data?.product_id) {
        const tier = Object.entries(PRICING_TIERS).find(
          ([, tierData]) => tierData.productId === data.product_id
        );
        setCurrentTier(tier ? (tier[0] as PricingTier) : null);
      } else {
        setCurrentTier(null);
      }
    } catch (err) {
      console.error('Subscription check failed:', err);
      setIsSubscribed(false);
      setCurrentTier(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSubscription();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    return () => subscription.unsubscribe();
  }, [checkSubscription]);

  const canAccessFeature = useCallback((feature: FeatureType): boolean => {
    // If no tier required, allow access
    if (!FEATURE_TIERS[feature]) return true;
    
    // If user has no subscription, check if starter tier is allowed
    if (!currentTier) return false;
    
    return FEATURE_TIERS[feature].includes(currentTier);
  }, [currentTier]);

  const requiresUpgrade = useCallback((feature: FeatureType): boolean => {
    return !canAccessFeature(feature);
  }, [canAccessFeature]);

  const getMinimumTierForFeature = useCallback((feature: FeatureType): PricingTier | null => {
    const allowedTiers = FEATURE_TIERS[feature];
    if (!allowedTiers || allowedTiers.length === 0) return null;
    
    // Return the lowest tier (first in the array since we order them from lowest to highest)
    return allowedTiers[0];
  }, []);

  const showUpgradePrompt = useCallback((feature: FeatureType) => {
    const featureName = FEATURE_NAMES[feature] || feature;
    const minimumTier = getMinimumTierForFeature(feature);
    const tierName = minimumTier ? PRICING_TIERS[minimumTier].name : 'Professional';

    toast({
      title: `${featureName} requires upgrade`,
      description: `Upgrade to ${tierName} or higher to access ${featureName}. Visit the Subscribe page to upgrade.`,
    });
    
    // Navigate after a short delay to allow toast to show
    setTimeout(() => {
      navigate('/subscribe');
    }, 2000);
  }, [toast, navigate, getMinimumTierForFeature]);

  return {
    isLoading,
    isSubscribed,
    currentTier,
    productId,
    canAccessFeature,
    requiresUpgrade,
    showUpgradePrompt,
    getMinimumTierForFeature,
    refreshSubscription: checkSubscription,
  };
};
