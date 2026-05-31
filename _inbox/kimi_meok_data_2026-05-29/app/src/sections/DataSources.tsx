import { Shield, HeartPulse, TrendingUp, FileCheck, Lock, Globe } from 'lucide-react';

const sources = [
  {
    icon: Shield,
    title: 'Governance & Compliance',
    description: '62 tools across EU AI Act, GDPR, HIPAA, NIS2, DORA, CRA, and 7 more frameworks. Crosswalk mappings, gap analyses, and audit trail patterns.',
    stats: '2.3M queries/month',
    color: '#00bca8'
  },
  {
    icon: HeartPulse,
    title: 'Healthcare FHIR',
    description: 'De-identified clinical data from Epic, Cerner, and NHS Spine. ICD-10 to SNOMED crosswalks, clinical timelines, and care plan outcomes across 50+ resource types.',
    stats: '50+ FHIR types',
    color: '#00bca8'
  },
  {
    icon: TrendingUp,
    title: 'Financial Services',
    description: 'MiFID II, MiCA, Basel, and DORA regulatory signals. Transaction pattern analysis, risk indicator correlations, and cross-jurisdictional compliance mappings.',
    stats: '4 frameworks',
    color: '#00bca8'
  },
  {
    icon: FileCheck,
    title: 'Attestation Network',
    description: 'HMAC-SHA256 signed compliance attestations with public verify URLs. Every Pro tool issues cryptographically verifiable audit receipts.',
    stats: 'Verifiable chain',
    color: '#00bca8'
  },
  {
    icon: Lock,
    title: 'Privacy-First Pipeline',
    description: 'HIPAA Safe Harbor de-identification applied to all 18 identifiers before data enters the MEOK DATA pipeline. GDPR Article 9 compliance built-in.',
    stats: '18 identifiers stripped',
    color: '#00bca8'
  },
  {
    icon: Globe,
    title: 'Cross-Domain Intelligence',
    description: 'Unique correlation across healthcare, finance, and governance domains enables novel use cases no single-vertical provider can match.',
    stats: '3 domains unified',
    color: '#00bca8'
  }
];

export default function DataSources() {
  return (
    <section id="sources" className="relative py-24 bg-[#0f1923]">
      <div className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(0,188,168,0.03) 0%, transparent 50%)'
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-xs tracking-[0.2em] text-[#00bca8] uppercase">Data Sources</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-[#e2e8f0]">
            Ecosystem-Generated <span className="gradient-text">Proprietary Data</span>
          </h2>
          <p className="mt-4 text-[#8899aa] max-w-2xl mx-auto">
            Every MCP server interaction enriches our datasets. The more the ecosystem grows, the deeper the moat becomes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sources.map((source) => (
            <div
              key={source.title}
              className="group relative bg-[#1a2a3a] rounded-lg border border-[#00788820] p-6 hover:border-[#00788860] transition-all duration-300 hover:glow-accent"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-md bg-[#00788815]">
                  <source.icon className="h-5 w-5 text-[#00bca8]" />
                </div>
                <h3 className="text-lg font-semibold text-[#e2e8f0]">{source.title}</h3>
              </div>
              <p className="text-sm text-[#8899aa] leading-relaxed mb-4">{source.description}</p>
              <div className="text-xs text-[#00bca8] font-medium">{source.stats}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
