import type { Metadata } from 'next';
import { Shield, ArrowRight } from 'lucide-react';
import { vertical } from '@/lib/vertical';

export const metadata: Metadata = {
  title: `Verify — ${vertical.name}`,
  description: 'Verify koi pond recommendations and attestations on proofof.ai.',
};

export default function VerifyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Verify <span className="text-brand-400">Koi Guidance</span></h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Every diagnosis and recommendation is attested on proofof.ai for transparent, verifiable koi care.
        </p>
      </div>
      <div className="rounded-2xl bg-card border border-border p-8 text-center">
        <Shield className="w-12 h-12 text-brand-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-4">Attestation Engine</h2>
        <p className="text-muted-foreground mb-6">
          CSOAI-verified attestations for KoiKeeper.ai are published on proofof.ai. Upgrade to Premium for private vet-referral attestations.
        </p>
        <a href="/pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-opacity">
          View Plans
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
      <div className="mt-8 text-center">
        <a href="https://proofof.ai" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors">
          <Shield className="w-4 h-4" />
          View attestations on proofof.ai ↗
        </a>
      </div>
    </div>
  );
}
