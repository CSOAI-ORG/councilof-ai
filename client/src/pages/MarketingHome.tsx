import { useEffect } from "react";

/**
 * Marketing door. No free trial, no public prices, no certificate.
 * AG UI / Home is /os?lobby=home. Get measured is /assess.
 */
export default function MarketingHome() {
  useEffect(() => {
    document.title = "Council of AI — we measure, we sign, we re-attest";
  }, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-5xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI — measure, sign, re-attest</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Get measured. Not certified.</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">
            Describe the system. Get a signed card. Empty cells stay empty. Verify is free. A grade is never sold. We do not remediate.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/assess" className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-[#03110b] hover:bg-emerald-400">Get measured -&gt;</a>
            <a href="/dashboard?tab=home" className="rounded-xl border border-emerald-300/60 px-6 py-3 text-sm font-bold text-emerald-50 hover:bg-white/10">Council OS lobby -&gt;</a>
            <a href="/gspc-verify" className="rounded-xl border border-emerald-300/60 px-6 py-3 text-sm font-bold text-emerald-50 hover:bg-white/10">Verify a record -&gt;</a>
          </div>
        </div>
      </section>
    </div>
  );
}
