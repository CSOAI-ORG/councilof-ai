import { useEffect } from "react";

// Fedramp - RFC-0024 OSCAL readiness landing. Leads with the 30 Sep 2026 mandate and
// the "zero of 100+ 2025 authorizations actually produced OSCAL" tooling vacuum.
const STEPS = [
  { t: "Ingest your control set", d: "Import existing SSP, controls, and evidence - any format." },
  { t: "Generate OSCAL packages", d: "Machine-readable SSP, SAP, SAR, and POA&M as RFC-0024 requires." },
  { t: "Council reviews + signs", d: "The Council of AI checks completeness; every package is Ed25519-signed." },
  { t: "Submit + monitor", d: "Track the 30 Sep 2026 deadline with a live readiness score." },
];
export default function Fedramp() {
  useEffect(() => { document.title = "FedRAMP RFC-0024 / OSCAL readiness - CSOAI"; }, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - fedramp readiness</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Machine-readable FedRAMP, before 30 Sep 2026</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">RFC-0024 (adopted 2026) makes machine-readable submission packages mandatory for every FedRAMP provider, with OSCAL named as the primary standard. The catch: few providers produce OSCAL today, and generating it by hand is the bottleneck. The tooling gap is the opportunity - close it here.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/oscal" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-400">Open OSCAL Studio -&gt;</a>
            <a href="/evidence-rail" className="rounded-xl border border-emerald-300/60 px-5 py-2.5 text-sm font-semibold text-emerald-50 hover:bg-white/10">Evidence Hub -&gt;</a>
          </div>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <b>The clock:</b> RFC-0024 initial deadline 30 Sep 2026, final 30 Sep 2027. "FedRAMP Ready" retires 28 Jul 2026; FIPS-199 levels become Certification Classes A-D. Producing OSCAL by hand is the bottleneck for every CSP.
        </div>
        <h2 className="mt-10 text-xl font-bold text-gray-900">How CSOAI gets you there</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {STEPS.map((s, i) => (
            <div key={s.t} className="rounded-2xl border border-gray-200 p-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">{i + 1}</div>
              <div className="mt-2 font-bold text-gray-900">{s.t}</div>
              <p className="mt-1 text-sm text-gray-600">{s.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/try" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">Check my readiness -&gt;</a>
          <a href="/compare" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Why CSOAI for OSCAL -&gt;</a>
        </div>
      </section>
    </div>
  );
}
