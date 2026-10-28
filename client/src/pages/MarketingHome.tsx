
/**
 * Marketing door. No free trial, no public prices, no certificate.
 * Existing evidence is verified at /gspc-verify. /assess is a scoped evidence / receipt service,
 * not a promise of instant fresh measurement or mandatory signature.
 */
export default function MarketingHome() {
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-5xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI Ltd — independent AI measurement</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Verifiable AI evidence, without invented assurance.</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">
            Inspect dated measurements and free verification before purchasing scoped evidence. Signed cards are checkable; unsigned or unmeasured results remain labelled. A paid receipt is not a fresh AI test or a certificate.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/gspc-verify" className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-[#03110b] hover:bg-emerald-400">Verify a published card -&gt;</a>
            <a href="/dashboard?tab=home" className="rounded-xl border border-emerald-300/60 px-6 py-3 text-sm font-bold text-emerald-50 hover:bg-white/10">Council OS lobby -&gt;</a>
            <a href="/assess" className="rounded-xl border border-emerald-300/60 px-6 py-3 text-sm font-bold text-emerald-50 hover:bg-white/10">Existing evidence services -&gt;</a>
            <a href="/contact/?arm=data" className="rounded-xl border border-emerald-300/60 px-6 py-3 text-sm font-bold text-emerald-50 hover:bg-white/10">Discuss a scoped request -&gt;</a>
          </div>
        </div>
      </section>
    </div>
  );
}
