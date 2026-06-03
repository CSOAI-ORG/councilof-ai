import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { getNewTiers } from "@/config/pricing";

export const PricingSection = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handlePlanClick = (tierKey: string) => {
    if (isAuthenticated) {
      navigate(`/subscribe?tier=${tierKey}`);
    } else {
      navigate(`/auth?redirect=/subscribe&tier=${tierKey}`);
    }
  };

  const handleEnterpriseClick = () => {
    navigate('/contact?subject=enterprise');
  };

  // Get pricing tiers from central config
  const tiers = getNewTiers();

  const plans = tiers.map(tier => {
    const vehicleLimit = tier.limits.vehicles === -1 ? 'Unlimited' : `Up to ${tier.limits.vehicles}`;
    const jobLimit = tier.limits.jobs === -1 ? 'Unlimited' : `${tier.limits.jobs}`;
    
    return {
      key: tier.key,
      name: tier.name,
      price: `£${tier.price}`,
      period: "/month",
      vehicleLimit,
      jobLimit,
      description: tier.description,
      features: tier.features,
      cta: `Get ${tier.name}`,
      popular: tier.popular
    };
  });

  return (
    <section id="pricing" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose the plan that fits your fleet size. All plans include full UK compliance features.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`bg-card border-border shadow-card relative ${
                plan.popular ? 'border-primary shadow-construction' : ''
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-action text-accent-foreground">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <div className="flex items-center justify-center gap-2 mt-2 text-sm text-accent">
                  <Truck className="h-4 w-4" />
                  <span>{plan.vehicleLimit} vehicles</span>
                </div>
                <CardDescription className="mt-2">{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  variant={plan.popular ? "action" : "default"} 
                  className="w-full" 
                  size="lg"
                  onClick={() => handlePlanClick(plan.key)}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Card className="bg-card border-border shadow-card max-w-4xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Enterprise & White-Label Solutions
              </h3>
              <p className="text-muted-foreground mb-6">
                Large-scale operators, councils, and waste management companies can access 
                custom pricing, white-label solutions, and dedicated account management.
              </p>
              <Button variant="hero" size="lg" onClick={handleEnterpriseClick}>
                Contact Enterprise Sales
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
