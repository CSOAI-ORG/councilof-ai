import { useEffect } from "react";
import { Link } from "wouter";

/**
 * Article 50 Explained — ported from donor csoai-org-v2
 * (src/app/article-50-explained/page.tsx) per CONSOLIDATION.md.
 *
 * Plain-English explainer with Article + FAQ JSON-LD (GEO/AEO asset).
 * Rethemed to the master wing (dark-emerald on #03110b). Changes from the donor:
 *  - next/link + Next Metadata -> wouter + document.title (Vite SPA).
 *  - Donor CTAs pointed at donor-only routes (/high-risk-classifier,
 *    /framework-crosswalk); repointed at the master equivalents
 *    (/assess, /crosswalk).
 *  - Checklist bullets: "☐" glyph replaced with a CSS square (no emoji register).
 */

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "EU AI Act Article 50 Explained: Transparency Obligations and the 2 Aug 2026 Deadline",
  description:
    "A plain-English explainer of Article 50 of the EU AI Act, covering who is affected, what disclosures are required for chatbots, deepfakes, and AI-generated content, and how to comply.",
  datePublished: "2026-06-19",
  dateModified: "2026-08-02",
  author: { "@type": "Organization", name: "CSOAI", url: "https://www.csoai.org" },
  publisher: {
    "@type": "Organization",
    name: "CSOAI",
    logo: { "@type": "ImageObject", url: "https://www.csoai.org/assets/og-image.png" },
  },
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://www.csoai.org/article-50-explained" },
  about: { "@type": "Legislation", name: "Regulation (EU) 2024/1689 (EU Artificial Intelligence Act), Article 50" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What does Article 50 of the EU AI Act require?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Article 50 sets transparency obligations. Providers must ensure systems that interact with people disclose they are AI, and that AI-generated audio, image, video, and text are marked in a machine-readable format. Deployers must disclose emotion recognition and biometric categorisation, label deepfakes, and disclose AI-generated text published to inform the public on matters of public interest.",
      },
    },
    {
      "@type": "Question",
      name: "When does Article 50 take effect?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Article 50 transparency obligations apply from 2 August 2026, which is 24 months after the Regulation entered into force on 1 August 2024.",
      },
    },
    {
      "@type": "Question",
      name: "Who has to comply with Article 50?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Both providers (those who develop and place systems on the market) and deployers (those who use them professionally) have duties. It applies to any operator whose system is used in the EU, regardless of where the operator is established.",
      },
    },
    {
      "@type": "Question",
      name: "What are the penalties for breaching Article 50?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Non-compliance with transparency obligations can attract fines of up to €15 million or 3% of total worldwide annual turnover, whichever is higher.",
      },
    },
  ],
};

const IN_SCOPE = [
  "Customer-facing chatbots or voice assistants",
  "Generative text, image, audio, or video tools",
  "Deepfake or face/voice-swap features",
  "Emotion recognition or biometric categorisation",
  "AI that auto-publishes news or public-interest text",
];

const OBLIGATION_ROWS: [string, string, string][] = [
  ["System interacts with people", "Provider", "Inform users they are interacting with an AI, unless obvious."],
  ["Generative output (text/image/audio/video)", "Provider", "Mark output as AI-generated in a machine-readable, interoperable format."],
  ["Deepfake content", "Deployer", "Disclose the content is artificially generated or manipulated."],
  ["Emotion recognition / biometric categorisation", "Deployer", "Inform the exposed persons and process data lawfully."],
  ["AI-generated public-interest text", "Deployer", "Disclose unless human-reviewed with editorial responsibility."],
];

const KEY_DATES: { date: string; text: string; strong?: boolean }[] = [
  { date: "1 August 2024", text: "Regulation (EU) 2024/1689 enters into force." },
  { date: "2 February 2025", text: "Prohibited practices (Article 5) and AI-literacy duties apply." },
  { date: "2 August 2025", text: "Obligations for general-purpose AI models and governance bodies apply." },
  { date: "2 August 2026", text: "Article 50 transparency obligations apply, with the full penalty and market-surveillance regime.", strong: true },
  { date: "2 December 2027", text: "Annex III high-risk rules apply (deferred by the Digital Omnibus, Reg (EU) 2026/1744)." },
  { date: "2 August 2028", text: "High-risk rules for Annex I product-safety systems apply (Digital Omnibus)." },
];

const CHECKLIST = [
  "Inventory every AI surface that talks to users or generates content.",
  'Add a clear "you are talking to an AI" disclosure to chatbots and assistants.',
  "Embed machine-readable provenance (e.g. C2PA / watermarking) into generative outputs.",
  "Label deepfakes and synthetic media at the point of publication.",
  "Notify users subject to emotion recognition or biometric categorisation.",
  "Document an editorial-review process for any AI-published public-interest text.",
  "Record your assessment so you can demonstrate compliance to regulators.",
];

export default function Article50Explained() {
  useEffect(() => {
    document.title = "EU AI Act Article 50 Explained — transparency obligations | CSOAI";
  }, []);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>

      <article className="mx-auto max-w-4xl px-6 pt-14 pb-16">
        <section className="mb-16 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
            Regulation (EU) 2024/1689 · transparency
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-4xl">
            EU AI Act <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">Article 50</span> Explained
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-emerald-100/75">
            Article 50 is the transparency backbone of the EU AI Act. If your product talks to
            people, generates content, or creates synthetic media, it almost certainly applies to
            you — even if your system is not high-risk.
          </p>
        </section>

        {/* What Article 50 actually says */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
            What <span className="text-emerald-300">Article 50</span> actually says
          </h2>
          <p className="leading-relaxed text-emerald-100/75">
            Article 50 of Regulation (EU) 2024/1689 imposes transparency obligations on AI that
            interacts with, or produces content for, natural persons. The idea is simple: people
            have a right to know when they are dealing with a machine or with machine-made content.
            It splits duties between <strong className="text-emerald-50">providers</strong> (who
            build and place systems on the market) and{" "}
            <strong className="text-emerald-50">deployers</strong> (who put them to use
            professionally).
          </p>

          <h3 className="mb-3 mt-8 text-lg font-bold text-emerald-300">Provider duties</h3>
          <p className="leading-relaxed text-emerald-100/75">
            Providers must design AI systems that interact with people so those people are informed
            they are dealing with an AI — unless that is obvious to a reasonably well-informed
            person. Providers of generative systems must mark outputs (audio, image, video, text) as
            artificially generated or manipulated, in a{" "}
            <strong className="text-emerald-50">machine-readable</strong> format, so detection tools
            and platforms can pick it up.
          </p>

          <h3 className="mb-3 mt-8 text-lg font-bold text-emerald-300">Deployer duties</h3>
          <p className="leading-relaxed text-emerald-100/75">
            Deployers of emotion-recognition or biometric-categorisation systems must inform the
            people exposed to them. Deployers who generate or manipulate deepfakes must disclose
            that the content is artificial. Where AI-generated text is published to inform the
            public on matters of public interest, the deployer must disclose it — unless the content
            underwent human editorial review and a person holds editorial responsibility.
          </p>
        </section>

        {/* Who is affected */}
        <section className="mb-16 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6 sm:p-8">
          <h2 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
            Who is <span className="text-emerald-300">affected?</span>
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/15 bg-black/20 p-6">
              <h4 className="mb-4 text-lg font-bold text-emerald-300">You are in scope if you operate…</h4>
              <ul className="space-y-2 text-emerald-100/75">
                {IN_SCOPE.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full bg-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-emerald-500/15 bg-black/20 p-6">
              <h4 className="mb-4 text-lg font-bold text-emerald-300">Territorial reach</h4>
              <p className="leading-relaxed text-emerald-100/75">
                Article 50 follows the market, not the company. If your system&apos;s output is used
                in the EU, you are in scope regardless of where you are headquartered. Both EU and
                non-EU providers and deployers carry the duties, and non-EU providers may need an
                authorised representative.
              </p>
            </div>
          </div>
        </section>

        {/* Obligations table */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
            The <span className="text-emerald-300">obligations</span> at a glance
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-emerald-500/20">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-emerald-500/15 bg-[#05140d] text-left">
                  <th className="px-4 py-3 font-bold text-emerald-300">Trigger</th>
                  <th className="px-4 py-3 font-bold text-emerald-300">Who</th>
                  <th className="px-4 py-3 font-bold text-emerald-300">What you must do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-500/10 text-emerald-100/75">
                {OBLIGATION_ROWS.map(([trigger, who, what]) => (
                  <tr key={trigger}>
                    <td className="px-4 py-3 align-top">{trigger}</td>
                    <td className="px-4 py-3 align-top font-semibold text-emerald-50">{who}</td>
                    <td className="px-4 py-3 align-top">{what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Key dates */}
        <section className="mb-16 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6 sm:p-8">
          <h2 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
            Key <span className="text-emerald-300">dates</span>
          </h2>
          <ul className="space-y-4 text-emerald-100/75">
            {KEY_DATES.map(({ date, text, strong }) => (
              <li key={date} className="relative pl-6">
                <span className="absolute left-0 top-2 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <strong className={strong ? "text-emerald-50" : "text-emerald-100/85"}>{date}</strong> —{" "}
                {strong ? <strong className="text-emerald-50">{text}</strong> : text}
              </li>
            ))}
          </ul>
        </section>

        {/* Compliance checklist */}
        <section className="mb-8">
          <h2 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
            Compliance <span className="text-emerald-300">checklist</span>
          </h2>
          <p className="mb-6 leading-relaxed text-emerald-100/75">
            A practical starting point for Article 50 readiness:
          </p>
          <ul className="mb-8 space-y-3 text-emerald-100/75">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1.5 inline-block h-3 w-3 flex-shrink-0 rounded-[3px] border-2 border-emerald-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <p className="mb-6 leading-relaxed text-emerald-100/75">
            Not sure which tier your system sits in? Start with the signed assessment, then map your
            controls across frameworks.
          </p>
          <div className="flex flex-col flex-wrap gap-4 sm:flex-row">
            <Link
              href="/assess"
              className="inline-flex rounded-lg bg-emerald-500 px-6 py-3 text-center text-sm font-bold text-[#03110b] transition hover:bg-emerald-400"
            >
              Run the free AI assessment
            </Link>
            <Link
              href="/crosswalk"
              className="inline-flex rounded-lg border-2 border-emerald-500/60 bg-transparent px-6 py-3 text-center text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/10"
            >
              See the framework crosswalk
            </Link>
            <Link
              href="/article-50"
              className="inline-flex rounded-lg border-2 border-emerald-500/60 bg-transparent px-6 py-3 text-center text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/10"
            >
              Estimate your exposure
            </Link>
          </div>

          <p className="mt-8 border-t border-emerald-500/15 pt-4 text-sm text-emerald-100/50">
            This explainer summarises the published text of Regulation (EU) 2024/1689 for
            educational purposes. It is not legal advice. Always confirm specifics against the
            official text and qualified counsel.
          </p>
        </section>
      </article>
    </div>
  );
}
