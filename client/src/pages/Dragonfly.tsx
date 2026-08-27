import { useEffect, useState } from "react";

// Dragonfly - the 4-Wing Model. Four independent wings (Governance, Intelligence,
// Safety, Cybersecurity) must all agree for a major decision: Byzantine Fault
// Tolerance applied to AI governance, rediscovered from 4,000 years of history.

type Wing = { id: string; n: string; letter: string; color: string; purpose: string; components: string[]; agents: string; quote: string; who: string };
const WINGS: Wing[] = [
  { id: "g", n: "Governance", letter: "G", color: "#059669", purpose: "Ensure AI systems comply with every applicable regulation.", components: ["framework catalog", "47-industry classifier", "Council Score"], agents: "Barnaby, Mei-Lin, Carlos, Amara, Ravi, Fatima", quote: "Every number tells a story. My job is to ensure it's a true one.", who: "Barnaby" },
  { id: "i", n: "Intelligence", letter: "I", color: "#2563eb", purpose: "Analyse, predict, and optimise AI system behaviour.", components: ["MARFT engine", "Predictive modeling", "Anomaly detection"], agents: "Oracle, Sage, Cipher, Scout, Navigator", quote: "I see patterns others miss. I predict what others can't.", who: "Oracle" },
  { id: "s", n: "Safety", letter: "S", color: "#dc2626", purpose: "Prevent harm to humans, society, and the environment.", components: ["Safety evaluation engine", "Red team (Augustus)", "Sandbox (forkd)"], agents: "Vex, Shadow, Blaze, Shield, Warden, Sentinel", quote: "I am the wall between civilization and catastrophe.", who: "Vex" },
  { id: "c", n: "Cybersecurity", letter: "C", color: "#7c3aed", purpose: "Protect AI systems from attack, intrusion, and manipulation.", components: ["Rainbow Stack (7-layer defense)", "Worm Hive mesh", "Signed attestation"], agents: "Phantom, Guardian, Cipher", quote: "You cannot see me. That is why you are safe.", who: "Phantom" },
];
type Member = { name: string; wing: string; style: string };
const COUNCIL: Member[] = [
  { name: "Barnaby", wing: "Governance", style: "Conservative, evidence-based" },
  { name: "Oracle", wing: "Intelligence", style: "Forward-looking, pattern-based" },
  { name: "Vex", wing: "Safety", style: "Risk-averse, safety-first" },
  { name: "Phantom", wing: "Cybersecurity", style: "Paranoid, security-obsessed" },
  { name: "Council Speaker", wing: "Neutral", style: "Balanced, facilitation-focused" },
];
const PROTOCOL = [
  "Any agent can propose a decision",
  "All five debate for a minimum of three rounds",
  "Each casts a vote: APPROVE / REJECT / ABSTAIN",
  "Passes if >=3 approve AND <=1 rejects",
  "If no consensus, escalate to the human operator",
  "Every decision is Ed25519-signed and permanently logged",
];

export default function Dragonfly() {
  useEffect(() => { document.title = "The Dragonfly - the 4-Wing Model | CSOAI"; }, []);
  const [w, setW] = useState("g");
  const active = WINGS.find((x) => x.id === w) || WINGS[0];
  const wingPos: Record<string, { cx: number; cy: number; rot: number }> = {
    g: { cx: 150, cy: 150, rot: -35 }, i: { cx: 350, cy: 150, rot: 35 },
    s: { cx: 150, cy: 250, rot: 35 }, c: { cx: 350, cy: 250, rot: -35 },
  };
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - the architecture</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">The Dragonfly - 4-Wing Model</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">The dragonfly has four wings; so does CSOAI — by design. Four independent subsystems - Governance, Intelligence, Safety, Cybersecurity - are designed so all must agree for any major decision. Council cross-checking applied to AI.</p>
          <p className="mt-3 max-w-2xl text-sm text-amber-200/90">Design model — not yet a live system. Measured status is published on the <a href="/refutation-ledger" className="underline">Refutation Ledger</a> (DR-0007).</p>
          <p className="mt-3 max-w-2xl text-emerald-100/75 text-sm">360-degree vision, reacts in milliseconds, 300 million years of survival. The metaphor is the architecture.</p>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-6 py-12 grid gap-8 lg:grid-cols-2 items-start">
        <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-slate-50 to-white p-4">
          <svg viewBox="0 0 500 420" className="w-full">
            <rect x={244} y={70} width={12} height={250} rx={6} fill="#0f766e" />
            <circle cx={250} cy={70} r={16} fill="#0f766e" />
            <circle cx={243} cy={66} r={4} fill="#a7f3d0" /><circle cx={257} cy={66} r={4} fill="#a7f3d0" />
            {WINGS.map((wg) => {
              const p = wingPos[wg.id]; const on = w === wg.id;
              return (
                <g key={wg.id} onClick={() => setW(wg.id)} style={{ cursor: "pointer" }} transform={"rotate(" + p.rot + " " + p.cx + " " + p.cy + ")"}>
                  <ellipse cx={p.cx} cy={p.cy} rx={95} ry={38} fill={wg.color} opacity={on ? 0.9 : 0.4} stroke={wg.color} strokeWidth={on ? 3 : 1} />
                  <text x={p.cx} y={p.cy - 4} textAnchor="middle" fill="#fff" fontSize={20} fontWeight={800} transform={"rotate(" + (-p.rot) + " " + p.cx + " " + p.cy + ")"}>{wg.letter}</text>
                  <text x={p.cx} y={p.cy + 14} textAnchor="middle" fill="#fff" fontSize={11} fontWeight={700} transform={"rotate(" + (-p.rot) + " " + p.cx + " " + p.cy + ")"}>{wg.n}</text>
                </g>
              );
            })}
            <rect x={246} y={310} width={8} height={70} rx={4} fill="#0f766e" opacity={0.7} />
            <text x={250} y={405} textAnchor="middle" fill="#64748b" fontSize={12} fontWeight={700}>designed: all four must agree -&gt; multi-agent council</text>
          </svg>
        </div>
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 text-white" style={{ background: "linear-gradient(135deg, " + active.color + ", #0f766e)" }}>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl font-black">{active.letter}</span>
              <div className="text-2xl font-black">{active.n} Wing</div>
            </div>
            <p className="mt-3 text-white/90">{active.purpose}</p>
          </div>
          <div className="p-6">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-400">Components</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {active.components.map((c) => <span key={c} className="rounded-md bg-gray-100 px-2.5 py-1 text-sm font-semibold text-gray-700">{c}</span>)}
            </div>
            <div className="mt-4 text-xs font-bold uppercase tracking-wide text-gray-400">Resident agents</div>
            <p className="mt-1 text-sm font-mono text-emerald-700">{active.agents}</p>
            <blockquote className="mt-4 rounded-xl border-l-4 border-emerald-400 bg-emerald-50 p-3 text-sm italic text-emerald-900">"{active.quote}" <span className="not-italic font-bold">- {active.who}</span></blockquote>
            <div className="mt-3 flex gap-2">
              {WINGS.map((wg) => <button key={wg.id} onClick={() => setW(wg.id)} className={"h-8 w-8 rounded-lg text-xs font-bold text-white " + (w === wg.id ? "ring-2 ring-offset-1 ring-emerald-500" : "opacity-70")} style={{ background: wg.color }}>{wg.letter}</button>)}
            </div>
          </div>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-6 pb-14">
        <h2 className="text-xl font-bold text-gray-900">The Council of AI - five agents, multi-agent council <span className="ml-2 align-middle rounded-full border border-amber-400/50 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">Designed — not yet live</span></h2>
        <p className="mt-1 text-sm text-gray-500">Five independent legs is the design target; measured effective independence is published on /benchmarks and the Refutation Ledger (DR-0007) rather than assumed</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {COUNCIL.map((m) => (
            <div key={m.name} className="rounded-2xl border border-gray-200 p-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-lg font-black text-white">{m.name[0]}</div>
              <div className="mt-2 font-bold text-gray-900">{m.name}</div>
              <div className="text-[11px] uppercase tracking-wide text-gray-400">{m.wing}</div>
              <p className="mt-1 text-xs text-gray-500 leading-snug">{m.style}</p>
            </div>
          ))}
        </div>
        <h2 className="mt-12 text-xl font-bold text-gray-900">How consensus flows</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PROTOCOL.map((s, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-gray-200 p-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">{i + 1}</span>
              <span className="text-sm text-gray-700 leading-snug">{s}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/try" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">See the council design demo -&gt;</a>
          <a href="/hive" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">How the hive decides -&gt;</a>
          <a href="/lineage" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Why it's 4,000 years old -&gt;</a>
        </div>
      </section>
    </div>
  );
}
