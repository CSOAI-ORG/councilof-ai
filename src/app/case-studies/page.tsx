import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Case Studies",
  description:
    "See how organisations use CSOAI to accelerate AI governance, pass customer security reviews, and reduce regulatory risk.",
  openGraph: {
    title: "CSOAI Case Studies",
    description: "AI governance outcomes, measured.",
    images: ["/api/og?title=CSOAI%20Case%20Studies&desc=AI%20governance%20outcomes%2C%20measured."],
  },
  alternates: { canonical: "/case-studies" },
};

const cases = [
  {
    id: "fintech-readiness",
    industry: "FinTech",
    title: "From AI policy draft to ISO 42001 readiness in six weeks",
    challenge:
      "A payments AI team had model cards scattered across Notion, Confluence, and spreadsheets. A major enterprise prospect demanded proof of governance before contract close.",
    solution:
      "The team imported their AI systems into CSOAI, ran the EU AI Act classifier, linked policies to each model, and generated a Watchdog Certificate for the prospect.",
    metrics: [
      { value: "6", label: "weeks to ISO 42001 readiness" },
      { value: "70%", label: "reduction in audit prep time" },
      { value: "1", label: "public verify URL shared with prospect" },
    ],
    quote:
      "We closed the enterprise deal because the customer could verify our governance posture in 30 seconds instead of reading a 40-page PDF.",
    attribution: "Head of AI, FinTech scale-up",
  },
  {
    id: "healthcare-review",
    industry: "HealthTech",
    title: "Security review cycles collapsed from weeks to two days",
    challenge:
      "A clinical decision-support startup was stuck in back-and-forth procurement questionnaires. Every hospital asked for different evidence formats.",
    solution:
      "CSOAI aggregated their risk register, data flows, and subprocessor list into a signed attestation. The team shared a single verify URL and embedded the certificate badge in their security portal.",
    metrics: [
      { value: "60%", label: "faster procurement review cycles" },
      { value: "2", label: "days to first customer security sign-off" },
      { value: "90%", label: "fewer repeated evidence requests" },
    ],
    quote:
      "Procurement stopped asking 'do you have this document?' and started asking 'when can we go live?'.",
    attribution: "Co-founder, HealthTech startup",
  },
  {
    id: "enterprise-gap",
    industry: "Enterprise SaaS",
    title: "80% fewer AI compliance gaps before an Article 50 deadline",
    challenge:
      "A global SaaS vendor discovered late in the year that several AI features might fall under the EU AI Act. They needed a fast gap analysis across engineering, legal, and data science.",
    solution:
      "CSOAI mapped every AI feature to a risk class, surfaced missing transparency and human-oversight records, and generated a remediation plan with owner assignments.",
    metrics: [
      { value: "80%", label: "reduction in compliance gaps tracked" },
      { value: "3", label: "high-risk systems remediated in 30 days" },
      { value: "£2.1M", label: "estimated penalty exposure avoided" },
    ],
    quote:
      "CSOAI gave our board a single source of truth instead of five competing spreadsheets.",
    attribution: "AI Governance Lead, Enterprise SaaS",
  },
];

const schema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "CSOAI Case Studies",
  itemListElement: cases.map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "CaseSeries",
      name: c.title,
      description: c.challenge,
      about: { "@type": "Thing", name: c.industry },
    },
  })),
};

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Outcomes
          </div>
          <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">Case Studies</h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            Composite illustrations of how organisations use CSOAI to accelerate governance, close deals, and reduce
            regulatory risk.
          </p>
        </div>

        <div className="space-y-12">
          {cases.map((c) => (
            <article
              key={c.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
            >
              <div className="border-b border-white/10 bg-white/[0.02] px-6 py-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">{c.industry}</span>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">{c.title}</h2>
              </div>
              <div className="grid gap-8 p-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="mb-2 text-sm font-black uppercase tracking-widest text-slate-500">Challenge</h3>
                    <p className="text-slate-300">{c.challenge}</p>
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-black uppercase tracking-widest text-slate-500">Solution</h3>
                    <p className="text-slate-300">{c.solution}</p>
                  </div>
                  <blockquote className="border-l-4 border-emerald-500 pl-4 italic text-slate-400">
                    “{c.quote}”
                    <footer className="mt-2 text-sm not-italic text-slate-500">— {c.attribution}</footer>
                  </blockquote>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
                  <h3 className="mb-6 text-sm font-black uppercase tracking-widest text-slate-500">Results</h3>
                  <dl className="space-y-6">
                    {c.metrics.map((m) => (
                      <div key={m.label}>
                        <dt className="text-3xl font-black text-emerald-400">{m.value}</dt>
                        <dd className="text-sm text-slate-400">{m.label}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="mb-6 text-sm text-slate-500">
            Results are illustrative composites based on typical CSOAI engagements. Individual outcomes depend on scope,
            data quality, and organisational readiness.
          </p>
          <Link
            href="/contact"
            className="inline-flex rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            Tell us your use case
          </Link>
        </div>
      </div>
    </div>
  );
}
