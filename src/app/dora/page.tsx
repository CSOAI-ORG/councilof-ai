import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "DORA Compliance",
  description:
    "CSOAI DORA compliance infrastructure: ICT risk mapping, third-party attestations, incident reporting, and resilience testing for financial entities and their ICT providers.",
  openGraph: {
    title: "CSOAI DORA Compliance",
    description: "DORA ICT risk management, third-party attestations, and resilience testing.",
    images: ["/api/og?title=DORA%20Compliance&desc=ICT%20risk%20management%2C%20third-party%20attestations%2C%20and%20resilience%20testing%20for%20financial%20entities."],
  },
  alternates: { canonical: "/dora" },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "DORA Compliance", item: "https://csoai.org/dora" },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Who must comply with DORA?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "DORA applies to EU financial entities including banks, insurers, investment firms, payment providers, and their critical ICT third-party providers.",
      },
    },
    {
      "@type": "Question",
      name: "What are the five DORA pillars?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ICT risk management, ICT-related incident management and reporting, digital operational resilience testing, third-party risk management, and information-sharing arrangements.",
      },
    },
    {
      "@type": "Question",
      name: "How does CSOAI help with DORA?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CSOAI maps AI and ICT systems, issues signed third-party attestations, automates incident evidence packs, and provides BFT-governed resilience test records.",
      },
    },
  ],
};

export default function DoraPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="mx-auto max-w-4xl px-4 py-20">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-400">
          In force now
        </div>
        <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">DORA Compliance</h1>
        <p className="mb-12 text-lg text-slate-400">
          The Digital Operational Resilience Regulation is live. Financial entities and ICT providers need mapped systems,
          signed attestations, and resilient AI governance. CSOAI provides the Layer 0 infrastructure.
        </p>

        <div className="mb-12 grid gap-6 sm:grid-cols-2">
          {[
            { title: "ICT risk mapping", desc: "Map every AI system, API, and third-party dependency to DORA Article 6 requirements." },
            { title: "Third-party attestations", desc: "Issue Ed25519-signed attestations for critical ICT providers that financial entities can submit to lead overseers." },
            { title: "Incident evidence packs", desc: "Auto-generate classification, root-cause, and notification evidence for major ICT-related incidents." },
            { title: "Resilience test records", desc: "Log TIBER-EU style tests, red-team findings, and remediation sign-off on the BFT audit chain." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="mb-2 font-bold text-emerald-400">{item.title}</h3>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mb-12 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8">
          <h2 className="mb-4 text-2xl font-bold">Get DORA-ready</h2>
          <p className="mb-6 text-slate-300">
            Start with a DORA ICT risk scan. We map your AI/ICT footprint, identify third-party attestations you need,
            and produce a signed readiness report.
          </p>
          <Link href="/pricing" className="inline-block rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-600">
            See DORA pricing →
          </Link>
        </div>

        <h2 className="mb-6 text-2xl font-bold">Frequently asked questions</h2>
        <div className="space-y-3">
          {faqSchema.mainEntity.map((f) => (
            <details key={f.name} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <summary className="cursor-pointer font-bold">{f.name}</summary>
              <p className="mt-2 leading-relaxed text-slate-400">{f.acceptedAnswer.text}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
