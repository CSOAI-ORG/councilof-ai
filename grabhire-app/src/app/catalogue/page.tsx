import type { Metadata } from 'next';
import { Brain, Shield, Check } from 'lucide-react';

export const metadata: Metadata = { title: 'Agent Catalogue — CouncilOf.AI', description: 'Discover, verify, and deploy pre-audited AI governance agents.' };

export default function CataloguePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Agent <span className="text-brand-400">Catalogue</span></h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">Pre-audited AI governance agents with cryptographic proof of compliance. Deploy with confidence.</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: 'Risk Assessment Agent', desc: 'AI risk assessment for EU AI Act compliance.', cat: 'Compliance' },
          { name: 'Bias Detection Agent', desc: 'Detect and mitigate algorithmic bias across model outputs.', cat: 'Safety' },
          { name: 'GDPR Compliance Agent', desc: 'Automated data privacy compliance for AI systems.', cat: 'Privacy' },
          { name: 'Audit Trail Agent', desc: 'Immutable compliance records with cryptographic signatures.', cat: 'Compliance' },
          { name: 'Verification Agent', desc: 'Multi-AI consensus verification for model outputs.', cat: 'Verification' },
          { name: 'Regulatory Monitor', desc: 'Real-time monitoring of regulatory changes globally.', cat: 'Monitoring' },
        ].map((agent) => (
          <div key={agent.name} className="rounded-xl bg-card border border-border p-6 hover:border-brand-500/30 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-brand-400" />
              <span className="text-xs font-mono text-brand-400 uppercase">{agent.cat}</span>
            </div>
            <h3 className="font-semibold mb-2">{agent.name}</h3>
            <p className="text-sm text-muted-foreground">{agent.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
