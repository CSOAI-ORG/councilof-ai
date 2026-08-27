import { useEffect } from "react";

import SovereignSpot from "../components/SovereignSpot";
import AISystemNotice from "../components/AISystemNotice";
// Iso42001VsEuAct - side-by-side ISO/IEC 42001 vs EU AI Act comparison + FAQPage JSON-LD.
// High-intent answer-engine page. Zero external deps.
type Row = { dim: string; iso: string; eu: string };
const ROWS: Row[] = [
  { dim: "What it is", iso: "AI management-system standard (certifiable)", eu: "Binding regulation" },
  { dim: "Issued by", iso: "ISO/IEC (international)", eu: "European Union" },
  { dim: "Model", iso: "Plan-Do-Check-Act management system", eu: "Risk-tiered obligations by use case" },
  { dim: "Certification", iso: "Third-party certifiable (like ISO 27001)", eu: "No 'certificate' - conformity + market surveillance" },
  { dim: "Mandatory?", iso: "Voluntary, but a recognised assurance signal", eu: "Mandatory for in-scope systems" },
  { dim: "Penalties", iso: "None (lose certification)", eu: "Up to EUR 35m or 7% of global turnover" },
  { dim: "Relationship", iso: "Strong evidence base for compliance", eu: "Can presume conformity where harmonised" },
];
export default function Iso42001VsEuAct() {
  useEffect(() => { document.title = "ISO 42001 vs EU AI Act - do you need both? | CSOAI"; }, []);
  useEffect(() => {
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.text = JSON.stringify({
      "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        { "@type": "Question", "name": "Does ISO 42001 certification mean I am EU AI Act compliant?", "acceptedAnswer": { "@type": "Answer", "text": "Not automatically. ISO/IEC 42001 is a strong management-system foundation and much of its evidence supports EU AI Act obligations, but the Act imposes specific binding duties that go beyond the standard." } },
        { "@type": "Question", "name": "What is the difference between ISO 42001 and the EU AI Act?", "acceptedAnswer": { "@type": "Answer", "text": "ISO 42001 is a voluntary, certifiable management-system standard; the EU AI Act is binding law with risk-tiered obligations and financial penalties up to EUR 35 million or 7% of global turnover." } },
        { "@type": "Question", "name": "Can ISO 42001 evidence be reused for the EU AI Act?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Risk assessments, governance records, and management reviews produced for ISO 42001 can be crosswalked onto EU AI Act technical documentation and conformity evidence." } },
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
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - framework comparison</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">ISO 42001 vs the EU AI Act</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">A certifiable management standard, or binding law? You likely need both - and one evidence base can serve them together.</p>
          <div className="mt-6 max-w-2xl"><AISystemNotice route="/iso-42001-vs-eu-ai-act" /></div>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="overflow-hidden rounded-2xl border border-gray-200">
          <div className="grid grid-cols-3 bg-slate-50 text-xs font-bold uppercase tracking-wide text-gray-500">
            <div className="px-4 py-3">Dimension</div><div className="px-4 py-3">ISO/IEC 42001</div><div className="px-4 py-3">EU AI Act</div>
          </div>
          {ROWS.map((r, i) => (
            <div key={r.dim} className={"grid grid-cols-3 text-sm " + (i % 2 ? "bg-white" : "bg-gray-50/50")}>
              <div className="px-4 py-3 font-semibold text-gray-900">{r.dim}</div>
              <div className="px-4 py-3 text-gray-600">{r.iso}</div>
              <div className="px-4 py-3 text-gray-600">{r.eu}</div>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          <b>The CSOAI bridge:</b> run one AI management system, certify to ISO 42001, and crosswalk the same evidence onto the EU AI Act - certification and compliance from a single source of truth.
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/crosswalks" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">See the crosswalk -&gt;</a>
          <a href="/nist-vs-eu-ai-act" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">NIST vs EU AI Act -&gt;</a>
          <a href="/eu-ai-act-checklist" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">The 2 Aug 2026 checklist -&gt;</a>
        </div>
      </section>
      <section className="bg-[#03110b] py-10"><div className="mx-auto max-w-5xl px-6">
        <SovereignSpot topic="ISO/IEC 42001 vs the EU AI Act — how they map and differ" layer="frameworks" suggest="Does ISO 42001 certification help with EU AI Act compliance?" />
      </div></section>
    </div>
  );
}
