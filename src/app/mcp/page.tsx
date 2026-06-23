import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MCP",
  description:
    "Model Context Protocol (MCP) governance for AI agents. CSOAI provides compliant, signed, and auditable MCP servers for EU AI Act, risk classification, watermarking, and human oversight.",
  openGraph: {
    title: "CSOAI MCP Governance",
    description: "Compliant, signed, and auditable Model Context Protocol servers.",
  },
  alternates: { canonical: "/mcp" },
};

const SERVERS = [
  "csoai-layer0-compliance",
  "csoai-risk-classifier",
  "csoai-article50-watermark",
  "csoai-human-oversight-trigger",
  "csoai-brand-authority",
  "csoai-aeo-geo-optimizer",
  "csoai-payment-precheck",
  "csoai-aml-kyc-validator",
];

const FAQ = [
  {
    q: "What is MCP?",
    a: "The Model Context Protocol (MCP) is an open protocol standardised by Anthropic that lets AI assistants connect to external data sources and tools through a standardised server interface.",
  },
  {
    q: "How does CSOAI make MCP servers compliant?",
    a: "Every CSOAI MCP server is packaged with a signed attestation, policy enforcement hooks, audit logging, and conformance to EU AI Act, DORA, NIS2, and ISO 42001 controls where applicable.",
  },
  {
    q: "Can I use CSOAI MCP servers with Claude, Cursor, or other clients?",
    a: "Yes. Our servers expose the standard MCP interface and can be added to any MCP-compatible client.",
  },
];

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "Protocols", item: "https://csoai.org/protocols" },
    { "@type": "ListItem", position: 3, name: "MCP", item: "https://csoai.org/mcp" },
  ],
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "CSOAI MCP Server Suite",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "999", priceCurrency: "GBP" },
  featureList: SERVERS,
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function McpPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="mx-auto max-w-4xl px-4 py-20">
        <div className="mb-6 inline-block rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
          Layer 0 Protocol
        </div>
        <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">
          Model Context Protocol
        </h1>
        <p className="mb-12 max-w-2xl text-lg text-slate-400">
          Anthropic&apos;s open standard for connecting AI assistants to tools and data. CSOAI wraps MCP servers in governance,
          signing, and audit trails so your agents stay compliant by default.
        </p>

        <div className="mb-16 grid gap-3 sm:grid-cols-2">
          {SERVERS.map((s) => (
            <div key={s} className="rounded-xl border border-white/10 bg-white/5 p-4 font-mono text-sm text-emerald-300">
              {s}
            </div>
          ))}
        </div>

        <div className="mb-16 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8">
          <p className="mb-4 font-mono text-sm text-emerald-300">$ pip install meok-watermark-attest-mcp</p>
          <p className="text-sm text-slate-400">
            Example: install the Article 50 watermarking MCP and start generating compliant disclosure strings and C2PA manifests.
          </p>
        </div>

        <div className="flex gap-4">
          <Link
            href="/mcp-packs"
            className="rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-600"
          >
            Browse MCP Packs
          </Link>
          <Link href="/protocols" className="rounded-xl border border-white/10 px-6 py-3 font-medium transition hover:bg-white/5">
            All protocols
          </Link>
        </div>

        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                <summary className="cursor-pointer font-bold">{f.q}</summary>
                <p className="mt-2 leading-relaxed text-slate-400">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
