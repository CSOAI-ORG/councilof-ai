import { useEffect } from "react";

import SovereignSpot from "../components/SovereignSpot";
// NistVsEuAct - side-by-side NIST AI RMF vs EU AI Act comparison with FAQPage JSON-LD.
// High-intent answer-engine page. Zero external deps.
type Row = { dim: string; nist: string; eu: string };
const ROWS: Row[] = [
  { dim: "Legal status", nist: "Voluntary framework / guidance", eu: "Binding law with penalties" },
  { dim: "Issued by", nist: "NIST (US Dept of Commerce)", eu: "European Union" },
  { dim: "Approach", nist: "Outcome-based: Govern, Map, Measure, Manage", eu: "Risk-tiered: prohibited / high-risk / limited / minimal" },
  { dim: "Who it binds", nist: "Anyone who chooses to adopt it", eu: "Providers + deployers touching the EU market" },
  { dim: "Key dates", nist: "RMF 1.0 (Jan 2023), GenAI profile (2024)", eu: "Transparency + GPAI: 2 Aug 2026; high-risk: Dec 2027 (Annex III) / Aug 2028 (Annex I)" },
  { dim: "Penalties", nist: "None (voluntary)", eu: "Up to EUR 35m or 7% of global turnover" },
  { dim: "Evidence", nist: "Self-attested maturity", eu: "Conformity assessment + technical documentation" },
];
export default function NistVsEuAct() {
  useEffect(() => { document.title = "NIST AI RMF vs EU AI Act - what's the difference? | CSOAI"; }, []);
  useEffect(() => {
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.text = JSON.stringify({
      "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        { "@type": "Question", "name": "Is the NIST AI RMF mandatory?", "acceptedAnswer": { "@type": "Answer", "text": "No. The NIST AI Risk Management Framework is a voluntary, outcome-based framework. The EU AI Act, by contrast, is binding law with financial penalties." } },
        { "@type": "Question", "name": "Does following NIST AI RMF make me EU AI Act compliant?", "acceptedAnswer": { "@type": "Answer", "text": "Not on its own. NIST is a strong governance foundation and much of its evidence is reusable, but the EU AI Act adds specific binding obligations - transparency labelling, GPAI documentation, conformity assessment - that NIST does not require." } },
        { "@type": "Question", "name": "Can one governance program cover both NIST and the EU AI Act?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Both share risk-management primitives, so a single mapped control set with crosswalked evidence can satisfy NIST outcomes and EU AI Act obligations together." } },
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
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">NIST AI RMF vs the EU AI Act</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">One is a voluntary US framework; the other is binding EU law with 35m EUR teeth. Here is how they differ - and how a single program covers both.</p>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="overflow-hidden rounded-2xl border border-gray-200">
          <div className="grid grid-cols-3 bg-slate-50 text-xs font-bold uppercase tracking-wide text-gray-500">
            <div className="px-4 py-3">Dimension</div><div className="px-4 py-3">NIST AI RMF</div><div className="px-4 py-3">EU AI Act</div>
          </div>
          {ROWS.map((r, i) => (
            <div key={r.dim} className={"grid grid-cols-3 text-sm " + (i % 2 ? "bg-white" : "bg-gray-50/50")}>
              <div className="px-4 py-3 font-semibold text-gray-900">{r.dim}</div>
              <div className="px-4 py-3 text-gray-600">{r.nist}</div>
              <div className="px-4 py-3 text-gray-600">{r.eu}</div>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          <b>The CSOAI bridge:</b> map your NIST Govern/Map/Measure/Manage evidence once, and crosswalk it straight onto EU AI Act obligations - no duplicate audit.
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/crosswalks" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">See the crosswalk -&gt;</a>
          <a href="/readiness" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Scan my readiness -&gt;</a>
          <a href="/eu-ai-act-checklist" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">The 2 Aug 2026 checklist -&gt;</a>
        </div>
      </section>
      <section className="bg-[#03110b] py-10"><div className="mx-auto max-w-5xl px-6">
        <SovereignSpot topic="NIST AI RMF vs the EU AI Act — how they map and differ" layer="frameworks" suggest="If I've done NIST AI RMF, what more does the EU AI Act need?" />
      </div></section>
    </div>
  );
}
