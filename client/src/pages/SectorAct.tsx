import { useEffect } from "react";

// SectorAct - one data-driven, sector-specific EU AI Act page (healthcare / finance / hr).
import SovereignSpot from "../components/SovereignSpot";
// Renders sector high-risk use cases, obligations, and FAQPage JSON-LD for answer engines.
// Date-accurate: transparency/notice from 2 Aug 2026; high-risk obligations phase to 2 Dec 2027 (Annex III) / 2 Aug 2028 (Annex I) per the Digital Omnibus.

type Faq = { q: string; a: string };
type Sector = { key: string; eyebrow: string; title: string; intro: string; highRisk: string[]; obligations: string[]; faqs: Faq[]; callout?: string; leftLabel?: string; rightLabel?: string };
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
      { q: "When do healthcare AI obligations apply?", a: "Transparency duties apply from 2 August 2026; stand-alone Annex III high-risk obligations phase in by 2 December 2027, and AI embedded in regulated medical devices (Annex I) by 2 August 2028, under the Digital Omnibus." },
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
  energy: {
    key: "energy", eyebrow: "CSOAI - energy + critical infrastructure + EU AI Act",
    title: "AI in energy and critical infrastructure and the EU AI Act",
    intro: "AI that keeps electricity, gas, water, and heating flowing safely is named high-risk in Annex III of the EU AI Act. Transparency duties land 2 Aug 2026; full high-risk obligations phase in by Dec 2027 - and NIS2 and the Cyber Resilience Act run alongside for critical infrastructure.",
    highRisk: ["AI as a safety component in the supply of electricity, gas, water, or heating", "Grid balancing, load forecasting, and outage-prevention control", "AI in the operation of critical digital infrastructure", "Automated control that, on failure, endangers supply or safety"],
    obligations: ["Human oversight of safety-critical control decisions", "Robustness, accuracy, and cybersecurity testing", "Technical documentation, logging, and traceability", "Aligning evidence with NIS2 and the Cyber Resilience Act"],
    faqs: [
      { q: "Is energy-grid AI high-risk under the EU AI Act?", a: "Yes. AI intended as a safety component in the management and operation of critical infrastructure, including the supply of water, gas, heating, and electricity, is listed as a high-risk use in Annex III of the EU AI Act." },
      { q: "Does the AI Act overlap with NIS2 for critical infrastructure?", a: "Yes. Energy operators face NIS2 cybersecurity duties as essential entities and, where AI is a safety component, the AI Act's high-risk obligations on top. Much governance evidence can be shared across both." },
      { q: "When do energy AI obligations apply?", a: "Transparency duties apply from 2 August 2026; stand-alone Annex III high-risk obligations phase in by 2 December 2027 (product-embedded Annex I AI: 2 August 2028) under the Digital Omnibus." },
    ],
  },
  pharma: {
    key: "pharma", eyebrow: "CSOAI - pharma + life sciences + EU AI Act",
    title: "AI in pharma and life sciences and the EU AI Act",
    intro: "Not all pharma AI is high-risk - early-stage drug-discovery models often sit outside Annex III - but AI inside medical devices, clinical decision support, and safety-critical pharmacovigilance can be. GPAI duties for foundation models apply from 2 Aug 2026, and GxP and EMA expectations run in parallel. Here is the honest line.",
    highRisk: ["AI as a safety component of a medical device (MDR / IVDR overlap)", "Clinical decision support used in trials or care", "Safety-signal detection in pharmacovigilance, where safety-critical", "Note: pure early-stage drug-discovery AI is often not Annex III high-risk"],
    obligations: ["GPAI transparency and documentation for foundation models (from 2 Aug 2026)", "Human oversight and validation for device or clinical AI", "Alignment with GxP and EMA expectations on AI", "Data governance, bias testing, logging, and traceability"],
    faqs: [
      { q: "Is drug-discovery AI high-risk under the EU AI Act?", a: "Often not. Early-stage drug-discovery models are typically not listed in Annex III. AI becomes high-risk when it is a safety component of a medical device or used in clinical decision-making." },
      { q: "Do foundation models used in pharma have obligations?", a: "Yes. General-purpose AI (GPAI) models carry transparency and documentation duties that apply from 2 August 2026, regardless of sector." },
      { q: "How does the AI Act interact with GxP and EMA guidance?", a: "The AI Act sits alongside GxP and EMA expectations on AI. Validation and documentation work can be aligned, but the AI-Act-specific duties for high-risk and GPAI systems are additional." },
    ],
  },
  defence: {
    key: "defence", eyebrow: "CSOAI - defence + national security",
    title: "AI in defence and the EU AI Act - what is excluded, what still applies",
    intro: "Defence AI is the exception, not the rule, under the EU AI Act. The honest answer most sources get wrong: exclusively-military AI is carved out - but a lot of what defence organisations run is not exclusively military, and stays firmly in scope.",
    callout: "The EU AI Act does NOT apply to AI systems placed on the market, put into service, or used exclusively for military, defence, or national-security purposes (Article 2(3)). The exclusion turns on exclusive purpose - not on who operates the system.",
    leftLabel: "What is still in scope", rightLabel: "What still governs it",
    highRisk: ["Dual-use AI also offered in civilian markets", "Non-military security, border, and migration-management AI (Annex III)", "Ordinary back-office AI - HR, procurement, finance - at a defence organisation", "General-purpose / foundation models used in defence contexts (GPAI duties)"],
    obligations: ["Classify each system: exclusively-military vs dual-use / civilian", "Apply the EU AI Act to everything not exclusively military", "Align military systems with national defence-AI strategy + NATO principles of responsible use", "Export controls, procurement governance, and classified-domain assurance"],
    faqs: [
      { q: "Does the EU AI Act apply to military AI?", a: "No. Article 2(3) excludes AI systems used exclusively for military, defence, or national-security purposes. The exclusion is about exclusive purpose, not about the organisation operating the system." },
      { q: "So are defence contractors fully exempt?", a: "No. Dual-use AI, non-military security uses, and ordinary back-office AI at a defence organisation remain in scope. Only the exclusively-military systems are carved out." },
      { q: "What governs military AI instead?", a: "National defence-AI strategies, NATO's principles of responsible use of AI, export controls, and procurement rules - plus classified-domain assurance. CSOAI's signed, offline-verifiable governance maps cleanly onto these without publishing anything sensitive." },
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
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">{s.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">{s.intro}</p>
          {s.callout && (
            <div className="mt-5 max-w-2xl rounded-xl border border-amber-300/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              <span className="font-bold text-amber-200">Key carve-out — </span>{s.callout}
            </div>
          )}
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 py-12 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{s.leftLabel || "High-risk uses in your sector"}</h2>
          <ul className="mt-4 space-y-2">
            {s.highRisk.map((x) => (
              <li key={x} className="flex items-start gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700"><span className="mt-0.5 text-amber-500 font-black">!</span>{x}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{s.rightLabel || "What you must do"}</h2>
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
