'use client';

import { Check, Zap, Building2, Crown, ArrowRight, Shield, AlertTriangle, XCircle, Scale } from 'lucide-react';

const PRICING_TIERS = [
  {
    name: 'Verification & Metrology',
    price: 'Free',
    period: 'forever',
    description: 'We do not sell grades. Checking a cryptographic card is always free.',
    features: [
      { text: 'Live GET /api/gspc', included: true },
      { text: 'Client-side signature verification', included: true },
      { text: 'Council Space spectator access', included: true },
      { text: 'No account required', included: true },
      { text: 'Guaranteed cryptographic audit trails', included: true }
    ],
    cta: 'Verify a Card',
    highlighted: false,
    checkoutUrl: '/verify',
  },
  {
    name: 'Pro',
    price: '£79',
    period: 'per month',
    description: 'For mid-market AI companies needing continuous assessment.',
    features: [
      { text: 'Continuous automated sweeps', included: true },
      { text: 'Multi-agent consensus probing', included: true },
      { text: 'EU AI Act / NIST RMF mapping', included: true },
      { text: 'Signed 3KB Evidence Cards', included: true },
      { text: 'Audit-ready compliance PDFs', included: true },
      { text: 'Automated remediation engine', included: false },
    ],
    cta: 'Subscribe Now',
    highlighted: true,
    checkoutUrl: 'https://buy.stripe.com/14A4gBbcw28a7oh8iA8k918',
  },
  {
    name: 'Enterprise',
    price: '£499',
    period: 'per month',
    description: 'For heavily regulated (DORA/NIS2) Sovereign deployments.',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Auto-Remediation Engine (Code/Guardrails)', included: true },
      { text: 'Private RunPod A100 Telemetry', included: true },
      { text: 'On-premise / VPC Deployment', included: true },
      { text: 'Enterprise SSO (SAML/OIDC)', included: true },
      { text: 'Dedicated Account Manager', included: true },
    ],
    cta: 'Contact Sales',
    highlighted: false,
    checkoutUrl: 'mailto:sales@councilof.ai',
  },
];

export default function PricingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-black mb-6">Measurement, not certification.</h1>
        <p className="text-xl text-muted-foreground">
          Nobody on the board pays for their place on it, their score, or their removal from either. Verification is free forever and needs no account.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-24">
        {PRICING_TIERS.map((tier) => (
          <div 
            key={tier.name}
            className={`relative rounded-3xl border p-8 flex flex-col ${
              tier.highlighted 
                ? 'bg-card/80 backdrop-blur-xl border-brand-500 shadow-2xl shadow-brand-500/10 scale-105' 
                : 'bg-card/50 backdrop-blur border-border/50 hover:border-brand-500/30'
            }`}
          >
            {tier.highlighted && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full gradient-brand text-white text-xs font-bold tracking-wider uppercase">
                Most Popular
              </div>
            )}
            
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-black">{tier.price}</span>
                <span className="text-muted-foreground text-sm">{tier.period}</span>
              </div>
              <p className="text-sm text-muted-foreground">{tier.description}</p>
            </div>

            <div className="flex-1 space-y-4 mb-8">
              {tier.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  {feature.included ? (
                    <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : (
                    <div className="w-5 h-5 border border-border/50 rounded-full shrink-0" />
                  )}
                  <span className={`text-sm ${feature.included ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>

            <a 
              href={tier.checkoutUrl}
              className={`w-full py-4 rounded-xl font-bold text-center transition-all ${
                tier.highlighted
                  ? 'gradient-brand text-white hover:shadow-lg hover:shadow-brand-500/25'
                  : 'bg-background border border-border hover:border-brand-500/50 text-foreground'
              }`}
            >
              {tier.cta}
            </a>
          </div>
        ))}
      </div>

      <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-12 max-w-4xl mx-auto relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Scale className="w-48 h-48 text-red-500" />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-8 text-foreground flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-500" /> What We Refuse To Do
          </h2>
          <div className="grid sm:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-red-400 mb-2">We do not certify</h3>
              <p className="text-sm text-muted-foreground">No conformity mark, no badge, no seal, no accreditation chain. We are not a notified body under the EU AI Act.</p>
            </div>
            <div>
              <h3 className="font-bold text-red-400 mb-2">We do not sell a grade</h3>
              <p className="text-sm text-muted-foreground">Nobody pays for their place on the board. Verification is free forever and needs no account.</p>
            </div>
            <div>
              <h3 className="font-bold text-red-400 mb-2">We do not publish unmeasured numbers</h3>
              <p className="text-sm text-muted-foreground">UNMEASURED is a first-class state. An empty cell stays empty—inventing one is what we exist to catch.</p>
            </div>
            <div>
              <h3 className="font-bold text-red-400 mb-2">We do not let a model judge a model</h3>
              <p className="text-sm text-muted-foreground">Every verdict is deterministic code against pre-written gold labels. An AI grading an AI is a correlated error, not an audit.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
