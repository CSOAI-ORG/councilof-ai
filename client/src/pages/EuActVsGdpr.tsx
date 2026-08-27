import { useEffect } from "react";

// EuActVsGdpr - high-volume "EU AI Act vs GDPR" explainer with comparison + FAQ JSON-LD.
type Row = { dim: string; act: string; gdpr: string };
const ROWS: Row[] = [
  { dim: "What it regulates", act: "AI systems and models by risk", gdpr: "Processing of personal data" },
  { dim: "In force", act: "Phasing: transparency + GPAI 2 Aug 2026; high-risk Dec 2027 (Annex III) / Aug 2028 (Annex I)", gdpr: "Since May 2018" },
  { dim: "Trigger", act: "Building, providing, or deploying AI in the EU market", gdpr: "Handling personal data of people in the EU" },
  { dim: "Structure", act: "Risk tiers: prohibited / high-risk / limited / minimal", gdpr: "Principles + lawful bases + data-subject rights" },
  { dim: "Max penalty", act: "EUR 35m or 7% of global turnover", gdpr: "EUR 20m or 4% of global turnover" },
  { dim: "Overlap", act: "Automated decisions, profiling, data governance", gdpr: "Art. 22 automated decisions; data minimisation" },
];
export default function EuActVsGdpr() {
  useEffect(() => { document.title = "EU AI Act vs GDPR - how they differ and overlap | CSOAI"; }, []);
  useEffect(() => {
    const sc = document.createElement("script");
    sc.type = "application/ld+json";
    sc.text = JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
      { "@type": "Question", "name": "What is the difference between the EU AI Act and GDPR?", "acceptedAnswer": { "@type": "Answer", "text": "GDPR governs how personal data is processed; the EU AI Act governs AI systems and models by risk level. They overlap on automated decision-making and data governance but are distinct regimes with separate obligations and penalties." } },
      { "@type": "Question", "name": "Does GDPR compliance make me EU AI Act compliant?", "acceptedAnswer": { "@type": "Answer", "text": "No. GDPR is a strong data-protection foundation and some evidence is reusable, but the EU AI Act adds AI-specific obligations - risk classification, transparency labelling, GPAI documentation, conformity - that GDPR does not cover." } },
      { "@type": "Question", "name": "Which has bigger fines, the EU AI Act or GDPR?", "acceptedAnswer": { "@type": "Answer", "text": "The EU AI Act. Its top tier is up to EUR 35 million or 7% of global turnover, versus GDPR's up to EUR 20 million or 4%." } },
    ] });
    document.head.appendChild(sc);
    return () => { document.head.removeChild(sc); };
  }, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-5xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - regulation explainer</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">EU AI Act vs GDPR</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">Two EU regimes, two different jobs - and a real overlap on automated decisions. Here is how they differ, where they meet, and why GDPR compliance is not enough on its own.</p>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="overflow-hidden rounded-2xl border border-gray-200">
          <div className="grid grid-cols-3 bg-slate-50 text-xs font-bold uppercase tracking-wide text-gray-500">
            <div className="px-4 py-3">Dimension</div><div className="px-4 py-3">EU AI Act</div><div className="px-4 py-3">GDPR</div>
          </div>
          {ROWS.map((r, i) => (
            <div key={r.dim} className={"grid grid-cols-3 text-sm " + (i % 2 ? "bg-white" : "bg-gray-50/50")}>
              <div className="px-4 py-3 font-semibold text-gray-900">{r.dim}</div>
              <div className="px-4 py-3 text-gray-600">{r.act}</div>
              <div className="px-4 py-3 text-gray-600">{r.gdpr}</div>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          <b>The CSOAI bridge:</b> reuse your GDPR data-governance and automated-decision evidence, then crosswalk it onto the AI Act's risk classification and transparency duties - one program, both regimes.
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/eu-ai-act-checklist" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">The 2 Aug 2026 checklist -&gt;</a>
          <a href="/readiness" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Scan my readiness -&gt;</a>
          <a href="/penalties" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Penalty estimator -&gt;</a>
        </div>
      </section>
    </div>
  );
}
