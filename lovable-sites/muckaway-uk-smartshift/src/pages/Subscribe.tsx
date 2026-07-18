import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SubscriptionManager } from "@/components/SubscriptionManager";
import { useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Sparkles } from "lucide-react";
import { PRICING_TIERS, NEW_TIER_KEYS, type NewPricingTier } from "@/config/pricing";

// Use actual tier data from config
const getTierInfo = (tierKey: string) => {
  const tier = PRICING_TIERS[tierKey as NewPricingTier];
  if (!tier) return null;
  return {
    name: tier.name,
    features: tier.features.slice(0, 4) // Show first 4 features
  };
};

const Subscribe = () => {
  const [searchParams] = useSearchParams();
  const selectedTier = searchParams.get("tier")?.toLowerCase();
  const tierInfo = selectedTier ? getTierInfo(selectedTier) : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            {tierInfo ? (
              <div className="text-center mb-12">
                <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Selected Plan
                </Badge>
                <h1 className="text-4xl font-bold mb-4">
                  Complete Your {tierInfo.name} Subscription
                </h1>
                <p className="text-xl text-muted-foreground mb-6">
                  You're one step away from unlocking powerful waste management tools
                </p>
                <div className="inline-flex flex-wrap justify-center gap-3 bg-muted/50 rounded-lg p-4 max-w-2xl">
                  {tierInfo.features.map((feature, index) => (
                    <span key={index} className="flex items-center gap-1.5 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
                <p className="text-xl text-muted-foreground">
                  Select the perfect subscription tier for your muck away business
                </p>
              </div>
            )}
            <SubscriptionManager />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Subscribe;
