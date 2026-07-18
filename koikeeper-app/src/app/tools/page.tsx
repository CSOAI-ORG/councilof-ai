import { Fish, Droplet, Thermometer, ShieldCheck, Snowflake, Search, Check } from 'lucide-react';
import { vertical } from '@/lib/vertical';

const tools = [
  {
    icon: Fish,
    title: 'Identify Koi',
    desc: 'Look up koi by variety — Kohaku, Sanke, Showa, Tancho, Asagi, Shusui, Utsurimono, and more.',
    included: ['Free', 'Pro', 'Premium'],
  },
  {
    icon: Droplet,
    title: 'Pond Stocking',
    desc: 'Calculate safe stocking levels using the 1000 L per adult koi rule, adjusted for filtration and aeration.',
    included: ['Pro', 'Premium'],
  },
  {
    icon: Thermometer,
    title: 'Seasonal Feeding',
    desc: 'Temperature-gated feed schedule: wheatgerm at 8-14°C, growth at 14-20°C, no food below 4°C.',
    included: ['Pro', 'Premium'],
  },
  {
    icon: ShieldCheck,
    title: 'Disease Diagnosis',
    desc: 'Diagnose by symptoms and temperature. Flags KHV as notifiable and provides CEFAS contact guidance.',
    included: ['Pro', 'Premium'],
  },
  {
    icon: Snowflake,
    title: 'Winter Prep Checklist',
    desc: 'September → February UK winter-prep checklist covering netting, aeration, and salt overwinter.',
    included: ['Premium'],
  },
  {
    icon: Search,
    title: 'Variety Catalogue',
    desc: 'Browse the full supported variety list with group classification and identifying traits.',
    included: ['Free', 'Pro', 'Premium'],
  },
];

export default function ToolsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          {vertical.name.split('.')[0]} <span className="text-brand-400">Tools</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          MCP-powered koi pond tools. Verify every recommendation on{' '}
          <a href="https://proofof.ai" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300">
            proofof.ai
          </a>.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <div key={tool.title} className="rounded-2xl border border-border bg-card p-6 hover:border-brand-500/30 transition-colors">
            <tool.icon className="w-10 h-10 text-brand-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">{tool.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{tool.desc}</p>
            <div className="flex flex-wrap gap-2">
              {tool.included.map((tier) => (
                <span key={tier} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-safety-500/10 text-safety-400 text-xs font-medium">
                  <Check className="w-3 h-3" />
                  {tier}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <a href="https://mcp.market/server/meok-koikeeper-ai-mcp" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-opacity">
          Get the MCP Server
        </a>
      </div>
    </div>
  );
}
