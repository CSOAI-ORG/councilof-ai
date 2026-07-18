export const PRICING_TIERS = {
  wasteTracker: {
    name: 'Waste Tracker',
    price: 37,
    priceId: 'price_1ShNd6LToiah1qKAEA8Xjej4',
    productId: 'prod_Teh1CyLBjr21oJ',
    currency: 'GBP',
    interval: 'month',
    popular: false,
    uploadsIncluded: 3,
    description: 'Perfect for small operators with up to 3 vehicles',
    features: [
      'Up to 3 vehicles',
      'Up to 20 jobs/month',
      '10 AI spoil classifications/month',
      'Manual WTN creation (templates)',
      'Compliance calendar',
      'Basic reporting',
      'Email support',
      'Mobile app access',
    ],
    limits: {
      jobs: 20,
      aiRequests: 10,
      vehicles: 3,
    },
  },
  aiClassifier: {
    name: 'AI Classifier',
    price: 149,
    priceId: 'price_1ShNd8LToiah1qKAVk20nUe5',
    productId: 'prod_Teh1wGYprBRbuz',
    currency: 'GBP',
    interval: 'month',
    popular: true,
    uploadsIncluded: -1, // unlimited
    description: 'Ideal for growing fleets with up to 10 vehicles',
    features: [
      'Up to 10 vehicles',
      'Up to 100 jobs/month',
      'Unlimited AI spoil classification',
      'Auto EWC code assignment',
      'Digital WTN generation',
      'Mobile app (offline mode)',
      'GPS job tracking',
      'Photo documentation',
      'Recycling reports',
      'Fleet management',
      'Priority support',
    ],
    limits: {
      jobs: 100,
      aiRequests: -1,
      vehicles: 10,
    },
  },
  enterpriseWaste: {
    name: 'Enterprise Waste',
    price: 499,
    priceId: 'price_1ShNdALToiah1qKAWUPrBnqw',
    productId: 'prod_Teh17gF9C1eYPN',
    currency: 'GBP',
    interval: 'month',
    popular: false,
    uploadsIncluded: -1, // unlimited
    description: 'For large operations with unlimited vehicles',
    features: [
      'Unlimited vehicles',
      'Unlimited jobs',
      'Unlimited AI classification',
      'Custom API integrations',
      'Multi-region support',
      'Dedicated account manager',
      'Advanced analytics',
      'On-site waste audits',
      'Insurance verification',
      'White-label options',
      '24/7 phone support',
      'Custom compliance templates',
    ],
    limits: {
      jobs: -1, // unlimited
      aiRequests: -1,
      vehicles: -1,
    },
  },
  // Legacy tiers for backwards compatibility
  starter: {
    name: 'Starter',
    price: 29,
    priceId: 'price_1SeSfOLToiah1qKAsTWUwQ17',
    productId: 'prod_Tbg13upR7KugoM',
    currency: 'GBP',
    interval: 'month',
    popular: false,
    uploadsIncluded: 5,
    description: 'Legacy plan',
    features: [
      '5 jobs per month',
      'Basic AI classification',
      'Standard compliance documents',
      'Email support',
      'Mobile app access',
    ],
    limits: {
      jobs: 5,
      aiRequests: 50,
      vehicles: 2,
    },
  },
  professional: {
    name: 'Professional',
    price: 79,
    priceId: 'price_1SeSfQLToiah1qKAFumMVrNJ',
    productId: 'prod_Tbg1ZwRghdmIbV',
    currency: 'GBP',
    interval: 'month',
    popular: false,
    uploadsIncluded: -1,
    description: 'Legacy plan',
    features: [
      '25 jobs per month',
      'Advanced AI tools',
      'Voice commands',
      'Fleet management',
      'Predictive maintenance',
      'Priority support',
      'Real-time tracking',
    ],
    limits: {
      jobs: 25,
      aiRequests: 500,
      vehicles: 10,
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: 199,
    priceId: 'price_1SDHvVLToiah1qKA5PToeR8x',
    productId: 'prod_T9b7xxYxnK47AS',
    currency: 'GBP',
    interval: 'month',
    popular: false,
    uploadsIncluded: -1,
    description: 'Legacy plan',
    features: [
      'Unlimited jobs',
      'White-label options',
      'API access',
      'Dedicated account manager',
      'Custom integrations',
      '24/7 phone support',
      'Custom compliance templates',
      'Advanced analytics',
    ],
    limits: {
      jobs: -1,
      aiRequests: -1,
      vehicles: -1,
    },
  },
} as const;

export type PricingTier = keyof typeof PRICING_TIERS;

// New tier keys for the updated pricing ecosystem
export const NEW_TIER_KEYS = ['wasteTracker', 'aiClassifier', 'enterpriseWaste'] as const;
export type NewPricingTier = typeof NEW_TIER_KEYS[number];

export const getProductIdFromTier = (tier: PricingTier) => {
  return PRICING_TIERS[tier].productId;
};

export const getPriceIdFromTier = (tier: PricingTier) => {
  return PRICING_TIERS[tier].priceId;
};

// Helper to get new pricing tiers only (for main pricing display)
export const getNewTiers = () => {
  return NEW_TIER_KEYS.map(key => ({ key, ...PRICING_TIERS[key] }));
};

// Helper to get monthly tiers only (for main pricing display)
export const getMonthlyTiers = () => {
  return Object.entries(PRICING_TIERS).filter(([_, tier]) => tier.interval === 'month');
};


// Helper to get tier by product ID
export const getTierByProductId = (productId: string) => {
  return Object.entries(PRICING_TIERS).find(([_, tier]) => tier.productId === productId);
};

// Material density map for waste volume calculations (tonnes per m³)
export const MATERIAL_DENSITIES = {
  topsoil: 1.4,
  clay: 1.8,
  sand: 1.6,
  gravel: 1.8,
  chalk: 1.4,
  hardcore: 1.9,
  concrete: 2.4,
  mixed_spoil: 1.6,
  peat: 0.8,
  subsoil: 1.5,
} as const;

export type MaterialType = keyof typeof MATERIAL_DENSITIES;

// Competitor pricing for ROI calculator
export const COMPETITOR_PRICING = {
  biffa: { perLoad: 250, name: 'Biffa' },
  veolia: { perLoad: 280, name: 'Veolia' },
  skipHire: { perLoad: 275, name: 'Skip Hire (avg)' },
  local: { perLoad: 215, name: 'Local Firms (avg)' },
} as const;
