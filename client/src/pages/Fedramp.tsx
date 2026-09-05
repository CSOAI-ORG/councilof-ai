import { useEffect } from "react";

// Fedramp - RFC-0024 OSCAL readiness landing. Leads with the 30 Sep 2026 mandate and
// the "zero of 100+ 2025 authorizations actually produced OSCAL" tooling vacuum.
const STEPS = [
  { t: "Inspect the input pattern", d: "The current OSCAL Studio is a public prototype; it does not promise arbitrary-format import." },
  { t: "Review target artifacts", d: "SSP, SAP, SAR, and POA&M are target OSCAL outputs. End-to-end generation is not verified here." },
  { t: "Validate before signing", d: "No live Council reviews or signs packages. A signature would prove package bytes and signer, not FedRAMP acceptance." },
  { t: "Plan submission", d: "No submission connector or live readiness monitor is configured on this page." },
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
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">This page is a readiness prototype for reviewing OSCAL-shaped evidence. Confirm current FedRAMP requirements and dates with the official programme before acting; CSOAI is not a submission or authorization service.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/oscal" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-400">Open OSCAL Studio -&gt;</a>
            <a href="/evidence-rail" className="rounded-xl border border-emerald-300/60 px-5 py-2.5 text-sm font-semibold text-emerald-50 hover:bg-white/10">Evidence Hub -&gt;</a>
          </div>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <b>Prototype boundary:</b> this route demonstrates a proposed evidence workflow. It does not ingest a production SSP, submit to FedRAMP, monitor an authorization, or issue a readiness verdict.
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
          <a href="/oscal" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">Inspect the OSCAL prototype -&gt;</a>
          <a href="/compare" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Why CSOAI for OSCAL -&gt;</a>
        </div>
      </section>
    </div>
  );
}
