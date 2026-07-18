import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, ArrowRight, Zap, Shield, Clock, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getNewTiers } from '@/config/pricing';
import { FleetSizeCalculator } from '@/components/FleetSizeCalculator';
import { WasteVolumeCalculator } from '@/components/WasteVolumeCalculator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const Pricing = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const tiers = getNewTiers();

  const handleSubscribe = async (priceId: string, tierKey: string) => {
    setLoading(tierKey);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate(`/auth?redirect=/subscribe&tier=${tierKey}`);
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Error',
        description: 'Failed to start checkout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Pricing - MuckAway.ai | AI Spoil Classification Plans</title>
        <meta name="description" content="Simple, transparent pricing for AI-powered spoil classification. From £37/month. No hidden fees, no contracts." />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {/* Hero */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <Badge variant="outline" className="mb-4">
              <Zap className="h-3 w-3 mr-1" />
              Simple Monthly Pricing
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your fleet size. Scale seamlessly as your business grows.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {tiers.map((tier) => {
                const vehicleLimit = tier.limits.vehicles === -1 ? 'Unlimited' : `Up to ${tier.limits.vehicles}`;
                const jobLimit = tier.limits.jobs === -1 ? 'Unlimited' : `${tier.limits.jobs}/month`;
                
                return (
                  <Card 
                    key={tier.key}
                    className={`relative ${tier.popular ? 'border-primary shadow-xl scale-105 z-10' : 'border-border'}`}
                  >
                    {tier.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground px-4 py-1">
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-4">
                      <CardTitle className="text-2xl">{tier.name}</CardTitle>
                      <CardDescription>{tier.description}</CardDescription>
                      <div className="pt-4">
                        <span className="text-4xl font-bold">£{tier.price}</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 mt-2 text-sm text-primary">
                        <Truck className="h-4 w-4" />
                        <span>{vehicleLimit} vehicles</span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      <Button 
                        className="w-full" 
                        variant={tier.popular ? 'default' : 'outline'}
                        size="lg"
                        disabled={loading === tier.key}
                        onClick={() => handleSubscribe(tier.priceId, tier.key)}
                      >
                        {loading === tier.key ? 'Loading...' : 'Get Started'}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>

                      <div className="space-y-3">
                        {tier.features.map((feature, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t text-center">
                        <p className="text-xs text-muted-foreground">
                          {jobLimit === 'Unlimited/month' ? 'Unlimited jobs' : `${tier.limits.jobs} jobs/month`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Fleet Size Calculator */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8">
                Find Your Perfect Plan
              </h2>
              <FleetSizeCalculator />
            </div>
          </div>
        </section>

        {/* Waste Volume Calculator */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-4">
                Free Waste Calculator
              </h2>
              <p className="text-muted-foreground text-center mb-8">
                Estimate your spoil volume and get an instant price quote
              </p>
              <WasteVolumeCalculator />
            </div>
          </div>
        </section>

        {/* Competitor Comparison */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">
              How We Compare
            </h2>
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-4">Feature</th>
                          <th className="text-center p-4">MuckAway.ai</th>
                          <th className="text-center p-4">Traditional</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-4">AI Spoil Classification</td>
                          <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                          <td className="text-center p-4"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-4">Automated WTN</td>
                          <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                          <td className="text-center p-4"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-4">DWT 2026 Compliance</td>
                          <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                          <td className="text-center p-4"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-4">Auto EWC Codes</td>
                          <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                          <td className="text-center p-4"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-4">Digital Record Keeping</td>
                          <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                          <td className="text-center p-4"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-4">Fleet Management</td>
                          <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                          <td className="text-center p-4"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="p-4 font-semibold">Pricing Model</td>
                          <td className="text-center p-4 text-primary font-bold">Fixed Monthly</td>
                          <td className="text-center p-4 text-muted-foreground">Per Load</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Fully Compliant</h3>
                <p className="text-sm text-muted-foreground">
                  DWT 2026 ready with automated EWC codes and digital WTNs
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Save 5+ Hours/Week</h3>
                <p className="text-sm text-muted-foreground">
                  Automated paperwork means more time on site
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Instant Classification</h3>
                <p className="text-sm text-muted-foreground">
                  AI-powered spoil analysis in under 10 seconds
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How does pricing work?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We charge a simple flat monthly fee based on your fleet size. No hidden charges, 
                    no per-job fees. Choose the plan that matches your number of vehicles and scale 
                    up as your business grows.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What happens if I exceed my job limit?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    If you're consistently reaching your job limit, we'll notify you and recommend 
                    upgrading to a larger plan. We won't cut off access mid-month – we'll work with 
                    you to find the right plan for your needs.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Can I change plans later?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Is there a contract?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    No long-term contracts. All plans are month-to-month and you can cancel anytime.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Pricing;
