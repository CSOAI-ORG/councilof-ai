import { useEffect, useState } from "react";

// Readiness - the 2 Aug 2026 transparency/GPAI countdown. Buy-before-the-cliff surface.
const ITEMS = [
  { t: "Article 50 transparency", d: "Disclose AI interaction, label synthetic media, watermark generated content." },
  { t: "GPAI penalty powers", d: "General-purpose model obligations become enforceable with penalties." },
  { t: "Market-surveillance authority", d: "Competent authorities gain enforcement powers across the single market." },
];
function daysTo(){ var t=new Date("2026-12-02T00:00:00Z").getTime(); return Math.max(0, Math.ceil((t-Date.now())/86400000)); }
export default function Readiness() {
  useEffect(() => { document.title = "2 Aug 2026 EU AI Act readiness - transparency + GPAI | CSOAI"; }, []);
  const [d] = useState(daysTo());
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - readiness</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">The 2 Aug 2026 transparency cliff is here</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">EU AI Act transparency duties, GPAI penalty powers, and market-surveillance authority have applied since 2 Aug 2026. Legacy generative systems have a marking grace period to 2 Dec 2026. (High-risk obligations were deferred to Dec 2027 / Aug 2028 by the Digital Omnibus - but transparency is now.)</p>
          <div className="mt-6 inline-flex items-baseline gap-2 rounded-2xl bg-white/10 px-5 py-3">
            <span className="text-4xl font-black text-emerald-300">{d}</span><span className="text-sm text-emerald-100">days to the 2 Dec 2026 legacy-marking cliff</span>
          </div>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-xl font-bold text-gray-900">What activates</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {ITEMS.map((it) => (
            <div key={it.t} className="rounded-2xl border border-gray-200 p-5">
              <div className="font-bold text-gray-900">{it.t}</div>
              <p className="mt-1 text-sm text-gray-600">{it.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          CSOAI issues Ed25519-signed compliance passports and C2PA watermark attestations for Article 50 - provable transparency you can show a regulator. Bring your system and the Council scopes exactly what you owe now - and by 2 Dec 2026.
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/try" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">Scope my obligations -&gt;</a>
          <a href="/meok-law" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Law by jurisdiction -&gt;</a>
        </div>
      </section>
    </div>
  );
}
