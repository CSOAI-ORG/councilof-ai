import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "Layer 0: MCP & Protocol Landscape (2026) — CSOAI",
  description:
    "CSOAI Layer 0 distribution registry. 202 nodes across 14 domains. Integrated with A2A, x402, and Microsoft AGT.",
  openGraph: {
    title: "Layer 0: MCP & Protocol Landscape — CSOAI",
    description: "202 nodes across 14 sovereign AI domains. The protocol landscape for 2026.",
    images: ["/api/og?title=MCP%20Distribution&desc=Layer%200%20fleet%20registry"],
  },
  alternates: { canonical: "/mcp-distribution" },
};

const protocols = [
  { name: "MCP", layer: "L1 Tool Integration", status: "97M SDK/mo", what: "Agents call tools" },
  { name: "A2A", layer: "L2 Agent Coordination", status: "v1.0 Stable", what: "Agents discover/delegate" },
  { name: "x402", layer: "L3 Settlement", status: "140M Trans.", what: "HTTP-native payments" },
  { name: "Microsoft AGT", layer: "L1-L2 Governance", status: "9,500+ Tests", what: "Runtime policy enforcement" },
];

const sites = [
  { name: "meok.ai", layer: "L0-A: Identity", purpose: "AI Research & Development Labs", geo: ["London, UK", "Singapore"], aeo: ["MEOK AI", "Sovereign AI", "Model Context Protocol servers"] },
  { name: "accountabilityof.ai", layer: "L0-B: Certification", purpose: "Algorithmic Accountability", geo: ["Brussels, BE", "London, UK"], aeo: ["AI accountability", "Article 16 AI Act"] },
  { name: "csoai.org", layer: "L0-C: Policy Engine", purpose: "Primary Governance Institution", geo: ["London, UK", "Frankfurt, DE", "New York, US"], aeo: ["AI safety governance", "AI audit checklist", "EU AI Act compliance"] },
  { name: "agisafe.ai", layer: "L0-C: Policy Engine", purpose: "AGI Safety & Guardrails", geo: ["Zurich, CH", "London, UK"], aeo: ["AGI safety", "AI guardrails"] },
  { name: "asisecurity.ai", layer: "L0-C: Policy Engine", purpose: "ASI Security & Control", geo: ["San Francisco, US", "London, UK"], aeo: ["ASI security", "superintelligence control"] },
  { name: "ethicalgovernanceof.ai", layer: "L0-C: Policy Engine", purpose: "Ethics & Value Alignment", geo: ["Stockholm, SE", "Geneva, CH"], aeo: ["AI ethics framework", "ISO 42001 governance"] },
  { name: "dataprivacyof.ai", layer: "L0-D: Cross-Regional", purpose: "AI Data Protection", geo: ["Frankfurt, DE", "London, UK"], aeo: ["AI GDPR compliance", "DPIA for AI"] },
  { name: "biasdetectionof.ai", layer: "L0-D: Cross-Regional", purpose: "Bias & Fairness Testing", geo: ["Paris, FR", "Dublin, IE"], aeo: ["AI bias detection", "algorithmic fairness"] },
  { name: "checkoutof.ai", layer: "L0-E: Payment", purpose: "Agentic Payment Compliance", geo: ["London, UK", "New York, US"], aeo: ["ACP compliance", "x402 pre-check"] },
  { name: "proofof.ai", layer: "L0-F: Audit", purpose: "On-chain Compliance Verification", geo: ["London, UK", "Distributed Nodes"], aeo: ["proof of AI", "blockchain AI compliance"] },
  { name: "transparencyof.ai", layer: "L0-F: Audit", purpose: "AI Transparency & Watermarking", geo: ["Amsterdam, NL", "London, UK"], aeo: ["AI watermarking", "Article 50 AI Act"] },
  { name: "councilof.ai", layer: "L0-G: Human-in-the-loop", purpose: "Global AI Governance Council", geo: ["London, UK", "Tokyo, JP"], aeo: ["AI governance council", "global AI standards"] },
  { name: "safetyof.ai", layer: "L0-G: Human-in-the-loop", purpose: "Real-time AI Safety Monitoring", geo: ["London, UK", "Berlin, DE"], aeo: ["AI safety monitoring", "real-time AI audit"] },
  { name: "cobolbridge.ai", layer: "L0-H: Legacy Bridge", purpose: "Legacy Modernization Safety", geo: ["London, UK", "Charlotte, US"], aeo: ["COBOL to AI", "legacy system safety"] },
];

const dataFeedSchema = {
  "@context": "https://schema.org",
  "@type": "DataFeed",
  name: "CSOAI Layer 0 MCP Distribution Registry",
  description: "Global distribution of Layer 0 nodes across sovereign AI sites, mapped to CSOAI infrastructure (2026).",
  provider: { "@type": "Organization", name: "CSOAI", url: "https://csoai.org" },
  dataset: sites.map((site) => ({
    "@type": "Dataset",
    name: `${site.name} MCP Node (${site.layer})`,
    description: site.purpose,
    spatialCoverage: site.geo,
  })),
};

export default function McpDistributionPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dataFeedSchema) }}
      />

      <div className="min-h-screen bg-slate-950 text-white">
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-32 text-center">
          <h1 className="mb-4 text-4xl font-black tracking-tighter sm:text-6xl">
            <span className="gradient-text">CSOAI IS LAYER 0</span>
          </h1>
          <p className="mx-auto mb-6 max-w-2xl text-lg text-slate-400">
            The sovereign foundation for the agentic economy. Certifying identity, policy, and
            payments across the 2026 protocol landscape.
          </p>
          <div className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-emerald-400">
            202 NODES · 14 SOVEREIGN DOMAINS · 2026_COMPLIANT
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-white/[0.05] to-emerald-500/[0.05] p-8">
            <h2 className="mb-6 text-2xl font-bold text-emerald-400">The Protocol Landscape (2026)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-emerald-400">Protocol</th>
                    <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-emerald-400">Layer</th>
                    <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-emerald-400">Status</th>
                    <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-emerald-400">What It Does</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {protocols.map((protocol) => (
                    <tr key={protocol.name} className="border-b border-white/5 last:border-b-0">
                      <td className="py-3 font-bold text-emerald-400">{protocol.name}</td>
                      <td className="py-3">{protocol.layer}</td>
                      <td className="py-3">{protocol.status}</td>
                      <td className="py-3">{protocol.what}</td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-500/[0.05]">
                    <td className="py-3 font-bold text-emerald-400">did:csoai</td>
                    <td className="py-3 font-bold text-emerald-400">LAYER 0</td>
                    <td className="py-3 font-bold text-emerald-400">PROD</td>
                    <td className="py-3 font-bold text-emerald-400">Sovereign Identity & Certification</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              &quot;Before any agent can pay, hire, or act — it needs to prove it&apos;s compliant. That&apos;s
              Layer 0. And CSOAI is the only company that built it.&quot;
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24">
          <h2 className="mb-8 border-l-4 border-emerald-500 pl-4 text-2xl font-black text-white">
            The 8 Layers of CSOAI Infrastructure
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sites.map((site) => (
              <div
                key={site.name}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-emerald-500/30"
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <h3 className="text-lg font-bold text-emerald-400">{site.name}</h3>
                  <span className="whitespace-nowrap rounded bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                    {site.layer}
                  </span>
                </div>
                <p className="mb-4 text-sm font-medium text-white">{site.purpose}</p>
                <div className="mb-2 text-xs text-slate-500">
                  <strong className="text-slate-400">GEO:</strong>{" "}
                  {site.geo.map((g) => (
                    <span key={g} className="mr-1 inline-block rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-blue-400">
                      {g}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-slate-500">
                  <strong className="text-slate-400">AEO:</strong>{" "}
                  {site.aeo.map((a) => (
                    <span key={a} className="mr-1 inline-block rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-slate-400">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
