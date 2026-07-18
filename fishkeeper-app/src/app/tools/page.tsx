import { Wrench, Droplets, Stethoscope, Fish } from 'lucide-react';
import { vertical } from '@/lib/vertical';

export default function ToolsPage() {
  const tools = [
    {
      icon: Stethoscope,
      name: 'Disease Diagnosis',
      desc: 'Describe symptoms or upload a photo and get AI-powered disease identification with treatment steps.',
    },
    {
      icon: Droplets,
      name: 'Water Parameter Analysis',
      desc: 'Input ammonia, nitrite, nitrate, pH, GH, KH and temperature readings for instant safety feedback.',
    },
    {
      icon: Fish,
      name: 'Stocking & Compatibility',
      desc: 'Check species temperament, tank size and water requirements before adding new fish.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <Wrench className="w-12 h-12 text-brand-400 mx-auto mb-4" />
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">{vertical.name} MCP Tools</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          FishKeeper.ai exposes a CSOAI-verified MCP server with aquarium-focused tools. Connect them to any SOV3 agent or use them directly below.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {tools.map((tool) => (
          <div
            key={tool.name}
            className="rounded-xl bg-card border border-border p-6 hover:border-brand-500/30 transition-colors text-center"
          >
            <tool.icon className="w-8 h-8 text-brand-400 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">{tool.name}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{tool.desc}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-muted-foreground mb-6">
          Ready to unlock unlimited tool calls and API access?
        </p>
        <a
          href="/pricing"
          className="inline-flex items-center px-6 py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-opacity"
        >
          View Pricing
        </a>
      </div>
    </div>
  );
}
