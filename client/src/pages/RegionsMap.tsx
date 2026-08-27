import { useEffect, useState } from "react";

// RegionsMap - region-filtered regulatory view (EU / US / Global). Pick a region and see
// the frameworks that bind you there, the status, and the CSOAI bridge that covers it.
// Companion to /map; self-contained, zero external deps.
type Fw = { name: string; status: "In force" | "Phasing" | "Proposed" | "Guidance"; bridge: string };
type Region = { id: string; name: string; tag: string; frameworks: Fw[] };
const REGIONS: Region[] = [
  { id: "eu", name: "European Union", tag: "Comprehensive, risk-tiered", frameworks: [
    { name: "EU AI Act - transparency (Art. 50) + GPAI", status: "In force", bridge: "since 2 Aug 2026 - /readiness" },
    { name: "EU AI Act - high-risk (Annex III)", status: "Phasing", bridge: "Dec 2027; Annex I Aug 2028 (Digital Omnibus)" },
    { name: "GDPR", status: "In force", bridge: "Data + automated decisions" },
    { name: "Digital Services Act", status: "In force", bridge: "Algorithmic transparency" },
    { name: "Cyber Resilience Act / NIS2", status: "Phasing", bridge: "Security baseline" },
    { name: "ISO/IEC 42001", status: "In force", bridge: "Management-system evidence" },
  ]},
  { id: "us", name: "United States", tag: "Sectoral + state-led", frameworks: [
    { name: "NIST AI RMF 1.0", status: "Guidance", bridge: "De-facto baseline" },
    { name: "FedRAMP / OSCAL (RFC-0024)", status: "Phasing", bridge: "30 Sep 2026 - /fedramp" },
    { name: "CCPA / CPRA (California)", status: "In force", bridge: "Profiling + opt-out" },
    { name: "Colorado AI Act (SB 26-189)", status: "Phasing", bridge: "Enacted - ADMT notices, eff. 1 Jan 2027" },
    { name: "Texas TRAIGA", status: "In force", bridge: "Banned-use list (Jan 2026)" },
    { name: "NYC LL144 (AEDT bias audit)", status: "In force", bridge: "Annual bias-audit attestation" },
  ]},
  { id: "global", name: "Global / International", tag: "Soft law + treaties", frameworks: [
    { name: "OECD AI Principles", status: "Guidance", bridge: "Shapes allied policy" },
    { name: "Council of Europe AI Treaty", status: "Proposed", bridge: "First binding rights treaty" },
    { name: "G7 Hiroshima Process", status: "Guidance", bridge: "Advanced-AI code" },
    { name: "ISO/IEC 42001", status: "In force", bridge: "Globally recognised MS" },
    { name: "C2PA (content provenance)", status: "In force", bridge: "Art. 50 watermarking" },
  ]},
];
const TONE: Record<string, string> = {
  "In force": "bg-emerald-100 text-emerald-700",
  "Phasing": "bg-blue-100 text-blue-700",
  "Proposed": "bg-amber-100 text-amber-700",
  "Guidance": "bg-slate-100 text-slate-600",
};

export default function RegionsMap() {
  useEffect(() => { document.title = "Regulatory map by region - EU / US / Global | CSOAI"; }, []);
  const [r, setR] = useState("eu");
  const region = REGIONS.find((x) => x.id === r) || REGIONS[0];
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - regulatory map</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">What governs AI, by region</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">Filter by EU, US, or Global and see the frameworks in force, what's phasing in, and the CSOAI bridge that covers each. For the city-to-bloc stack of any single place, use MEOK Law.</p>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((x) => (
            <button key={x.id} onClick={() => setR(x.id)} className={"rounded-full border px-5 py-2 text-sm font-bold transition-colors " + (r === x.id ? "border-emerald-400 bg-emerald-600 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>{x.name}</button>
          ))}
        </div>
        <div className="mt-2 text-xs text-gray-400">{region.tag} - {region.frameworks.length} frameworks</div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {region.frameworks.map((f) => (
            <div key={f.name} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-bold text-gray-900">{f.name}</div>
                <div className="text-sm text-gray-500">Bridge: {f.bridge}</div>
              </div>
              <span className={"shrink-0 self-start rounded-md px-2 py-0.5 text-[11px] font-bold " + (TONE[f.status] || "bg-gray-100 text-gray-600")}>{f.status}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/meok-law" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">Your exact jurisdiction stack -&gt;</a>
          <a href="/map" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">The relevance map -&gt;</a>
          <a href="/sectors" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">By sector -&gt;</a>
        </div>
      </section>
    </div>
  );
}
