"use client";

import { useState, useEffect } from "react";

const DEADLINE_UTC = "2026-08-02T00:00:00Z";

function daysUntil(iso: string): number {
  const now = new Date();
  const target = new Date(iso);
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000));
}

// Canonical Stripe price IDs (from meok-attestation-api/checkout canonical ladder)
// £999 one-time Article 50 Kit
const STRIPE_KIT_URL = "https://buy.stripe.com/4gMcN7a8s6oq0ZTaqI8k91Z";
// £199/mo Pro (unlimited + signed attestations)
const STRIPE_PRO_URL = "https://buy.stripe.com/00wfZjbcw9ACcIBfL28k91K";
// £4,950 Assessment (full gap analysis)
const STRIPE_ASSESS_URL = "https://buy.stripe.com/cNieVf0xS7sueQJfL28k91G";

const OBLIGATIONS = [
  {
    code: "Art 50(1)",
    title: "Chatbot disclosure",
    fine: "€15M or 3% of global turnover",
  },
  {
    code: "Art 50(2)",
    title: "Synthetic content watermarking (C2PA-2.0)",
    fine: "€15M or 3% of global turnover",
  },
  {
    code: "Art 50(3)",
    title: "Emotion recognition + biometric categorisation",
    fine: "€15M or 3% of global turnover",
  },
  {
    code: "Art 50(4)",
    title: "Deepfake disclosure",
    fine: "€15M or 3% of global turnover",
  },
  {
    code: "Art 50(5)",
    title: "AI-generated text on matters of public interest",
    fine: "€15M or 3% of global turnover",
  },
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
  { name: "check_access", desc: "API key + tier check (Free 10/day, Pro, Enterprise)." },
  { name: "_shared_check_access", desc: "Internal helper (not user-callable)." },
];

// 5 surfaces × 5 languages the MCP covers
const SURFACES = ["UI banner", "API response", "TTS opening", "C2PA manifest", "Capability description"];
const LANGUAGES = ["en", "fr", "de", "es", "it"];

export default function Article50Kit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<number>(() => daysUntil(DEADLINE_UTC));
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => setDays(daysUntil(DEADLINE_UTC)), 60000);
    return () => clearInterval(t);
  }, []);

  const handleCheckout = async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: "article_50_kit" }),
      });
      const data = await res.json();
      if (data?.url) {
        window.open(data.url, "_self");
      } else {
        // Fallback: direct Stripe link (works when /api/checkout is offline)
        window.open(url, "_self");
      }
    } catch {
      // Network error: fall back to direct Stripe link
      window.open(url, "_self");
    } finally {
      setLoading(false);
    }
  };

  const copyInstallCmd = (idx: number) => {
    navigator.clipboard.writeText("pip install meok-watermark-attest-mcp");
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-red-500/30">
      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* HERO — emergency banner */}
        <div className="border-2 border-red-500 rounded-3xl p-10 bg-red-500/5 mb-16 text-center">
          <span className="inline-block mb-4 px-3 py-1 rounded-full bg-red-500 text-white text-[10px] font-black tracking-widest uppercase">
            Emergency Response
          </span>
          <h1 className="text-5xl sm:text-6xl font-black mb-4 text-red-500 tracking-tighter">
            ARTICLE 50 KIT
          </h1>
          <p className="text-2xl font-bold uppercase tracking-widest text-slate-300 mb-2">
            EU AI Act Cliff
          </p>
          <div className="inline-block px-8 py-4 rounded-2xl bg-red-500/10 border border-red-500/30 mt-4">
            <div className="text-6xl font-black text-red-500 tabular-nums">{days}</div>
            <div className="text-sm text-slate-400 uppercase tracking-widest mt-1">days until 2 August 2026</div>
          </div>
          <p className="text-slate-500 text-sm mt-4">
            Pre-existing AI systems on the market before that date have until 2 December 2026 to comply.
          </p>
        </div>

        {/* THE RISK */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-4">The €35,000,000 Risk</h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Under the EU AI Act, providers and deployers failing to meet Article 50
            transparency + watermarking obligations face fines up to <strong className="text-white">3% of global
            annual turnover or €15M</strong>, whichever is higher. The higher 7% / €35M tier applies
            only to prohibited AI practices under Article 5. Compliance is not optional —
            it is a production gate. The proposed Digital Omnibus (Parliament negotiating position,
            26 Mar 2026) would delay <em>high-risk Annex III</em> obligations to 2 Dec 2027 — but
            <strong className="text-white"> Article 50 is unchanged</strong> in current law, still live on 2 Aug 2026.
          </p>
        </section>

        {/* THE 5 OBLIGATIONS */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">5 Obligations in Scope</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {OBLIGATIONS.map((o) => (
              <div key={o.code} className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-xs text-red-400 font-mono mb-1">{o.code}</div>
                <div className="text-lg font-bold mb-2">{o.title}</div>
                <div className="text-xs text-slate-500">Fine: {o.fine}</div>
              </div>
            ))}
          </div>
        </section>

        {/* THE WIRED MCP — THE DIFFERENTIATOR */}
        <section className="mb-16 p-8 rounded-3xl bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 border border-emerald-500/20">
          <span className="inline-block mb-3 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black tracking-widest uppercase">
            The Differentiation
          </span>
          <h2 className="text-3xl font-bold mb-3">Wired to meok-watermark-attest-mcp</h2>
          <p className="text-slate-400 leading-relaxed mb-6">
            Most &ldquo;compliance kits&rdquo; ship PDFs. Ours ships a working MCP. The <code className="text-cyan-300">meok-watermark-attest-mcp</code> is on PyPI (v1.3.10) with 9 tools covering the full Article 50 surface: classify your obligations, generate per-surface × per-language disclosure text, audit your content pipeline, sign an Ed25519 attestation, and emit C2PA-2.0 manifests with cryptographic watermarks.
          </p>

          <div className="mb-4 p-4 rounded-xl bg-slate-900/80 border border-slate-700/50 font-mono text-sm flex items-center justify-between">
            <code className="text-emerald-300">$ pip install meok-watermark-attest-mcp</code>
            <button
              onClick={() => copyInstallCmd(0)}
              className="px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
            >
              {copiedIdx === 0 ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {MCP_TOOLS.filter(t => !t.name.startsWith("_")).map((t) => (
              <div key={t.name} className="flex gap-2 items-start p-2 rounded-md hover:bg-white/5">
                <span className="text-emerald-400 font-mono text-xs flex-shrink-0 mt-0.5">→</span>
                <div>
                  <code className="text-cyan-300 text-xs">{t.name}</code>
                  <p className="text-slate-400 text-xs mt-0.5">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5 × 5 SURFACE × LANGUAGE MATRIX */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-4">5 Surfaces × 5 Languages</h2>
          <p className="text-slate-400 mb-6">
            The MCP covers every Art 50 surface in every EU major language, with one disclosure string per (surface, language) pair. 25 cells in the matrix; one MCP call each.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-800">
                  <th className="py-2 pr-4 font-medium">Surface</th>
                  {LANGUAGES.map((l) => (
                    <th key={l} className="py-2 px-2 font-mono text-xs uppercase">{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SURFACES.map((s) => (
                  <tr key={s} className="border-b border-slate-900">
                    <td className="py-3 pr-4 text-slate-300">{s}</td>
                    {LANGUAGES.map((l) => (
                      <td key={l} className="py-3 px-2 text-center">
                        <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            <span className="inline-block w-3 h-3 rounded-full bg-emerald-500 align-middle mr-1" />
            = MCP covers this cell with a native disclosure string (not a translation).
          </p>
        </section>

        {/* THE KIT — what's inside */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">What&rsquo;s in the £999 Kit</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: "Transparency Docs", desc: "Ready-to-file technical documentation for Article 50(1)." },
              { title: "Risk Classification", desc: "Automated Annex III risk assessment templates." },
              { title: "MCP Pro Tier (12 mo)", desc: "Unlimited audits + signed attestations + monthly regression checks." },
              { title: "C2PA Manifest Templates", desc: "Drop-in C2PA-2.0 manifests for your content pipeline." },
              { title: "Disclosure String Library", desc: "25 native-language strings, 5 surfaces, MIT-licensed, your product." },
              { title: "Post-Market Plan", desc: "Monitoring system for continuous runtime compliance." },
            ].map((f) => (
              <div key={f.title} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-lg font-bold mb-2 text-emerald-400">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING — 3 tiers */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">Three Tiers, One Cliff</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-sm text-slate-400 uppercase tracking-widest mb-1">Free</div>
              <div className="text-3xl font-black mb-3">£0</div>
              <p className="text-sm text-slate-400 mb-4">
                10 audits / day. Full classifier + disclosure templates.
              </p>
              <code className="text-xs text-emerald-300">pip install meok-watermark-attest-mcp</code>
            </div>
            <div className="p-6 rounded-2xl bg-red-500/10 border-2 border-red-500/40 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-red-500 text-white text-[10px] font-black tracking-widest uppercase">
                Kit
              </span>
              <div className="text-sm text-red-300 uppercase tracking-widest mb-1">One-time</div>
              <div className="text-3xl font-black mb-3">£999</div>
              <p className="text-sm text-slate-300 mb-4">
                One-time purchase. MCP Pro tier (12 mo) + transparency docs + C2PA templates + disclosure library + post-market plan.
              </p>
              <button
                onClick={() => handleCheckout(STRIPE_KIT_URL)}
                disabled={loading}
                className="w-full px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold transition"
              >
                {loading ? "Redirecting…" : "Secure Compliance Now"}
              </button>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-sm text-slate-400 uppercase tracking-widest mb-1">Assessment</div>
              <div className="text-3xl font-black mb-3">£4,950</div>
              <p className="text-sm text-slate-400 mb-4">
                Full gap analysis + bespoke cert + 1-on-1 with the council.
              </p>
              <button
                onClick={() => handleCheckout(STRIPE_ASSESS_URL)}
                className="w-full px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition"
              >
                Book Assessment
              </button>
            </div>
          </div>
          <p className="text-center text-slate-500 text-sm mt-4">
            Pro subscription <button onClick={() => handleCheckout(STRIPE_PRO_URL)} className="underline hover:text-white">£199/mo</button> for ongoing compliance + monthly regression checks.
          </p>
        </section>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* SOURCES */}
        <footer className="mt-16 pt-8 border-t border-slate-800 text-xs text-slate-500 leading-relaxed">
          <p className="mb-2">
            <strong className="text-slate-400">Sources of truth (verified 2026-06-12):</strong> EU AI Act implementation tracker
            (<a href="https://artificialintelligenceact.eu/transparency-rules-article-50/" className="text-cyan-400 hover:underline">artificialintelligenceact.eu/transparency-rules-article-50/</a>):
            &ldquo;While these obligations apply from 2 August 2026, already on the market before that date until 2 December 2026.&rdquo;
            HSFKramer analysis (2026-03), TwoBirds analysis: &ldquo;fully applicable 24 months after entry into force — i.e., in August 2026.&rdquo;
          </p>
          <p>
            <strong className="text-slate-400">Digital Omnibus</strong> (Parliament negotiating position, 26 Mar 2026)
            proposes delaying high-risk Annex III to 2 Dec 2027 and Annex I product-embedded to 2 Aug 2028.
            Article 50 (transparency + watermarking) is <em>not</em> affected by that proposal in the
            current text.
          </p>
        </footer>
      </div>
    </div>
  );
}
