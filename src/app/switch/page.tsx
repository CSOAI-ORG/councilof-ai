import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Switch to CSOAI",
  description:
    "Move your AI governance from checklist to cryptographic proof. Transfer from Vanta, Drata, OneTrust, Credo AI, IBM, Microsoft Purview, and more.",
  openGraph: {
    title: "Switch to CSOAI",
    description: "Transfer your AI governance from incumbents to the independent Layer 0 trust layer.",
    images: ["/api/og?title=Switch%20to%20CSOAI&desc=Transfer%20from%20Vanta%2C%20Drata%2C%20OneTrust%2C%20Credo%20AI%2C%20IBM%2C%20Microsoft%20Purview%2C%20and%20more."],
  },
  alternates: { canonical: "/switch" },
};

const competitors = [
  { name: "Vanta", category: "Compliance automation", price: "$10k+/yr", weakness: "No agent identity or runtime enforcement; US-only data model", cta: "Import Vanta evidence" },
  { name: "Drata", category: "Continuous monitoring", price: "$7.5k+/yr", weakness: "No cryptographic attestations; no protocol-layer governance", cta: "Import Drata controls" },
  { name: "OneTrust", category: "Privacy + GRC", price: "Enterprise", weakness: "6–12 month implementation; no agent-in-motion governance", cta: "Sync AI BOM" },
  { name: "Credo AI", category: "AI governance", price: "$75k–$250k", weakness: "Proprietary dashboard; no MCP/A2A/AP2/x402 native enforcement", cta: "Bridge Credo policies" },
  { name: "Holistic AI", category: "Model testing", price: "$40k–$400k", weakness: "No BFT council or signed certificates", cta: "Ingest test results" },
  { name: "IBM watsonx.governance", category: "Enterprise ML ops", price: "Enterprise", weakness: "Vendor-locked, heavy implementation", cta: "Connect watsonx" },
  { name: "Microsoft Purview", category: "Data governance", price: "Enterprise", weakness: "Microsoft-stack lock-in; no agent identity", cta: "Purview connector" },
  { name: "AWS Audit Manager", category: "Cloud audit", price: "Pay-as-you-go", weakness: "AWS-only; no AI-specific frameworks", cta: "Export evidence" },
];

const features = [
  { label: "Agent identity layer", csoai: true, incumbents: "None" },
  { label: "Runtime policy enforcement", csoai: true, incumbents: "Limited" },
  { label: "MCP / A2A / AP2 / x402 native", csoai: true, incumbents: "Rare" },
  { label: "Ed25519 signed attestations", csoai: true, incumbents: "No" },
  { label: "Public verify URL", csoai: true, incumbents: "No" },
  { label: "EU / UK sovereign hosting", csoai: true, incumbents: "Optional cell" },
  { label: "Open-source MCP servers", csoai: "475+", incumbents: "Closed" },
  { label: "Per-call pricing", csoai: true, incumbents: "Seat/audit based" },
];

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "Switch to CSOAI", item: "https://csoai.org/switch" },
  ],
};

export default function SwitchPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Migration
          </div>
          <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">
            Switch to <span className="text-emerald-400">CSOAI</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            Move your AI governance from checklists to cryptographic proof. We help you transfer evidence from
            Vanta, Drata, OneTrust, Credo AI, IBM, Microsoft Purview, and more — without losing audit continuity.
          </p>
        </div>

        <div className="mb-16 overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-slate-300">
              <tr>
                <th className="px-6 py-4 font-bold">Capability</th>
                <th className="px-6 py-4 font-bold text-emerald-400">CSOAI</th>
                <th className="px-6 py-4 font-bold text-slate-400">Typical incumbents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {features.map((f) => (
                <tr key={f.label} className="bg-white/[0.02]">
                  <td className="px-6 py-4 font-medium text-white">{f.label}</td>
                  <td className="px-6 py-4 text-emerald-400">
                    {typeof f.csoai === "boolean" ? (f.csoai ? "✓" : "—") : f.csoai}
                  </td>
                  <td className="px-6 py-4 text-slate-400">{f.incumbents}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-16 grid gap-6 md:grid-cols-2">
          {competitors.map((c) => (
            <div
              key={c.name}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-emerald-500/30"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{c.name}</h3>
                <span className="text-xs text-slate-500">{c.category}</span>
              </div>
              <p className="mb-1 text-xs text-slate-500">Typical price: {c.price}</p>
              <p className="mb-6 flex-1 text-sm text-slate-400">{c.weakness}</p>
              <a
                href="mailto:hello@meok.ai?subject=CSOAI%20transfer%20from%20incumbent"
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-center text-sm font-bold text-white transition hover:border-emerald-500/40"
              >
                {c.cta}
              </a>
            </div>
          ))}
        </div>

        <section className="mb-16 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <h2 className="mb-4 text-xl font-bold">Why incumbents lose</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { name: "Vanta", note: "50%+ renewal hikes and a 2025 cross-customer data exposure.", slug: "vanta" },
              { name: "Drata", note: "40%+ renewals and integrations that only confirm a connection exists.", slug: "drata" },
              { name: "OneTrust", note: "22–80% mid-contract price increases.", slug: "onetrust" },
              { name: "ServiceNow", note: "Four CVSS 9.8 RCEs in 18 months.", slug: "servicenow" },
            ].map((c) => (
              <div key={c.slug} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <h3 className="mb-1 font-bold text-white">{c.name}</h3>
                <p className="mb-2 text-sm text-slate-400">{c.note}</p>
                <Link href={`/vs/${c.slug}`} className="text-sm font-bold text-emerald-400 hover:underline">
                  CSOAI vs {c.name} →
                </Link>
              </div>
            ))}
          </div>
        </section>

        <div className="mb-16 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8">
          <h2 className="mb-4 text-2xl font-bold text-white">Switch guarantee</h2>
          <ul className="mb-6 space-y-2 text-slate-300">
            <li>• Free migration concierge for annual CSOAI contracts</li>
            <li>• Credit for up to 6 months of unused incumbent spend</li>
            <li>• EU-hosted deployment option</li>
            <li>• Public verify URL within 24 hours of certificate issuance</li>
          </ul>
          <Link
            href="/pricing"
            className="inline-block rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-600"
          >
            See pricing →
          </Link>
        </div>

        <section className="mt-16 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <h2 className="mb-4 text-xl font-bold">Sources & notes</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-400">
            <li>
              Vanta pricing and renewal data from public G2 / TrustRadius / Reddit reports; breach details from public
              reporting, May 2025.
            </li>
            <li>Drata renewal and integration-depth claims from HackerNews and G2 reviews.</li>
            <li>OneTrust uplift data from TrustRadius.</li>
            <li>
              ServiceNow CVEs sourced from NVD: CVE-2025-12420, CVE-2026-0542, CVE-2024-4879, CVE-2024-5217,
              CVE-2024-8923.
            </li>
            <li>
              “63% of organizations have no AI governance policies” — IBM study; “89% of AI use escapes governance” —
              Microsoft / LinkedIn research.
            </li>
          </ol>
          <p className="mt-4 text-xs text-slate-500">
            Verify all third-party pricing and security claims independently before contractual use.
          </p>
        </section>
      </div>
    </div>
  );
}
