import type { Metadata } from 'next';
import { Check, ArrowRight, Handshake } from 'lucide-react';
import { vertical } from '@/lib/vertical';

export const metadata: Metadata = {
  title: 'Partner Program',
  description: 'Become a KoiKeeper.ai partner. Commissions, co-branding and referral dashboards.',
  alternates: { canonical: `${vertical.domain}/partner` },
};

const benefits = [
  '20% recurring commission',
  'White-label pond reports',
  'Partner badge and listings',
  'Customer success playbooks',
];

export default function PartnerPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="md:flex md:gap-12">
        <div className="md:w-1/2">
          <div className="flex items-center gap-2 mb-4">
            <Handshake className="w-6 h-6 text-brand-400" />
            <span className="text-xs font-mono text-brand-400 uppercase tracking-wider">Partner Program</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">KoiKeeper Partner Program</h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Koi dealers, pond builders and aquatic vets offer clients premium water monitoring and care.
          </p>
          <ul className="mt-8 space-y-4">
            {benefits.map((b) => (
              <li key={b} className="flex items-center gap-3">
                <Check className="w-5 h-5 text-safety-500 flex-shrink-0" />
                <span className="text-foreground">{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:w-1/2 mt-10 md:mt-0">
          <div className="rounded-2xl border border-border bg-card p-8">
            <h2 className="text-2xl font-bold mb-6">Apply now</h2>
            <form
              action="mailto:hello@meok.ai?subject=KoiKeeper%20Partner%20application"
              method="post"
              encType="text/plain"
              className="space-y-5"
            >
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
                Website
                <input type="url" name="website" placeholder="https://example.com" required className="mt-1 block w-full rounded-lg bg-background border border-border px-4 py-3 focus:border-brand-500 focus:outline-none" />
              </label>
              <label className="block text-sm font-medium text-muted-foreground">
                Partner type
                <select name="type" className="mt-1 block w-full rounded-lg bg-background border border-border px-4 py-3 focus:border-brand-500 focus:outline-none">
                  <option>Referrer / Affiliate</option>
                  <option>Reseller</option>
                  <option>Integration partner</option>
                  <option>Hire yard / Supplier</option>
                </select>
              </label>
              <button type="submit" className="w-full gradient-brand text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                Apply to partner <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-xs text-muted-foreground">
                We will reply within one business day. No spam, no real charges until the flow is tested.
              </p>
            </form>
          </div>
        </div>
      </div>

      <section className="max-w-4xl mx-auto py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold">Ready to make KoiKeeper work for you?</h2>
        <p className="mt-4 text-muted-foreground">Start a free trial, request a demo, or apply to become a partner.</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/signup" className="gradient-brand text-white px-8 py-3 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity">Join partner program</a>
          <a href="/pricing" className="border border-border text-foreground px-8 py-3 rounded-xl font-semibold hover:border-brand-500/30 transition-colors">View pricing</a>
        </div>
      </section>
    </div>
  );
}
