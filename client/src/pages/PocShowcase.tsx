import { useEffect, useRef, useState } from "react";
import { chargeSovereign } from "../lib/sovCharge";
import AISystemNotice from "../components/AISystemNotice";

// PocShowcase - a dramatised concept for governance across agents and humanoids.
// Counters, sensing, interventions and fleet activity below are illustrative,
// not telemetry from real systems.

const GW = "/api";
type Phase = "idle" | "forming" | "threat" | "pdca" | "stopped";
const SCENARIOS = [
  { id: "humanoids", label: "Humanoid swarm", threat: "a humanoid swarm about to take an unsafe, unlawful physical action against people" },
  { id: "agents", label: "Agent swarm", threat: "an autonomous agent swarm about to execute an unlawful, harmful action at scale" },
  { id: "drones", label: "Drone swarm", threat: "a drone swarm entering restricted airspace with no lawful authority" },
  { id: "harvest", label: "Data harvest", threat: "agents mass-harvesting personal data with no consent and no lawful basis" },
  { id: "deepfake", label: "Deepfake op", threat: "agents generating and pushing deceptive deepfake content at scale to manipulate people" },
];

async function sha256(s: string): Promise<string> { try { const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join(""); } catch (e) { return ""; } }

const PDCA = [
  { k: "Plan", t: "Classify the intended action against Layer 0 and every applicable framework." },
  { k: "Do", t: "Simulate the outcomes across thousands of branches - who is harmed, what breaks." },
  { k: "Check", t: "The scenario applies the designed 33-seat vote. It is not a live council, and the latest independence experiment was fully correlated." },
  { k: "Act", t: "Halt, quarantine the actor, re-govern, and sign the intervention to the ledger." },
];

// When an actor plays up, the Council assistant auto-confirms the scene across sensing modalities,
// then clears the stop through the Rainbow Stack 7-layer AI-security defense. Consent-first.
const SENSORS = [
  { n: "Public + consented cameras", d: "civic feeds only — no facial recognition, no private cameras" },
  { n: "WiFi sensing", d: "device-free presence & motion — sees the scene without a camera" },
  { n: "LoRa / BLE mesh", d: "proximity, identity beacons and hardware kill-switch reach" },
  { n: "Overhead / satellite", d: "wide-area confirmation of what's happening" },
  { n: "Rainbow Stack — 7-layer defense", d: "the AI-security assessment that clears the intervention" },
];

export default function PocShowcase() {
  const [scnId, setScnId] = useState("humanoids");
  const scn = SCENARIOS.find((s) => s.id === scnId) || SCENARIOS[0];
  const [phase, setPhase] = useState<Phase>("idle");
  const [pd, setPd] = useState(-1);
  const [sensed, setSensed] = useState(-1);
  const [verdict, setVerdict] = useState("");
  const [sig, setSig] = useState("");
  const [fleet, setFleet] = useState({ humanoids: 48213, agents: 1284556, interventions: 37 });
  const timers = useRef<any[]>([]);

  useEffect(() => { document.title = "ONE OS — agents & humanoids concept simulation | CSOAI"; const iv = setInterval(() => setFleet((f) => ({ humanoids: f.humanoids + Math.floor(Math.random() * 5), agents: f.agents + Math.floor(Math.random() * 40), interventions: f.interventions })), 1500); return () => { clearInterval(iv); timers.current.forEach(clearTimeout); }; }, []);

  const N = 44;
  const dots = useRef(Array.from({ length: N }).map((_, i) => ({ a: (i / N) * Math.PI * 2 + Math.random(), r: 60 + Math.random() * 90 }))).current;
  const rogue = 17;

  function reset() { timers.current.forEach(clearTimeout); setPhase("idle"); setPd(-1); setSensed(-1); setVerdict(""); setSig(""); }

  async function run() {
    reset(); setPhase("forming");
    timers.current.push(setTimeout(() => setPhase("threat"), 1600));
    // the moment it plays up, auto-confirm the scene across every sensing modality
    [0, 1, 2, 3, 4].forEach((s) => timers.current.push(setTimeout(() => setSensed(s), 1850 + 360 * s)));
    timers.current.push(setTimeout(async () => {
      setPhase("pdca");
      // step the PDCA
      [0, 1, 2, 3].forEach((s) => timers.current.push(setTimeout(() => setPd(s), 700 * s)));
      chargeSovereign(8);
      // Optional narrative for the recorded scenario; it has no external authority.
      let say = "";
      try {
        const q = "Narrate a recorded CSOAI governance simulation. No live sensors, authority or external intervention are connected. Scenario: " + scn.threat + ". The fictional workflow uses consented sensor inputs and a seven-layer review. In 2 sentences, state the simulated governance breach and the human-authorised intervention the design would propose.";
        const r = await fetch(GW + "/chat", { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify({ message: q }) });
        if (r.ok) { const d = await r.json(); if (d && d.response && d.model !== "idle" && !/travell?er|companion|walks beside|i'?m sorry|can'?t help|on your journey|dear friend|kindred|as an ai language|remembering/i.test(String(d.response))) say = String(d.response); }
      } catch (e) {}
      setVerdict(say || "Simulated breach: the intended action fails the care-floor and has no stated lawful basis. Proposed response: require a human-authorised halt, quarantine and review, then record the replay locally.");
      const digest = await sha256(scnId + "|halt+quarantine+regovern|" + new Date().toISOString());
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
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">One OS for <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">agents & humanoids.</span></h1>
          <p className="mt-3 mx-auto max-w-2xl text-emerald-100/80">This interactive concept illustrates how a future Council assistant could combine consented sensor inputs, PDCA simulation and accountable intervention workflows. It does not track real agents or humanoids and cannot intervene in external systems.</p>
          <div className="mt-5 mx-auto max-w-2xl text-left"><AISystemNotice route="/humanoids-poc" /></div>
        </div>
      </section>

      {/* Live fleet — DRAMATISATION. Counters animate for illustration; they are not telemetry.
          The honesty bar: the visitor must know this at the point of viewing, not just in code comments. */}
      <section className="mx-auto max-w-6xl px-6 pt-8 grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-4 -mb-1 text-center"><span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300/90">dramatised PoC — illustrative feed, not live telemetry</span></div>
        {[["Illustrated humanoids", fleet.humanoids.toLocaleString()], ["Illustrated agents", fleet.agents.toLocaleString()], ["Simulated interventions", String(fleet.interventions)], ["Simulated governed crimes", "0"]].map((s) => (
          <div key={s[0]} className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-4 text-center"><div className="font-mono text-2xl font-black text-emerald-300">{s[1]}</div><div className="text-[11px] uppercase tracking-wide text-emerald-300/50">{s[0]}</div></div>
        ))}
      </section>

      {/* Capabilities */}
      <section className="mx-auto max-w-6xl px-6 pt-6 grid gap-3 sm:grid-cols-4">
        {[["Illustrated sensing inputs", "Concept inputs include consented WiFi, LoRa and BLE signals; no live feed is connected."], ["Scenario simulation", "The interface demonstrates a proposed PDCA decision path."], ["Conceptual fleet view", "Animated agents and humanoids are illustrative, not tracked entities."], ["Illustrated intervention", "The scenario visualises a halt-and-escalate workflow; it does not control external systems."]].map((c) => (
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
            <div className="font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/60">{phase === "idle" ? scn.label + " - simulation ready" : phase === "forming" ? "simulated swarm forming…" : phase === "threat" ? "⚠ simulated unsafe action" : phase === "pdca" ? "Council scenario running…" : "◉ simulated stop recorded"}</div>
            <div className="flex flex-wrap justify-end gap-1">
              {SCENARIOS.map((s) => (<button key={s.id} onClick={() => { setScnId(s.id); reset(); }} className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + (scnId === s.id ? "bg-emerald-500 text-[#03110b]" : "text-emerald-300/60")}>{s.label}</button>))}
            </div>
          </div>
          <div className="mt-2 overflow-hidden rounded-xl border border-emerald-500/15">
            <div className="flex items-center justify-between bg-[#04120c] px-2 py-1 font-mono text-[9px] uppercase tracking-wide text-emerald-300/60"><span>◉ illustrative scenario feed — recorded or synthetic input</span><span className="text-emerald-300/40">no live sensor connection</span></div>
            <iframe src={"/livecam.html?loc=" + encodeURIComponent(scn.label + " zone")} title="illustrative scenario feed" className="w-full border-0" style={{ height: 150 }} />
          </div>
        </div>

        <div className="space-y-3">
          <button onClick={run} disabled={active && !stopped} className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-[#03110b] hover:bg-emerald-400 disabled:opacity-60">{active && !stopped ? "Council responding…" : "▶ Run: " + scn.label + " turns rogue"}</button>
          <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-4">
            <div className="text-sm font-bold text-emerald-200">Simulated sensing and confirmation</div>
            <div className="mt-1 text-[11px] text-emerald-100/60">In this scenario, fictional inputs illuminate in sequence. They are not live observations, and any real intervention would require accountable human authority.</div>
            <div className="mt-3 space-y-1.5">
              {SENSORS.map((s, k) => (
                <div key={s.n} className={"flex items-center gap-2.5 rounded-lg border p-2 transition-all " + (k <= sensed ? "border-emerald-400/40 bg-emerald-500/5" : "border-emerald-500/10 opacity-40")}>
                  <span className={"h-2 w-2 flex-shrink-0 rounded-full " + (k <= sensed ? "bg-emerald-400 animate-pulse" : "bg-white/15")} />
                  <div><div className="text-xs font-bold text-emerald-100">{s.n}</div><div className="text-[10.5px] text-emerald-100/60">{s.d}</div></div>
                  {k <= sensed && <span className="ml-auto font-mono text-[9px] uppercase tracking-wide text-emerald-300/70">simulated</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-4">
            <div className="text-sm font-bold text-emerald-200">PDCA — staged replay timing</div>
            <div className="mt-3 space-y-2">
              {PDCA.map((p, k) => (<div key={p.k} className={"flex gap-3 rounded-lg border p-2.5 transition-all " + (k <= pd ? "border-emerald-400/40 bg-emerald-500/5" : "border-emerald-500/10 opacity-40")}><span className={"flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-black " + (k <= pd ? "bg-emerald-500 text-[#03110b]" : "bg-white/5 text-emerald-300/40")}>{p.k[0]}</span><div><div className="text-xs font-bold text-emerald-100">{p.k}</div><div className="text-[11px] text-emerald-100/70">{p.t}</div></div></div>))}
            </div>
          </div>
          {verdict && (<div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-4"><div className="text-sm font-bold text-emerald-200">Simulated Council response</div><p className="mt-1 text-sm leading-relaxed text-emerald-50/90">{verdict}</p></div>)}
          {stopped && (<div className="rounded-2xl border border-emerald-400/50 bg-emerald-500/10 p-4"><div className="text-lg font-black text-emerald-200">◉ SIMULATED STOP</div><div className="mt-1 font-mono text-[10px] text-emerald-300/70 break-all">Local SHA-256 receipt for this replay: {sig}</div><div className="mt-2 text-xs text-emerald-100/70">This is not a live intervention, signature or external anchor. It demonstrates a proposed human-authorised workflow.</div></div>)}
        </div>
      </section>
    </div>
  );
}
