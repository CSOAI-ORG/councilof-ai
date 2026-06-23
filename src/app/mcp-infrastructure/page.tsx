import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MCP Infrastructure — CSOAI",
  description:
    "CSOAI operates a 271-node MCP server fleet as public AI infrastructure. Open-source, certifiable, and ready for Claude, Cursor, and any AI client.",
  openGraph: {
    title: "MCP Infrastructure — CSOAI",
    description: "271-node MCP server fleet. Public AI infrastructure for the sovereign AI era.",
    images: ["/api/og?title=MCP%20Infrastructure&desc=Public%20AI%20infrastructure%20fleet"],
  },
  alternates: { canonical: "/mcp-infrastructure" },
};

const stats = [
  { value: "348", label: "Validated MCP servers in the fleet, each with health-checked builds and documented schemas." },
  { value: "100%", label: "E2E test pass rate across the entire fleet before any server is promoted to production." },
  { value: "0", label: "Proprietary lock-in. Every server is open-source under the csoai-org GitHub organisation." },
];

const features = [
  {
    title: "🔐 Tiered Auth & Billing",
    description:
      "Every server enforces tiered rate limits via a shared auth middleware. Free tiers get generous daily allowances; Sovereign and Family tiers unlock higher limits. Stripe-linked API keys enable live tier re-validation.",
  },
  {
    title: "📡 Real-World Tooling",
    description:
      "From calendar and email integrations to regulatory webhooks, flashcard generators, and academic paper searches — the fleet covers productivity, safety, education, and governance use cases.",
  },
  {
    title: "🧪 Certifiable Quality",
    description:
      "Servers are built to CSOAI's CASA standards: documented capabilities, tested boundaries, transparent failure modes, and audit-ready logs.",
  },
  {
    title: "🌐 Public Registry",
    description:
      "Browse the full catalogue at csoai-org.github.io/mcp-servers or inside the MEOK Marketplace.",
  },
];

const euAiActItems = [
  "Full audit trail & logging (Article 49)",
  "Risk management system integration (Article 9)",
  "Transparency & disclosure tools (Article 50)",
  "Human oversight controls (Article 14)",
  "Data governance documentation (Article 10)",
];

const schema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "MCP Infrastructure — CSOAI",
  description:
    "CSOAI operates a 348-node MCP server fleet as public AI infrastructure. Open-source, certifiable, and ready for Claude, Cursor, and any AI client.",
  url: "https://csoai.org/mcp-infrastructure",
  mainEntity: {
    "@type": "Organization",
    name: "CSOAI",
    url: "https://csoai.org",
  },
};

export default function McpInfrastructurePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div className="min-h-screen bg-slate-950 text-white">
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-32">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Public Infrastructure
          </span>

          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-5xl lg:text-6xl">
                <span className="gradient-text">MCP Infrastructure</span>
              </h1>
              <p className="mb-8 text-lg leading-relaxed text-slate-300">
                CSOAI operates a 348-node MCP server fleet as public AI infrastructure. Open-source,
                certifiable, and ready for Claude, Cursor, and any AI client that speaks the Model
                Context Protocol.
              </p>
              <a
                href="https://github.com/CSOAI-ORG/clawd"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
              >
                Explore the Fleet on GitHub →
              </a>
            </div>

            <div className="flex justify-center">
              <svg width="320" height="320" viewBox="0 0 320 320" fill="none" className="drop-shadow-[0_0_30px_rgba(212,168,67,0.3)]">
                <defs>
                  <linearGradient id="nodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D4A843" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#E8B76D" stopOpacity="0.15" />
                  </linearGradient>
                </defs>
                <circle cx="160" cy="160" r="90" fill="url(#nodeGrad)" stroke="#D4A843" strokeWidth="1.5" opacity="0.7" />
                <circle cx="160" cy="60" r="8" fill="#D4A843" opacity="0.9" />
                <circle cx="245" cy="115" r="8" fill="#D4A843" opacity="0.9" />
                <circle cx="245" cy="205" r="8" fill="#D4A843" opacity="0.9" />
                <circle cx="160" cy="260" r="8" fill="#D4A843" opacity="0.9" />
                <circle cx="75" cy="205" r="8" fill="#D4A843" opacity="0.9" />
                <circle cx="75" cy="115" r="8" fill="#D4A843" opacity="0.9" />
                <line x1="160" y1="60" x2="245" y2="115" stroke="#D4A843" strokeWidth="1" opacity="0.4" />
                <line x1="245" y1="115" x2="245" y2="205" stroke="#D4A843" strokeWidth="1" opacity="0.4" />
                <line x1="245" y1="205" x2="160" y2="260" stroke="#D4A843" strokeWidth="1" opacity="0.4" />
                <line x1="160" y1="260" x2="75" y2="205" stroke="#D4A843" strokeWidth="1" opacity="0.4" />
                <line x1="75" y1="205" x2="75" y2="115" stroke="#D4A843" strokeWidth="1" opacity="0.4" />
                <line x1="75" y1="115" x2="160" y2="60" stroke="#D4A843" strokeWidth="1" opacity="0.4" />
                <circle cx="160" cy="160" r="120" fill="none" stroke="#D4A843" strokeWidth="1" opacity="0.2" strokeDasharray="5,5" />
              </svg>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="grid gap-6 md:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center transition hover:border-emerald-500/30"
              >
                <div className="mb-3 text-4xl font-black text-emerald-400">{stat.value}</div>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
            <h2 className="mb-4 text-2xl font-bold text-white">What is the Model Context Protocol?</h2>
            <p className="leading-relaxed text-slate-300">
              The Model Context Protocol (MCP) is an open standard that lets AI clients discover and
              call tools, retrieve context, and interact with external systems through a uniform
              interface. CSOAI&apos;s MCP fleet turns any MCP-compatible client into a sovereign powerhouse
              — from research agents to safety monitors.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.1] to-emerald-500/[0.05] p-8">
            <h2 className="mb-4 text-2xl font-bold text-emerald-400">EU AI Act Article 50 — 2 August 2026</h2>
            <p className="mb-4 leading-relaxed text-slate-300">
              DORA, NIS2 and GDPR are already in force today. The EU AI Act&apos;s Article 50 transparency
              duties apply from 2 August 2026; high-risk (Annex III) obligations were delayed to December 2027
              by the Digital Omnibus. Article 5 prohibited-practice breaches carry penalties up to
              <strong className="text-emerald-400"> €35 million or 7% of global annual turnover</strong>.
            </p>
            <p className="mb-4 text-slate-300">
              CSOAI&apos;s MCP fleet provides <strong className="text-emerald-400">compliant infrastructure ready for certification</strong>:
            </p>
            <ul className="mb-6 space-y-2 text-slate-300">
              {euAiActItems.map((item) => (
                <li key={item}>✓ {item}</li>
              ))}
            </ul>
            <Link
              href="/guide-eu-ai-act"
              className="inline-flex rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              EU AI Act Compliance Guide →
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24">
          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 transition hover:-translate-y-1 hover:border-emerald-500/30"
              >
                <h3 className="mb-3 text-lg font-bold text-white">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="fixed bottom-0 left-0 right-0 z-40 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 bg-slate-950/80 px-6 py-4 backdrop-blur">
          <span className="text-sm font-medium text-slate-300">
            Want to integrate the MCP fleet into your product?
          </span>
          <Link
            href="/contact"
            className="inline-flex rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            Contact Us →
          </Link>
        </div>
      </div>
    </>
  );
}
