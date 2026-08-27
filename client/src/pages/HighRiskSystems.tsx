import { useEffect } from "react";

// HighRiskSystems - the EU AI Act Annex III high-risk categories explainer + FAQ JSON-LD.
import SovereignSpot from "../components/SovereignSpot";
type Cat = { n: string; ex: string };
const CATS: Cat[] = [
  { n: "Biometrics", ex: "Remote biometric identification, biometric categorisation, and emotion recognition." },
  { n: "Critical infrastructure", ex: "AI as a safety component in road traffic, water, gas, heating, and electricity." },
  { n: "Education + vocational training", ex: "Admissions, scoring of exams, and monitoring of prohibited behaviour during tests." },
  { n: "Employment + worker management", ex: "Recruitment, CV screening, promotion, termination, and task allocation." },
  { n: "Access to essential services", ex: "Credit scoring, insurance pricing, public benefits, and emergency-call dispatch." },
  { n: "Law enforcement", ex: "Risk assessments of individuals, evidence reliability, and profiling." },
  { n: "Migration, asylum + border control", ex: "Visa and asylum risk assessment, document verification." },
  { n: "Justice + democratic processes", ex: "Assisting judicial decisions and influencing elections or voting behaviour." },
];
export default function HighRiskSystems() {
  useEffect(() => { document.title = "High-risk AI systems under the EU AI Act (Annex III) | CSOAI"; }, []);
  useEffect(() => {
    const sc = document.createElement("script");
    sc.type = "application/ld+json";
    sc.text = JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
      { "@type": "Question", "name": "What is a high-risk AI system under the EU AI Act?", "acceptedAnswer": { "@type": "Answer", "text": "A high-risk AI system is one used in a sensitive area listed in Annex III - such as biometrics, critical infrastructure, education, employment, essential services, law enforcement, migration, or justice - or as a safety component of a regulated product." } },
      { "@type": "Question", "name": "What must high-risk AI providers do?", "acceptedAnswer": { "@type": "Answer", "text": "They must implement risk management, data governance, technical documentation, logging, transparency, human oversight, and accuracy/robustness measures, and undergo conformity assessment." } },
      { "@type": "Question", "name": "When do high-risk obligations apply?", "acceptedAnswer": { "@type": "Answer", "text": "Stand-alone Annex III high-risk systems must comply by 2 December 2027, and product-safety AI (Annex I) by 2 August 2028, as amended by the Digital Omnibus (Reg (EU) 2026/1744)." } },
    ] });
    document.head.appendChild(sc);
    return () => { document.head.removeChild(sc); };
  }, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-5xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - Annex III</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">What counts as high-risk AI?</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">The EU AI Act's heaviest obligations fall on high-risk systems. These are the eight Annex III categories - if your AI lands in one, the full regime applies.</p>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid gap-4 sm:grid-cols-2">
          {CATS.map((c, i) => (
            <div key={c.n} className="rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">{i + 1}</span><span className="font-bold text-gray-900">{c.n}</span></div>
              <p className="mt-2 text-sm text-gray-600">{c.ex}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          In a category? The full high-risk regime applies - risk management, data governance, documentation, logging, human oversight, and conformity assessment. The Council builds and signs that evidence.
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/eu-ai-act-checklist" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">Readiness checklist -&gt;</a>
          <a href="/readiness" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Scan my readiness -&gt;</a>
          <a href="/ai-act-summary" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">EU AI Act, explained -&gt;</a>
        </div>
      </section>
      <section className="bg-[#03110b] py-10"><div className="mx-auto max-w-5xl px-6">
        <SovereignSpot topic="EU AI Act Annex III high-risk AI systems" layer="frameworks" suggest="Is my AI system high-risk under Annex III, and what does that require?" />
      </div></section>
    </div>
  );
}
