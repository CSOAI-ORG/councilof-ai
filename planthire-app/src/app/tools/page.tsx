'use client';

import { Search, Calculator, CalendarCheck, ClipboardCheck, Truck, Package, Wrench } from 'lucide-react';
import { vertical } from '@/lib/vertical';

const tools = [
  {
    id: 'search_equipment',
    name: 'Search Equipment',
    description: 'Search the construction equipment catalog by type, capacity, or keyword. Returns matching plant with specs and daily/weekly rates.',
    icon: Search,
  },
  {
    id: 'get_rental_quote',
    name: 'Get Rental Quote',
    description: 'Calculate rental pricing for a piece of equipment over a given hire period, including delivery and collection costs.',
    icon: Calculator,
  },
  {
    id: 'check_availability',
    name: 'Check Availability',
    description: 'Check whether specific equipment is available for a requested date range across depots.',
    icon: CalendarCheck,
  },
  {
    id: 'create_booking',
    name: 'Create Booking',
    description: 'Create an equipment rental booking with delivery address, hire dates, and contact details.',
    icon: Package,
  },
  {
    id: 'get_safety_checklist',
    name: 'Get Safety Checklist',
    description: 'Get an HSE-compliant pre-use safety inspection checklist tailored to the equipment type (e.g. excavator, telehandler).',
    icon: ClipboardCheck,
  },
  {
    id: 'calculate_transport',
    name: 'Calculate Transport',
    description: 'Estimate transport costs for delivery and/or collection of hired equipment based on site postcode and equipment dimensions.',
    icon: Truck,
  },
];

export default function ToolsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-medium mb-6">
          <Wrench className="w-3.5 h-3.5" />
          MCP-Powered
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          {vertical.name.split('.')[0]} <span className="text-brand-400">Tools</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          MCP tools for plant and equipment hire. Verified by CSOAI, ready for agents, and available on Pro and Enterprise tiers.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <div key={tool.id} className="rounded-xl bg-card border border-border p-6 hover:border-brand-500/30 transition-colors text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg gradient-brand flex items-center justify-center">
                <tool.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold">{tool.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{tool.description}</p>
            <code className="text-xs font-mono text-brand-400 bg-brand-500/10 px-2 py-1 rounded">{tool.id}</code>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to deploy these tools?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
          Connect the PlantHire.ai MCP server to your agent stack. Pro and Enterprise plans include full tool access and signed compliance attestations.
        </p>
        <a href="/pricing" className="inline-flex items-center px-6 py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-opacity">
          View Pricing
        </a>
      </div>
    </div>
  );
}
