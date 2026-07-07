import { useEffect } from "react";

// /article-50 — the EU AI Act transparency cliff. Verified dates (July 2026):
// obligation + enforcement land together 2 Aug 2026; legacy generative systems
// already on the market get until 2 Dec 2026 for machine-readable marking
// (AI Omnibus, May 2026). Fines up to €15M or 3% of worldwide turnover.
function days(to: string) { return Math.max(0, Math.ceil((new Date(to + "T00:00:00Z").getTime() - Date.now()) / 86400000)); }
const DUTIES = [
  { t: "AI interaction disclosure", d: "Systems that interact with people must disclose they're AI at first interaction — accessibly. (Art. 50(1))" },
  { t: "Synthetic content marking", d: "Generative/GPAI outputs must be machine-readable-marked as AI-generated across audio, image, video and text. (Art. 50(2))" },
  { t: "Deepfake labelling", d: "AI-generated or -manipulated image/audio/video that resembles real people/events must be clearly labelled. (Art. 50(4))" },
  { t: "AI-generated text disclosure", d: "Text published to inform the public on matters of public interest must be disclosed as AI-generated. (Art. 50(4))" },
];
const FAQ = [
  { q: "What does EU AI Act Article 50 require?", a: "Article 50 sets transparency duties: AI systems that interact with people must disclose they are AI; providers of generative AI must machine-readable-mark synthetic audio, image, video and text as AI-generated; deepfakes and AI-generated public-interest text must be clearly labelled." },
  { q: "When does Article 50 take effect?", a: "Article 50 transparency obligations — and the enforcement powers behind them — apply from 2 August 2026. Generative AI systems already on the market before that date have until 2 December 2026 to meet the machine-readable marking requirement (AI Omnibus, May 2026). Systems launched after 2 August 2026 must comply immediately." },
  { q: "What are the penalties for breaching Article 50?", a: "Non-compliance with transparency obligations can attract fines of up to €15 million or 3% of total worldwide annual turnover, whichever is higher, alongside national market-surveillance enforcement." },
  { q: "How does CSOAI help with Article 50 compliance?", a: "CSOAI maps Article 50 to concrete, verifiable controls: C2PA / content-provenance watermarking for machine-readable marking, disclosure patterns for AI interaction, and Layer-0 (Ed25519) signed evidence that the marking and disclosure were in place — reproducible for auditors." },
];

export default function Article50() {
  useEffect(() => { document.title = "EU AI Act Article 50 — the transparency cliff (2 Aug / 2 Dec 2026) | CSOAI"; }, []);
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  const aug = days("2026-08-02"), dec = days("2026-12-02");
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="mx-auto max-w-4xl px-6 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">EU AI Act · Article 50 · transparency</p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">The transparency <span className="bg-gradient-to-r from-amber-300 to-emerald-300 bg-clip-text text-transparent">cliff.</span></h1>
        <p className="mt-4 max-w-3xl text-lg text-emerald-100/80">If your AI talks to people or generates content, Article 50 lands on you. Disclosure and machine-readable marking of AI content — with real fines (up to <b>€15M or 3%</b> of turnover) and enforcement from day one.</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-4"><div className="text-3xl font-black text-amber-200">{aug}</div><div className="text-sm text-amber-100/80">days → obligation + enforcement live (2 Aug 2026)</div></div>
          <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-4"><div className="text-3xl font-black text-emerald-200">{dec}</div><div className="text-sm text-emerald-100/80">days → legacy generative systems must mark content (2 Dec 2026)</div></div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {DUTIES.map((d) => (
            <div key={d.t} className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-4">
              <div className="text-sm font-black text-emerald-100">{d.t}</div>
              <p className="mt-1 text-xs text-emerald-100/65">{d.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.06] p-5">
          <div className="text-sm font-black text-emerald-100">Get Article-50-ready with CSOAI</div>
          <p className="mt-1 text-sm text-emerald-100/75">C2PA / content-provenance watermarking for machine-readable marking, disclosure patterns for AI interaction, and <b>Layer-0 signed evidence</b> that it was in place — reproducible for auditors.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="/classifier" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-black text-[#03110b] hover:bg-emerald-400">Does Article 50 apply to my AI? →</a>
            <a href="/readiness" className="rounded-xl border border-emerald-500/30 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Full 2 Aug readiness →</a>
            <a href="/crosswalk" className="rounded-xl border border-emerald-500/30 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Framework crosswalk →</a>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-black">Frequently asked</h2>
          <div className="mt-4 space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="rounded-xl border border-emerald-500/20 bg-[#05140d] p-4">
                <summary className="cursor-pointer font-semibold text-emerald-100">{f.q}</summary>
                <p className="mt-2 text-sm leading-relaxed text-emerald-100/75">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
        <p className="mt-6 text-[11px] text-emerald-300/70">Dates verified July 2026 (AI Omnibus provisional agreement, May 2026). Indicative guidance, not legal advice — verify against primary EU sources.</p>
      </div>
    </div>
  );
}
