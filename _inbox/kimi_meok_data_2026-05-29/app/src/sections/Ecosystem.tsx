import { Server, FileCheck, GitBranch, RefreshCw } from 'lucide-react';

const pillars = [
  {
    icon: Server,
    title: 'Ecosystem Lock-In',
    value: '255+',
    label: 'MCP Servers',
    description: 'Replication cost: GBP 2.5M+ and 18-24 months'
  },
  {
    icon: FileCheck,
    title: 'Cryptographic Trust',
    value: 'HMAC',
    label: 'SHA-256 Signed',
    description: 'Verifiable data provenance at scale'
  },
  {
    icon: GitBranch,
    title: 'Cross-Domain Unique',
    value: '3',
    label: 'Domains Unified',
    description: 'Healthcare + Finance + Governance correlation'
  },
  {
    icon: RefreshCw,
    title: 'Regulatory Velocity',
    value: '13',
    label: 'Frameworks Monitored',
    description: 'Real-time change detection feeds dataset freshness'
  }
];

export default function Ecosystem() {
  return (
    <section id="ecosystem" className="relative py-24 bg-[#0a141e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-xs tracking-[0.2em] text-[#00bca8] uppercase">Competitive Moat</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-[#e2e8f0]">
            4 <span className="gradient-text">Structural Advantages</span>
          </h2>
          <p className="mt-4 text-[#8899aa] max-w-2xl mx-auto">
            Our data moat rests on structural advantages that are expensive and time-consuming to replicate.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="bg-[#1a2a3a] rounded-lg border border-[#00788820] p-6 hover:border-[#00788860] transition-all"
            >
              <div className="p-2 rounded-md bg-[#00788815] w-fit mb-4">
                <pillar.icon className="h-5 w-5 text-[#00bca8]" />
              </div>
              <div className="text-3xl font-bold text-[#00bca8] mb-1">{pillar.value}</div>
              <div className="text-sm font-medium text-[#e2e8f0] mb-1">{pillar.label}</div>
              <div className="text-xs text-[#718096] mb-4">{pillar.title}</div>
              <p className="text-sm text-[#8899aa]">{pillar.description}</p>
            </div>
          ))}
        </div>

        {/* Flywheel visualization */}
        <div className="mt-16">
          <div className="bg-[#1a2a3a] rounded-lg border border-[#00788820] p-8">
            <h3 className="text-center text-lg font-semibold text-[#e2e8f0] mb-8">The Data Moat Flywheel</h3>
            <div className="flex flex-wrap justify-center items-center gap-4">
              {['More Users', 'More Data', 'Better Product', 'More Revenue', 'More Investment'].map((step, i) => (
                <div key={step} className="flex items-center gap-4">
                  <div className="px-5 py-3 bg-[#0f1923] rounded border border-[#00788830] text-sm text-[#a0b0c0] font-medium">
                    {step}
                  </div>
                  {i < 4 && (
                    <div className="text-[#00bca8] text-lg">&#8594;</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
