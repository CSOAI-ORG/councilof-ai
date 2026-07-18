import type { Metadata } from 'next';
import { Shield, Check, ArrowRight } from 'lucide-react';
import { vertical } from '@/lib/vertical';

export const metadata: Metadata = {
  title: 'Enterprise',
  description: 'Enterprise procurement, fleet management and multi-site FishKeeper.ai deployment.',
};

const benefits = [
  'Multi-pond health dashboards',
  'IoT sensor integrations',
  'Vet-issued treatment records',
  'Compliance and welfare reports',
];

export default function EnterprisePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <Shield className="w-12 h-12 text-brand-400 mx-auto mb-4" />
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">FishKeeper for Enterprise</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Fish farms, aquaculture research centres and public aquariums monitor health at scale.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-12">
        {benefits.map((b) => (
          <div key={b} className="flex items-center gap-3 rounded-xl bg-card border border-border p-4">
            <Check className="w-5 h-5 text-safety-500 flex-shrink-0" />
            <span className="text-sm">{b}</span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-8 max-w-2xl mx-auto text-center">
        <h2 className="text-xl font-semibold mb-2">Request a demo</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Tell us about your sites and ponds. We will reply within one business day. No spam, no real
          charges until the flow is tested.
        </p>
        <a
          href="mailto:hello@meok.ai?subject=FishKeeper%20Enterprise%20demo%20request"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-opacity"
        >
          Request enterprise demo
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      <div className="text-center mt-12">
        <p className="text-muted-foreground mb-4">Ready to make {vertical.name} work for you?</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a href="/pricing" className="inline-flex items-center px-5 py-2.5 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-opacity">
            Get enterprise pricing
          </a>
          <a href="/partner" className="inline-flex items-center px-5 py-2.5 rounded-xl bg-background border border-border hover:border-brand-500/30 font-semibold transition-colors">
            View partner program
          </a>
        </div>
      </div>
    </div>
  );
}
