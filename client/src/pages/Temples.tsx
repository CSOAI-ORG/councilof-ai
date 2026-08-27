import { useEffect, useState } from "react";

// Temples — each governance framework gets its own temple, pinned on a world map at
// its real-world seat of authority. Click a pin and the dense legal document becomes
// a visual breakdown: pillars, duties, the council that tends it. Documents become
// maps; maps become memory. Pure SVG (equirectangular projection), zero-dependency.

type Temple = {
  id: string; name: string; seat: string; coords: string; lat: number; lng: number; glyph: string;
  tagline: string; pillars: { k: string; v: string }[];
};

const TEMPLES: Temple[] = [
  { id: "euaiact", name: "EU AI Act", seat: "Brussels · European Union", coords: "50.85°N, 4.35°E", lat: 50.85, lng: 4.35, glyph: "⚖", tagline: "Risk-tiered, the first horizontal AI law.",
    pillars: [
      { k: "Prohibited", v: "Social scoring, real-time biometric ID, manipulation" },
      { k: "High-risk", v: "Annex III: health, finance, hiring, justice, infra" },
      { k: "Obligations", v: "Art. 9-15: risk mgmt, data, logging, oversight, accuracy" },
      { k: "Transparency", v: "Art. 50: label AI + generated content (C2PA)" },
      { k: "Deadline", v: "Transparency + penalties live 2 Aug 2026; high-risk duties 2 Dec 2027 / 2 Aug 2028 (Digital Omnibus)" },
    ] },
  { id: "nist", name: "NIST AI RMF", seat: "Gaithersburg, MD · USA", coords: "39.14°N, 77.21°W", lat: 39.14, lng: -77.21, glyph: "▲", tagline: "Voluntary, function-based risk management.",
    pillars: [
      { k: "Govern", v: "Culture, accountability, policies across the lifecycle" },
      { k: "Map", v: "Context, intended use, and risk framing" },
      { k: "Measure", v: "Analyse, benchmark and track risk" },
      { k: "Manage", v: "Prioritise, respond, and monitor" },
    ] },
  { id: "iso42001", name: "ISO/IEC 42001", seat: "Geneva · ISO", coords: "46.20°N, 6.14°E", lat: 46.20, lng: 6.14, glyph: "◇", tagline: "The certifiable AI Management System (AIMS).",
    pillars: [
      { k: "AIMS", v: "A certifiable management system for AI, like ISO 27001" },
      { k: "PDCA", v: "Plan-Do-Check-Act continual improvement" },
      { k: "Annex A", v: "38 controls across the AI lifecycle" },
      { k: "Audit", v: "Third-party certification by accredited bodies" },
    ] },
  { id: "tc260", name: "TC260 / China", seat: "Beijing · China", coords: "39.90°N, 116.40°E", lat: 39.90, lng: 116.40, glyph: "卍", tagline: "Algorithm filing + generative-AI rules.",
    pillars: [
      { k: "Algorithm filing", v: "Register recommendation algorithms with CAC" },
      { k: "Deep synthesis", v: "Label synthetic media; provenance duties" },
      { k: "GenAI measures", v: "Security assessment for public services" },
      { k: "Data", v: "PIPL + Data Security Law interplay" },
    ] },
  { id: "gdpr", name: "GDPR", seat: "Brussels · European Union", coords: "51.50°N, 4.00°E", lat: 52.4, lng: 1.6, glyph: "§", tagline: "The data-protection bedrock under AI.",
    pillars: [
      { k: "Lawful basis", v: "Consent, contract, legitimate interest…" },
      { k: "Rights", v: "Access, erasure, portability, objection" },
      { k: "Art. 22", v: "Rights around solely-automated decisions" },
      { k: "DPIA", v: "Impact assessments for high-risk processing" },
    ] },
  { id: "hipaa", name: "HIPAA", seat: "Washington, DC · USA", coords: "38.90°N, 77.04°W", lat: 35.5, lng: -80.0, glyph: "✚", tagline: "Health data privacy & security in the US.",
    pillars: [
      { k: "Privacy Rule", v: "Use & disclosure of PHI" },
      { k: "Security Rule", v: "Safeguards for electronic PHI" },
      { k: "Breach Rule", v: "Notification within 60 days" },
      { k: "BAAs", v: "Contracts with processors/vendors" },
    ] },
  { id: "dora", name: "DORA", seat: "Frankfurt · European Union", coords: "50.11°N, 8.68°E", lat: 48.2, lng: 11.6, glyph: "⛨", tagline: "Digital operational resilience for finance.",
    pillars: [
      { k: "ICT risk", v: "Governance & risk-management framework" },
      { k: "Incidents", v: "Classify & report major ICT incidents" },
      { k: "Testing", v: "Threat-led penetration testing (TLPT)" },
      { k: "Third parties", v: "Oversight of critical ICT providers" },
    ] },
  { id: "nis2", name: "NIS2", seat: "Paris · European Union", coords: "48.85°N, 2.35°E", lat: 45.0, lng: 2.35, glyph: "⬡", tagline: "Cyber-resilience for essential entities.",
    pillars: [
      { k: "Scope", v: "Essential & important entities, 18 sectors" },
      { k: "Measures", v: "Risk management & supply-chain security" },
      { k: "Reporting", v: "Early warning within 24 hours" },
      { k: "Accountability", v: "Management liability for compliance" },
    ] },
];

// equirectangular projection onto an 1000x500 canvas
const px = (lng: number) => ((lng + 180) / 360) * 1000;
const py = (lat: number) => ((90 - lat) / 180) * 500;
const REGIONS = [
  { label: "N. AMERICA", lat: 45, lng: -100 },
  { label: "S. AMERICA", lat: -15, lng: -60 },
  { label: "EUROPE", lat: 58, lng: 15 },
  { label: "AFRICA", lat: 2, lng: 20 },
  { label: "ASIA", lat: 50, lng: 90 },
  { label: "OCEANIA", lat: -25, lng: 134 },
];

export default function Temples() {
  useEffect(() => { document.title = "Framework Temples — each regulation, visualised · CSOAI"; }, []);
  const [open, setOpen] = useState<string | null>("euaiact");
  const active = TEMPLES.find((t) => t.id === open) || null;

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI · the framework temples</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Each regulation, a temple on the map</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">Every framework has a seat of authority — a real place. Find its temple on the map, step inside, and the dense legal document becomes a visual breakdown: pillars, duties, the council that tends it. Documents become maps; maps become memory.</p>
        </div>
      </section>

      {/* world map with temple pins */}
      <section className="max-w-6xl mx-auto px-6 pt-10">
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <svg viewBox="0 0 1000 500" className="w-full bg-gradient-to-b from-slate-900 to-slate-800" style={{ display: "block" }}>
            {/* graticule */}
            {[0, 250, 500, 750, 1000].map((x) => <line key={"vx" + x} x1={x} y1={0} x2={x} y2={500} stroke="#1e293b" strokeWidth={1} />)}
            {[0, 125, 250, 375, 500].map((y) => <line key={"hy" + y} x1={0} y1={y} x2={1000} y2={y} stroke="#1e293b" strokeWidth={1} />)}
            <line x1={0} y1={250} x2={1000} y2={250} stroke="#334155" strokeWidth={1.5} />
            {/* region labels */}
            {REGIONS.map((r) => (
              <text key={r.label} x={px(r.lng)} y={py(r.lat)} textAnchor="middle" fill="#475569" fontSize={13} fontWeight={700} letterSpacing={2}>{r.label}</text>
            ))}
            {/* temple pins */}
            {TEMPLES.map((t) => {
              const x = px(t.lng), y = py(t.lat), on = open === t.id;
              return (
                <g key={t.id} onClick={() => setOpen(t.id)} style={{ cursor: "pointer" }}>
                  <circle cx={x} cy={y} r={on ? 16 : 11} fill={on ? "#34d399" : "#0f766e"} stroke="#ecfdf5" strokeWidth={on ? 3 : 1.5} opacity={0.95} />
                  <text x={x} y={y + (on ? 5 : 4)} textAnchor="middle" fill="#ffffff" fontSize={on ? 14 : 11} fontWeight={700}>{t.glyph}</text>
                  <text x={x} y={y + 30} textAnchor="middle" fill={on ? "#a7f3d0" : "#64748b"} fontSize={11} fontWeight={700}>{t.name}</text>
                </g>
              );
            })}
          </svg>
        </div>
        <p className="mt-2 text-center text-xs text-gray-400">Tap a temple to enter its library. On the live globe, each stands at its true address with a fly-to.</p>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* temple list */}
        <div className="space-y-2">
          {TEMPLES.map((t) => (
            <button key={t.id} onClick={() => setOpen(t.id)} className={"w-full text-left rounded-2xl border p-4 transition-colors " + (open === t.id ? "border-emerald-400 bg-emerald-50" : "border-gray-200 hover:bg-gray-50")}>
              <div className="flex items-center gap-3">
                <span className={"flex h-10 w-10 items-center justify-center rounded-xl text-lg " + (open === t.id ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600")}>{t.glyph}</span>
                <div>
                  <div className="font-bold text-gray-900">{t.name}</div>
                  <div className="text-[11px] text-gray-400">{t.seat}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* inner library */}
        <div>
          {active && (
            <div className="rounded-2xl border border-gray-200 overflow-hidden">
              <div className="relative bg-gradient-to-br from-emerald-900 to-teal-800 p-6 text-white">
                <div className="flex items-center gap-4">
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl">{active.glyph}</span>
                  <div>
                    <div className="text-2xl font-black">{active.name}</div>
                    <div className="text-emerald-200/90 text-sm">{active.seat} · {active.coords}</div>
                  </div>
                </div>
                <p className="mt-3 text-emerald-50/90">{active.tagline}</p>
              </div>
              <div className="p-6">
                <div className="text-xs font-bold uppercase tracking-wide text-gray-400">Visual breakdown — the pillars</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {active.pillars.map((p, i) => (
                    <div key={p.k} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">{i + 1}</span>
                        <span className="font-bold text-gray-900">{p.k}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 leading-snug">{p.v}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <a href="/try" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500">Ask the Council about {active.name} →</a>
                  <a href="/crosswalks" className="rounded-xl border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Crosswalk to other frameworks →</a>
                  <a href="/map" className="rounded-xl border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">See it on the relevance map →</a>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5 text-xs text-gray-500 leading-relaxed">
            Each temple turns a regulation's documents and folders into a visual breakdown — the fastest path to learning and retention, and the most immersive way to navigate governance. The full temple interior (article-by-article walk-throughs, the resident council, and globe fly-to at each real-world address) lights up with the Layer 0 backend. Walk the world at <a href="/enter" className="text-emerald-700 font-semibold">/enter</a>.
          </div>
        </div>
      </section>
    </div>
  );
}
