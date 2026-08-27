import { useEffect, useState } from "react";

import SovereignSpot from "../components/SovereignSpot";
// AiActFaq - a broad EU AI Act FAQ with accordion UI + full FAQPage JSON-LD (10 Q&As).
type QA = { q: string; a: string };
const QAS: QA[] = [
  { q: "What is the EU AI Act?", a: "The first comprehensive AI law. It regulates AI by risk - banning unacceptable uses, heavily regulating high-risk systems, requiring transparency for limited-risk AI, and leaving minimal-risk AI largely free." },
  { q: "When does the EU AI Act apply?", a: "It entered into force on 1 August 2024 and applies in phases: prohibited practices from Feb 2025, GPAI rules from Aug 2025, transparency from 2 August 2026, and high-risk obligations from 2 December 2027 (Annex III) and 2 August 2028 (Annex I), as amended by the Digital Omnibus (Reg (EU) 2026/1744)." },
  { q: "Who has to comply?", a: "Providers and deployers of AI systems placed on or used in the EU market - including companies based outside the EU whose AI output is used in the Union." },
  { q: "What is a high-risk AI system?", a: "AI used in a sensitive Annex III area - biometrics, critical infrastructure, education, employment, essential services, law enforcement, migration, or justice - or as a safety component of a regulated product." },
  { q: "What are the penalties?", a: "Up to EUR 35 million or 7% of global annual turnover for prohibited practices, EUR 15 million or 3% for other obligations, and EUR 7.5 million or 1% for supplying misleading information." },
  { q: "What is a GPAI model?", a: "A general-purpose AI model trained on broad data that can perform many tasks - for example a large language model. Providers face documentation, training-data summary, and copyright duties from 2 August 2025 (models placed on the market before then must comply by 2 August 2027); AI Office enforcement powers apply from 2 August 2026." },
  { q: "Does GDPR compliance cover the AI Act?", a: "No. GDPR governs personal data; the AI Act governs AI systems by risk. They overlap on automated decisions, but the AI Act adds distinct obligations." },
  { q: "What is the transparency obligation?", a: "Under Article 50, users must be told when they are interacting with AI, and AI-generated or manipulated media (deepfakes) must be marked in a machine-readable way." },
  { q: "What is conformity assessment?", a: "The process by which a high-risk AI provider demonstrates the system meets the Act's requirements - usually via internal control, sometimes via a notified body - before placing it on the market." },
  { q: "How do I get ready?", a: "Map which obligations apply, classify your systems by risk, run a readiness assessment, and build reusable evidence - risk assessments, documentation, logging, and human oversight." },
];
export default function AiActFaq() {
  useEffect(() => { document.title = "EU AI Act FAQ - your questions answered | CSOAI"; }, []);
  useEffect(() => {
    const sc = document.createElement("script");
    sc.type = "application/ld+json";
    sc.text = JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": QAS.map((x) => ({ "@type": "Question", "name": x.q, "acceptedAnswer": { "@type": "Answer", "text": x.a } })) });
    document.head.appendChild(sc);
    return () => { document.head.removeChild(sc); };
  }, []);
  const [open, setOpen] = useState<number>(0);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-3xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - frequently asked</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">EU AI Act FAQ</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">The questions everyone asks about the EU AI Act, answered plainly. Tap any question to expand.</p>
        </div>
      </section>
      <section className="max-w-3xl mx-auto px-6 py-12">
        <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200">
          {QAS.map((x, i) => (
            <div key={x.q}>
              <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                <span className="font-bold text-gray-900">{x.q}</span>
                <span className="text-emerald-600 font-black">{open === i ? "-" : "+"}</span>
              </button>
              {open === i && <p className="px-5 pb-4 text-sm text-gray-600">{x.a}</p>}
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/eu-ai-act-checklist" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">Check my readiness -&gt;</a>
          <a href="/ai-governance" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">The full guide -&gt;</a>
          <a href="/penalties" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Penalty estimator -&gt;</a>
        </div>
      </section>
      <section className="bg-[#03110b] py-10"><div className="mx-auto max-w-5xl px-6">
        <SovereignSpot topic="EU AI Act — your specific question" layer="frameworks" suggest="Ask any EU AI Act question and I'll answer for your case." />
      </div></section>
    </div>
  );
}
