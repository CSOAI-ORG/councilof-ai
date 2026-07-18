import type { Metadata } from 'next';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Start your FishKeeper account — pick a plan and check out in 30 seconds via Stripe.',
};

const plans = [
  {
    name: 'Sovereign',
    price: '£29/mo',
    description: 'Day-rate tier for hobbyists and single-site keepers.',
    href: 'https://buy.stripe.com/9B67sNeoIcMObEx56o8k91S',
    highlighted: true,
  },
  {
    name: 'Pro',
    price: '£199/mo',
    description: 'Site team tier with full MCP and API access.',
    href: 'https://buy.stripe.com/eVq14p1BWcMO4c59mE8k91T',
    highlighted: false,
  },
];

export default function SignupPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <Sparkles className="w-12 h-12 text-brand-400 mx-auto mb-4" />
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Start your FishKeeper account</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Get started with a 30-second Stripe checkout. No real charges until the flow is tested.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl border p-8 transition-all ${plan.highlighted ? 'border-brand-500 bg-brand-500/5 shadow-lg shadow-brand-500/10' : 'border-border bg-card hover:border-brand-500/30'}`}
          >
            {plan.highlighted && (
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-xs font-medium mb-4">
                <Zap className="w-3 h-3" />Most Popular
              </div>
            )}
            <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
            <div className="text-3xl font-bold mb-3">{plan.price}</div>
            <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
            <a
              href={plan.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-opacity ${plan.highlighted ? 'gradient-brand text-white hover:opacity-90' : 'bg-background border border-border hover:border-brand-500/30'}`}
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-muted-foreground">
          Need an Enterprise demo or want to see every plan?{' '}
          <a href="/pricing" className="text-brand-400 hover:text-brand-300">See all plans</a>
          {' · '}
          <a href="/connect/mcp" className="text-brand-400 hover:text-brand-300">Connect via MCP</a>
        </p>
      </div>
    </div>
  );
}
