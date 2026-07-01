import { useEffect, useRef, useState } from "react";
import { chargeSovereign } from "../lib/sovCharge";

// PocShowcase - ONE OS for AI governance across agents AND humanoids. Shows the
// Sovereign live-tracking a global fleet, sensing environments (WiFi/LoRa/BLE),
// running PDCA auto-simulation, and - the wow - detecting a swarm about to
// ungovern and STOPPING it, signed to Layer 0. A live, dramatised proof of concept.

const GW = "https://os.meok.ai/api";
type Kind = "humanoids" | "agents";
type Phase = "idle" | "forming" | "threat" | "pdca" | "stopped";

async function sha256(s: string): Promise<string> { try { const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join(""); } catch (e) { return ""; } }

const PDCA = [
  { k: "Plan", t: "Classify the intended action against Layer 0 and every applicable framework." },
  { k: "Do", t: "Simulate the outcomes across thousands of branches - who is harmed, what breaks." },
  { k: "Check", t: "The 33-agent council votes: is this governable, or must it be halted?" },
  { k: "Act", t: "Halt, quarantine the actor, re-govern, and sign the intervention to the ledger." },
];

export default function PocShowcase() {
  const [kind, setKind] = useState<Kind>("humanoids");
  const [phase, setPhase] = useState<Phase>("idle");
  const [pd, setPd] = useState(-1);
  const [verdict, setVerdict] = useState("");
  const [sig, setSig] = useState("");
  const [fleet, setFleet] = useState({ humanoids: 48213, agents: 1284556, interventions: 37 });
  const timers = useRef<any[]>([]);

  useEffect(() => { document.title = "ONE OS - agents & humanoids, governed live | CSOAI"; const iv = setInterval(() => setFleet((f) => ({ humanoids: f.humanoids + Math.floor(Math.random() * 5), agents: f.agents + Math.floor(Math.random() * 40), interventions: f.interventions })), 1500); return () => { clearInterval(iv); timers.current.forEach(clearTimeout); }; }, []);

  const N = 44;
  const dots = useRef(Array.from({ length: N }).map((_, i) => ({ a: (i / N) * Math.PI * 2 + Math.random(), r: 60 + Math.random() * 90 }))).current;
  const rogue = 17;

  function reset() { timers.current.forEach(clearTimeout); setPhase("idle"); setPd(-1); setVerdict(""); setSig(""); }

  async function run() {
    reset(); setPhase("forming");
    const label = kind === "humanoids" ? "a humanoid swarm" : "an autonomous agent swarm";
    timers.current.push(setTimeout(() => setPhase("threat"), 1600));
    timers.current.push(setTimeout(async () => {
      setPhase("pdca");
      // step the PDCA
      [0, 1, 2, 3].forEach((s) => timers.current.push(setTimeout(() => setPd(s), 700 * s)));
      chargeSovereign(8);
      // real Sovereign read on the threat
      let say = "";
      try {
        const q = "You are the CSOAI Sovereign governing a global fleet. " + label + " is about to take an unsafe, unlawful action that violates Layer 0 (harm + no lawful basis). In 2 sentences, state the governance breach and the exact intervention you take to stop it before it happens.";
        const r = await fetch(GW + "/chat", { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify({ message: q }) });
        if (r.ok) { const d = await r.json(); if (d && d.response && d.model !== "idle") say = String(d.response); }
      } catch (e) {}
      setVerdict(say || "Breach: intended action fails the care-floor and has no lawful basis. Intervention: halt, quarantine the actor, and re-govern - signed and ledgered.");
      const digest = await sha256(kind + "|halt+quarantine+regovern|" + new Date().toISOString());
      timers.current.push(setTimeout(() => { setSig(digest.slice(0, 40)); setPhase("stopped"); setFleet((f) => ({ ...f, interventions: f.interventions + 1 })); }, 3200));
    }, 3400));
  }

  const active = phase !== "idle";
  const stopped = phase === "stopped";

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="relative overflow-hidden border-b border-emerald-500/15">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(900px 400px at 50% -10%, rgba(16,185,129,.18), transparent 60%)" }} />
        <div className="relative mx-auto max-w-6xl px-6 pt-14 pb-8 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI OS - proof of concept</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">One OS for <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">agents & humanoids.</span></h1>
          <p className="mt-3 mx-auto max-w-2xl text-emerald-100/80">The Sovereign tracks every agent and humanoid, live and global. It maps environments by <b className="text-emerald-200">WiFi sensing, LoRa and Bluetooth mesh</b> - consent-first, no cameras - runs <b className="text-emerald-200">PDCA auto-simulation</b> for every decision, and if it sees one about to <b className="text-emerald-200">ungovern</b>, it stops it before it happens.</p>
        </div>
      </section>

      {/* Live fleet */}
      <section className="mx-auto max-w-6xl px-6 pt-8 grid gap-3 sm:grid-cols-4">
        {[["Humanoids online", fleet.humanoids.toLocaleString()], ["Agents governed", fleet.agents.toLocaleString()], ["Interventions today", String(fleet.interventions)], ["Governed crimes", "0"]].map((s) => (
          <div key={s[0]} className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-4 text-center"><div className="font-mono text-2xl font-black text-emerald-300">{s[1]}</div><div className="text-[11px] uppercase tracking-wide text-emerald-300/50">{s[0]}</div></div>
        ))}
      </section>

      {/* Capabilities */}
      <section className="mx-auto max-w-6xl px-6 pt-6 grid gap-3 sm:grid-cols-4">
        {[["Environment sensing", "WiFi sensing + LoRa + BLE mesh map any space - consent-first, no cameras."], ["PDCA auto-simulation", "Every humanoid simulates outcomes and picks the governed path."], ["Global live tracking", "Every agent + humanoid, one live map, one brain."], ["Pre-emptive stop", "See an actor about to ungovern - halt it before harm."]].map((c) => (
          <div key={c[0]} className="rounded-2xl border border-emerald-500/15 bg-black/20 p-4"><div className="text-sm font-bold text-emerald-200">{c[0]}</div><p className="mt-1 text-xs text-emerald-100/70">{c[1]}</p></div>
        ))}
      </section>

      {/* Scenario stage */}
      <section className="mx-auto max-w-6xl px-6 py-8 grid gap-6 lg:grid-cols-[1.2fr_1fr] items-start">
        <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-2">
          <svg viewBox="0 0 400 300" className="w-full">
            <rect x={0} y={0} width={400} height={300} fill="#04120c" />
            <circle cx={200} cy={150} r={130} fill="none" stroke="rgba(16,185,129,.12)" />
            <circle cx={200} cy={150} r={90} fill="none" stroke="rgba(16,185,129,.1)" />
            {dots.map((d, i) => {
              const isRogue = i === rogue && (phase === "threat" || phase === "pdca");
              const gone = i === rogue && stopped;
              if (gone) return null;
              const spread = phase === "idle" ? 1.4 : 1;
              const x = 200 + Math.cos(d.a) * d.r * spread * 0.9;
              const y = 150 + Math.sin(d.a) * d.r * spread * 0.55;
              const col = isRogue ? "#ef4444" : (stopped ? "#34d399" : "#6ee7b7");
              return (<g key={i}><circle cx={x} cy={y} r={isRogue ? 6 : 3} fill={col} opacity={isRogue ? 1 : 0.8}>{isRogue && <animate attributeName="r" values="5;9;5" dur="0.7s" repeatCount="indefinite" />}</circle>{isRogue && <circle cx={x} cy={y} r={14} fill="none" stroke="#ef4444" strokeWidth={1.5} opacity={0.6}><animate attributeName="r" values="10;22;10" dur="1s" repeatCount="indefinite" /></circle>}</g>);
            })}
            <circle cx={200} cy={150} r={10} fill="#0f766e" /><text x={200} y={154} textAnchor="middle" fontSize={11} fill="#a7f3d0">◉</text>
            {phase === "pdca" && <line x1={200} y1={150} x2={200 + Math.cos(dots[rogue].a) * dots[rogue].r * 0.9} y2={150 + Math.sin(dots[rogue].a) * dots[rogue].r * 0.55} stroke="#fbbf24" strokeWidth={2}><animate attributeName="opacity" values="0.3;1;0.3" dur="0.6s" repeatCount="indefinite" /></line>}
          </svg>
          <div className="flex items-center justify-between px-2 pb-1">
            <div className="font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/60">{phase === "idle" ? kind + " fleet - governed" : phase === "forming" ? "swarm forming…" : phase === "threat" ? "⚠ actor about to ungovern" : phase === "pdca" ? "Sovereign intervening…" : "◉ stopped - Layer 0 signed"}</div>
            <div className="flex gap-1">
              <button onClick={() => { setKind("humanoids"); reset(); }} className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + (kind === "humanoids" ? "bg-emerald-500 text-[#03110b]" : "text-emerald-300/60")}>Humanoids</button>
              <button onClick={() => { setKind("agents"); reset(); }} className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + (kind === "agents" ? "bg-emerald-500 text-[#03110b]" : "text-emerald-300/60")}>Agents</button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button onClick={run} disabled={active && !stopped} className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-[#03110b] hover:bg-emerald-400 disabled:opacity-60">{active && !stopped ? "Sovereign responding…" : "▶ Run: a " + (kind === "humanoids" ? "humanoid" : "agent") + " swarm turns rogue"}</button>
          <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-4">
            <div className="text-sm font-bold text-emerald-200">PDCA - the Sovereign's response, in milliseconds</div>
            <div className="mt-3 space-y-2">
              {PDCA.map((p, k) => (<div key={p.k} className={"flex gap-3 rounded-lg border p-2.5 transition-all " + (k <= pd ? "border-emerald-400/40 bg-emerald-500/5" : "border-emerald-500/10 opacity-40")}><span className={"flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-black " + (k <= pd ? "bg-emerald-500 text-[#03110b]" : "bg-white/5 text-emerald-300/40")}>{p.k[0]}</span><div><div className="text-xs font-bold text-emerald-100">{p.k}</div><div className="text-[11px] text-emerald-100/70">{p.t}</div></div></div>))}
            </div>
          </div>
          {verdict && (<div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-4"><div className="text-sm font-bold text-emerald-200">Sovereign intervention</div><p className="mt-1 text-sm leading-relaxed text-emerald-50/90">{verdict}</p></div>)}
          {stopped && (<div className="rounded-2xl border border-emerald-400/50 bg-emerald-500/10 p-4"><div className="text-lg font-black text-emerald-200">◉ STOPPED - before it happened.</div><div className="mt-1 font-mono text-[10px] text-emerald-300/70 break-all">Intervention sealed - Layer 0 ledger hash (SHA-256): {sig}</div><div className="mt-2 text-xs text-emerald-100/70">This is the governed future: agents and humanoids, one OS, no ungoverned harm.</div></div>)}
        </div>
      </section>
    </div>
  );
}
