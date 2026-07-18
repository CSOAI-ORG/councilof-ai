import type { Metadata } from 'next';
import { Fish, Droplet, Thermometer, ShieldCheck, Snowflake, Search } from 'lucide-react';
import { vertical } from '@/lib/vertical';

export const metadata: Metadata = {
  title: `Agent Catalogue — ${vertical.name}`,
  description: 'MCP-powered koi pond agents: identification, stocking, feeding, disease diagnosis, and winter prep.',
};

const agents = [
  { name: 'Identify Koi', desc: 'Look up koi by variety name or physical description.', cat: 'Identification', icon: Fish },
  { name: 'Pond Stocking', desc: 'Calculate safe stocking levels based on volume, filtration, and aeration.', cat: 'Planning', icon: Droplet },
  { name: 'Seasonal Feeding', desc: 'Temperature-gated feeding schedule for every season.', cat: 'Nutrition', icon: Thermometer },
  { name: 'Disease Diagnosis', desc: 'Diagnose symptoms and flag notifiable diseases like KHV.', cat: 'Health', icon: ShieldCheck },
  { name: 'Winter Prep', desc: 'September → February checklist for safe overwintering.', cat: 'Seasonal', icon: Snowflake },
  { name: 'Variety Catalogue', desc: 'Full supported variety list with group classification.', cat: 'Reference', icon: Search },
];

export default function CataloguePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Koi <span className="text-brand-400">Agent Catalogue</span></h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          MCP-powered koi pond agents. Every tool is attested and verified by CSOAI.
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div key={agent.name} className="rounded-xl bg-card border border-border p-6 hover:border-brand-500/30 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <agent.icon className="w-4 h-4 text-brand-400" />
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
