import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CSOAI vs. AI Governance Platforms",
  description:
    "Compare CSOAI to Vanta, Drata, OneTrust, Credo AI, Holistic AI, IBM watsonx.governance, Microsoft Purview, and AWS Audit Manager.",
  openGraph: {
    title: "CSOAI vs. AI Governance Platforms",
    description: "Independent Layer 0 trust vs. compliance dashboards and AI governance suites.",
    images: ["/api/og?title=CSOAI%20vs.%20AI%20Governance%20Platforms&desc=Independent%20Layer%200%20trust%20vs.%20compliance%20dashboards%20and%20AI%20governance%20suites."],
  },
  alternates: { canonical: "/compare" },
};

const rows = [
  { feature: "Agent identity layer", csoai: true, vanta: false, drata: false, credo: false, onetrust: false, holistic: false, ibm: false },
  { feature: "Runtime policy enforcement", csoai: true, vanta: false, drata: false, credo: "Limited", onetrust: false, holistic: false, ibm: "Limited" },
  { feature: "MCP / A2A / AP2 / x402 native", csoai: true, vanta: false, drata: false, credo: false, onetrust: false, holistic: false, ibm: false },
  { feature: "Ed25519 signed attestations", csoai: true, vanta: false, drata: false, credo: false, onetrust: false, holistic: false, ibm: false },
  { feature: "Public verify URL", csoai: true, vanta: false, drata: false, credo: false, onetrust: false, holistic: false, ibm: false },
  { feature: "13-framework crosswalk", csoai: true, vanta: "Limited", drata: "Limited", credo: true, onetrust: true, holistic: "Limited", ibm: true },
  { feature: "EU / UK sovereign hosting", csoai: true, vanta: "Optional", drata: "Optional", credo: "Optional", onetrust: "Optional", holistic: "Optional", ibm: "Optional" },
  { feature: "Open-source MCP servers", csoai: "475+", vanta: false, drata: false, credo: false, onetrust: false, holistic: false, ibm: false },
  { feature: "Starting price", csoai: "£0 / £49/mo", vanta: "$10k+/yr", drata: "$7.5k+/yr", credo: "$75k+", onetrust: "Enterprise", holistic: "$40k+", ibm: "Enterprise" },
];

const competitors = [
  { name: "Vanta", type: "Compliance automation", gap: "No agent identity or runtime enforcement" },
  { name: "Drata", type: "Continuous monitoring", gap: "No cryptographic attestations" },
  { name: "OneTrust", type: "Privacy + GRC", gap: "No agent-in-motion governance" },
  { name: "Credo AI", type: "AI governance", gap: "Proprietary dashboard; no protocol-native enforcement" },
  { name: "Holistic AI", type: "Model testing", gap: "No BFT council or signed certificates" },
  { name: "IBM watsonx.governance", type: "Enterprise ML ops", gap: "Vendor-locked, heavy implementation" },
];

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "Compare", item: "https://csoai.org/compare" },
  ],
};

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <span className="text-emerald-400">✓</span>;
  if (value === false) return <span className="text-slate-600">—</span>;
  return <span className="text-amber-400">{value}</span>;
}

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="mx-auto max-w-7xl px-4 py-20">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Comparison
          </div>
          <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">
            CSOAI <span className="text-emerald-400">vs.</span> the rest
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            Dashboards document compliance. CSOAI proves it at the agent-call layer. See how independent Layer 0
            compares to the leading platforms.
          </p>
        </div>

        <div className="mb-16 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-white/5 text-slate-300">
              <tr>
                <th className="px-4 py-3 font-bold">Feature</th>
                <th className="px-4 py-3 font-bold text-emerald-400">CSOAI</th>
                <th className="px-4 py-3 font-bold">Vanta</th>
                <th className="px-4 py-3 font-bold">Drata</th>
                <th className="px-4 py-3 font-bold">Credo AI</th>
                <th className="px-4 py-3 font-bold">OneTrust</th>
                <th className="px-4 py-3 font-bold">Holistic AI</th>
                <th className="px-4 py-3 font-bold">IBM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((row) => (
                <tr key={row.feature} className="bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium text-white">{row.feature}</td>
                  <td className="px-4 py-3"><Cell value={row.csoai} /></td>
                  <td className="px-4 py-3"><Cell value={row.vanta} /></td>
                  <td className="px-4 py-3"><Cell value={row.drata} /></td>
                  <td className="px-4 py-3"><Cell value={row.credo} /></td>
                  <td className="px-4 py-3"><Cell value={row.onetrust} /></td>
                  <td className="px-4 py-3"><Cell value={row.holistic} /></td>
                  <td className="px-4 py-3"><Cell value={row.ibm} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {competitors.map((c) => (
            <div key={c.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="mb-1 text-lg font-bold text-white">{c.name}</h3>
              <p className="mb-3 text-xs text-slate-500">{c.type}</p>
              <p className="text-sm text-slate-400">{c.gap}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/switch" className="rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-600">
            Start switching →
          </Link>
          <Link href="/pricing" className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 font-bold text-white transition hover:border-emerald-500/40">
            See pricing
          </Link>
        </div>

        <section className="mt-16 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <h2 className="mb-4 text-xl font-bold">Sources & notes</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-400">
            <li>
              Vanta pricing estimated at $10K–$80K+/yr based on public G2 and TrustRadius data; renewal hikes of 30–500%
              and the May 2025 cross-customer data exposure are reported by customers on Reddit r/compliance and public
              breach trackers. <Link href="/vs/vanta" className="text-emerald-400 hover:underline">See CSOAI vs Vanta →</Link>
            </li>
            <li>
              Drata pricing estimated at $7.5K–$50K+/yr; 40%+ renewals and shallow integration depth are reported on
              HackerNews and G2 reviews. <Link href="/vs/drata" className="text-emerald-400 hover:underline">See CSOAI vs Drata →</Link>
            </li>
            <li>
              OneTrust 22–80% mid-contract price increases are reported on TrustRadius.{" "}
              <Link href="/vs/onetrust" className="text-emerald-400 hover:underline">See CSOAI vs OneTrust →</Link>
            </li>
            <li>
              ServiceNow IRM CVEs (CVE-2025-12420, CVE-2026-0542, CVE-2024-4879, CVE-2024-5217, CVE-2024-8923) are
              recorded in the NVD. <Link href="/vs/servicenow" className="text-emerald-400 hover:underline">See CSOAI vs ServiceNow →</Link>
            </li>
            <li>
              “63% of organizations have no AI governance policies” — IBM study; “89% of AI use escapes governance” —
              Microsoft / LinkedIn research.
            </li>
          </ol>
          <p className="mt-4 text-xs text-slate-500">
            All competitive claims are based on public and composite research. Verify pricing and security data
            independently before contractual use.
          </p>
        </section>
      </div>
    </div>
  );
}
