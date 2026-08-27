import { useEffect } from "react";

/**
 * EU AI Act page. We measure systems against published rules.
 * We do not certify, sell a grade, or remediate.
 */
export default function EUAIActGuide() {
  useEffect(() => {
    document.title = "EU AI Act — we measure, we do not certify | CSOAI";
  }, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-5xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI — EU AI Act</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Measure the system. Do not buy a certificate.</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">
            /assess is a deterministic EU AI Act keyword classifier (Annex III / Art 5). It does not fetch or probe an endpoint. The signed card is not a conformity certificate and not legal advice. We do not remediate.
          </p>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <p className="text-gray-700 leading-relaxed">
          Describe purpose and domain. Empty cells stay empty. Verify stays free at /gspc-verify. A grade is never sold. No public prices. No free trial for a certificate we cannot issue.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="/assess" className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-500">Get measured -&gt;</a>
          <a href="/gspc-verify" className="rounded-xl border border-emerald-300 px-6 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-50">Verify a record -&gt;</a>
          <a href="/how-it-works" className="rounded-xl border border-emerald-300 px-6 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-50">How it works -&gt;</a>
        </div>
      </section>
    </div>
  );
}
