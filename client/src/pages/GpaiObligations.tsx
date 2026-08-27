import { useEffect } from "react";

import SovereignSpot from "../components/SovereignSpot";
import AISystemNotice from "../components/AISystemNotice";
// GpaiObligations - GPAI / foundation-model provider obligations live 2 Aug 2026.
// FAQPage JSON-LD for answer engines. Zero external deps.
const BASE = [
  { t: "Technical documentation", d: "Keep up-to-date docs on the model's design, training, and evaluation for regulators and downstream providers." },
  { t: "Training-data summary", d: "Publish a sufficiently detailed public summary of the content used to train the model." },
  { t: "Copyright policy", d: "Put a policy in place to comply with EU copyright law and honour text-and-data-mining opt-outs." },
  { t: "Downstream information", d: "Give downstream deployers what they need to understand capabilities and limitations." },
];
const SYSTEMIC = [
  { t: "Model evaluation", d: "Adversarial testing / red-teaming to find and mitigate systemic risks." },
  { t: "Serious-incident reporting", d: "Track and report serious incidents and corrective actions to the AI Office." },
  { t: "Cybersecurity", d: "Protect the model and its physical infrastructure to an adequate level." },
  { t: "Systemic-risk assessment", d: "Assess and mitigate risks at the Union level on an ongoing basis." },
];
export default function GpaiObligations() {
  useEffect(() => { document.title = "GPAI obligations under the EU AI Act (2 Aug 2026) | CSOAI"; }, []);
  useEffect(() => {
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.text = JSON.stringify({
      "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        { "@type": "Question", "name": "What is a GPAI model under the EU AI Act?", "acceptedAnswer": { "@type": "Answer", "text": "A general-purpose AI model is one trained on broad data that can perform a wide range of tasks and be integrated into many downstream systems - for example large language models." } },
        { "@type": "Question", "name": "When do GPAI obligations apply?", "acceptedAnswer": { "@type": "Answer", "text": "GPAI provider obligations (Articles 53-55) have applied since 2 August 2025 for new models; the AI Office's enforcement (penalty) powers became exercisable on 2 August 2026, and models placed on the market before 2 August 2025 must comply by 2 August 2027." } },
        { "@type": "Question", "name": "What makes a GPAI model systemic-risk?", "acceptedAnswer": { "@type": "Answer", "text": "A model is presumed to carry systemic risk when the compute used for training exceeds 10^25 floating-point operations, triggering additional evaluation, incident-reporting, and cybersecurity duties." } },
      ],
    });
    document.head.appendChild(s);
    return () => { document.head.removeChild(s); };
  }, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-5xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - GPAI obligations</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">If you ship a model, this is your 2 Aug 2026 list</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">General-purpose AI provider obligations have applied since 2 August 2025 - and since 2 August 2026 the AI Office can enforce them with penalties. Here is exactly what every model provider owes - and the extra duties if your model carries systemic risk.</p>
          <div className="mt-6 max-w-2xl"><AISystemNotice route="/foundation-models" /></div>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-xl font-bold text-gray-900">Every GPAI provider</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {BASE.map((x) => (
            <div key={x.t} className="rounded-2xl border border-gray-200 p-5">
              <div className="font-bold text-gray-900">{x.t}</div>
              <p className="mt-1 text-sm text-gray-600">{x.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <b>Systemic-risk trigger:</b> if training compute exceeds <b>10^25 FLOP</b>, your model is presumed systemic and the four duties below apply on top of the base list.
        </div>
        <h2 className="mt-10 text-xl font-bold text-gray-900">Systemic-risk models (additional)</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {SYSTEMIC.map((x) => (
            <div key={x.t} className="rounded-2xl border border-gray-200 p-5">
              <div className="font-bold text-gray-900">{x.t}</div>
              <p className="mt-1 text-sm text-gray-600">{x.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <a href="/eu-ai-act-checklist" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">The full readiness checklist -&gt;</a>
          <a href="/readiness" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Scan my readiness -&gt;</a>
          <a href="/penalties" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">The penalties -&gt;</a>
        </div>
      </section>
      <section className="bg-[#03110b] py-10"><div className="mx-auto max-w-5xl px-6">
        <SovereignSpot topic="GPAI / foundation-model provider obligations" layer="frameworks" suggest="What must a GPAI model provider do from 2 Aug 2026?" />
      </div></section>
    </div>
  );
}
