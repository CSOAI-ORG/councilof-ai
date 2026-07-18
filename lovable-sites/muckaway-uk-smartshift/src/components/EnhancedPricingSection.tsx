import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Truck, 
  Users, 
  Building, 
  BarChart3, 
  Shield, 
  Zap, 
  Globe, 
  Star,
  Check,
  ArrowRight
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { PRICING_TIERS, getNewTiers } from "@/config/pricing";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useGlobal } from "@/components/GlobalProvider";
import { formatPrice } from "@/config/regionalPricing";
import { getComplianceForRegion } from "@/config/regionalCompliance";
import { useTranslation } from "react-i18next";

export const EnhancedPricingSection = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { region, currency } = useGlobal();
  const { t } = useTranslation();
  const compliance = getComplianceForRegion(region?.country || 'UK');
  const newTiers = getNewTiers();

  const handleSubscribe = async (tierKey: string, tierName: string) => {
    try {
      setLoading(tierName);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: t('pricing.authRequired', 'Authentication Required'),
          description: t('pricing.createAccount', 'Create an account to subscribe to this plan'),
        });
        navigate(`/auth?redirect=/subscribe&tier=${tierKey}`);
        return;
      }

      const tier = PRICING_TIERS[tierKey as keyof typeof PRICING_TIERS];
      const priceId = tier?.priceId;

      if (!priceId) {
        toast({
          title: t('common.error', 'Error'),
          description: t('pricing.invalidTier', 'Invalid pricing tier'),
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId,
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
          title: t('pricing.redirecting', 'Redirecting to Checkout'),
          description: t('pricing.completeSubscription', 'Complete your subscription in the new tab'),
        });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('pricing.checkoutFailed', 'Failed to start checkout'),
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  // Build plans from new tier structure with fleet info
  const plans = newTiers.map((tier) => {
    const vehicleLimit = tier.limits.vehicles === -1 ? 'Unlimited' : tier.limits.vehicles;
    const jobLimit = tier.limits.jobs === -1 ? 'Unlimited' : tier.limits.jobs;
    
    return {
      key: tier.key,
      name: tier.name,
      price: tier.price,
      interval: tier.interval,
      features: tier.features,
      popular: tier.popular || false,
      uploadsIncluded: tier.uploadsIncluded,
      vehicleLimit,
      jobLimit,
      description: tier.key === 'wasteTracker' 
        ? t('pricing.wasteTrackerDesc', 'Essential tracking for small operators')
        : tier.key === 'aiClassifier'
        ? t('pricing.aiClassifierDesc', 'AI-powered classification & optimization')
        : t('pricing.enterpriseWasteDesc', 'Full platform access for large operations'),
    };
  });

  const addOns = [
    {
      name: t('pricing.marketplaceJobs', 'Marketplace Jobs'),
      description: t('pricing.marketplaceDesc', 'Access to additional muck away opportunities'),
      price: "3-6%"
    },
    {
      name: t('pricing.sustainabilityReports', 'Sustainability Reports'),
      description: t('pricing.sustainabilityDesc', 'Carbon footprint and recycling analytics'),
      price: formatPrice(29, currency)
    },
    {
      name: t('pricing.apiAccess', 'API Access'),
      description: t('pricing.apiDesc', 'Integrate with your existing systems'),
      price: formatPrice(99, currency)
    },
    {
      name: t('pricing.whiteLabelDocs', 'White-label Documents'),
      description: t('pricing.whiteLabelDesc', 'Customize WTNs and invoices with your branding'),
      price: formatPrice(49, currency)
    }
  ];

  const benefits = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: `${compliance.flag} ${t('pricing.complianceReady', 'Compliance Ready')}`,
      description: compliance.regulations[0]?.name || t('pricing.regulatoryCompliance', 'Full regulatory compliance')
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: t('pricing.aiPowered', 'AI-Powered Insights'),
      description: t('pricing.aiDescription', 'Predictive analytics and automated classifications')
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: t('pricing.multiRegion', 'Multi-Region Support'),
      description: compliance.regions.slice(0, 3).join(', ') + '...'
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: t('pricing.realTimeAnalytics', 'Real-time Analytics'),
      description: t('pricing.trackPerformance', 'Track performance and optimize operations')
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-gradient-surface">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
            {t('pricing.transparentPricing', 'Transparent Pricing')}
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            {t('pricing.chooseYourPlan', 'Choose Your Plan')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            {t('pricing.subtitle', 'From solo operators to large fleets, we have a plan that grows with your business.')}
          </p>
          
          {/* Benefits Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="text-primary mb-2">
                  {benefit.icon}
                </div>
                <h3 className="font-semibold text-foreground mb-1">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative bg-card border-border shadow-card hover:shadow-construction transition-all ${
                plan.popular ? 'ring-2 ring-accent shadow-glow' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-accent text-accent-foreground px-3 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    {t('pricing.mostPopular', 'Most Popular')}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl text-foreground">{plan.name}</CardTitle>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-primary">
                    {formatPrice(plan.price, currency)}
                  </span>
                  <span className="text-muted-foreground">/{plan.interval}</span>
                </div>
                <div className="flex items-center justify-center gap-2 mt-2 text-sm text-accent">
                  <Truck className="h-4 w-4" />
                  <span>{plan.vehicleLimit === 'Unlimited' ? 'Unlimited' : `Up to ${plan.vehicleLimit}`} vehicles</span>
                </div>
                <CardDescription className="text-center">{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  variant={plan.popular ? "action" : "outline"} 
                  className="w-full mt-6"
                  size="lg"
                  onClick={() => handleSubscribe(plan.key, plan.name)}
                  disabled={loading === plan.name}
                >
                  {loading === plan.name ? (
                    <>
                      <span className="mr-2">{t('common.processing', 'Processing...')}</span>
                    </>
                  ) : (
                    <>
                      {t('pricing.get', 'Get')} {plan.name}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add-ons Section */}
        <div className="bg-card rounded-lg p-8 border border-border shadow-card">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {t('pricing.addOnServices', 'Add-on Services')}
            </h3>
            <p className="text-muted-foreground">
              {t('pricing.addOnDescription', 'Enhance your subscription with optional services tailored to your needs')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {addOns.map((addon, index) => (
              <Card key={index} className="bg-gradient-surface border-border">
                <CardHeader>
                  <CardTitle className="text-sm text-foreground">{addon.name}</CardTitle>
                  <CardDescription className="text-xs">{addon.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold text-primary">{addon.price}/mo</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Trust Indicators - using consistent platform metrics */}
        <div className="text-center mt-16">
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="flex flex-col items-center">
              <Truck className="h-8 w-8 text-primary mb-2" />
              <h4 className="font-semibold text-foreground">50+ {t('pricing.operators', 'Operators')}</h4>
              <p className="text-sm text-muted-foreground">{t('pricing.trustMuckaway', 'Trust MuckAway.ai')}</p>
            </div>
            <div className="flex flex-col items-center">
              <Users className="h-8 w-8 text-primary mb-2" />
              <h4 className="font-semibold text-foreground">1,000+ {t('pricing.jobs', 'Quotes')}</h4>
              <p className="text-sm text-muted-foreground">{t('pricing.processedMonthly', 'Generated')}</p>
            </div>
            <div className="flex flex-col items-center">
              <Building className="h-8 w-8 text-primary mb-2" />
              <h4 className="font-semibold text-foreground">99.9% {t('pricing.uptime', 'Uptime')}</h4>
              <p className="text-sm text-muted-foreground">{t('pricing.reliableService', 'Reliable service')}</p>
            </div>
          </div>
          
          <div className="mt-8 text-sm text-muted-foreground">
            <p>{t('pricing.freeSetup', 'All plans include free setup, training, and migration assistance.')}</p>
            <p>{t('pricing.cancelAnytime', 'Cancel anytime. No long-term contracts.')}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
