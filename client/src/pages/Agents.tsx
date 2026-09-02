import { useEffect } from "react";
import { ANCHORING_CLAIM } from "../data/anchoringClaim";

// Agents - reframe the Council of AI as the governance-agent answer to Vanta Agents,
// Credo GAIA, and ServiceNow AI Control Tower. A council of agents beats one agent.
const POINTS = [
  { t: "One agent is a single point of capture", d: "A lone governance agent can be wrong, biased, or compromised - and nobody checks it." },
  { t: "A council can't be captured", d: "A designed 33-seat council reviews high-impact decisions under a supermajority threshold - no single node decides. It is a design, not a live claim: measured cross-architecture decorrelation today is n_eff 1.21 of 3, published on the Refutation Ledger." },
  { t: "Every verdict is provable", d: ANCHORING_CLAIM + " Outcomes are replayable — not a black-box recommendation." },
  { t: "Open and cross-vendor", d: "MCP-native and cross-vendor - it governs agents wherever they run, not just inside one suite." },
];
const RIVALS = [
  { n: "Vanta Agents", c: "Single 24/7 GRC agent inside the Vanta suite." },
  { n: "Credo AI GAIA", c: "Governance agent as policy system-of-record." },
  { n: "ServiceNow AI Control Tower", c: "Governance layer inside the ServiceNow walled garden." },
];
export default function Agents() {
  useEffect(() => { document.title = "The governance agent, done right - a Council, not one agent | CSOAI"; }, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - the governance agent</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Everyone shipped one agent. We designed a Council.</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">2026 is the year of the governance agent. But a single agent deciding your compliance is a single point of failure. CSOAI's answer is a designed 33-seat council under a supermajority threshold - no single node decides. It is a design, not a live claim: measured cross-checking today is n_eff 1.21 of 3.</p>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid gap-4 sm:grid-cols-2">
          {POINTS.map((p) => (
            <div key={p.t} className="rounded-2xl border border-gray-200 p-5">
              <div className="font-bold text-gray-900">{p.t}</div>
              <p className="mt-1 text-sm text-gray-600">{p.d}</p>
            </div>
          ))}
        </div>
        <h2 className="mt-12 text-xl font-bold text-gray-900">How it compares</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {RIVALS.map((r) => (
            <div key={r.n} className="rounded-2xl border border-gray-200 p-5">
              <div className="font-bold text-gray-900">{r.n}</div>
              <p className="mt-1 text-sm text-gray-500">{r.c}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/try" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">Watch the Council decide -&gt;</a>
          <a href="/dragonfly" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">The 4-Wing architecture -&gt;</a>
          <a href="/compare" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Full comparison -&gt;</a>
        </div>
      </section>
    </div>
  );
}
