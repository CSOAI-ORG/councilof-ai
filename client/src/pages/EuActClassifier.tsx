import { useEffect, useState } from "react";
import { askSovereign } from "../lib/sovAsk";
import AISystemNotice from "../components/AISystemNotice";

// /classifier — an interactive EU AI Act risk-tier classifier, wired to the live
// Council engine. Describe an AI system → get its risk tier, why, the obligations
// that follow, and the frameworks that apply. Real reasoning, governed, not a lookup.
const EXAMPLES = [
  "AI that screens job applicants and ranks CVs",
  "A chatbot that answers customer questions",
  "Facial recognition in a public train station",
  "An AI credit-scoring model approving consumer loans",
  "A spam filter for internal email",
];

const TIERS: Record<string, { color: string; label: string }> = {
  unacceptable: { color: "text-red-300 border-red-400/40 bg-red-500/10", label: "Unacceptable — prohibited" },
  high: { color: "text-amber-300 border-amber-400/40 bg-amber-500/10", label: "High-risk" },
  limited: { color: "text-emerald-300 border-emerald-400/40 bg-emerald-500/10", label: "Limited risk" },
  minimal: { color: "text-teal-300 border-teal-400/40 bg-teal-500/10", label: "Minimal risk" },
};

function tierOf(text: string): string {
  const t = text.toLowerCase();
  if (/unacceptable|prohibit|banned/.test(t)) return "unacceptable";
  if (/high[-\s]?risk/.test(t)) return "high";
  if (/limited[-\s]?risk|transparency/.test(t)) return "limited";
  if (/minimal[-\s]?risk|low[-\s]?risk/.test(t)) return "minimal";
  return "";
}

export default function EuActClassifier() {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<{ text: string; tier: string } | null>(null);
  useEffect(() => { document.title = "EU AI Act risk classifier — CSOAI"; }, []);
  useEffect(() => {
    const s = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("q") : null;
    if (s) { setQ(s); run(s); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(seed?: string) {
    const desc = (seed || q).trim(); if (!desc || busy) return;
    if (seed) setQ(seed);
    setBusy(true); setOut(null);
    const res = await askSovereign(
      "Classify this AI system under the EU AI Act: \"" + desc + "\".",
      {
        system:
          "You are the CSOAI EU AI Act classifier. Given an AI system, respond in this exact shape:\n" +
          "RISK TIER: <Unacceptable | High-risk | Limited risk | Minimal risk>\n" +
          "WHY: <one or two sentences, cite the relevant Annex/Article where possible>\n" +
          "OBLIGATIONS: <bullet the concrete duties that follow>\n" +
          "ALSO APPLIES: <other frameworks — NIST AI RMF, ISO 42001, GDPR, NIS2, DORA — if relevant>\n" +
          "Be concrete and honest. AI governance only.",
        fallback: "The live classifier is unreachable right now — retry in a moment for the reasoned classification.",
      }
    );
    setOut({ text: res.text, tier: tierOf(res.text) });
    setBusy(false);
  }

  const tier = out && out.tier ? TIERS[out.tier] : null;
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">EU AI Act · risk classifier</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Is your AI <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">high-risk?</span></h1>
        <p className="mt-3 text-emerald-100/75">Describe any AI system. The Sovereign classifies its EU AI Act risk tier, tells you why, and lists the obligations that follow — plus every other framework that applies.</p>

        {/* Article 50(1) AI-interaction disclosure — registry-driven wording. */}
        <div className="mt-6">
          <AISystemNotice route="/classifier" />
        </div>

        <div className="mt-3 flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(); }} placeholder="Describe your AI system…" className="flex-1 rounded-xl border border-emerald-500/30 bg-black/40 px-4 py-3 text-sm text-emerald-50 placeholder-emerald-300/25 focus:border-emerald-400 focus:outline-none" />
          <button onClick={() => run()} disabled={busy} className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-[#03110b] hover:bg-emerald-400 disabled:opacity-50">{busy ? "Classifying…" : "Classify ▶"}</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">{EXAMPLES.map((e) => (<button key={e} onClick={() => run(e)} className="rounded-full border border-emerald-400/25 bg-emerald-500/5 px-3 py-1 text-xs text-emerald-200/80 hover:bg-emerald-500/15">{e}</button>))}</div>

        {out && (
          <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
            {tier && <div className={"mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-black " + tier.color}>● {tier.label}</div>}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-emerald-50/90">{out.text}</p>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-emerald-500/15 pt-4 text-xs">
              <a href="/assess" className="rounded-lg bg-emerald-500 px-3 py-1.5 font-bold text-[#03110b] hover:bg-emerald-400">Get your full signed assessment →</a>
              <a href="/high-risk-ai-systems" className="rounded-lg border border-emerald-500/25 px-3 py-1.5 font-semibold text-emerald-200/80 hover:bg-white/5">Annex III high-risk list →</a>
              <a href="/readiness" className="rounded-lg border border-emerald-500/25 px-3 py-1.5 font-semibold text-emerald-200/80 hover:bg-white/5">Deadline readiness →</a>
              <a href="/try" className="rounded-lg bg-emerald-500 px-3 py-1.5 font-bold text-[#03110b] hover:bg-emerald-400">Take it to the Council →</a>
            </div>
          </div>
        )}
        <p className="mt-6 text-[11px] text-emerald-300/70">Indicative classification to guide you — not legal advice. For a signed, council-reviewed determination, run it through the Workbench.</p>
      </div>
    </div>
  );
}
