import { useEffect, useMemo, useState } from "react";

// EUActChecklist - interactive 2 Aug 2026 readiness checklist with live countdown
// and FAQPage JSON-LD for answer-engine visibility. Zero external deps.

const daysTo = (d: string) => Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000));
type Item = { id: string; cat: string; text: string };
const ITEMS: Item[] = [
  { id: "t1", cat: "Transparency (Art. 50)", text: "Label AI-generated text, image, audio, and video output" },
  { id: "t2", cat: "Transparency (Art. 50)", text: "Disclose to users when they are interacting with an AI system" },
  { id: "t3", cat: "Transparency (Art. 50)", text: "Mark deepfakes and synthetic media in a machine-readable way (C2PA)" },
  { id: "g1", cat: "GPAI / model providers", text: "Publish a summary of training data used" },
  { id: "g2", cat: "GPAI / model providers", text: "Maintain technical documentation for the model" },
  { id: "g3", cat: "GPAI / model providers", text: "Put a copyright policy in place; honour text-and-data-mining opt-outs" },
  { id: "g4", cat: "GPAI / model providers", text: "If systemic-risk (>10^25 FLOP): model evaluation, incident reporting, cyber" },
  { id: "o1", cat: "Governance + records", text: "Maintain an inventory of every AI system you build or deploy" },
  { id: "o2", cat: "Governance + records", text: "Assign clear human accountability for each system" },
  { id: "o3", cat: "Governance + records", text: "Keep evidence: risk assessments, test logs, and decisions" },
  { id: "o4", cat: "Governance + records", text: "Brief staff so they have adequate AI literacy (Art. 4)" },
];
const CATS = ["Transparency (Art. 50)", "GPAI / model providers", "Governance + records"];

export default function EUActChecklist() {
  useEffect(() => { document.title = "EU AI Act 2 Aug 2026 readiness checklist | CSOAI"; }, []);
  useEffect(() => {
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.text = JSON.stringify({
      "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        { "@type": "Question", "name": "What changes on 2 August 2026 under the EU AI Act?", "acceptedAnswer": { "@type": "Answer", "text": "Transparency obligations (Article 50) and general-purpose AI (GPAI) provider obligations become enforceable. High-risk Annex III obligations were deferred to December 2027 by the Digital Omnibus." } },
        { "@type": "Question", "name": "Who has to comply with the EU AI Act transparency rules?", "acceptedAnswer": { "@type": "Answer", "text": "Any provider or deployer of AI systems that interact with people, generate synthetic media, or are general-purpose AI models placed on the EU market - regardless of where the provider is based." } },
        { "@type": "Question", "name": "What are the penalties for non-compliance?", "acceptedAnswer": { "@type": "Answer", "text": "Up to EUR 35 million or 7% of global annual turnover for prohibited practices, and up to EUR 15 million or 3% for other obligations." } },
      ],
    });
    document.head.appendChild(s);
    return () => { document.head.removeChild(s); };
  }, []);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const pct = useMemo(() => Math.round((Object.values(done).filter(Boolean).length / ITEMS.length) * 100), [done]);
  const left = daysTo("2026-12-02");
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-5xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - free readiness checklist</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">EU AI Act: the 2 August 2026 duties are live. Are you ready?</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">Article 50 transparency and the enforcement regime have applied since 2 Aug 2026. Legacy generative systems have <b>{left} days</b> left of the machine-readable-marking grace period (to 2 Dec 2026). Tick off what you have done and see your readiness score - then close the gaps with the Council.</p>
          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-white/10 px-5 py-3">
            <span className="text-3xl font-black text-emerald-300">{left}</span>
            <span className="text-sm text-emerald-50/80">days to the legacy-marking cliff<br />(2 Dec 2026, Art. 111(4))</span>
          </div>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4">
          <div className="h-3 flex-1 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-emerald-500 transition-all" style={{ width: pct + "%" }} /></div>
          <span className="text-lg font-black text-emerald-700">{pct}%</span>
        </div>
        {CATS.map((c) => (
          <div key={c} className="mt-8">
            <h2 className="text-lg font-bold text-gray-900">{c}</h2>
            <div className="mt-3 space-y-2">
              {ITEMS.filter((i) => i.cat === c).map((i) => {
                const on = !!done[i.id];
                return (
                  <button key={i.id} onClick={() => setDone((d) => ({ ...d, [i.id]: !d[i.id] }))} className={"flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors " + (on ? "border-emerald-400 bg-emerald-50" : "border-gray-200 hover:bg-gray-50")}>
                    <span className={"mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-xs font-black " + (on ? "border-emerald-500 bg-emerald-500 text-white" : "border-gray-300 text-transparent")}>X</span>
                    <span className={on ? "text-emerald-900" : "text-gray-700"}>{i.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          {pct === 100 ? "Fully ticked - now make it provable. The Council signs your evidence with an Ed25519 passport." : "Every unticked box is live exposure - the Art. 50 regime has applied since 2 Aug 2026. The Council can generate the evidence and the documentation for you."}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/readiness" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">Run a full readiness scan -&gt;</a>
          <a href="/gpai" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">GPAI obligations -&gt;</a>
          <a href="/penalties" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">What are the fines? -&gt;</a>
        </div>
      </section>
    </div>
  );
}
