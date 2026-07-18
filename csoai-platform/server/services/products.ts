/**
 * COAI Stripe Products Configuration
 * Defines subscription tiers and pricing for the platform
 */

export const SUBSCRIPTION_TIERS = {
  free: {
    name: "Free",
    description: "For individuals exploring AI compliance",
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      "1 AI System",
      "Basic compliance tracking",
      "Community support",
      "Public Watchdog reports",
      "Basic training modules",
    ],
    limits: {
      aiSystems: 1,
      apiCalls: 100,
      councilSessions: 5,
      pdcaCycles: 2,
      teamMembers: 1,
    },
  },
  pro: {
    name: "Pro",
    description: "For teams managing multiple AI systems",
    priceMonthly: 49,
    priceYearly: 490, // ~17% discount
    stripePriceIdMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "price_pro_monthly",
    stripePriceIdYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || "price_pro_yearly",
    features: [
      "10 AI Systems",
      "Multi-framework compliance (EU AI Act, NIST, TC260)",
      "Priority email support",
      "Advanced analytics dashboard",
      "PDF report generation",
      "API access (10,000 calls/month)",
      "Watchdog Analyst certification",
      "Unlimited PDCA cycles",
    ],
    limits: {
      aiSystems: 10,
      apiCalls: 10000,
      councilSessions: 100,
      pdcaCycles: -1, // unlimited
      teamMembers: 5,
    },
  },
  enterprise: {
    name: "Enterprise",
    description: "For organizations with advanced compliance needs",
    priceMonthly: 199,
    priceYearly: 1990, // ~17% discount
    stripePriceIdMonthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || "price_enterprise_monthly",
    stripePriceIdYearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || "price_enterprise_yearly",
    features: [
      "Unlimited AI Systems",
      "All compliance frameworks",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee (99.9% uptime)",
      "Unlimited API access",
      "White-label reports",
      "SSO/SAML authentication",
      "Custom training modules",
      "On-premise deployment option",
    ],
    limits: {
      aiSystems: -1, // unlimited
      apiCalls: -1, // unlimited
      councilSessions: -1, // unlimited
      pdcaCycles: -1, // unlimited
      teamMembers: -1, // unlimited
    },
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

export function getTierLimits(tier: SubscriptionTier) {
  return SUBSCRIPTION_TIERS[tier].limits;
}

export function canAccessFeature(tier: SubscriptionTier, feature: string): boolean {
  const tierFeatures = SUBSCRIPTION_TIERS[tier].features;
  return tierFeatures.some(f => f.toLowerCase().includes(feature.toLowerCase()));
}

export function isWithinLimit(tier: SubscriptionTier, resource: keyof typeof SUBSCRIPTION_TIERS.free.limits, current: number): boolean {
  const limit = SUBSCRIPTION_TIERS[tier].limits[resource];
  if (limit === -1) return true; // unlimited
  return current < limit;
}
