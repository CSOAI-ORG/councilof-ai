import type { Metadata } from 'next';
import { Shield, Check, Wrench } from 'lucide-react';
import { vertical } from '@/lib/vertical';

export const metadata: Metadata = { title: `Agent Catalogue — ${vertical.name}`, description: 'Discover, verify, and deploy pre-audited AI governance agents for plant and equipment hire.' };

const agents = [
  { name: 'Operator Competence Agent', desc: 'Verify CPCS, NPORS, and HSE cards before operators start work.', cat: 'Compliance' },
  { name: 'Maintenance Scheduling Agent', desc: 'Track LOLER, PUWER, and routine servicing with automated reminders.', cat: 'Safety' },
  { name: 'Hire Contract Compliance Agent', desc: 'Validate hire notes, rates, and conditions against CSOAI governance.', cat: 'Governance' },
  { name: 'Equipment Search Agent', desc: 'Search plant catalog by type, capacity, or keyword with live rates.', cat: 'Operations' },
  { name: 'Rental Quote Agent', desc: 'Calculate hire pricing including delivery and collection costs.', cat: 'Finance' },
  { name: 'Transport Estimator Agent', desc: 'Estimate delivery and collection costs from site postcode and dimensions.', cat: 'Logistics' },
];

export default function CataloguePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Agent <span className="text-brand-400">Catalogue</span></h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">Pre-audited AI agents for plant-hire compliance, safety, and operations. Deploy with confidence.</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div key={agent.name} className="rounded-xl bg-card border border-border p-6 hover:border-brand-500/30 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              {agent.cat === 'Operations' ? <Wrench className="w-4 h-4 text-brand-400" /> : <Shield className="w-4 h-4 text-brand-400" />}
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
