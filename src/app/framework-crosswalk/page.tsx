import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "EU AI Act ↔ NIST AI RMF ↔ ISO 42001 Crosswalk",
  description:
    "A practical framework crosswalk mapping EU AI Act obligations to the NIST AI Risk Management Framework and ISO/IEC 42001. See how one control set satisfies three regimes and avoid duplicating compliance work.",
  openGraph: {
    title: "EU AI Act ↔ NIST AI RMF ↔ ISO 42001 Crosswalk",
    description:
      "Map EU AI Act obligations to NIST AI RMF functions and ISO/IEC 42001 clauses so one control set satisfies three regimes.",
    url: "https://csoai.org/framework-crosswalk",
    type: "article",
    images: ["/assets/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "EU AI Act ↔ NIST AI RMF ↔ ISO 42001 Crosswalk",
    description: "One control set, three regimes. Map EU AI Act to NIST AI RMF and ISO/IEC 42001.",
    images: ["/assets/og-image.png"],
  },
  alternates: { canonical: "/framework-crosswalk" },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "EU AI Act to NIST AI RMF to ISO/IEC 42001 Crosswalk",
  description:
    "A practical mapping of EU AI Act obligations against the NIST AI Risk Management Framework and ISO/IEC 42001 management-system clauses.",
  datePublished: "2026-06-19",
  dateModified: "2026-06-19",
  author: { "@type": "Organization", name: "CSOAI", url: "https://csoai.org" },
  publisher: {
    "@type": "Organization",
    name: "CSOAI",
    logo: { "@type": "ImageObject", url: "https://csoai.org/assets/og-image.png" },
  },
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://csoai.org/framework-crosswalk" },
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to use one control set across the EU AI Act, NIST AI RMF, and ISO 42001",
  description:
    "Steps to build a single, auditable control set that satisfies the EU AI Act, the NIST AI Risk Management Framework, and ISO/IEC 42001.",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Anchor on ISO/IEC 42001",
      text: "Stand up an AI management system (AIMS) under ISO/IEC 42001 as your governance backbone — policy, roles, risk treatment, and continual improvement.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Operationalise with NIST AI RMF",
      text: "Use the NIST AI RMF Govern, Map, Measure, and Manage functions to run the day-to-day risk activities your AIMS requires.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Bind to EU AI Act articles",
      text: "Map each EU AI Act high-risk obligation (Articles 9-15) and transparency duty (Article 50) onto the NIST function and ISO clause that already produces the evidence.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Generate one evidence trail",
      text: "Capture documentation once and reuse it across all three regimes — technical files, risk logs, and oversight records become a single auditable artefact.",
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Does ISO 42001 certification make me EU AI Act compliant?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. ISO/IEC 42001 is a voluntary management-system standard and a strong foundation, but it is not a substitute for the EU AI Act's specific legal obligations such as conformity assessment, EU database registration, and Article 50 transparency. It reduces the gap and provides much of the evidence, but legal obligations must be met directly.",
      },
    },
    {
      "@type": "Question",
      name: "Is the NIST AI RMF mandatory in the EU?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. The NIST AI Risk Management Framework is a voluntary US framework. It is not legally required in the EU, but its Govern, Map, Measure, and Manage functions map cleanly onto EU AI Act risk-management duties, so it is widely used to operationalise compliance.",
      },
    },
    {
      "@type": "Question",
      name: "Why use a crosswalk at all?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Because the three regimes overlap heavily. A crosswalk lets you build one control set and one evidence trail that satisfies the EU AI Act, NIST AI RMF, and ISO/IEC 42001 at once, instead of running three parallel compliance programmes.",
      },
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "Framework Crosswalk", item: "https://csoai.org/framework-crosswalk" },
  ],
};

const mappings = [
  {
    obligation: "Risk-management system (Art. 9)",
    nist: "Map & Manage",
    iso: "Cl. 6.1, 8.2–8.3",
    evidence: "Documented AI risk register with treatment plans and residual-risk sign-off.",
  },
  {
    obligation: "Data & data governance (Art. 10)",
    nist: "Map 2 / Measure 2",
    iso: "Annex A.7 (data for AI)",
    evidence: "Dataset documentation, bias checks, lineage and representativeness records.",
  },
  {
    obligation: "Technical documentation (Art. 11)",
    nist: "Govern 1",
    iso: "Cl. 7.5 documented info",
    evidence: "Living technical file / model card covering design, data, and performance.",
  },
  {
    obligation: "Record-keeping & logging (Art. 12)",
    nist: "Measure 1",
    iso: "Cl. 9.1 monitoring",
    evidence: "Automatic event logs retained for traceability and incident reconstruction.",
  },
  {
    obligation: "Transparency to deployers (Art. 13)",
    nist: "Govern 4 / Map 5",
    iso: "Annex A.8 (system info)",
    evidence: "Instructions for use describing capabilities, limits, and oversight needs.",
  },
  {
    obligation: "Human oversight (Art. 14)",
    nist: "Manage 1",
    iso: "Annex A.9 (human oversight)",
    evidence: "Documented oversight design — stop controls, escalation, competence.",
  },
  {
    obligation: "Accuracy, robustness, cybersecurity (Art. 15)",
    nist: "Measure 2 / Manage 4",
    iso: "Cl. 8.1 / Annex A.6",
    evidence: "Performance, adversarial-robustness, and security test evidence.",
  },
  {
    obligation: "Transparency obligations (Art. 50)",
    nist: "Govern 4",
    iso: "Annex A.8",
    evidence: "AI-interaction disclosures and machine-readable content provenance.",
  },
  {
    obligation: "Quality management system (Art. 17)",
    nist: "Govern (all)",
    iso: "Cl. 4–10 (the AIMS)",
    evidence: "The ISO 42001 management system itself acts as the QMS evidence base.",
  },
  {
    obligation: "Post-market monitoring (Art. 72)",
    nist: "Manage 4",
    iso: "Cl. 9.1, 10.2",
    evidence: "Monitoring plan, incident handling, and continual-improvement loop.",
  },
];

export default function FrameworkCrosswalkPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Hero */}
      <section className="flex min-h-[42vh] items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 pt-24 pb-16 text-center sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Framework <span className="text-emerald-500">Crosswalk</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-300">
            EU AI Act ↔ NIST AI RMF ↔ ISO/IEC 42001. Three regimes, one control set. Map your
            obligations once, generate one evidence trail, and stop running parallel compliance
            programmes.
          </p>
        </div>
      </section>

      {/* Three regimes */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
            The three <span className="text-emerald-500">regimes</span>
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-emerald-500/30">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
                Law — EU
              </span>
              <h3 className="mb-2 mt-2 text-lg font-bold text-white">EU AI Act</h3>
              <p className="text-sm leading-relaxed text-slate-300">
                Regulation (EU) 2024/1689. Binding, risk-based law with prohibited practices,
                high-risk obligations (Articles 9–15), and Article 50 transparency duties. Penalties
                up to €35m or 7% of turnover. Article 50 and Annex III apply 2 Aug 2026.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-emerald-500/30">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
                Framework — US
              </span>
              <h3 className="mb-2 mt-2 text-lg font-bold text-white">NIST AI RMF</h3>
              <p className="text-sm leading-relaxed text-slate-300">
                Voluntary US framework (AI RMF 1.0). Organised around four functions — Govern, Map,
                Measure, Manage — to identify and treat AI risk across the lifecycle. Widely used to
                operationalise legal obligations.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-emerald-500/30">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
                Standard — ISO/IEC
              </span>
              <h3 className="mb-2 mt-2 text-lg font-bold text-white">ISO/IEC 42001</h3>
              <p className="text-sm leading-relaxed text-slate-300">
                The first certifiable AI management-system standard. A Plan-Do-Check-Act backbone
                (clauses 4–10) plus Annex A controls. Provides the governance structure and audit
                trail regulators expect.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Obligation mapping */}
      <section className="bg-white/[0.02] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
            Obligation <span className="text-emerald-500">mapping</span>
          </h2>
          <p className="mb-6 max-w-3xl leading-relaxed text-slate-300">
            Each EU AI Act obligation maps to a NIST AI RMF function and an ISO/IEC 42001 clause that
            already produces the relevant evidence. Build the control once; satisfy all three.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="bg-white/[0.03] px-4 py-3 font-bold text-emerald-400">
                    EU AI Act obligation
                  </th>
                  <th className="bg-white/[0.03] px-4 py-3 font-bold text-emerald-400">
                    NIST AI RMF
                  </th>
                  <th className="bg-white/[0.03] px-4 py-3 font-bold text-emerald-400">
                    ISO/IEC 42001
                  </th>
                  <th className="bg-white/[0.03] px-4 py-3 font-bold text-emerald-400">
                    Shared control / evidence
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-slate-300">
                {mappings.map((row, i) => (
                  <tr key={i} className={i % 2 === 1 ? "bg-white/[0.02]" : ""}>
                    <td className="px-4 py-3 align-top font-semibold text-white">
                      {row.obligation}
                    </td>
                    <td className="px-4 py-3 align-top">{row.nist}</td>
                    <td className="px-4 py-3 align-top">{row.iso}</td>
                    <td className="px-4 py-3 align-top">{row.evidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-xs leading-relaxed text-slate-500">
            Mappings are indicative and based on the published EU AI Act (Regulation (EU) 2024/1689),
            NIST AI RMF 1.0, and ISO/IEC 42001:2023. Article and clause references can shift with
            guidance and revisions; confirm against current source texts. Not legal advice.
          </p>
        </div>
      </section>

      {/* How to use it */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
            How to <span className="text-emerald-500">use it</span>
          </h2>
          <div className="space-y-4 leading-relaxed text-slate-300">
            <p>
              <strong className="text-white">1. Anchor on ISO/IEC 42001.</strong> Stand up an AI
              management system as your governance backbone — policy, roles, risk treatment,
              continual improvement.
            </p>
            <p>
              <strong className="text-white">2. Operationalise with NIST AI RMF.</strong> Run the
              Govern / Map / Measure / Manage functions as the day-to-day activities your management
              system requires.
            </p>
            <p>
              <strong className="text-white">3. Bind to EU AI Act articles.</strong> Use the table
              above to attach each legal obligation to the function and clause that already
              generates the evidence.
            </p>
            <p>
              <strong className="text-white">4. Generate one evidence trail.</strong> Capture
              documentation once and reuse it across all three regimes for audits, conformity
              assessment, and certification.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/high-risk-classifier"
              className="inline-flex rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              Check your risk tier first
            </Link>
            <Link
              href="/article-50-explained"
              className="inline-flex rounded-lg border-2 border-emerald-500 bg-transparent px-6 py-3 text-sm font-bold text-emerald-500 transition hover:bg-emerald-500/10"
            >
              Article 50 deep dive
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ section for visible preservation and schema context */}
      <section className="bg-white/[0.02] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">
            Common <span className="text-emerald-500">questions</span>
          </h2>
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="mb-2 font-bold text-white">
                Does ISO 42001 certification make me EU AI Act compliant?
              </h3>
              <p className="text-sm leading-relaxed text-slate-300">
                No. ISO/IEC 42001 is a voluntary management-system standard and a strong foundation,
                but it is not a substitute for the EU AI Act&apos;s specific legal obligations such
                as conformity assessment, EU database registration, and Article 50 transparency. It
                reduces the gap and provides much of the evidence, but legal obligations must be met
                directly.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="mb-2 font-bold text-white">Is the NIST AI RMF mandatory in the EU?</h3>
              <p className="text-sm leading-relaxed text-slate-300">
                No. The NIST AI Risk Management Framework is a voluntary US framework. It is not
                legally required in the EU, but its Govern, Map, Measure, and Manage functions map
                cleanly onto EU AI Act risk-management duties, so it is widely used to
                operationalise compliance.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="mb-2 font-bold text-white">Why use a crosswalk at all?</h3>
              <p className="text-sm leading-relaxed text-slate-300">
                Because the three regimes overlap heavily. A crosswalk lets you build one control set
                and one evidence trail that satisfies the EU AI Act, NIST AI RMF, and ISO/IEC 42001
                at once, instead of running three parallel compliance programmes.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
