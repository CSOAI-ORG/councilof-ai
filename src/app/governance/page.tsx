import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Global Governance Mesh & Cross-Regional Compliance — CSOAI",
  description:
    "Enforce AI compliance across borders. CSOAI Layer 0-D provides cross-regional handoff and strict boundary enforcement for global AI agents.",
  openGraph: {
    title: "Global Governance Mesh — CSOAI",
    description: "Cross-regional AI compliance handoff and strict boundary enforcement.",
    images: ["/api/og?title=Global%20Governance%20Mesh&desc=Cross-regional%20AI%20compliance"],
  },
  alternates: { canonical: "/governance" },
};

const activeJurisdictions = [
  { flag: "🇪🇺", name: "EU", framework: "AI Act", active: true },
  { flag: "🇺🇸", name: "US", framework: "NIST RMF", active: true },
  { flag: "🇬🇧", name: "UK", framework: "AISI", active: true },
  { flag: "🇨🇳", name: "CN", framework: "TC260", active: true },
  { flag: "🇸🇬", name: "SG", framework: "PDPA", active: true },
  { flag: "🇰🇷", name: "KR", framework: "AI Basic Act", active: true },
  { flag: "🇦🇺", name: "AU", framework: "", active: false },
  { flag: "🇨🇦", name: "CA", framework: "", active: false },
  { flag: "🇯🇵", name: "JP", framework: "", active: false },
];

const features = [
  {
    title: "A2A Handoff",
    description:
      "Securely delegate tasks between agents in different regions while ensuring that compliance contexts are preserved and enforced.",
  },
  {
    title: "Boundary Enforcement",
    description:
      "Automatically block data transfers or actions that violate local regulations (e.g., GDPR, PIPL, HIPAA) at the protocol level.",
  },
  {
    title: "Framework Mapping",
    description:
      "Real-time crosswalks between ISO 42001, NIST, and EU AI Act, ensuring your agents remain compliant as they move between frameworks.",
  },
];

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "CSOAI Global Governance Mesh",
  provider: { "@type": "Organization", name: "CSOAI", url: "https://csoai.org" },
  description: "Cross-regional AI compliance handoff and boundary enforcement.",
  areaServed: activeJurisdictions.filter((j) => j.active).map((j) => j.name),
  url: "https://csoai.org/governance",
};

export default function GovernancePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div className="min-h-screen bg-slate-950 text-white">
        <section className="mx-auto max-w-5xl px-4 pb-16 pt-32 text-center">
          <div className="mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">
            Layer 0-D: Cross-Regional
          </div>
          <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">
            <span className="gradient-text">Global Governance Mesh</span>
          </h1>
          <p className="mx-auto mb-10 max-w-3xl text-xl leading-relaxed text-slate-400">
            AI agents don&apos;t respect borders—but regulators do. CSOAI&apos;s global jurisdiction mesh
            enforces the &quot;strictest-framework-wins&quot; logic in real-time across the globe.
          </p>
          <Link
            href="/mcp-distribution"
            className="inline-flex rounded-full bg-emerald-500 px-8 py-4 text-sm font-black uppercase tracking-widest text-slate-950 transition hover:bg-emerald-400"
          >
            View Global Fleet
          </Link>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-20">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 text-center sm:p-12">
            <h2 className="mb-8 text-2xl font-black text-white">Active Jurisdictions</h2>
            <div className="mb-8 flex flex-wrap justify-center gap-3">
              {activeJurisdictions.map((j) => (
                <span
                  key={j.name}
                  className={`rounded-full border px-4 py-2 text-xs font-bold ${
                    j.active
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                      : "border-white/10 bg-white/[0.03] text-slate-500"
                  }`}
                >
                  {j.flag} {j.name} {j.framework && `(${j.framework})`}
                </span>
              ))}
            </div>
            <p className="mx-auto max-w-2xl text-sm text-slate-400">
              Our BFT Council ensures that when an agent hands off a task between jurisdictions, all
              data sovereignty and regulatory requirements are validated and signed on-chain.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-32">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 transition hover:-translate-y-2 hover:border-emerald-500/30 hover:bg-white/[0.05]"
              >
                <h3 className="mb-3 text-xl font-bold text-emerald-400">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
