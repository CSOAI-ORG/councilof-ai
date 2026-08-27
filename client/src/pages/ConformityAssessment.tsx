import { useEffect } from "react";

import SovereignSpot from "../components/SovereignSpot";
// ConformityAssessment - how high-risk AI providers demonstrate conformity + FAQ JSON-LD.
const STEPS = [
  { t: "Build the quality + risk system", d: "Stand up a risk-management system, data governance, technical documentation, logging, and human oversight." },
  { t: "Run the conformity assessment", d: "Most high-risk AI uses internal control (self-assessment); some - such as certain biometrics - require a notified body." },
  { t: "Draw up the EU declaration of conformity", d: "A signed declaration stating the system meets the Act's requirements, kept for ten years." },
  { t: "Affix the CE marking", d: "Where required, the CE marking signals conformity for the EU market." },
  { t: "Register in the EU database", d: "Standalone high-risk systems are registered in the EU database before going to market." },
  { t: "Monitor post-market", d: "Run post-market monitoring and report serious incidents; re-assess after substantial modification." },
];
export default function ConformityAssessment() {
  useEffect(() => { document.title = "EU AI Act conformity assessment, explained | CSOAI"; }, []);
  useEffect(() => {
    const sc = document.createElement("script");
    sc.type = "application/ld+json";
    sc.text = JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
      { "@type": "Question", "name": "What is conformity assessment under the EU AI Act?", "acceptedAnswer": { "@type": "Answer", "text": "It is the process by which a provider of high-risk AI demonstrates the system meets the Act's requirements before placing it on the EU market - via internal control or, for some systems, a notified body." } },
      { "@type": "Question", "name": "Do I need a notified body?", "acceptedAnswer": { "@type": "Answer", "text": "Most high-risk AI uses internal control (self-assessment). A notified body is required for certain systems, such as some remote biometric identification." } },
      { "@type": "Question", "name": "What is the EU declaration of conformity?", "acceptedAnswer": { "@type": "Answer", "text": "A signed statement by the provider that the high-risk AI system complies with the EU AI Act. It must be kept for ten years and made available to authorities." } },
    ] });
    document.head.appendChild(sc);
    return () => { document.head.removeChild(sc); };
  }, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-5xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - conformity assessment</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">How high-risk AI gets to market</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">Conformity assessment is how you prove a high-risk AI system meets the EU AI Act - before it ships. Here is the path, step by step.</p>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-6 py-12">
        <ol className="relative border-l-2 border-gray-200 ml-3">
          {STEPS.map((s, i) => (
            <li key={s.t} className="mb-8 ml-6">
              <span className="absolute -left-[15px] flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">{i + 1}</span>
              <div className="text-lg font-bold text-gray-900">{s.t}</div>
              <p className="mt-1 text-sm text-gray-600">{s.d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          The Council builds and signs the evidence - risk assessments, technical documentation, and the declaration - and keeps it audit-ready with an Ed25519 passport.
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/high-risk-ai-systems" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">Am I high-risk? -&gt;</a>
          <a href="/assess" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Run the free signed risk check -&gt;</a>
          <a href="/ai-act-faq" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">More FAQs -&gt;</a>
        </div>
      </section>
      <section className="bg-[#03110b] py-10"><div className="mx-auto max-w-5xl px-6">
        <SovereignSpot topic="EU AI Act conformity assessment for high-risk systems" layer="frameworks" suggest="What are the conformity-assessment steps for a high-risk AI system?" />
      </div></section>
    </div>
  );
}
