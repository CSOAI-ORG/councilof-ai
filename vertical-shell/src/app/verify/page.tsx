import type { Metadata } from 'next';
import { Shield, ArrowRight } from 'lucide-react';

export const metadata: Metadata = { title: 'Verify — CouncilOf.AI', description: 'Submit AI models for multi-AI consensus verification.' };

export default function VerifyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Verify <span className="text-brand-400">AI Models</span></h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">Submit your AI model for multi-AI consensus verification. Receive cryptographic proof of safety and compliance.</p>
      </div>
      <div className="rounded-2xl bg-card border border-border p-8 text-center">
        <Shield className="w-12 h-12 text-brand-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-4">Coming Soon</h2>
        <p className="text-muted-foreground mb-6">The verification engine is being finalised. Join the waitlist for early access.</p>
        <a href="/pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-opacity">
          View Plans
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
      <div className="mt-8 text-center">
        <a href="https://proofof.ai" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors">
          <Shield className="w-4 h-4" />
          Attestations published on proofof.ai ↗
        </a>
      </div>
    </div>
  );
}
