'use client';

import { Check, Building2, ArrowRight } from 'lucide-react';
import { vertical } from '@/lib/vertical';

const benefits = [
  'Multi-site fleet allocation',
  'Purchase-order and cost-code billing',
  'HSE-ready compliance pack',
  'SSO and dedicated support',
];

function mailtoSubmit(e: React.FormEvent<HTMLFormElement>) {
  const form = e.currentTarget;
  const data = new FormData(form);
  const email = String(data.get('email') ?? '');
  const body = Array.from(data.entries())
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  form.action = `mailto:hello@meok.ai?subject=${encodeURIComponent(
    `New Request demo submission from ${email}`
  )}&body=${encodeURIComponent(body)}`;
}

export default function EnterprisePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <section className="md:flex md:gap-12 md:items-start">
        <div className="md:w-1/2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-xs font-medium mb-4">
            <Building2 className="w-3 h-3" />
            Enterprise
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            {vertical.name} for Enterprise
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            National contractors and housebuilders manage labour, plant and waste
            through one procurement layer.
          </p>
          <ul className="mt-8 space-y-4">
            {benefits.map((b) => (
              <li key={b} className="flex gap-3 items-center">
                <Check className="w-4 h-4 text-safety-500 flex-shrink-0" />
                <span className="text-foreground">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:w-1/2 mt-10 md:mt-0">
          <div className="rounded-2xl bg-card border border-border p-8">
            <h2 className="text-2xl font-bold mb-6">Request a demo</h2>
            <form method="post" className="space-y-5" onSubmit={mailtoSubmit}>
              <label className="block text-sm font-medium text-muted-foreground">
                Full name
                <input type="text" name="name" placeholder="Your name" required
                  className="mt-1 block w-full rounded-lg bg-background border border-border px-4 py-3 focus:border-brand-500 focus:outline-none" />
              </label>
              <label className="block text-sm font-medium text-muted-foreground">
                Work email
                <input type="email" name="email" placeholder="you@company.com" required
                  className="mt-1 block w-full rounded-lg bg-background border border-border px-4 py-3 focus:border-brand-500 focus:outline-none" />
              </label>
              <label className="block text-sm font-medium text-muted-foreground">
                Company
                <input type="text" name="company" placeholder="Your company" required
                  className="mt-1 block w-full rounded-lg bg-background border border-border px-4 py-3 focus:border-brand-500 focus:outline-none" />
              </label>
              <label className="block text-sm font-medium text-muted-foreground">
                Number of sites
                <input type="text" name="sites" placeholder="e.g. 12" required
                  className="mt-1 block w-full rounded-lg bg-background border border-border px-4 py-3 focus:border-brand-500 focus:outline-none" />
              </label>
              <label className="block text-sm font-medium text-muted-foreground">
                What are you solving?
                <input type="text" name="details" placeholder="Tell us briefly" required
                  className="mt-1 block w-full rounded-lg bg-background border border-border px-4 py-3 focus:border-brand-500 focus:outline-none" />
              </label>
              <button type="submit"
                className="w-full py-3 rounded-xl font-semibold gradient-brand text-white hover:opacity-90 transition-opacity">
                Request demo
              </button>
              <p className="text-xs text-muted-foreground">
                We will reply within one business day. No spam, no real charges until the flow is tested.
              </p>
            </form>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-bold">Ready to make {vertical.name} work for you?</h2>
        <p className="mt-4 text-muted-foreground">
          Start a free trial, request a demo, or apply to become a partner.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/signup" className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-opacity">
            Get enterprise pricing
            <ArrowRight className="w-4 h-4" />
          </a>
          <a href="/partner" className="inline-flex items-center justify-center px-8 py-3 rounded-xl border border-border font-semibold hover:border-brand-500/30 transition-colors">
            View partner program
          </a>
        </div>
      </section>
    </div>
  );
}
