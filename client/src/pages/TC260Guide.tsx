import { useEffect } from "react";

/**
 * TC260 page. We measure. We do not certify or sell a unified compliance platform.
 */
export default function TC260Guide() {
  useEffect(() => {
    document.title = "TC260 — we measure, we do not certify | CSOAI";
  }, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-5xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI — TC260</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">We measure. We do not certify.</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">
            China&apos;s TC260 programme is a national standards track. CSOAI does not issue TC260 certificates, sell a unified compliance platform, or remediate. Describe the system. Get a signed card. Empty cells stay empty.
          </p>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <p className="text-gray-700 leading-relaxed">
          Verify stays free at /gspc-verify. A grade is never sold. No public prices.
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
