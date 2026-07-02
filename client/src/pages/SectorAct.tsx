import { useEffect } from "react";

// SectorAct - one data-driven, sector-specific EU AI Act page (healthcare / finance / hr).
import SovereignSpot from "../components/SovereignSpot";
// Renders sector high-risk use cases, obligations, and FAQPage JSON-LD for answer engines.
// Date-accurate: transparency/notice from 2 Aug 2026; full high-risk obligations phase to Dec 2027.

type Faq = { q: string; a: string };
type Sector = { key: string; eyebrow: string; title: string; intro: string; highRisk: string[]; obligations: string[]; faqs: Faq[] };
const SECTORS: Record<string, Sector> = {
  healthcare: {
    key: "healthcare", eyebrow: "CSOAI - healthcare + EU AI Act",
    title: "AI in healthcare and the EU AI Act",
    intro: "Clinical AI is squarely in the EU AI Act's high-risk tier. Transparency duties land 2 Aug 2026; the full high-risk regime phases in by Dec 2027. Here is what applies to medical AI - and how to get ready now.",
    highRisk: ["AI for medical diagnosis, triage, or screening", "AI components inside medical devices (MDR / IVDR overlap)", "Patient risk-stratification and resource allocation", "AI-driven clinical decision support"],
    obligations: ["Human oversight of every clinical decision", "Data governance + bias testing across patient cohorts", "Technical documentation, logging, and traceability", "Transparency to patients that AI is involved"],
    faqs: [
      { q: "Is medical AI high-risk under the EU AI Act?", a: "Yes. AI used for medical diagnosis, triage, or as a safety component of a medical device is classified high-risk under the EU AI Act, triggering conformity, oversight, and documentation duties." },
      { q: "Does the EU AI Act apply on top of MDR/IVDR?", a: "Yes. The AI Act applies alongside the Medical Device and In-Vitro Diagnostic Regulations; conformity work can be aligned but the AI-specific obligations are additional." },
      { q: "When do healthcare AI obligations apply?", a: "Transparency duties apply from 2 August 2026; the full high-risk obligations phase in by December 2027 under the Digital Omnibus." },
    ],
  },
  finance: {
    key: "finance", eyebrow: "CSOAI - financial services + EU AI Act",
    title: "AI in financial services and the EU AI Act",
    intro: "Credit, insurance, and lending AI are named high-risk uses. Transparency duties land 2 Aug 2026; full high-risk obligations phase in by Dec 2027. Here is what binds financial AI - on top of your existing regulation.",
    highRisk: ["Credit scoring and creditworthiness assessment", "Insurance pricing and underwriting (life and health)", "Fraud detection that gates access to services", "Automated decisions on loans and accounts"],
    obligations: ["Bias and fairness testing across protected groups", "Explainability of adverse decisions to customers", "Human oversight and a route to appeal", "Records, logging, and technical documentation"],
    faqs: [
      { q: "Is credit scoring high-risk under the EU AI Act?", a: "Yes. AI used to evaluate creditworthiness or establish credit scores for individuals is explicitly listed as a high-risk use under the EU AI Act." },
      { q: "Does the EU AI Act cover insurance AI?", a: "Yes. AI for risk assessment and pricing in life and health insurance is a high-risk use, requiring bias testing, oversight, and documentation." },
      { q: "How does it interact with existing financial regulation?", a: "The AI Act sits on top of existing financial rules. Much governance evidence is reusable, but the AI-specific obligations - bias testing, explainability, logging - are additional." },
    ],
  },
  hr: {
    key: "hr", eyebrow: "CSOAI - hiring + HR + EU AI Act",
    title: "AI in hiring and HR and the EU AI Act",
    intro: "Recruitment and workforce AI are high-risk uses. Candidate-facing transparency lands 2 Aug 2026; full obligations phase in by Dec 2027. Here is what applies to hiring AI - and how it echoes NYC's bias-audit law.",
    highRisk: ["AI for recruitment and CV / resume screening", "Automated interview or assessment scoring", "AI in promotion and termination decisions", "Task allocation and performance monitoring"],
    obligations: ["Bias audits on selection outcomes (echoes NYC LL144)", "Notice to candidates that AI is used", "Human review of automated decisions", "Documentation, logging, and record-keeping"],
    faqs: [
      { q: "Is AI recruitment high-risk under the EU AI Act?", a: "Yes. AI used to screen, rank, or assess candidates, or to make employment decisions, is a high-risk use under the EU AI Act." },
      { q: "Do I have to tell candidates AI is used?", a: "Yes. Transparency obligations require informing people when they are subject to an AI system, and these duties apply from 2 August 2026." },
      { q: "How does this relate to NYC Local Law 144?", a: "Both require bias auditing of automated employment tools. A single bias-audit program can be designed to satisfy NYC LL144 and EU AI Act expectations together." },
    ],
  },
};

export default function SectorAct({ sector }: { sector: string }) {
  const s = SECTORS[sector] || SECTORS.healthcare;
  useEffect(() => { document.title = s.title + " | CSOAI"; }, [s.title]);
  useEffect(() => {
    const sc = document.createElement("script");
    sc.type = "application/ld+json";
    sc.text = JSON.stringify({
      "@context": "https://schema.org", "@type": "FAQPage",
      "mainEntity": s.faqs.map((f) => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })),
    });
    document.head.appendChild(sc);
    return () => { document.head.removeChild(sc); };
  }, [s.key]);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-5xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">{s.eyebrow}</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">{s.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">{s.intro}</p>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 py-12 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900">High-risk uses in your sector</h2>
          <ul className="mt-4 space-y-2">
            {s.highRisk.map((x) => (
              <li key={x} className="flex items-start gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700"><span className="mt-0.5 text-amber-500 font-black">!</span>{x}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">What you must do</h2>
          <ul className="mt-4 space-y-2">
            {s.obligations.map((x) => (
              <li key={x} className="flex items-start gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700"><span className="mt-0.5 text-emerald-600 font-black">+</span>{x}</li>
            ))}
          </ul>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 pb-8">
        <h2 className="text-xl font-bold text-gray-900">Questions, answered</h2>
        <div className="mt-4 space-y-3">
          {s.faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-gray-200 p-5">
              <div className="font-bold text-gray-900">{f.q}</div>
              <p className="mt-1 text-sm text-gray-600">{f.a}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/eu-ai-act-checklist" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">The 2 Aug 2026 checklist -&gt;</a>
          <a href="/readiness" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Scan my readiness -&gt;</a>
          <a href="/penalties" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">What a breach costs -&gt;</a>
        </div>
      </section>
      <section className="bg-[#03110b] py-10"><div className="mx-auto max-w-5xl px-6">
        <SovereignSpot topic={"the EU AI Act for " + sector} layer="regulators" suggest={"Which " + sector + " AI systems are high-risk, and what must we do?"} />
      </div></section>
    </div>
  );
}
