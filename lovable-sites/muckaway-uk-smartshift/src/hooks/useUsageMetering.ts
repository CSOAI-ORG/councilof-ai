import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UsageData {
  jobs: { current: number; limit: number; percentage: number };
  ai_requests: { current: number; limit: number; percentage: number };
  storage: { bytes_used: number; formatted: string };
}

interface UsagePeriod {
  start: string;
  end: string;
  days_remaining: number;
}

interface UsageState {
  usage: UsageData | null;
  tier: string;
  period: UsagePeriod | null;
  isLoading: boolean;
  error: string | null;
}

export function useUsageMetering() {
  const [state, setState] = useState<UsageState>({
    usage: null,
    tier: 'free',
    period: null,
    isLoading: true,
    error: null
  });
  const { toast } = useToast();

  const fetchUsage = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const { data, error } = await supabase.functions.invoke('get-usage', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      setState({
        usage: data.usage,
        tier: data.tier,
        period: data.period,
        isLoading: false,
        error: null
      });
    } catch (err) {
      console.error('Error fetching usage:', err);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to load usage data' 
      }));
    }
  }, []);

  const trackUsage = useCallback(async (usageType: 'job' | 'ai_request', increment = 1) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { success: false, error: 'Not authenticated' };

      const { data, error } = await supabase.functions.invoke('track-usage', {
        body: { usage_type: usageType, increment },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) {
        // Check if it's a rate limit error
        if (error.message?.includes('429') || data?.upgrade_required) {
          toast({
            title: 'Usage Limit Reached',
            description: `You've reached your ${usageType.replace('_', ' ')} limit. Upgrade your plan for more.`,
            variant: 'destructive'
          });
          return { success: false, error: 'Limit exceeded', upgrade_required: true };
        }
        throw error;
      }

      // Update local state
      setState(prev => ({
        ...prev,
        usage: data.usage,
        tier: data.tier
      }));

      return { success: true, usage: data.usage };
    } catch (err) {
      console.error('Error tracking usage:', err);
      return { success: false, error: 'Failed to track usage' };
    }
  }, [toast]);

  const checkCanUseFeature = useCallback((featureType: 'job' | 'ai_request'): boolean => {
    if (!state.usage) return true; // Allow if no usage data yet
    
    const feature = featureType === 'job' ? state.usage.jobs : state.usage.ai_requests;
    
    // Unlimited (-1) or under limit
    if (feature.limit === -1) return true;
    return feature.current < feature.limit;
  }, [state.usage]);

  const getUsageWarningLevel = useCallback((featureType: 'job' | 'ai_request'): 'none' | 'warning' | 'critical' | 'exceeded' => {
    if (!state.usage) return 'none';
    
    const feature = featureType === 'job' ? state.usage.jobs : state.usage.ai_requests;
    
    if (feature.limit === -1) return 'none';
    if (feature.percentage >= 100) return 'exceeded';
    if (feature.percentage >= 90) return 'critical';
    if (feature.percentage >= 75) return 'warning';
    return 'none';
  }, [state.usage]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return {
    ...state,
    fetchUsage,
    trackUsage,
    checkCanUseFeature,
    getUsageWarningLevel
  };
}
