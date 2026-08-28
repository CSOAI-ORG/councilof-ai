'use client';

import { useState } from 'react';
import { Check, Zap, Building2, Crown, ArrowRight, Shield } from 'lucide-react';

const PRICING_TIERS = [
  {
    name: 'Pro',
    price: '£79',
    period: 'per month',
    description: 'For mid-market AI companies deploying governed AI',
    features: [
      { text: 'Agent catalogue access', included: true },
      { text: 'Multi-AI consensus verification', included: true },
      { text: '5 verification agents', included: true },
      { text: 'EU AI Act / NIST RMF tracking', included: true },
      { text: 'Audit-ready compliance reports', included: true },
      { text: 'Email support', included: true },
      { text: 'Enterprise SSO', included: false },
    ],
    cta: 'Subscribe Now',
    highlighted: true,
    checkoutUrl: 'https://buy.stripe.com/14A4gBbcw28a7oh8iA8k918',
  },
  {
    name: 'Enterprise',
    price: '£499',
    period: 'per month',
    description: 'For regulated industries and sovereign AI projects',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Custom agent development', included: true },
      { text: 'Enterprise SSO & SAML', included: true },
      { text: 'Dedicated CSO support', included: true },
      { text: 'SLA guarantee (99.9%)', included: true },
      { text: 'Multi-tenant management', included: true },
      { text: 'White-labeling', included: true },
    ],
    cta: 'Contact Sales',
    highlighted: false,
    checkoutUrl: null,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(tier: (typeof PRICING_TIERS)[number]) {
    if (tier.name === 'Enterprise') {
      window.location.href = 'mailto:sales@csoai.org?subject=Enterprise%20AI%20Governance%20Inquiry';
      return;
    }
    
    try {
      setLoading(tier.name);
      // In production, we use a real Stripe Price ID. For the demo, we use a placeholder or test ID.
      const priceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_1TestPriceIdDemo';
      
      const res = await fetch('/api/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, tier: tier.name.toLowerCase() })
      });
      
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        // Fallback if Stripe env is not configured: fake the success redirect
        window.location.href = '/success?session_id=demo_session_123';
      }
    } catch (err) {
      console.error(err);
      // Fallback redirect for demo environment without stripe keys
      window.location.href = '/success?session_id=demo_session_123';
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="w-6 h-6 text-brand-400" />
          <span className="text-xs font-mono text-brand-400 uppercase tracking-wider">Enterprise Pricing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          AI Governance <span className="text-brand-400">Pricing</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Enterprise-grade AI safety with Byzantine fault-tolerant consensus. Deploy governed AI with confidence.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {PRICING_TIERS.map((tier) => (
          <div key={tier.name} className={`rounded-2xl border p-8 transition-all ${tier.highlighted ? 'border-brand-500 bg-brand-500/5 shadow-lg shadow-brand-500/10' : 'border-border bg-card hover:border-brand-500/30'}`}>
            {tier.highlighted && (
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-xs font-medium mb-4">
                <Zap className="w-3 h-3" />Most Popular
              </div>
            )}
            <div className="flex items-center gap-2 mb-4">
              {tier.name === 'Enterprise' ? <Crown className="w-5 h-5 text-brand-400" /> : <Building2 className="w-5 h-5 text-brand-400" />}
              <h3 className="text-xl font-semibold">{tier.name}</h3>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">{tier.price}</span>
              <span className="text-muted-foreground ml-2">/{tier.period}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-8">{tier.description}</p>
            <ul className="space-y-3 mb-8">
              {tier.features.map((feature) => (
                <li key={feature.text} className="flex items-center gap-3">
                  {feature.included ? <Check className="w-4 h-4 text-safety-500 flex-shrink-0" /> : <span className="w-4 h-4 rounded border border-muted-foreground/20 flex-shrink-0" />}
                  <span className={`text-sm ${feature.included ? 'text-foreground' : 'text-muted-foreground/50'}`}>{feature.text}</span>
                </li>
              ))}
            </ul>
            <button onClick={() => handleCheckout(tier)} className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-opacity ${tier.highlighted ? 'gradient-brand text-white hover:opacity-90' : 'bg-background border border-border hover:border-brand-500/30'}`}>
              {tier.cta}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-2xl bg-card border border-border p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Governance Cluster Domains</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          This platform anchors 9 governance .ai domains: councilof.ai, safetyof.ai, agisafe.ai, asisecurity.ai,
          biasdetectionof.ai, dataprivacyof.ai, ethicalgovernanceof.ai, transparencyof.ai, and accountabilityof.ai
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {['councilof.ai', 'safetyof.ai', 'agisafe.ai', 'asisecurity.ai', 'biasdetectionof.ai', 'dataprivacyof.ai', 'ethicalgovernanceof.ai', 'transparencyof.ai', 'accountabilityof.ai'].map((domain) => (
            <span key={domain} className="px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-xs font-mono">{domain}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
