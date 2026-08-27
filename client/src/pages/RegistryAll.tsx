import { useEffect, useState } from "react";

// RegistryAll - the master catalog: every regulation, standard, protocol, and Council
// layer the OS covers, each tagged with the government seat/building where it is made.
// Search + filter. This is "all layers, all protocols, all regulations" in one place.

type Cat = "Regulation" | "Standard" | "Protocol" | "Council";
type Item = { name: string; cat: Cat; seat: string; region: string; status: string; href: string };
const ITEMS: Item[] = [
  { name: "EU AI Act", cat: "Regulation", seat: "European Commission - Berlaymont, Brussels", region: "EU", status: "Phasing (Aug 2026 / Dec 2027)", href: "/readiness" },
  { name: "GDPR", cat: "Regulation", seat: "European Commission, Brussels", region: "EU", status: "In force", href: "/meok-law" },
  { name: "Digital Services Act", cat: "Regulation", seat: "European Commission, Brussels", region: "EU", status: "In force", href: "/regions" },
  { name: "Cyber Resilience Act / NIS2", cat: "Regulation", seat: "European Commission, Brussels", region: "EU", status: "Phasing", href: "/regions" },
  { name: "Council of Europe AI Treaty", cat: "Regulation", seat: "Palais de l'Europe, Strasbourg", region: "EU", status: "Proposed", href: "/meok-law" },
  { name: "US EO on Safe, Secure AI", cat: "Regulation", seat: "The White House, Washington DC", region: "US", status: "Guidance", href: "/regions" },
  { name: "FedRAMP / OSCAL (RFC-0024)", cat: "Regulation", seat: "GSA, Washington DC", region: "US", status: "Phasing (30 Sep 2026)", href: "/fedramp" },
  { name: "CCPA / CPRA", cat: "Regulation", seat: "California State Capitol, Sacramento", region: "US", status: "In force", href: "/regions" },
  { name: "Colorado AI Act (SB 26-189)", cat: "Regulation", seat: "Colorado State Capitol, Denver", region: "US", status: "Enacted (eff. 1 Jan 2027)", href: "/regions" },
  { name: "Texas TRAIGA", cat: "Regulation", seat: "Texas State Capitol, Austin", region: "US", status: "In force", href: "/regions" },
  { name: "NYC LL144 (AEDT bias audit)", cat: "Regulation", seat: "New York City Hall", region: "US", status: "In force", href: "/sectors" },
  { name: "UK pro-innovation AI", cat: "Regulation", seat: "Palace of Westminster, London", region: "UK", status: "Guidance", href: "/regions" },
  { name: "Canada AIDA (Bill C-27)", cat: "Regulation", seat: "Parliament Hill, Ottawa", region: "Canada", status: "Proposed", href: "/regions" },
  { name: "China PIPL", cat: "Regulation", seat: "Great Hall of the People, Beijing", region: "APAC", status: "In force", href: "/meok-law" },
  { name: "Singapore Model AI Governance", cat: "Regulation", seat: "Parliament House, Singapore", region: "APAC", status: "Guidance", href: "/regions" },
  { name: "NIST AI RMF 1.0", cat: "Standard", seat: "NIST HQ, Gaithersburg", region: "US", status: "Guidance", href: "/fedramp" },
  { name: "ISO/IEC 42001", cat: "Standard", seat: "ISO Central Secretariat, Geneva", region: "Global", status: "In force", href: "/temples" },
  { name: "ISO/IEC 27001", cat: "Standard", seat: "ISO Central Secretariat, Geneva", region: "Global", status: "In force", href: "/temples" },
  { name: "OECD AI Principles", cat: "Standard", seat: "Chateau de la Muette, Paris", region: "Global", status: "Guidance", href: "/regions" },
  { name: "G7 Hiroshima Process", cat: "Standard", seat: "G7 (rotating presidency)", region: "Global", status: "Guidance", href: "/regions" },
  { name: "C2PA content provenance", cat: "Protocol", seat: "C2PA coalition (open)", region: "Global", status: "In force", href: "/readiness" },
  { name: "OSCAL (machine-readable controls)", cat: "Protocol", seat: "NIST, open spec", region: "US/Global", status: "In force", href: "/fedramp" },
  { name: "Ed25519 signed verdicts", cat: "Protocol", seat: "Open cryptographic standard", region: "Global", status: "In force", href: "/agents" },
  { name: "A2A governance bridge", cat: "Protocol", seat: "CSOAI - open at openpatent.ai", region: "Global", status: "Live", href: "/agents" },
  { name: "MCP (Model Context Protocol)", cat: "Protocol", seat: "Open spec", region: "Global", status: "In force", href: "/agents" },
  { name: "MEOK Law cross-layer engine", cat: "Protocol", seat: "CSOAI", region: "Global", status: "Live", href: "/meok-law" },
  { name: "Council Compliance Passport", cat: "Protocol", seat: "CSOAI - Ed25519 attestation", region: "Global", status: "Live", href: "/readiness" },
  { name: "Multi-Agent Council (configurable)", cat: "Council", seat: "CSOAI - open at openpatent.ai", region: "Global", status: "Live", href: "/bft" },
  { name: "The 4-Wing Council", cat: "Council", seat: "CSOAI", region: "Global", status: "Live", href: "/dragonfly" },
  { name: "The Hive (Council queens)", cat: "Council", seat: "CSOAI", region: "Global", status: "Live", href: "/hive" },
];
const CATS: ("All" | Cat)[] = ["All", "Regulation", "Standard", "Protocol", "Council"];
const CTONE: Record<string, string> = { Regulation: "bg-blue-100 text-blue-700", Standard: "bg-emerald-100 text-emerald-700", Protocol: "bg-violet-100 text-violet-700", Council: "bg-amber-100 text-amber-700" };

export default function RegistryAll() {
  useEffect(() => { document.title = "The Registry - every regulation, standard, protocol | CSOAI"; }, []);
  const [cat, setCat] = useState<"All" | Cat>("All");
  const [q, setQ] = useState("");
  const rows = ITEMS.filter((x) => (cat === "All" || x.cat === cat) && (q === "" || (x.name + x.seat + x.region).toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - the registry</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Every layer, in one place</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">All regulations, standards, protocols, and Council infrastructure the OS covers - each tagged with the government seat where it is made. Search it, filter it, jump into any one.</p>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-wrap items-center gap-2">
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={"rounded-full border px-4 py-2 text-sm font-bold transition-colors " + (cat === c ? "border-emerald-400 bg-emerald-600 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>{c}</button>
          ))}
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="ml-auto rounded-xl border border-gray-200 px-4 py-2 text-sm" />
        </div>
        <div className="mt-2 text-xs text-gray-400">{rows.length} of {ITEMS.length} entries</div>
        <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {rows.map((x) => (
            <a key={x.name} href={x.href} className="flex flex-col gap-1 px-5 py-4 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={"rounded-md px-2 py-0.5 text-[10px] font-bold " + (CTONE[x.cat] || "bg-gray-100 text-gray-600")}>{x.cat}</span>
                  <span className="font-bold text-gray-900">{x.name}</span>
                </div>
                <div className="mt-0.5 text-sm text-gray-500">{x.seat}</div>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs">
                <span className="text-gray-400">{x.region}</span>
                <span className="rounded-md bg-gray-100 px-2 py-0.5 font-semibold text-gray-600">{x.status}</span>
                <span className="font-bold text-emerald-700">open -&gt;</span>
              </div>
            </a>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/globe" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">See them on the globe -&gt;</a>
          <a href="/meok-law" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Your jurisdiction stack -&gt;</a>
          <a href="/try" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Ask the Council -&gt;</a>
        </div>
      </section>
    </div>
  );
}
