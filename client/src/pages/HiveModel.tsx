import { useEffect, useState } from "react";

// HiveModel - the Hive explains the BFT. Every tool in the OS is a hive with an inner
// Sovereign queen: workers gather signal, the queen proposes, the swarm debates, a Byzantine
// -council vote decides, the outcome is attested, and the hive learns. The
// teaching surface for the architecture - it feeds the Academy, demos and distribution.

type Stage = { id: string; n: string; glyph: string; body: string };
const LOOP: Stage[] = [
  { id: "gather", n: "Gather", glyph: "1", body: "Worker agents sense the world - the request, the data, the live reg-delta feed - and carry signal to the hive." },
  { id: "propose", n: "Propose", glyph: "2", body: "The inner Council queen forms a proposal from the signal: a decision, an action, a verdict." },
  { id: "debate", n: "Debate", glyph: "3", body: "The swarm challenges it from every wing - Governance, Intelligence, Safety, Cybersecurity." },
  { id: "vote", n: "Vote (multi-agent)", glyph: "4", body: "designed multi-agent review vote: passes only on supermajority, so one corrupt agent can't decide." },
  { id: "attest", n: "Attest", glyph: "5", body: "The outcome is Ed25519-signed and logged - provable, replayable, never deniable." },
  { id: "learn", n: "Learn", glyph: "6", body: "The result feeds back into the queen's memory. The hive gets sharper; it never gets stuck." },
];
type Hive = { name: string; queen: string; state: "Learning" | "Aware" | "Evolving" };
const HIVES: Hive[] = [
  { name: "Compliance Engine", queen: "council-gov", state: "Evolving" },
  { name: "Safety / Red Team", queen: "council-saf", state: "Aware" },
  { name: "Cyber / Rainbow Stack", queen: "council-cyb", state: "Aware" },
  { name: "Legacy Bridge", queen: "council-brg", state: "Learning" },
  { name: "Social OS", queen: "council-soc", state: "Learning" },
  { name: "Council Towns", queen: "council-twn", state: "Evolving" },
];
const FAQ = [
  { q: "Why a hive, not a server?", a: "A single server is a single point of failure and capture. A hive distributes the decision across many agents, so resilience and honesty are structural - not promised." },
  { q: "Why does multi-agent review matter?", a: "designed multi-agent review means a decision passes only on a supermajority, so no single agent decides the outcome. Effective independence is measured, not assumed." },
  { q: "Why an inner queen?", a: "The Council queen gives each hive memory and intent - it proposes and learns - while the swarm keeps it honest. Intelligence with checks, not intelligence unchecked." },
  { q: "Why does it never get stuck?", a: "If the swarm can't agree, it escalates - to another hive, the Council of AI, then the human. There is always a path forward, always an owner." },
];

export default function HiveModel() {
  useEffect(() => { document.title = "The Hive - how multi-agent council works | CSOAI"; }, []);
  const [step, setStep] = useState(0);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - the hive model</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">The Hive - how consensus is reached</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">Every tool in the OS is a hive with an inner Council queen. Workers gather, the queen proposes, the swarm debates, and a designed multi-agent review vote decides - so no single agent can corrupt the whole. The hive attests, learns, and never gets stuck.</p>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-xl font-bold text-gray-900">The hive loop - step through it</h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {LOOP.map((s, i) => (
            <button key={s.id} onClick={() => setStep(i)} className={"rounded-full border px-4 py-2 text-sm font-semibold transition-colors " + (step === i ? "border-emerald-400 bg-emerald-600 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>{i + 1}. {s.n}</button>
          ))}
        </div>
        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_360px] items-start">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-black text-white">{step + 1}</span>
              <div className="text-2xl font-black text-emerald-900">{LOOP[step].n}</div>
            </div>
            <p className="mt-3 text-emerald-900/80 leading-relaxed">{LOOP[step].body}</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setStep((step + LOOP.length - 1) % LOOP.length)} className="rounded-lg border border-emerald-300 px-3 py-1.5 text-sm font-semibold text-emerald-700">Prev</button>
              <button onClick={() => setStep((step + 1) % LOOP.length)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white">Next</button>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-slate-50 to-white p-4">
            <svg viewBox="0 0 300 300" className="w-full">
              <circle cx={150} cy={150} r={34} fill="#065f46" />
              <text x={150} y={146} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={800}>Council</text>
              <text x={150} y={162} textAnchor="middle" fill="#a7f3d0" fontSize={10}>queen</text>
              {LOOP.map((s, i) => {
                const ang = (i / LOOP.length) * Math.PI * 2 - Math.PI / 2;
                const x = 150 + Math.cos(ang) * 105, y = 150 + Math.sin(ang) * 105;
                const on = step === i;
                return (
                  <g key={s.id} onClick={() => setStep(i)} style={{ cursor: "pointer" }}>
                    <line x1={150} y1={150} x2={x} y2={y} stroke="#34d399" strokeWidth={on ? 2.5 : 1} opacity={on ? 0.9 : 0.35} />
                    <circle cx={x} cy={y} r={on ? 24 : 19} fill={on ? "#34d399" : "#ecfdf5"} stroke="#10b981" strokeWidth={on ? 2 : 1} />
                    <text x={x} y={y + 5} textAnchor="middle" fill={on ? "#03110b" : "#047857"} fontSize={15} fontWeight={800}>{i + 1}</text>
                  </g>
                );
              })}
            </svg>
            <p className="text-center text-xs text-gray-400">one hive - one queen - a swarm that votes</p>
          </div>
        </div>
        <h2 className="mt-12 text-xl font-bold text-gray-900">Every component is a hive</h2>
        <p className="mt-1 text-sm text-gray-500">Each tool runs the same loop with its own Council queen - learning, aware, evolving. Together they are the swarm.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HIVES.map((h) => (
            <div key={h.name} className="rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div className="font-bold text-gray-900">{h.name}</div>
                <span className={"rounded-md px-2 py-0.5 text-[10px] font-bold " + (h.state === "Evolving" ? "bg-emerald-100 text-emerald-700" : h.state === "Aware" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600")}>{h.state}</span>
              </div>
              <div className="mt-1 font-mono text-xs text-emerald-600">{h.queen}</div>
            </div>
          ))}
        </div>
        <h2 className="mt-12 text-xl font-bold text-gray-900">Why the hive</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {FAQ.map((f) => (
            <div key={f.q} className="rounded-2xl border border-gray-200 p-5">
              <div className="font-bold text-gray-900">{f.q}</div>
              <p className="mt-1 text-sm text-gray-600 leading-snug">{f.a}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/dragonfly" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">See the 4-Wing architecture -&gt;</a>
          <a href="/try" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Watch a hive decide -&gt;</a>
          <a href="/meok-law" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">What governs you here -&gt;</a>
        </div>
      </section>
    </div>
  );
}
