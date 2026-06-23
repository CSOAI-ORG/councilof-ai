import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "EU AI Act Article 50 Explained — Transparency Obligations & the 2 Aug 2026 Deadline",
  description:
    "EU AI Act Article 50 explained: who is affected, the transparency obligations for chatbots, deepfakes, and AI-generated content, the 2 August 2026 deadline, and a practical compliance checklist.",
  openGraph: {
    title: "EU AI Act Article 50 Explained — Transparency Obligations",
    description:
      "Plain-English guide to Article 50 of the EU AI Act: transparency duties for chatbots, synthetic content, deepfakes, and emotion recognition, with the 2 August 2026 deadline.",
    url: "https://csoai.org/article-50-explained",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "EU AI Act Article 50 Explained",
    description: "Transparency obligations for chatbots, deepfakes, and AI-generated content — deadline 2 August 2026.",
  },
  alternates: { canonical: "/article-50-explained" },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "EU AI Act Article 50 Explained: Transparency Obligations and the 2 August 2026 Deadline",
  description:
    "A plain-English explainer of Article 50 of the EU AI Act, covering who is affected, what disclosures are required for chatbots, deepfakes, and AI-generated content, and how to comply before the deadline.",
  datePublished: "2026-06-19",
  dateModified: "2026-06-19",
  author: { "@type": "Organization", name: "CSOAI", url: "https://csoai.org" },
  publisher: {
    "@type": "Organization",
    name: "CSOAI",
    logo: { "@type": "ImageObject", url: "https://csoai.org/assets/og-image.png" },
  },
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://csoai.org/article-50-explained" },
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
    {
      "@type": "Question",
      name: "Are there exceptions to the disclosure duties?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Disclosure of AI interaction is not required where it is obvious to a reasonably informed person. Certain law-enforcement uses are exempt, and creative or satirical deepfakes have lighter, non-intrusive labelling requirements.",
      },
    },
  ],
};

export default function Article50ExplainedPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
        {/* Hero */}
        <section className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full border border-red-400/30 bg-red-500/10 px-4 py-1 text-sm font-semibold text-red-300">
            ⏱ Applies 2 August 2026
          </span>
          <h1 className="mb-6 text-3xl font-black tracking-tighter sm:text-5xl lg:text-6xl">
            EU AI Act <span className="text-emerald-400">Article 50</span> Explained
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-300">
            Article 50 is the transparency backbone of the EU AI Act. If your product talks to people, generates
            content, or creates synthetic media, it almost certainly applies to you — even if your system is not
            high-risk.
          </p>
        </section>

        {/* What Article 50 actually says */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
            What <span className="text-emerald-400">Article 50</span> actually says
          </h2>
          <div className="space-y-4 leading-relaxed text-slate-300">
            <p>
              Article 50 of Regulation (EU) 2024/1689 imposes transparency obligations on AI that interacts with, or
              produces content for, natural persons. The idea is simple: people have a right to know when they are
              dealing with a machine or with machine-made content. It splits duties between{" "}
              <strong className="text-white">providers</strong> (who build and place systems on the market) and{" "}
              <strong className="text-white">deployers</strong> (who put them to use professionally).
            </p>
          </div>

          <h3 className="mb-3 mt-8 text-lg font-bold text-emerald-400">Provider duties</h3>
          <p className="leading-relaxed text-slate-300">
            Providers must design AI systems that interact with people so those people are informed they are dealing with
            an AI — unless that is obvious to a reasonably well-informed person. Providers of generative systems must
            mark outputs (audio, image, video, text) as artificially generated or manipulated, in a{" "}
            <strong className="text-white">machine-readable</strong> format, so detection tools and platforms can pick
            it up.
          </p>

          <h3 className="mb-3 mt-8 text-lg font-bold text-emerald-400">Deployer duties</h3>
          <p className="leading-relaxed text-slate-300">
            Deployers of emotion-recognition or biometric-categorisation systems must inform the people exposed to them.
            Deployers who generate or manipulate deepfakes must disclose that the content is artificial. Where
            AI-generated text is published to inform the public on matters of public interest, the deployer must disclose
            it — unless the content underwent human editorial review and a person holds editorial responsibility.
          </p>
        </section>

        {/* Who is affected */}
        <section className="mb-16 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <h2 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
            Who is <span className="text-emerald-400">affected?</span>
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h4 className="mb-4 text-lg font-bold text-emerald-400">You are in scope if you operate…</h4>
              <ul className="space-y-2 text-slate-300">
                {[
                  "Customer-facing chatbots or voice assistants",
                  "Generative text, image, audio, or video tools",
                  "Deepfake or face/voice-swap features",
                  "Emotion recognition or biometric categorisation",
                  "AI that auto-publishes news or public-interest text",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-emerald-500">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h4 className="mb-4 text-lg font-bold text-emerald-400">Territorial reach</h4>
              <p className="leading-relaxed text-slate-300">
                Article 50 follows the market, not the company. If your system&apos;s output is used in the EU, you are
                in scope regardless of where you are headquartered. Both EU and non-EU providers and deployers carry the
                duties, and non-EU providers may need an authorised representative.
              </p>
            </div>
          </div>
        </section>

        {/* Obligations table */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
            The <span className="text-emerald-400">obligations</span> at a glance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="bg-white/[0.03] px-4 py-3 font-bold text-emerald-400">Trigger</th>
                  <th className="bg-white/[0.03] px-4 py-3 font-bold text-emerald-400">Who</th>
                  <th className="bg-white/[0.03] px-4 py-3 font-bold text-emerald-400">What you must do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-slate-300">
                <tr>
                  <td className="px-4 py-3 align-top">System interacts with people</td>
                  <td className="px-4 py-3 align-top font-semibold text-white">Provider</td>
                  <td className="px-4 py-3 align-top">Inform users they are interacting with an AI, unless obvious.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 align-top">Generative output (text/image/audio/video)</td>
                  <td className="px-4 py-3 align-top font-semibold text-white">Provider</td>
                  <td className="px-4 py-3 align-top">
                    Mark output as AI-generated in a machine-readable, interoperable format.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 align-top">Deepfake content</td>
                  <td className="px-4 py-3 align-top font-semibold text-white">Deployer</td>
                  <td className="px-4 py-3 align-top">Disclose the content is artificially generated or manipulated.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 align-top">Emotion recognition / biometric categorisation</td>
                  <td className="px-4 py-3 align-top font-semibold text-white">Deployer</td>
                  <td className="px-4 py-3 align-top">Inform the exposed persons and process data lawfully.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 align-top">AI-generated public-interest text</td>
                  <td className="px-4 py-3 align-top font-semibold text-white">Deployer</td>
                  <td className="px-4 py-3 align-top">
                    Disclose unless human-reviewed with editorial responsibility.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Key dates */}
        <section className="mb-16 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <h2 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
            Key <span className="text-emerald-400">dates</span>
          </h2>
          <ul className="space-y-4 text-slate-300">
            {[
              { date: "1 August 2024", text: "Regulation (EU) 2024/1689 enters into force." },
              { date: "2 February 2025", text: "Prohibited practices (Article 5) and AI-literacy duties apply." },
              { date: "2 August 2025", text: "Obligations for general-purpose AI models and governance bodies apply." },
              {
                date: "2 August 2026",
                text: "Article 50 transparency obligations apply, along with Annex III high-risk rules.",
                strong: true,
              },
              { date: "2 August 2027", text: "High-risk rules for Annex I product-safety systems apply." },
            ].map(({ date, text, strong }) => (
              <li key={date} className="relative pl-6">
                <span className="absolute left-0 top-2 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <strong className={strong ? "text-white" : "text-slate-200"}>{date}</strong> —{" "}
                {strong ? <strong className="text-white">{text}</strong> : text}
              </li>
            ))}
          </ul>
        </section>

        {/* Compliance checklist */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
            Compliance <span className="text-emerald-400">checklist</span>
          </h2>
          <p className="mb-6 leading-relaxed text-slate-300">
            A practical starting point for Article 50 readiness before the 2 August 2026 deadline:
          </p>
          <ul className="mb-8 space-y-3 text-slate-300">
            {[
              "Inventory every AI surface that talks to users or generates content.",
              'Add a clear "you are talking to an AI" disclosure to chatbots and assistants.',
              "Embed machine-readable provenance (e.g. C2PA / watermarking) into generative outputs.",
              "Label deepfakes and synthetic media at the point of publication.",
              "Notify users subject to emotion recognition or biometric categorisation.",
              "Document an editorial-review process for any AI-published public-interest text.",
              "Record your assessment so you can demonstrate compliance to regulators.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="text-emerald-500">☐</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <p className="mb-6 leading-relaxed text-slate-300">
            Not sure which tier your system sits in? Start with the interactive checker, then map your controls across
            frameworks.
          </p>
          <div className="flex flex-col flex-wrap gap-4 sm:flex-row">
            <Link
              href="/high-risk-classifier"
              className="inline-flex rounded-lg bg-emerald-500 px-6 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              Run the high-risk checker
            </Link>
            <Link
              href="/framework-crosswalk"
              className="inline-flex rounded-lg border-2 border-emerald-500/80 bg-transparent px-6 py-3 text-center text-sm font-bold text-emerald-400 transition hover:bg-emerald-500/10"
            >
              See the framework crosswalk
            </Link>
          </div>

          <p className="mt-8 border-t border-white/10 pt-4 text-sm text-slate-500">
            This explainer summarises the published text of Regulation (EU) 2024/1689 for educational purposes. It is not
            legal advice. Always confirm specifics against the official text and qualified counsel.
          </p>
        </section>
      </article>
    </div>
  );
}
