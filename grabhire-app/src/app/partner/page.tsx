'use client';

import { Check, Handshake, ArrowRight } from 'lucide-react';
import { vertical } from '@/lib/vertical';

const benefits = [
  '10–15% commission on referred hires',
  'Co-branded booking portal',
  'Real-time job tracking dashboard',
  'Monthly BACS payouts',
];

function mailtoSubmit(e: React.FormEvent<HTMLFormElement>) {
  const form = e.currentTarget;
  const data = new FormData(form);
  const email = String(data.get('email') ?? '');
  const body = Array.from(data.entries())
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  form.action = `mailto:hello@meok.ai?subject=${encodeURIComponent(
    `New Apply to partner submission from ${email}`
  )}&body=${encodeURIComponent(body)}`;
}

export default function PartnerPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <section className="md:flex md:gap-12 md:items-start">
        <div className="md:w-1/2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-xs font-medium mb-4">
            <Handshake className="w-3 h-3" />
            Partner Program
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            Partner with {vertical.name}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Plant-hire brokers, groundworkers and construction resellers earn recurring
            commission by referring jobs.
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
            <h2 className="text-2xl font-bold mb-6">Apply now</h2>
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
                Website
                <input type="url" name="website" placeholder="https://example.com" required
                  className="mt-1 block w-full rounded-lg bg-background border border-border px-4 py-3 focus:border-brand-500 focus:outline-none" />
              </label>
              <label className="block text-sm font-medium text-muted-foreground">
                Partner type
                <select name="type"
                  className="mt-1 block w-full rounded-lg bg-background border border-border px-4 py-3 focus:border-brand-500 focus:outline-none">
                  <option>Referrer / Affiliate</option>
                  <option>Reseller</option>
                  <option>Integration partner</option>
                  <option>Hire yard / Supplier</option>
                </select>
              </label>
              <button type="submit"
                className="w-full py-3 rounded-xl font-semibold gradient-brand text-white hover:opacity-90 transition-opacity">
                Apply to partner
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
            Join partner program
            <ArrowRight className="w-4 h-4" />
          </a>
          <a href="/pricing" className="inline-flex items-center justify-center px-8 py-3 rounded-xl border border-border font-semibold hover:border-brand-500/30 transition-colors">
            View pricing
          </a>
        </div>
      </section>
    </div>
  );
}
