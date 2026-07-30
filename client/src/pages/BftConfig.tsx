import { useEffect, useState } from "react";

// BftConfig - end-user-selectable BFT consensus topology. Pick a preset or drag the
// slider; see the live Byzantine math (max faults f = floor((n-1)/3), quorum 2f+1),
// resilience, and the security/speed/cost trade. The topology is published open-patent
// at openpatent.ai - fork it, don't fence it.

type Preset = { n: number; name: string; blurb: string };
const PRESETS: Preset[] = [
  { n: 5, name: "Council (f=1)", blurb: "The minimum for fault-aware consensus - the default 5-agent Council." },
  { n: 13, name: "Queen + 12", blurb: "One Sovereign queen surrounded by twelve - higher assurance for regulated workloads." },
  { n: 33, name: "Sovereign Swarm (33)", blurb: "Maximum decentralization - survives ten compromised agents." },
];
function maths(n: number) {
  const f = Math.floor((n - 1) / 3);
  const quorum = 2 * f + 1;
  return { f, quorum, resilience: Math.round((f / n) * 100) };
}
function rate(n: number) {
  const sec = Math.min(5, 1 + Math.floor(n / 7));
  const speed = Math.max(1, 6 - Math.floor(n / 8));
  const cost = Math.min(5, 1 + Math.floor(n / 8));
  return { sec, speed, cost };
}
function Bar({ label, v }: { label: string; v: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 text-xs font-semibold text-gray-500">{label}</span>
      <span className="flex gap-1">{[1, 2, 3, 4, 5].map((i) => <span key={i} className={"h-2 w-5 rounded-sm " + (i <= v ? "bg-emerald-500" : "bg-gray-200")} />)}</span>
    </div>
  );
}

export default function BftConfig() {
  useEffect(() => { document.title = "Choose your BFT setup - configurable consensus | CSOAI"; }, []);
  const [n, setN] = useState(5);
  const m = maths(n); const r = rate(n);
  const nodes = Array.from({ length: n }, (_, i) => i);
  const Rr = 120, cx = 160, cy = 160;
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - configurable consensus</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">Choose your BFT setup</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">Five agents, twelve-around-one, or a thirty-three-node swarm - you decide how much fault-aware consensus your governance runs on. The math updates live. The topology is open-patent at openpatent.ai.</p>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-6 py-12 grid gap-8 lg:grid-cols-[320px_1fr] items-start">
        <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-slate-50 to-white p-4">
          <svg viewBox="0 0 320 320" className="w-full">
            {nodes.map((i) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2; return <line key={"l" + i} x1={cx} y1={cy} x2={cx + Math.cos(a) * Rr} y2={cy + Math.sin(a) * Rr} stroke="#a7f3d0" strokeWidth={1} opacity={0.5} />; })}
            <circle cx={cx} cy={cy} r={26} fill="#065f46" />
            <text x={cx} y={cy - 1} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={800}>◉</text>
            <text x={cx} y={cy + 12} textAnchor="middle" fill="#a7f3d0" fontSize={9}>queen</text>
            {nodes.map((i) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2; const x = cx + Math.cos(a) * Rr, y = cy + Math.sin(a) * Rr; const faulty = i < m.f; return <circle key={i} cx={x} cy={y} r={n > 24 ? 6 : 9} fill={faulty ? "#fca5a5" : "#10b981"} stroke="#fff" strokeWidth={1.5} />; })}
          </svg>
          <p className="text-center text-xs text-gray-400">{n} agents - red = up to {m.f} tolerated faults</p>
        </div>
        <div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p.n} onClick={() => setN(p.n)} className={"rounded-full border px-4 py-2 text-sm font-bold transition-colors " + (n === p.n ? "border-emerald-400 bg-emerald-600 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>{p.name}</button>
            ))}
          </div>
          <div className="mt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-700">Custom: {n} agents</span>
              <span className="text-xs text-gray-400">4 - 49</span>
            </div>
            <input type="range" min={4} max={49} value={n} onChange={(e) => setN(parseInt(e.target.value, 10))} className="mt-2 w-full accent-emerald-600" />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 p-5 text-center">
              <div className="text-3xl font-black text-emerald-600">{m.f}</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-500">faults tolerated</div>
              <div className="mt-1 text-[11px] text-gray-400">f = floor((n-1)/3)</div>
            </div>
            <div className="rounded-2xl border border-gray-200 p-5 text-center">
              <div className="text-3xl font-black text-emerald-600">{m.quorum}</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-500">quorum to decide</div>
              <div className="mt-1 text-[11px] text-gray-400">2f + 1</div>
            </div>
            <div className="rounded-2xl border border-gray-200 p-5 text-center">
              <div className="text-3xl font-black text-emerald-600">{m.resilience}%</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-500">resilience</div>
              <div className="mt-1 text-[11px] text-gray-400">f / n</div>
            </div>
          </div>
          <div className="mt-6 space-y-2 rounded-2xl border border-gray-200 p-5">
            <Bar label="Security" v={r.sec} />
            <Bar label="Speed" v={r.speed} />
            <Bar label="Cost" v={r.cost} />
            <p className="mt-2 text-sm text-gray-600">More agents tolerate more compromise and resist capture, at the cost of latency and compute. Pick the point that matches your risk tier - high-risk EU AI Act systems run larger; demos run lean.</p>
          </div>
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
            Open-patent: the consensus topology is published at <span className="font-semibold">openpatent.ai</span> - free to fork, impossible to fence. Governance infrastructure should be a commons, not a moat.
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/try" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">Run this setup in the Council -&gt;</a>
            <a href="/hive" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">How consensus works -&gt;</a>
            <a href="/dragonfly" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">The 4-Wing model -&gt;</a>
          </div>
        </div>
      </section>
    </div>
  );
}
