import { useEffect, useState } from "react";

// MEOK Law - the cross-layer jurisdiction engine. For any place (town -> county ->
// state/province -> nation -> bloc), the OS shows the STACK of AI laws that apply at
// each layer and how they cross-reference. "It knows, through MEOK Law, what governs
// you here." The live engine resolves any address against the framework graph once the
// Layer 0 backend is on; this shows the model with worked examples now.

type Law = { name: string; status: "In force" | "Proposed" | "Guidance"; note: string };
type Layer = { layer: string; scope: string; laws: Law[] };
type Region = { id: string; name: string; tag: string; layers: Layer[]; cross: string[] };

const REGIONS: Region[] = [
  { id: "ca", name: "San Francisco, California, USA", tag: "US / state-led",
    layers: [
      { layer: "City", scope: "San Francisco", laws: [{ name: "SF Surveillance Tech Ordinance", status: "In force", note: "City approval before agencies use facial recognition / AI surveillance." }] },
      { layer: "State", scope: "California", laws: [
        { name: "CCPA / CPRA", status: "In force", note: "Automated decision-making + opt-out rights; profiling rules." },
        { name: "SB 1001 (Bot disclosure)", status: "In force", note: "Bots must disclose they are not human in commerce/elections." },
        { name: "SB 1047 successor / frontier rules", status: "Proposed", note: "Frontier-model safety + reporting obligations." } ] },
      { layer: "National", scope: "United States", laws: [
        { name: "NIST AI RMF 1.0", status: "Guidance", note: "Voluntary risk-management framework; de-facto baseline." },
        { name: "EO on Safe, Secure AI", status: "Guidance", note: "Federal agency duties, safety testing for large models." } ] },
      { layer: "Bloc", scope: "International", laws: [{ name: "OECD AI Principles", status: "Guidance", note: "Non-binding; informs US + allied policy." }] },
    ],
    cross: ["CCPA <-> EU GDPR (adequacy + profiling parallels)", "NIST AI RMF <-> ISO/IEC 42001 (crosswalk)", "Bot disclosure <-> EU AI Act transparency duties"] },
  { id: "de", name: "Munich, Bavaria, Germany", tag: "EU member state",
    layers: [
      { layer: "City/Land", scope: "Bavaria", laws: [{ name: "Bavarian data-protection supervision", status: "In force", note: "Land-level DPA enforcement of GDPR + AI use in public bodies." }] },
      { layer: "National", scope: "Germany", laws: [
        { name: "BDSG (Fed. Data Protection Act)", status: "In force", note: "National GDPR implementation; automated decisions." },
        { name: "AI liability transposition", status: "Proposed", note: "National transposition of EU AI liability rules." } ] },
      { layer: "Bloc", scope: "European Union", laws: [
        { name: "EU AI Act - transparency (Art. 50) + GPAI", status: "In force", note: "Transparency duties + GPAI penalty powers live since 2 Aug 2026." },
        { name: "EU AI Act - high-risk (Annex III)", status: "In force", note: "Applies 2 Dec 2027 (Annex I products: 2 Aug 2028) - deferred by the Digital Omnibus, Reg (EU) 2026/1744, in force 27 July 2026." },
        { name: "GDPR", status: "In force", note: "Lawful basis, DPIA, automated-decision safeguards." },
        { name: "Digital Services Act", status: "In force", note: "Algorithmic transparency + systemic-risk audits." } ] },
      { layer: "International", scope: "Global", laws: [{ name: "Council of Europe AI Treaty", status: "Proposed", note: "First binding international AI human-rights treaty." }] },
    ],
    cross: ["EU AI Act <-> NIST AI RMF (interoperability mapping)", "GDPR <-> CCPA (adequacy)", "EU AI Act high-risk <-> ISO/IEC 42001 (management system evidence)"] },
  { id: " on", name: "Toronto, Ontario, Canada", tag: "federal + provincial",
    layers: [
      { layer: "Province", scope: "Ontario", laws: [{ name: "Ontario AI in public sector directive", status: "Guidance", note: "Transparency + risk review for government AI." }] },
      { layer: "National", scope: "Canada", laws: [
        { name: "AIDA (Bill C-27)", status: "Proposed", note: "Artificial Intelligence and Data Act; high-impact systems." },
        { name: "PIPEDA", status: "In force", note: "Federal privacy; automated processing of personal data." } ] },
      { layer: "Bloc", scope: "International", laws: [{ name: "OECD + G7 Hiroshima Process", status: "Guidance", note: "Voluntary codes for advanced AI developers." }] },
    ],
    cross: ["AIDA <-> EU AI Act (risk-tier alignment)", "PIPEDA <-> GDPR (adequacy)", "Hiroshima code <-> NIST AI RMF"] },
];

const STATUS_TONE: Record<string, string> = {
  "In force": "bg-emerald-100 text-emerald-700",
  "Proposed": "bg-amber-100 text-amber-700",
  "Guidance": "bg-slate-100 text-slate-600",
};

export default function MeokLaw() {
  useEffect(() => { document.title = "Jurisdiction Engine - cross-layer AI law | CSOAI"; }, []);
  const [r, setR] = useState("ca");
  const region = REGIONS.find((x) => x.id === r) || REGIONS[0];
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - Jurisdiction Engine</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">What governs you, here</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">Pick a place. The Jurisdiction Engine shows the full stack of AI rules that apply - city, state, nation, bloc - and how each layer cross-references the others. One question, the whole jurisdiction.</p>
          <p className="mt-3 inline-block rounded-lg bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-100">As of August 2026 - EU AI Act: transparency live since 2 Aug 2026; high-risk deferred to 2 Dec 2027 / 2 Aug 2028 (Digital Omnibus, Reg (EU) 2026/1744).</p>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((x) => (
            <button key={x.id} onClick={() => setR(x.id)} className={"rounded-full border px-4 py-2 text-sm font-semibold transition-colors " + (r === x.id ? "border-emerald-400 bg-emerald-600 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>{x.name}</button>
          ))}
        </div>
        <div className="mt-2 text-xs text-gray-400">Profile: {region.tag}</div>
        <div className="mt-6 space-y-4">
          {region.layers.map((L, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-3 bg-slate-50 px-5 py-3 border-b border-gray-200">
                <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-emerald-600 px-2 text-xs font-black text-white">{L.layer}</span>
                <span className="font-bold text-gray-900">{L.scope}</span>
                <span className="text-xs text-gray-400">layer {i + 1} of {region.layers.length}</span>
              </div>
              <div className="divide-y divide-gray-100">
                {L.laws.map((law) => (
                  <div key={law.name} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{law.name}</div>
                      <div className="text-sm text-gray-500">{law.note}</div>
                    </div>
                    <span className={"shrink-0 self-start rounded-md px-2 py-0.5 text-[11px] font-bold " + (STATUS_TONE[law.status] || "bg-gray-100 text-gray-600")}>{law.status}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="text-sm font-bold uppercase tracking-wide text-emerald-700">Cross-layer links</div>
          <ul className="mt-2 space-y-1 text-sm text-emerald-900">
            {region.cross.map((c) => <li key={c} className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">+</span><span>{c}</span></li>)}
          </ul>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/temples" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">See each framework's temple -&gt;</a>
          <a href="/map" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">The relevance map -&gt;</a>
          <a href="/try" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Ask the Council -&gt;</a>
        </div>
        <p className="mt-6 text-xs text-gray-400 max-w-3xl">Worked examples shown. The live jurisdiction engine resolves any address against the full framework graph and keeps the layers current via the reg-delta feed once the Layer 0 backend is connected.</p>
      </section>
    </div>
  );
}
