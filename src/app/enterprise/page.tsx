import type { Metadata } from "next";
import EnterpriseClient from "./EnterpriseClient";

export const metadata: Metadata = {
  title: "Enterprise Governance",
  description:
    "Turnkey AI governance for organisations of all sizes. Deploy enterprise-grade AI safety governance across your organisation with automated compliance, training, and monitoring.",
  openGraph: {
    title: "Enterprise Governance — CSOAI",
    description:
      "Turnkey AI governance for organisations of all sizes. Complete compliance, automated assessments, and real-time monitoring.",
    images: [
      "/api/og?title=Enterprise%20Governance&desc=Turnkey%20AI%20governance%20for%20organisations%20of%20all%20sizes",
    ],
  },
  alternates: { canonical: "/enterprise" },
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "CSOAI Enterprise Governance",
  description:
    "Turnkey AI governance for organisations of all sizes. Deploy enterprise-grade AI safety governance across your organisation with automated compliance, training, and monitoring.",
  provider: {
    "@type": "Organization",
    name: "CSOAI",
    url: "https://csoai.org",
  },
  areaServed: "Global",
  url: "https://csoai.org/enterprise",
};

const features = [
  {
    icon: "🏗️",
    title: "Governance Platform",
    description:
      "Complete AI risk management dashboard with automated assessments, real-time monitoring, and compliance tracking across all frameworks.",
  },
  {
    icon: "📊",
    title: "Compliance Automation",
    description:
      "Automated crosswalk mapping to ISO 42001, NIST AI RMF, EU AI Act, IEEE 7000, and SOC 2 Type II with evidence collection.",
  },
  {
    icon: "👥",
    title: "Training & Culture",
    description:
      "Role-based AI safety training, certification pathways for every team member, and governance culture assessment tools.",
  },
];

const checklist = [
  "SOC 2 Type II certified infrastructure",
  "GDPR & UK GDPR fully compliant",
  "ISO 27001 information security management",
  "AES-256 encryption at rest & in transit",
  "Role-based access control (RBAC)",
  "Audit logs & immutable evidence trails",
];

const comparisonRows = [
  {
    capability: "52-article charter audit",
    csoai: "✓",
    big4: "—",
    inHouse: "Rarely",
  },
  {
    capability: "Byzantine consensus governance",
    csoai: "✓",
    big4: "—",
    inHouse: "—",
  },
  {
    capability: "Multi-framework crosswalks",
    csoai: "✓",
    big4: "$$$",
    inHouse: "Slow",
  },
  {
    capability: "Real-time compliance dashboard",
    csoai: "✓",
    big4: "—",
    inHouse: "Expensive",
  },
  {
    capability: "Time to certification",
    csoai: "4–8 weeks",
    big4: "3–6 months",
    inHouse: "6–12 months",
  },
  {
    capability: "Dedicated AI safety officer",
    csoai: "✓ Enterprise",
    big4: "—",
    inHouse: "Headcount",
  },
];

const trusted = ["NATO", "CDAO", "NHS", "Anthropic", "DSIT"];

function Check() {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-extrabold text-slate-950">
      ✓
    </span>
  );
}

export default function EnterprisePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-32 text-center">
        <div className="mb-4 text-[10px] font-black uppercase tracking-widest text-emerald-400">
          Enterprise Solutions
        </div>
        <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">
          AI Governance
          <br />
          <span className="gradient-accent">Built for Scale</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-300">
          Deploy enterprise-grade AI safety governance across your organisation. From 10 to
          100,000 employees — one platform, complete compliance.
        </p>
      </section>

      {/* Feature Cards */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center transition hover:-translate-y-2 hover:border-emerald-500/30 hover:bg-white/[0.05]"
            >
              <div className="mb-4 text-4xl">{feature.icon}</div>
              <h3 className="mb-3 text-xl font-bold text-white">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Compliance Checklist */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-4 text-[10px] font-black uppercase tracking-widest text-emerald-400">
          Security & Compliance
        </div>
        <h2 className="mb-10 text-3xl font-black tracking-tight sm:text-4xl">
          <span className="gradient-accent">Enterprise-Grade Checklist</span>
        </h2>
        <div className="grid max-w-3xl gap-4 md:grid-cols-2">
          {checklist.map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-emerald-500/30"
            >
              <Check />
              <span className="text-sm font-medium text-slate-200">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="bg-emerald-500/[0.03] py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-4 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Compare
          </div>
          <h2 className="mb-10 text-3xl font-black tracking-tight sm:text-4xl">
            <span className="gradient-accent">Why CSOAI vs Traditional Consultancies</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              <thead>
                <tr className="bg-emerald-500/10">
                  <th className="border-b border-white/10 p-4 text-left text-sm font-bold text-white">
                    Capability
                  </th>
                  <th className="border-b border-white/10 p-4 text-center text-sm font-bold text-emerald-400">
                    CSOAI
                  </th>
                  <th className="border-b border-white/10 p-4 text-center text-sm font-bold text-slate-300">
                    Big-4 Consultancy
                  </th>
                  <th className="border-b border-white/10 p-4 text-center text-sm font-bold text-slate-300">
                    In-House Team
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, index) => (
                  <tr
                    key={row.capability}
                    className={index % 2 === 1 ? "bg-white/[0.02]" : ""}
                  >
                    <td className="border-b border-white/10 p-4 text-sm text-slate-300">
                      {row.capability}
                    </td>
                    <td className="border-b border-white/10 p-4 text-center text-sm font-extrabold text-emerald-400">
                      {row.csoai}
                    </td>
                    <td className="border-b border-white/10 p-4 text-center text-sm text-slate-400">
                      {row.big4}
                    </td>
                    <td className="border-b border-white/10 p-4 text-center text-sm text-slate-400">
                      {row.inHouse}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <div className="mb-4 text-[10px] font-black uppercase tracking-widest text-emerald-400">
          Trusted By Leaders
        </div>
        <h2 className="mb-10 text-3xl font-black tracking-tight sm:text-4xl">
          <span className="gradient-accent">200+ Organisations Trust CSOAI</span>
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-50 sm:gap-12">
          {trusted.map((name) => (
            <span
              key={name}
              className="text-2xl font-bold tracking-tight text-white sm:text-3xl"
            >
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* Pricing + Buy Buttons (client component) */}
      <EnterpriseClient />
    </div>
  );
}
