'use client';

import { useState } from 'react';
import { Check, Zap, Crown, ArrowRight, Shield } from 'lucide-react';
import { vertical } from '@/lib/vertical';

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(tier: (typeof vertical.pricing)[number]) {
    if (!tier.checkoutUrl) {
      window.location.href = `mailto:sales@csoai.org?subject=${encodeURIComponent(tier.name + ' inquiry — ' + vertical.name)}`;
      return;
    }
    if (tier.checkoutUrl.startsWith('http')) {
      window.open(tier.checkoutUrl, '_blank');
      return;
    }
    setLoading(tier.name);
    try {
      const res = await fetch('/api/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: tier.checkoutUrl, tier: tier.name }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert('Checkout unavailable');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="w-6 h-6 text-brand-400" />
          <span className="text-xs font-mono text-brand-400 uppercase tracking-wider">Simple Pricing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          {vertical.name} <span className="text-brand-400">Pricing</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Choose the plan that fits your needs. All plans include CSOAI governance and proofof.ai attestation.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {vertical.pricing.map((tier) => (
          <div key={tier.name} className={`rounded-2xl border p-8 transition-all ${tier.highlighted ? 'border-brand-500 bg-brand-500/5 shadow-lg shadow-brand-500/10' : 'border-border bg-card hover:border-brand-500/30'}`}>
            {tier.highlighted && (
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-xs font-medium mb-4">
                <Zap className="w-3 h-3" />Most Popular
              </div>
            )}
            <div className="flex items-center gap-2 mb-4">
              {tier.name === 'Enterprise' ? <Crown className="w-5 h-5 text-brand-400" /> : <Shield className="w-5 h-5 text-brand-400" />}
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
            <button onClick={() => handleCheckout(tier)} disabled={loading === tier.name} className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-opacity ${tier.highlighted ? 'gradient-brand text-white hover:opacity-90' : 'bg-background border border-border hover:border-brand-500/30'}`}>
              {loading === tier.name ? '...' : tier.checkoutUrl ? 'Subscribe Now' : 'Contact Sales'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
