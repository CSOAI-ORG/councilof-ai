import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, PauseCircle, PlayCircle, Calendar, Sparkles } from 'lucide-react';
import { PRICING_TIERS, type PricingTier, getNewTiers } from '@/config/pricing';

export const SubscriptionManager = () => {
  const [searchParams] = useSearchParams();
  const tierFromUrl = searchParams.get('tier') as PricingTier | null;
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [pausingSubscription, setPausingSubscription] = useState(false);
  const [subscription, setSubscription] = useState<{
    subscribed: boolean;
    product_id?: string;
    subscription_end?: string;
    paused?: boolean;
  } | null>(null);
  const { toast } = useToast();
  const highlightedCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkSubscription();
  }, []);

  // Scroll to highlighted tier when loaded
  useEffect(() => {
    if (!loading && tierFromUrl && highlightedCardRef.current) {
      highlightedCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [loading, tierFromUrl]);

  const checkSubscription = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setSubscription({ subscribed: false });
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to check subscription status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (tier: PricingTier) => {
    try {
      setCheckingOut(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to subscribe',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: PRICING_TIERS[tier].priceId,
          mode: 'subscription',
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: 'Redirecting to Checkout',
          description: 'Complete your subscription in the new tab',
        });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Error',
        description: 'Failed to start checkout',
        variant: 'destructive',
      });
    } finally {
      setCheckingOut(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Portal error:', error);
      toast({
        title: 'Error',
        description: 'Failed to open customer portal',
        variant: 'destructive',
      });
    }
  };

  const handlePauseResume = async (action: 'pause' | 'resume') => {
    try {
      setPausingSubscription(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('pause-subscription', {
        body: { action },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: action === 'pause' ? 'Subscription Paused' : 'Subscription Resumed',
        description: action === 'pause' 
          ? 'Your subscription has been paused. You can resume anytime.'
          : 'Your subscription is now active again.',
      });

      // Refresh subscription status
      await checkSubscription();
    } catch (error) {
      console.error('Pause/Resume error:', error);
      toast({
        title: 'Error',
        description: `Failed to ${action} subscription`,
        variant: 'destructive',
      });
    } finally {
      setPausingSubscription(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const currentTier = subscription?.product_id 
    ? (Object.entries(PRICING_TIERS).find(([_, tier]) => tier.productId === subscription.product_id)?.[0] as PricingTier)
    : null;

  const newTiers = getNewTiers().map(t => [t.key, PRICING_TIERS[t.key as PricingTier]] as [string, typeof PRICING_TIERS[PricingTier]]);

  const renderTierCard = ([key, tier]: [string, typeof PRICING_TIERS[PricingTier]]) => {
    const isHighlighted = tierFromUrl === key;
    const isCurrentPlan = currentTier === key;
    
    return (
      <Card 
        key={key} 
        ref={isHighlighted ? highlightedCardRef : undefined}
        className={`transition-all duration-300 ${
          isHighlighted 
            ? 'border-primary border-2 shadow-xl ring-2 ring-primary/20' 
            : tier.popular 
              ? 'border-primary shadow-lg' 
              : ''
        }`}
      >
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle>{tier.name}</CardTitle>
            <div className="flex gap-1 flex-wrap">
              {isHighlighted && !isCurrentPlan && (
                <Badge className="bg-primary text-primary-foreground">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Selected
                </Badge>
              )}
              {tier.popular && <Badge variant="secondary">Popular</Badge>}
              {isCurrentPlan && <Badge variant="outline">Current</Badge>}
            </div>
          </div>
          <CardDescription>
            <span className="text-3xl font-bold">£{tier.price}</span>
            <span className="text-muted-foreground">/{tier.interval}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2">
            {tier.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
          <Button
            onClick={() => handleSubscribe(key as PricingTier)}
            disabled={checkingOut || isCurrentPlan}
            className="w-full"
            variant={isHighlighted || tier.popular ? 'default' : 'outline'}
          >
            {checkingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isCurrentPlan ? (
              'Current Plan'
            ) : isHighlighted ? (
              'Complete Subscription'
            ) : (
              `Subscribe to ${tier.name}`
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {subscription?.subscribed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {subscription.paused ? (
                <PauseCircle className="w-5 h-5 text-yellow-500" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
              {subscription.paused ? 'Subscription Paused' : 'Active Subscription'}
            </CardTitle>
            <CardDescription>
              You're on the {currentTier ? PRICING_TIERS[currentTier].name : 'Active'} plan
              {subscription.subscription_end && (
                <span className="flex items-center gap-1 mt-1">
                  <Calendar className="w-4 h-4" />
                  {subscription.paused ? 'Paused until resumed' : `Renews ${new Date(subscription.subscription_end).toLocaleDateString()}`}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={handleManageSubscription} variant="outline">
              Manage Subscription
            </Button>
            {subscription.paused ? (
              <Button 
                onClick={() => handlePauseResume('resume')} 
                variant="default"
                disabled={pausingSubscription}
              >
                {pausingSubscription ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <PlayCircle className="w-4 h-4 mr-2" />
                )}
                Resume Subscription
              </Button>
            ) : (
              <Button 
                onClick={() => handlePauseResume('pause')} 
                variant="secondary"
                disabled={pausingSubscription}
              >
                {pausingSubscription ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <PauseCircle className="w-4 h-4 mr-2" />
                )}
                Pause Subscription
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {newTiers.map(renderTierCard)}
      </div>
    </div>
  );
};
