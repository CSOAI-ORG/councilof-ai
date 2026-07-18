import { Wrench, Shield, ClipboardCheck, Truck, FileText } from 'lucide-react';
import { vertical } from '@/lib/vertical';

export default function ToolsPage() {
  const tools = [
    {
      name: 'Waste Carrier Registration Check',
      desc: 'Verify UK waste carrier, broker, and dealer registrations against the Environment Agency public register.',
      cat: 'Licensing',
      icon: Shield,
    },
    {
      name: 'EA Waste Code Lookup',
      desc: 'Resolve European Waste Catalogue (EWC) codes for skip and grab loads with hazardous flags.',
      cat: 'Compliance',
      icon: ClipboardCheck,
    },
    {
      name: 'Hazardous Consignment Notes',
      desc: 'Draft and audit hazardous waste consignment notes for compliant hand-off and duty-of-care records.',
      cat: 'Waste Duty of Care',
      icon: FileText,
    },
    {
      name: 'Fleet Compliance Scoring',
      desc: 'Aggregate tachograph, driver hours, and inspection data into live fleet compliance scores.',
      cat: 'Fleet',
      icon: Truck,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <Wrench className="w-12 h-12 text-brand-400 mx-auto mb-4" />
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          <span className="text-brand-400">{vertical.name.split('.')[0]}</span> Tools
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          MCP-powered compliance tools for skip-hire and grab-hire operators. Plug into the skip-hire-ai MCP server or subscribe for hosted access.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {tools.map((tool) => (
          <div key={tool.name} className="rounded-xl bg-card border border-border p-6 hover:border-brand-500/30 transition-colors text-left">
            <div className="flex items-center gap-2 mb-3">
              <tool.icon className="w-4 h-4 text-brand-400" />
              <span className="text-xs font-mono text-brand-400 uppercase">{tool.cat}</span>
            </div>
            <h3 className="font-semibold mb-2">{tool.name}</h3>
            <p className="text-sm text-muted-foreground">{tool.desc}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <a href="/pricing" className="inline-flex items-center px-6 py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-opacity">
          Get Tool Access
        </a>
      </div>
    </div>
  );
}
