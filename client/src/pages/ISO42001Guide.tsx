import { useEffect } from "react";

/**
 * ISO/IEC 42001 is a third-party management-system standard.
 * CSOAI is not a certification body. We measure and sign. We do not certify.
 */
export default function ISO42001Guide() {
  useEffect(() => {
    document.title = "ISO/IEC 42001 — we measure, we do not certify | CSOAI";
  }, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-5xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI — ISO/IEC 42001</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">We measure. We do not certify.</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">
            ISO/IEC 42001 is a certifiable AI management-system standard. Certificates are issued by accredited certification bodies. CSOAI is not one of them. A signed card is not an ISO 42001 certificate.
          </p>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <p className="text-gray-700 leading-relaxed">
          Describe the system at /assess. You get a signed measurement card: tier, gaps we could name, and empty cells we could not fill. It is not a conformity mark, not legal advice, and not remediation. Verify stays free at /gspc-verify. A grade is never sold.
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
