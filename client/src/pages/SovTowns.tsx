import { useEffect, useState } from "react";

// SovTowns — the learning multiplication engine. Each town ingests white papers +
// regulations, runs governance simulations per industry/region, accumulates data,
// and spawns specialised child towns. Ingest -> Simulate -> Learn -> Spawn -> Multiply.
// One town becomes a civilization; a civilization becomes a world of governed minds.

type Town = { name: string; civ: string; focus: string; papers: number; state: "Learning" | "Aware" | "Evolving"; spawned: number };

const TOWNS: Town[] = [
  { name: "Aethelgard Prime", civ: "UK / EU", focus: "EU AI Act · GDPR · DSA", papers: 412, state: "Evolving", spawned: 9 },
  { name: "Pan-America Hub", civ: "US", focus: "NIST AI RMF · sectoral", papers: 388, state: "Evolving", spawned: 7 },
  { name: "Sino-Nova Gate", civ: "China", focus: "TC260 · algorithm filing", papers: 256, state: "Aware", spawned: 5 },
  { name: "Indo-Sphere Field", civ: "India", focus: "DPDP · UPI governance", papers: 174, state: "Aware", spawned: 4 },
  { name: "Khaleej Crescent", civ: "Middle East", focus: "PDPL · Council AI", papers: 96, state: "Learning", spawned: 2 },
  { name: "Nubia Prime", civ: "Africa", focus: "mobile money · data acts", papers: 71, state: "Learning", spawned: 2 },
  { name: "Brasilia Verde", civ: "LATAM", focus: "LGPD · WhatsApp commerce", papers: 88, state: "Learning", spawned: 1 },
  { name: "ASEAN-IX Mesh", civ: "SE Asia", focus: "PDPA · cross-border flows", papers: 64, state: "Learning", spawned: 1 },
];

const LOOP = [
  { step: "Ingest", glyph: "▼", body: "Pull white papers, regulations, crosswalks and the live M4 reg-delta feed into the town." },
  { step: "Simulate", glyph: "◈", body: "Run governance scenarios for that industry × region — the crosswalks become playable." },
  { step: "Learn", glyph: "✦", body: "Outcomes, edge cases and resolutions accumulate as the town's own governed dataset." },
  { step: "Spawn", glyph: "❋", body: "When a town masters its domain it spawns a specialised child town — narrower, deeper." },
  { step: "Multiply", glyph: "∞", body: "Each child ingests more, spawns more. Data compounds; coverage approaches total governance." },
];

export default function SovTowns() {
  useEffect(() => { document.title = "Council Towns — the learning multiplication engine · CSOAI"; }, []);
  const totalPapers = TOWNS.reduce((a, t) => a + t.papers, 0);
  const totalTowns = TOWNS.length + TOWNS.reduce((a, t) => a + t.spawned, 0);

  // live multiplication model
  const [seed, setSeed] = useState(8);
  const [papers, setPapers] = useState(150);
  const [spawn, setSpawn] = useState(3);
  const [gens, setGens] = useState(4);
  let towns = seed, data = 0, g = seed;
  for (let i = 0; i < gens; i++) { data += g * papers; g = g * spawn; towns += g; }
  const fmt = (n: number) => n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "K" : String(Math.round(n));

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-20">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">ONE OS · the learning multiplication engine</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Council Towns</h1>
          <p className="mt-5 max-w-2xl text-lg text-emerald-50/90">Living governed worlds. Each town ingests white papers and regulations, simulates the scenarios for its industry and region, accumulates its own dataset — and spawns specialised child towns. One town becomes a civilization; the data compounds toward true governance of all.</p>
          <div className="mt-7 flex flex-wrap gap-3 text-sm">
            <span className="rounded-xl bg-white/10 px-4 py-2 font-semibold">{totalTowns} towns live</span>
            <span className="rounded-xl bg-white/10 px-4 py-2 font-semibold">{totalPapers.toLocaleString()} white papers ingested</span>
            <span className="rounded-xl bg-white/10 px-4 py-2 font-semibold">synced to the M4 reg-delta feed</span>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-14">
        <h2 className="text-xl font-bold text-gray-900">The multiplication loop</h2>
        <p className="mt-1 text-sm text-gray-500">Ingest → Simulate → Learn → Spawn → Multiply. The loop never stops — towns are always aware, always ensembling.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {LOOP.map((l, i) => (
            <div key={l.step} className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-lg text-emerald-700">{l.glyph}</div>
              <div className="mt-3 font-bold text-emerald-900">{i + 1}. {l.step}</div>
              <p className="mt-1 text-xs text-emerald-800/80 leading-snug">{l.body}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-bold text-gray-900">Live multiplication model</h2>
        <p className="mt-1 text-sm text-gray-500">Watch the data compound. Drag the levers — every generation of towns ingests papers and spawns the next.</p>
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
            {[
              { label: "Seed towns", val: seed, set: setSeed, min: 1, max: 50 },
              { label: "White papers / town", val: papers, set: setPapers, min: 10, max: 500 },
              { label: "Spawn factor", val: spawn, set: setSpawn, min: 1, max: 6 },
              { label: "Generations", val: gens, set: setGens, min: 1, max: 8 },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-sm"><span className="font-semibold text-gray-700">{s.label}</span><span className="font-mono text-emerald-700">{s.val}</span></div>
                <input type="range" min={s.min} max={s.max} value={s.val} onChange={(e) => s.set(Number(e.target.value))} className="mt-1 w-full accent-emerald-500" />
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 flex flex-col justify-center">
            <div className="text-sm font-semibold text-emerald-800">After {gens} generations</div>
            <div className="mt-2 text-4xl font-black text-emerald-700">{fmt(towns)}</div>
            <div className="text-sm text-emerald-700/80">governed towns in the network</div>
            <div className="mt-5 text-4xl font-black text-teal-700">{fmt(data)}</div>
            <div className="text-sm text-teal-700/80">white-paper-units of governed data accumulated</div>
            <p className="mt-4 text-xs text-emerald-800/70 leading-snug">This is the multiplication: data trains towns, towns spawn towns, towns generate more data. Coverage compounds toward total governance — humanoids, enterprises and governments registering one by one.</p>
          </div>
        </div>

        <h2 className="mt-12 text-xl font-bold text-gray-900">Town registry</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOWNS.map((t) => (
            <div key={t.name} className="rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div className="font-bold text-gray-900">{t.name}</div>
                <span className={"rounded-md px-2 py-0.5 text-[10px] font-bold " + (t.state === "Evolving" ? "bg-emerald-100 text-emerald-700" : t.state === "Aware" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600")}>{t.state}</span>
              </div>
              <div className="text-[11px] uppercase tracking-wide text-gray-400">{t.civ}</div>
              <p className="mt-2 text-sm text-gray-600 leading-snug">{t.focus}</p>
              <div className="mt-3 flex justify-between text-xs text-gray-500">
                <span>{t.papers} papers</span>
                <span className="font-semibold text-emerald-600">↳ spawned {t.spawned}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <a href="/register" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">Register a node →</a>
          <a href="/hives" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">See the Hive Grid →</a>
          <a href="/pulse" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Watch the reg pulse →</a>
        </div>

        <div className="mt-12 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          Yes — we can train more Council Towns on every white paper, and that multiplies into more data. The full learning loop (real ingestion, simulation, spawning, inner Council queens per town) lights up with the Layer 0 gateway. Until then this models the engine and accumulates the registry, one town at a time.
        </div>
      </section>
    </div>
  );
}
