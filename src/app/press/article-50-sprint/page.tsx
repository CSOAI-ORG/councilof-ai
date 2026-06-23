import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MEOK AI Labs ships open-source EU Code-of-Practice-ready compliance suite — CSOAI Press",
  description:
    "Three new MCP servers give developers Ed25519-signed, offline-verifiable compliance for the EU AI Act's 2 August 2026 Article 50 transparency obligations.",
  alternates: { canonical: "/press/article-50-sprint" },
};

export default function Article50SprintPressPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline:
      "MEOK AI Labs ships first open-source EU Code-of-Practice-ready AI compliance suite — 48 days before the Article 50 cliff",
    datePublished: "2026-06-15",
    dateline: "London, UK",
    author: { "@type": "Organization", name: "CSOAI / MEOK AI Labs" },
    publisher: {
      "@type": "Organization",
      name: "CSOAI",
      logo: { "@type": "ImageObject", url: "https://csoai.org/assets/og-image.png" },
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <header className="mb-12 border-b border-white/10 pb-12">
          <p className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-4">
            Press release · 15 June 2026
          </p>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tighter mb-6">
            MEOK AI Labs ships first open-source EU Code-of-Practice-ready AI compliance suite — 48
            days before the Article 50 cliff
          </h1>
          <p className="text-lg text-slate-400">
            Three MCP servers — content marking, psychological-vulnerability audit, Annex III
            classifier — all MIT-licensed, all Ed25519-signed, all offline-verifiable by any auditor.
          </p>
        </header>

        <div className="prose prose-invert prose-lg max-w-none text-slate-300">
          <p className="lead text-xl text-white">
            <strong>LONDON, UK — 15 June 2026</strong> — MEOK AI Labs (CSOAI Ltd) today released
            three new open-source Model Context Protocol (MCP) servers that give AI developers
            cryptographically-signed, offline-verifiable compliance with the EU AI Act&apos;s most
            pressing obligations: the 2 August 2026 Article 50 transparency cliff, the 12 May 2026
            Digital Omnibus Article 5(1)(f) psychological-vulnerability prohibition, and the 2
            December 2027 Annex III high-risk classification deadline.
          </p>

          <p>The three servers are:</p>

          <ol className="space-y-4">
            <li>
              <strong>meok-eu-code-of-practice-mcp</strong> — implements the EU Code of Practice on
              AI content marking. Wraps C2PA Content Credentials (Layer 1) + watermarking (Layer 2)
              into a single signed manifest, with a public verify_url any auditor can check without
              contacting MEOK.
            </li>
            <li>
              <strong>meok-ai-psych-vuln-audit-mcp</strong> — implements the Article 5(1)(f)
              prohibition on AI systems that exploit psychological vulnerabilities. Ships with a
              12-pattern gambling-vertical rubric keyed to the EU AI Act and UK Gambling Commission
              LCCP social responsibility codes.
            </li>
            <li>
              <strong>meok-annex-iii-impact-mcp</strong> — automated Annex III high-risk
              classification + Article 27 Fundamental Rights Impact Assessment generation + Annex IV
              technical documentation, all in deterministic offline keyword weighting with no LLM
              calls.
            </li>
          </ol>

          <p>
            All three servers use Ed25519 signatures over canonical JSON. Every response includes a
            signature field and a verify_url pointing to the public MEOK attestation API. Auditors
            can verify any output offline using the public key — no MEOK account, API call or
            involvement required.
          </p>

          <blockquote className="border-l-4 border-emerald-500 pl-6 italic text-xl text-white my-8">
            “China regulated content marking in 2023. The EU follows in 2026. The 2 August cliff is
            not a surprise — it&apos;s a predictable regulatory event. We built the compliance stack for
            it, and we&apos;re giving it away open-source, because the demand is going to be enormous and
            the only way to serve it is to make the tools free.”
            <footer className="text-sm text-slate-500 mt-2 not-italic">
              — Nicholas Templeman, Founder, MEOK AI Labs
            </footer>
          </blockquote>

          <p>
            The servers are installable via pip, MIT-licensed, and registered in the official MCP
            Registry.
          </p>
        </div>

        <footer className="mt-16 pt-8 border-t border-white/10 text-slate-500 text-sm">
          <p>
            <strong>Contact:</strong>{" "}
            <a href="mailto:press@meok.ai" className="text-emerald-400 hover:underline">
              press@meok.ai
            </a>
          </p>
          <p className="mt-2">
            <strong>About CSOAI:</strong> CSOAI Ltd (UK Companies House 16939677) is the Council for
            Safety of AI, building Layer 0 identity, certification and governance infrastructure for
            the agent economy.
          </p>
        </footer>
      </article>
    </div>
  );
}
