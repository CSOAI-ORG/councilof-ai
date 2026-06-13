/**
 * Billing Settings Page
 * Manage subscription, view pricing tiers, and access Stripe portal
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  CreditCard,
  Check,
  Sparkles,
  Building2,
  Zap,
  Shield,
  Users,
  BarChart3,
  FileText,
  Headphones,
  Globe,
  Lock,
  ExternalLink,
  Loader2,
  Crown,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";

const TIER_ICONS = {
  free: Zap,
  pro: Sparkles,
  enterprise: Building2,
};

interface PricingTier {
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
}

const FEATURE_ICONS: Record<string, any> = {
  "AI System": Shield,
  "compliance": Globe,
  "support": Headphones,
  "analytics": BarChart3,
  "report": FileText,
  "API": Lock,
  "team": Users,
  "certification": Crown,
};

function getFeatureIcon(feature: string) {
  for (const [key, Icon] of Object.entries(FEATURE_ICONS)) {
    if (feature.toLowerCase().includes(key.toLowerCase())) {
      return Icon;
    }
  }
  return Check;
}

export default function Billing() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [, setLocation] = useLocation();
  
  // Check for success/cancel URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast.success("Subscription activated!", {
        description: "Welcome to your new plan. Your features are now unlocked.",
      });
      // Clean up URL
      window.history.replaceState({}, "", "/settings/billing");
    } else if (params.get("canceled") === "true") {
      toast.info("Checkout canceled", {
        description: "No changes were made to your subscription.",
      });
      window.history.replaceState({}, "", "/settings/billing");
    }
  }, []);

  // Queries
  const { data: subscriptionStatus, isLoading: statusLoading } = trpc.stripe.getSubscriptionStatus.useQuery();
  const { data: pricingTiers } = trpc.stripe.getPricingTiers.useQuery();

  // Mutations
  const checkoutMutation = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      toast.info("Redirecting to checkout...", {
        description: "You'll be taken to Stripe to complete your purchase.",
      });
      window.open(data.url, "_blank");
    },
    onError: (error) => {
      toast.error("Checkout failed", { description: error.message });
    },
  });

  const portalMutation = trpc.stripe.createPortalSession.useMutation({
    onSuccess: (data) => {
      toast.info("Opening billing portal...");
      window.open(data.url, "_blank");
    },
    onError: (error) => {
      toast.error("Portal access failed", { description: error.message });
    },
  });

  const handleSubscribe = (tier: "pro" | "enterprise") => {
    checkoutMutation.mutate({ tier, billingPeriod });
  };

  const handleManageSubscription = () => {
    portalMutation.mutate();
  };

  const currentTier = subscriptionStatus?.tier || "free";
  const isSubscribed = subscriptionStatus?.status === "active";

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
          <p className="text-muted-foreground mt-2">
            Manage your subscription plan and billing settings
          </p>
        </div>

        {/* Current Plan Status */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>
                    {statusLoading ? "Loading..." : `You are on the ${currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} plan`}
                  </CardDescription>
                </div>
              </div>
              <Badge 
                variant={isSubscribed ? "default" : "secondary"}
                className={cn(
                  "text-sm px-3 py-1",
                  isSubscribed && "bg-green-500 hover:bg-green-600"
                )}
              >
                {isSubscribed ? "Active" : currentTier === "free" ? "Free Tier" : subscriptionStatus?.status || "Inactive"}
              </Badge>
            </div>
          </CardHeader>
          {isSubscribed && (
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={handleManageSubscription}
                disabled={portalMutation.isPending}
              >
                {portalMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Manage Subscription
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* Billing Period Toggle */}
        <div className="flex justify-center">
          <Tabs value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as any)}>
            <TabsList className="grid w-[300px] grid-cols-2">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly" className="relative">
                Yearly
                <Badge className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0 bg-green-500">
                  -17%
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricingTiers && Object.entries(pricingTiers as Record<string, PricingTier>).map(([tierKey, tier]) => {
            const TierIcon = TIER_ICONS[tierKey as keyof typeof TIER_ICONS];
            const isCurrentTier = currentTier === tierKey;
            const price = billingPeriod === "monthly" ? tier.priceMonthly : Math.round(tier.priceYearly / 12);
            const totalPrice = billingPeriod === "yearly" ? tier.priceYearly : tier.priceMonthly;
            const isPro = tierKey === "pro";
            const isEnterprise = tierKey === "enterprise";

            return (
              <motion.div
                key={tierKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Object.keys(pricingTiers).indexOf(tierKey) * 0.1 }}
              >
                <Card className={cn(
                  "relative h-full flex flex-col",
                  isPro && "border-2 border-primary shadow-lg",
                  isCurrentTier && "ring-2 ring-green-500"
                )}>
                  {isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  {isCurrentTier && (
                    <div className="absolute -top-3 right-4">
                      <Badge className="bg-green-500 text-white">
                        Current Plan
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-2">
                    <div className={cn(
                      "w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-4",
                      tierKey === "free" && "bg-muted",
                      tierKey === "pro" && "bg-primary/10",
                      tierKey === "enterprise" && "bg-purple-100 dark:bg-purple-900"
                    )}>
                      <TierIcon className={cn(
                        "h-7 w-7",
                        tierKey === "free" && "text-muted-foreground",
                        tierKey === "pro" && "text-primary",
                        tierKey === "enterprise" && "text-purple-600 dark:text-purple-400"
                      )} />
                    </div>
                    <CardTitle className="text-xl">{tier.name}</CardTitle>
                    <CardDescription>{tier.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="text-center mb-6">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold">${price}</span>
                        <span className="text-muted-foreground">/mo</span>
                      </div>
                      {billingPeriod === "yearly" && totalPrice > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          ${totalPrice} billed annually
                        </p>
                      )}
                    </div>

                    <ul className="space-y-3">
                      {tier.features.map((feature, i) => {
                        const FeatureIcon = getFeatureIcon(feature);
                        return (
                          <li key={i} className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="text-sm">{feature}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    {tierKey === "free" ? (
                      <Button variant="outline" className="w-full" disabled>
                        {isCurrentTier ? "Current Plan" : "Free Forever"}
                      </Button>
                    ) : isCurrentTier ? (
                      <Button variant="outline" className="w-full" onClick={handleManageSubscription}>
                        Manage Plan
                      </Button>
                    ) : (
                      <Button 
                        className={cn(
                          "w-full",
                          isPro && "bg-primary hover:bg-primary/90",
                          isEnterprise && "bg-purple-600 hover:bg-purple-700"
                        )}
                        onClick={() => handleSubscribe(tierKey as "pro" | "enterprise")}
                        disabled={checkoutMutation.isPending}
                      >
                        {checkoutMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ArrowRight className="h-4 w-4 mr-2" />
                        )}
                        {currentTier === "free" ? "Upgrade" : "Switch"} to {tier.name}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Test Card Info */}
        <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center flex-shrink-0">
                <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">Test Mode</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  This is a test environment. Use card number <code className="bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 rounded font-mono">4242 4242 4242 4242</code> with any future expiry date and CVC to test payments.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We accept all major credit cards (Visa, Mastercard, American Express) through our secure Stripe payment processor.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Can I upgrade or downgrade?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Yes, you can change your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the change takes effect at the next billing cycle.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Do you offer refunds?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We offer a 14-day money-back guarantee for new subscriptions. Contact our support team if you're not satisfied.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
