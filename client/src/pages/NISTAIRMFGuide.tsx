import { useEffect } from "react";

/**
 * NIST AI RMF page. The RMF is voluntary and has no certification scheme.
 * CSOAI measures and signs. We do not certify.
 */
export default function NISTAIRMFGuide() {
  useEffect(() => {
    document.title = "NIST AI RMF — we measure, we do not certify | CSOAI";
  }, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-5xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI — NIST AI RMF</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">No NIST certificate exists. We still measure.</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">
            The NIST AI Risk Management Framework is voluntary. There is no NIST AI RMF certification scheme. CSOAI is not a certification body. A signed card is evidence of a measurement, not a conformity mark.
          </p>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <p className="text-gray-700 leading-relaxed">
          Get measured at /assess. Verify stays free. We do not remediate. A grade is never sold.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="/assess" className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-500">Get measured -&gt;</a>
          <a href="/gspc-verify" className="rounded-xl border border-emerald-300 px-6 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-50">Verify a record -&gt;</a>
          <a href="/firewall-charter" className="rounded-xl border border-emerald-300 px-6 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-50">Measurement / remediation firewall -&gt;</a>
        </div>
      </section>
    </div>
  );
}
