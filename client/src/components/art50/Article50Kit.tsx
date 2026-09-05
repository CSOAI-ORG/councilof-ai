import { useEffect, useState } from "react";

/**
 * Article 50 Kit — ported from donor csoai-org-v2
 * (src/app/article-50-kit/{page,Article50KitClient}.tsx) per CONSOLIDATION.md.
 *
 * Product page for the £999 kit, wired to the real meok-watermark-attest-mcp
 * on PyPI (9 tools, surfaced from source). Rethemed to the master wing
 * (dark-emerald on #03110b). Changes from the donor:
 *  - next/link + Next Metadata -> wouter + document.title (Vite SPA).
 *  - Donor posted to /api/checkout (a Next API route that does not exist in
 *    the master) with a Stripe-link fallback; the port uses the canonical
 *    Stripe payment links directly — same links, no dead hop.
 *  - "bespoke cert + 1-on-1 with the council" reworded to the attestation
 *    register (signed attestation + review session).
 *  - JSON-LD Product/SoftwareApplication/FAQ/Breadcrumb schemas kept verbatim.
 *
 * The Stripe URLs are the canonical ladder from meok-attestation-api/checkout.
 */

const DEADLINE_UTC = "2026-08-02T00:00:00Z";

function daysUntil(iso: string): number {
  const now = new Date();
  const target = new Date(iso);
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000));
}

const OBLIGATIONS = [
  { code: "Art 50(1)", title: "Chatbot disclosure", fine: "€15M or 3% of global turnover" },
  { code: "Art 50(2)", title: "Synthetic content watermarking (C2PA-2.0)", fine: "€15M or 3% of global turnover" },
  { code: "Art 50(3)", title: "Emotion recognition + biometric categorisation", fine: "€15M or 3% of global turnover" },
  { code: "Art 50(4)", title: "Deepfake disclosure", fine: "€15M or 3% of global turnover" },
  { code: "Art 50(5)", title: "AI-generated text on matters of public interest", fine: "€15M or 3% of global turnover" },
];

// meok-watermark-attest-mcp tools (9 total, surfaced from PyPI source)
const MCP_TOOLS = [
  { name: "classify_obligations", desc: "Map your system to Art 50(1)-(5) obligations." },
  { name: "generate_disclosure_text", desc: "Per surface × per language (5×5 matrix)." },
  { name: "audit_content_pipeline", desc: "Static + runtime check for marker embedding." },
  { name: "sign_watermark_attestation", desc: "HMAC-signed Ed25519 compliance attestation per content type." },
  { name: "c2pa_generate_manifest", desc: "C2PA-2.0 manifest with cryptographic watermark." },
  { name: "c2pa_validate_manifest", desc: "Verify an existing C2PA manifest." },
  { name: "get_deadline_status", desc: "Live days-to-cliff + transition-window timeline." },
  { name: "check_access", desc: "API key check (free, 10 calls/day)." },
];

// 5 surfaces × 5 languages the MCP covers
const SURFACES = ["UI banner", "API response", "TTS opening", "C2PA manifest", "Capability description"];
const LANGUAGES = ["en", "fr", "de", "es", "it"];

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "CSOAI Article 50 Kit",
  description:
    "EU AI Act Article 50 compliance toolkit: transparency docs, C2PA-2.0 manifest templates, 25 native-language disclosure strings, and 12 months of MCP Pro.",
  brand: { "@type": "Brand", name: "CSOAI" },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "GBP",
    availability: "https://schema.org/InStock",
    url: "https://csoai.org/article-50-kit",
    seller: { "@type": "Organization", name: "CSOAI LTD", url: "https://csoai.org" },
  },
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "meok-watermark-attest-mcp",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
  featureList: [
    "Classify Art 50(1)-(5) obligations",
    "Generate per-surface × per-language disclosure text",
    "Audit content pipeline for marker embedding",
    "Sign Ed25519 compliance attestations",
    "Emit C2PA-2.0 manifests with cryptographic watermarks",
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "When does EU AI Act Article 50 apply?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Article 50 transparency obligations apply from 2 August 2026 for new AI systems. Pre-existing systems have until 2 December 2026 to comply.",
      },
    },
    {
      "@type": "Question",
      name: "What are the penalties for non-compliance?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Article 50 transparency infringements can be fined up to €15 million or 3% of total worldwide annual turnover, whichever is higher. The higher €35 million / 7% tier applies only to prohibited AI practices under Article 5.",
      },
    },
    {
      "@type": "Question",
      name: "What surfaces does the MCP cover?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The MCP covers UI banners, API responses, TTS openings, C2PA manifests, and capability descriptions across English, French, German, Spanish, and Italian.",
      },
    },
  ],
};

const KIT_FEATURES = [
  { title: "Transparency Docs", desc: "Ready-to-file technical documentation for Article 50(1)." },
  { title: "Risk Classification", desc: "Automated Annex III risk assessment templates." },
  { title: "MCP Toolkit", desc: "Unlimited audits + signed attestations + monthly regression checks." },
  { title: "C2PA Manifest Templates", desc: "Drop-in C2PA-2.0 manifests for your content pipeline." },
  { title: "Disclosure String Library", desc: "25 native-language strings, 5 surfaces, MIT-licensed, your product." },
  { title: "Post-Market Plan", desc: "Monitoring system for continuous runtime compliance." },
];

export default function Article50Kit() {
  const [days, setDays] = useState<number>(() => daysUntil(DEADLINE_UTC));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = "Article 50 Kit — EU AI Act transparency compliance | CSOAI";
    const t = setInterval(() => setDays(daysUntil(DEADLINE_UTC)), 60000);
    return () => clearInterval(t);
  }, []);

  const copyInstallCmd = () => {
    navigator.clipboard.writeText("pip install meok-watermark-attest-mcp");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(softwareSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>

      <div className="mx-auto max-w-5xl px-6 py-16">
        {/* HERO — deadline banner */}
        <div className="mb-16 rounded-3xl border-2 border-rose-400/50 bg-rose-500/[0.06] p-10 text-center">
          <span className="mb-4 inline-block rounded-full bg-rose-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
            Deadline response
          </span>
          <h1 className="mb-4 text-4xl font-black tracking-tighter text-rose-300 sm:text-5xl">
            ARTICLE 50 KIT
          </h1>
          <p className="mb-2 text-2xl font-bold uppercase tracking-widest text-emerald-100/80">
            EU AI Act transparency cliff
          </p>
          <div className="mt-4 inline-block rounded-2xl border border-rose-400/40 bg-rose-500/10 px-8 py-4">
            <div className="text-5xl font-black tabular-nums text-rose-300">{days}</div>
            <div className="mt-1 text-sm uppercase tracking-widest text-emerald-100/60">
              {days === 0 ? "Article 50 applies since 2 August 2026" : "days until 2 August 2026"}
            </div>
          </div>
          <p className="mt-4 text-sm text-emerald-100/50">
            Pre-existing AI systems on the market before that date have until 2 December 2026 to comply.
          </p>
        </div>

        {/* THE RISK */}
        <section className="mb-16">
          <h2 className="mb-4 text-3xl font-bold tracking-tight">The €15,000,000 Risk</h2>
          <p className="text-lg leading-relaxed text-emerald-100/75">
            Under the EU AI Act, providers and deployers failing to meet Article 50
            transparency + watermarking obligations face fines up to{" "}
            <strong className="text-emerald-50">3% of global annual turnover or €15M</strong>,
            whichever is higher. The higher 7% / €35M tier applies only to prohibited AI practices
            under Article 5. Compliance is not optional — it is a production gate. The proposed
            Digital Omnibus (Parliament negotiating position, 26 Mar 2026) would delay{" "}
            <em>high-risk Annex III</em> obligations to 2 Dec 2027 — but{" "}
            <strong className="text-emerald-50">Article 50 is unchanged</strong> in current law,
            live since 2 Aug 2026.
          </p>
        </section>

        {/* THE 5 OBLIGATIONS */}
        <section className="mb-16">
          <h2 className="mb-6 text-3xl font-bold tracking-tight">5 Obligations in Scope</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {OBLIGATIONS.map((o) => (
              <div key={o.code} className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
                <div className="mb-1 font-mono text-xs text-rose-300">{o.code}</div>
                <div className="mb-2 text-lg font-bold">{o.title}</div>
                <div className="text-xs text-emerald-100/50">Fine: {o.fine}</div>
              </div>
            ))}
          </div>
        </section>

        {/* THE WIRED MCP — THE DIFFERENTIATOR */}
        <section className="mb-16 rounded-3xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-8">
          <span className="mb-3 inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-200">
            The differentiation
          </span>
          <h2 className="mb-3 text-3xl font-bold tracking-tight">Wired to meok-watermark-attest-mcp</h2>
          <p className="mb-6 leading-relaxed text-emerald-100/75">
            Most compliance kits ship PDFs. Ours ships a working MCP. The{" "}
            <code className="text-teal-300">meok-watermark-attest-mcp</code> is on PyPI (v1.3.10)
            with 9 tools covering the full Article 50 surface: classify your obligations, generate
            per-surface × per-language disclosure text, audit your content pipeline, sign an
            Ed25519 attestation, and emit C2PA-2.0 manifests with cryptographic watermarks.
          </p>

          <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-500/20 bg-black/30 p-4 font-mono text-sm">
            <code className="text-emerald-300">$ pip install meok-watermark-attest-mcp</code>
            <button
              onClick={copyInstallCmd}
              className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100 hover:bg-emerald-500/20"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {MCP_TOOLS.map((t) => (
              <div key={t.name} className="flex items-start gap-2 rounded-md p-2 hover:bg-white/5">
                <span className="mt-0.5 flex-shrink-0 font-mono text-xs text-emerald-400">→</span>
                <div>
                  <code className="text-xs text-teal-300">{t.name}</code>
                  <p className="mt-0.5 text-xs text-emerald-100/60">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5 × 5 SURFACE × LANGUAGE MATRIX */}
        <section className="mb-16">
          <h2 className="mb-4 text-3xl font-bold tracking-tight">5 Surfaces × 5 Languages</h2>
          <p className="mb-6 text-emerald-100/70">
            The MCP covers every Art 50 surface in every EU major language, with one disclosure
            string per (surface, language) pair. 25 cells in the matrix; one MCP call each.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-emerald-500/20">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-emerald-500/15 bg-[#05140d] text-left text-emerald-300/70">
                  <th className="py-2 pr-4 pl-3 font-medium">Surface</th>
                  {LANGUAGES.map((l) => (
                    <th key={l} className="px-2 py-2 font-mono text-xs uppercase">{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-500/10">
                {SURFACES.map((s) => (
                  <tr key={s}>
                    <td className="py-3 pr-4 pl-3 text-emerald-100/85">{s}</td>
                    {LANGUAGES.map((l) => (
                      <td key={l} className="px-2 py-3 text-center">
                        <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-emerald-100/50">
            <span className="mr-1 inline-block h-3 w-3 rounded-full bg-emerald-500 align-middle" />
            = MCP covers this cell with a native disclosure string (not a translation).
          </p>
        </section>

        {/* THE KIT — what's inside */}
        <section className="mb-16">
          <h2 className="mb-6 text-3xl font-bold tracking-tight">What&apos;s in the Kit</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {KIT_FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6">
                <h3 className="mb-2 text-lg font-bold text-emerald-300">{f.title}</h3>
                <p className="text-sm leading-relaxed text-emerald-100/65">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* THE KIT — free & open source */}
        <section className="mb-12">
          <h2 className="mb-6 text-center text-3xl font-bold tracking-tight">Free &amp; Open Source</h2>
          <div className="mx-auto max-w-xl rounded-2xl border border-emerald-500/20 bg-[#05140d] p-8 text-center">
            <div className="mb-1 text-sm uppercase tracking-widest text-emerald-100/60">Measurement kit</div>
            <p className="mb-5 text-sm leading-relaxed text-emerald-100/75">
              The full classifier, disclosure templates, C2PA-2.0 manifests, and Ed25519 attestations
              ship in the open-source MCP. Install it and measure your Article 50 surface — no licence,
              no gate, transparency docs and post-market plan included.
            </p>
            <div className="inline-flex items-center rounded-xl border border-emerald-500/20 bg-black/30 px-4 py-3 font-mono text-sm">
              <code className="text-emerald-300">pip install meok-watermark-attest-mcp</code>
            </div>
          </div>
        </section>

        {/* SOURCES */}
        <footer className="mt-16 border-t border-emerald-500/15 pt-8 text-xs leading-relaxed text-emerald-100/50">
          <p className="mb-2">
            <strong className="text-emerald-100/75">Sources of truth (verified 2026-06-12):</strong>{" "}
            EU AI Act implementation tracker (
            <a
              href="https://artificialintelligenceact.eu/transparency-rules-article-50/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-300 hover:underline"
            >
              artificialintelligenceact.eu/transparency-rules-article-50/
            </a>
            ): &ldquo;While these obligations apply from 2 August 2026, already on the market before
            that date until 2 December 2026.&rdquo; HSFKramer analysis (2026-03), TwoBirds analysis:
            &ldquo;fully applicable 24 months after entry into force — i.e., in August 2026.&rdquo;
          </p>
          <p>
            <strong className="text-emerald-100/75">Digital Omnibus</strong> (Parliament negotiating
            position, 26 Mar 2026) proposes delaying high-risk Annex III to 2 Dec 2027 and Annex I
            product-embedded to 2 Aug 2028. Article 50 (transparency + watermarking) is{" "}
            <em>not</em> affected by that proposal in the current text.
          </p>
        </footer>
      </div>
    </div>
  );
}
