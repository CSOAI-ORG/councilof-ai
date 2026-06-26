import { useEffect, useRef, useState } from "react";

// WorldGlobe - a living, layered, zero-dependency world globe. Auto-rotates (pure SVG
// orthographic projection), pins every framework temple at its real lat/long, layers
// the BFT Council, and lets you click any pin for its detail. No external deps.

type Pin = { id: string; name: string; region: string; lat: number; lng: number; color: string; href: string; note: string };
const FRAMEWORKS: Pin[] = [
  { id: "euaa", name: "EU AI Act", region: "EU", lat: 50.85, lng: 4.35, color: "#2563eb", href: "/readiness", note: "Transparency 2 Aug 2026; high-risk Dec 2027 (Omnibus). Brussels." },
  { id: "gdpr", name: "GDPR", region: "EU", lat: 50.85, lng: 4.36, color: "#1d4ed8", href: "/meok-law", note: "Data + automated-decision safeguards. Brussels." },
  { id: "coe", name: "Council of Europe AI Treaty", region: "EU", lat: 48.57, lng: 7.75, color: "#7c3aed", href: "/meok-law", note: "First binding AI human-rights treaty. Strasbourg." },
  { id: "oecd", name: "OECD AI Principles", region: "Global", lat: 48.85, lng: 2.35, color: "#0ea5e9", href: "/regions", note: "Soft-law baseline shaping allied policy. Paris." },
  { id: "iso", name: "ISO/IEC 42001", region: "Global", lat: 46.2, lng: 6.14, color: "#059669", href: "/temples", note: "AI management-system standard. Geneva." },
  { id: "nist", name: "NIST AI RMF", region: "US", lat: 39.14, lng: -77.22, color: "#dc2626", href: "/fedramp", note: "De-facto US risk-management baseline. Gaithersburg." },
  { id: "fedramp", name: "FedRAMP / OSCAL", region: "US", lat: 38.9, lng: -77.04, color: "#b91c1c", href: "/fedramp", note: "RFC-0024 machine-readable mandate, 30 Sep 2026. Washington DC." },
  { id: "ccpa", name: "CCPA / CPRA", region: "US", lat: 38.58, lng: -121.49, color: "#ea580c", href: "/regions", note: "Profiling + opt-out rights. Sacramento." },
  { id: "nyc", name: "NYC LL144", region: "US", lat: 40.71, lng: -74.0, color: "#f59e0b", href: "/sectors", note: "Annual AEDT bias-audit attestation. New York." },
  { id: "uk", name: "UK pro-innovation AI", region: "UK", lat: 51.5, lng: -0.12, color: "#9333ea", href: "/regions", note: "Principles-based, regulator-led. London." },
  { id: "aida", name: "Canada AIDA (C-27)", region: "Canada", lat: 45.42, lng: -75.7, color: "#e11d48", href: "/regions", note: "High-impact systems regime. Ottawa." },
  { id: "pipl", name: "China PIPL", region: "APAC", lat: 39.9, lng: 116.4, color: "#16a34a", href: "/meok-law", note: "Personal-information protection + algorithm rules. Beijing." },
  { id: "sg", name: "Singapore Model AI", region: "APAC", lat: 1.35, lng: 103.8, color: "#0d9488", href: "/regions", note: "Voluntary governance framework + testing. Singapore." },
];
const COUNCIL: Pin[] = [
  { id: "barnaby", name: "Barnaby (Governance)", region: "Council", lat: 20, lng: -30, color: "#059669", href: "/dragonfly", note: "Compliance wing." },
  { id: "oracle", name: "Oracle (Intelligence)", region: "Council", lat: -10, lng: 60, color: "#2563eb", href: "/dragonfly", note: "Analysis + prediction wing." },
  { id: "vex", name: "Vex (Safety)", region: "Council", lat: 35, lng: 140, color: "#dc2626", href: "/dragonfly", note: "Harm-prevention wing." },
  { id: "phantom", name: "Phantom (Cyber)", region: "Council", lat: -30, lng: -60, color: "#7c3aed", href: "/dragonfly", note: "Defense wing." },
  { id: "speaker", name: "Council Speaker", region: "Council", lat: 0, lng: 0, color: "#0f766e", href: "/try", note: "Neutral facilitation." },
];

const R = 240, CX = 300, CY = 300;
function project(lat: number, lng: number, rot: number) {
  const la = (lat * Math.PI) / 180, lo = ((lng + rot) * Math.PI) / 180;
  const x = R * Math.cos(la) * Math.sin(lo);
  const y = R * Math.sin(la);
  const front = Math.cos(la) * Math.cos(lo) > 0;
  return { x: CX + x, y: CY - y, front, depth: Math.cos(la) * Math.cos(lo) };
}

export default function WorldGlobe() {
  useEffect(() => { document.title = "The Sovereign Globe - AI governance, layered on the world | CSOAI"; }, []);
  const [rot, setRot] = useState(0);
  const [spin, setSpin] = useState(true);
  const [layers, setLayers] = useState<{ fw: boolean; council: boolean }>({ fw: true, council: false });
  const [sel, setSel] = useState<Pin | null>(null);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (!spin) return;
    const id = window.setInterval(() => setRot((r) => (r + 0.4) % 360), 40);
    return () => window.clearInterval(id);
  }, [spin]);

  const grat: { x: number; y: number }[] = [];
  for (let la = -60; la <= 60; la += 30) for (let lo = 0; lo < 360; lo += 20) { const p = project(la, lo, rot); if (p.front) grat.push({ x: p.x, y: p.y }); }
  const pins = ([] as Pin[]).concat(layers.fw ? FRAMEWORKS : [], layers.council ? COUNCIL : []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-4">
        <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - the sovereign globe</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">AI governance, layered on the world</h1>
        <p className="mt-2 max-w-2xl text-emerald-50/80">Every framework lives where it is made. Spin the globe, toggle the layers, click any node to see what it governs and jump straight into the OS.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setLayers((l) => ({ ...l, fw: !l.fw }))} className={"rounded-full border px-4 py-1.5 text-sm font-bold " + (layers.fw ? "border-emerald-400 bg-emerald-600 text-white" : "border-white/20 text-white/60")}>Frameworks</button>
          <button onClick={() => setLayers((l) => ({ ...l, council: !l.council }))} className={"rounded-full border px-4 py-1.5 text-sm font-bold " + (layers.council ? "border-emerald-400 bg-emerald-600 text-white" : "border-white/20 text-white/60")}>BFT Council</button>
          <button onClick={() => setSpin((s) => !s)} className="rounded-full border border-white/20 px-4 py-1.5 text-sm font-semibold text-white/70 hover:bg-white/10">{spin ? "Pause" : "Spin"}</button>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-6 pb-16 grid gap-6 lg:grid-cols-[1fr_320px] items-start">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-2">
          <svg viewBox="0 0 600 600" className="w-full" onMouseEnter={() => setSpin(false)} onMouseLeave={() => sel ? null : setSpin(true)}>
            <defs>
              <radialGradient id="ocean" cx="38%" cy="32%" r="75%">
                <stop offset="0%" stopColor="#0f766e" /><stop offset="55%" stopColor="#0c4a6e" /><stop offset="100%" stopColor="#020617" />
              </radialGradient>
            </defs>
            <circle cx={CX} cy={CY} r={R} fill="url(#ocean)" stroke="#134e4a" strokeWidth={1.5} />
            {grat.map((g, i) => <circle key={i} cx={g.x} cy={g.y} r={1.1} fill="#5eead4" opacity={0.25} />)}
            {pins.map((p) => {
              const q = project(p.lat, p.lng, rot); if (!q.front) return null;
              const on = sel && sel.id === p.id; const sc = 0.6 + q.depth * 0.6;
              return (
                <g key={p.id} onClick={() => { setSel(p); setSpin(false); }} style={{ cursor: "pointer" }}>
                  <circle cx={q.x} cy={q.y} r={(on ? 9 : 6) * sc} fill={p.color} opacity={on ? 1 : 0.85} stroke="#fff" strokeWidth={on ? 2 : 1} />
                  {on && <circle cx={q.x} cy={q.y} r={16} fill="none" stroke={p.color} strokeWidth={2} opacity={0.6} />}
                </g>
              );
            })}
          </svg>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 min-h-[260px]">
          {sel ? (
            <div>
              <div className="text-[11px] uppercase tracking-wide text-emerald-300/70">{sel.region}</div>
              <div className="mt-1 text-xl font-black" style={{ color: "#a7f3d0" }}>{sel.name}</div>
              <p className="mt-2 text-sm text-white/75 leading-relaxed">{sel.note}</p>
              <a href={sel.href} className="mt-4 inline-block rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500">Open in the OS -&gt;</a>
              <button onClick={() => { setSel(null); setSpin(true); }} className="ml-2 text-sm text-white/50 hover:text-white/80">resume spin</button>
            </div>
          ) : (
            <div className="text-white/60">
              <div className="text-lg font-bold text-white/80">Click a node</div>
              <p className="mt-2 text-sm">Frameworks sit at the city where they are made - EU AI Act in Brussels, NIST near DC, PIPL in Beijing. Toggle the BFT Council to see the five agents that govern across them.</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <a href="/meok-law" className="rounded-lg border border-white/15 px-3 py-1.5 font-semibold text-emerald-200 hover:bg-white/10">MEOK Law -&gt;</a>
                <a href="/regions" className="rounded-lg border border-white/15 px-3 py-1.5 font-semibold text-emerald-200 hover:bg-white/10">By region -&gt;</a>
                <a href="/temples" className="rounded-lg border border-white/15 px-3 py-1.5 font-semibold text-emerald-200 hover:bg-white/10">Temples -&gt;</a>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
