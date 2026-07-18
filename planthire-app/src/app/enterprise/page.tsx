'use client';

import { Check, Building2, ArrowRight } from 'lucide-react';
import { vertical } from '@/lib/vertical';

const BENEFITS = [
  'National machine allocation',
  'Programme-level scheduling',
  'Hire-vs-buy analytics',
  'SSO, approvals and reporting',
];

export default function EnterprisePage() {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const data = new FormData(form);
    const email = String(data.get('email') || '');
    const body = Array.from(data.entries())
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    form.action = `mailto:hello@meok.ai?subject=${encodeURIComponent(
      'New Request demo submission from ' + email,
    )}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="md:flex md:gap-12">
        <div className="md:w-1/2">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-6 h-6 text-brand-400" />
            <span className="text-xs font-mono text-brand-400 uppercase tracking-wider">Enterprise</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">PlantHire for Enterprise</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Contractors and developers source plant across multiple sites with one account and consolidated billing.
          </p>
          <ul className="space-y-4">
            {BENEFITS.map((b) => (
              <li key={b} className="flex gap-3 items-center">
                <Check className="w-5 h-5 text-safety-500 flex-shrink-0" />
                <span className="text-foreground">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:w-1/2 mt-10 md:mt-0">
          <div className="rounded-2xl border border-border bg-card p-8">
            <h2 className="text-2xl font-bold mb-6">Request a demo</h2>
            <form onSubmit={handleSubmit} method="post" className="space-y-5">
              <label className="block text-sm font-medium text-muted-foreground">
                Full name
                <input type="text" name="name" placeholder="Your name" required className="mt-1 block w-full rounded-lg bg-background border border-border px-4 py-3 focus:border-brand-500 focus:outline-none" />
              </label>
              <label className="block text-sm font-medium text-muted-foreground">
                Work email
                <input type="email" name="email" placeholder="you@company.com" required className="mt-1 block w-full rounded-lg bg-background border border-border px-4 py-3 focus:border-brand-500 focus:outline-none" />
              </label>
              <label className="block text-sm font-medium text-muted-foreground">
                Company
                <input type="text" name="company" placeholder="Your company" required className="mt-1 block w-full rounded-lg bg-background border border-border px-4 py-3 focus:border-brand-500 focus:outline-none" />
              </label>
              <label className="block text-sm font-medium text-muted-foreground">
                Number of sites
                <input type="text" name="sites" placeholder="e.g. 12" required className="mt-1 block w-full rounded-lg bg-background border border-border px-4 py-3 focus:border-brand-500 focus:outline-none" />
              </label>
              <label className="block text-sm font-medium text-muted-foreground">
                What are you solving?
                <input type="text" name="details" placeholder="Tell us briefly" required className="mt-1 block w-full rounded-lg bg-background border border-border px-4 py-3 focus:border-brand-500 focus:outline-none" />
              </label>
              <button type="submit" className="w-full gradient-brand text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity">
                Request demo
              </button>
              <p className="text-xs text-muted-foreground">We will reply within one business day. No spam.</p>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto text-center py-16 mt-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to make {vertical.name} work for you?</h2>
        <p className="text-muted-foreground mb-8">Start a free trial, request a demo, or apply to become a partner.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/signup" className="inline-flex items-center justify-center gap-2 gradient-brand text-white px-8 py-3 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity">
            Get enterprise pricing <ArrowRight className="w-4 h-4" />
          </a>
          <a href="/partner" className="inline-flex items-center justify-center border border-border px-8 py-3 rounded-xl font-semibold hover:border-brand-500/30 transition-colors">
            View partner program
          </a>
        </div>
      </div>
    </div>
  );
}
