import { useEffect, useState } from "react";

import { ANCHORING_CLAIM } from "../data/anchoringClaim";
// /agent-registry — CSOAI's answer to Credo's Agent Registry, but agentic-native:
// every agent carries a SIGNED agent card (purpose, tools, guardrails) discoverable
// via A2A and sealed to Layer 0, plus a shadow-AI framing. Not a passive inventory —
// each entry is a cryptographically identified, purpose-bound governed agent.
type Agent = { name: string; domain: string; purpose: string; tools: string; status: "signed" | "review" };
const AGENTS: Agent[] = [
  { name: "ProofOf", domain: "proofof.ai", purpose: "Identity + provenance attestation for agents & content", tools: "sign · verify · agent-card", status: "signed" },
  { name: "SafetyOf", domain: "safetyof.ai", purpose: "Safety evaluation + red-team gating before action", tools: "evaluate · gate · escalate", status: "signed" },
  { name: "Council", domain: "csoai.org", purpose: "designed 33-seat council reviewing high-impact decisions (design, not a live claim; measured cross-checking n_eff 1.21 of 3)", tools: "council-vote · care-floor", status: "signed" },
  { name: "Crosswalk", domain: "councilof.ai", purpose: "Map any control across published frameworks", tools: "govern · crosswalk", status: "signed" },
  { name: "Watchdog", domain: "csoai.org/watchdog", purpose: "Incident intake + cryptographic logging", tools: "report · seal", status: "signed" },
  { name: "OSCAL Signer", domain: "councilof.ai", purpose: "Machine-readable OSCAL + Ed25519 (RFC-0024)", tools: "oscal · sign", status: "signed" },
  { name: "Watermark", domain: "councilof.ai", purpose: "Art. 50 C2PA content marking + provenance", tools: "mark · verify", status: "signed" },
  { name: "Classifier", domain: "csoai.org/classifier", purpose: "EU AI Act risk-tier classification", tools: "govern", status: "signed" },
];

export default function AgentRegistry() {
  const [q, setQ] = useState("");
  useEffect(() => { document.title = "Agent Registry — signed, governed AI agents | CSOAI"; }, []);
  const shown = AGENTS.filter((a) => !q.trim() || (a.name + a.domain + a.purpose + a.tools).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">Agent registry · signed agent cards · A2A</p>
        <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Every agent, <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">identified and signed.</span></h1>
        <p className="mt-4 max-w-3xl text-lg text-emerald-100/80">A registry isn't an inventory — it's control. Each agent carries a <b>signed agent card</b> (purpose, tools, guardrails), discoverable at <code className="text-emerald-300 text-sm">/.well-known/agent-card.json</code> and sealed to Layer 0. Shadow AI has nowhere to hide.</p>
        <p className="mt-3 max-w-3xl text-sm text-emerald-100/60">Every card is a ~3KB record signed against <a href="/.well-known/did.json" className="text-emerald-300 underline decoration-emerald-500/40 hover:decoration-emerald-300"><code>did:web:csoai.org#card-attestation-1</code></a>, public key <code className="text-emerald-300">d4cb0eaa16d5f50b…</code> — the key is in that document, so you can pin it before you trust a card. {ANCHORING_CLAIM} OpenTimestamps anchoring is roadmap, not yet wired. The post-quantum ML-DSA-65 (FIPS-204) signer is built, not shipped.</p>

        <div className="mt-6 flex items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search agents, purpose, tools…" className="flex-1 rounded-xl border border-emerald-500/30 bg-black/40 px-4 py-3 text-sm text-emerald-50 placeholder-emerald-300/25 focus:border-emerald-400 focus:outline-none" />
          <span className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300">{shown.length} agents</span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {shown.map((a) => (
            <div key={a.name} className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="font-black text-emerald-100">{a.name}</div>
                <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + (a.status === "signed" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/15 text-amber-300")}>{a.status === "signed" ? "✔ Ed25519 signed" : "in review"}</span>
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-emerald-300/72">{a.domain}</div>
              <p className="mt-2 text-xs text-emerald-100/70">{a.purpose}</p>
              <div className="mt-2 flex flex-wrap gap-1">{a.tools.split(" · ").map((t) => <span key={t} className="rounded bg-black/40 px-2 py-0.5 font-mono text-[10px] text-emerald-300/70">{t}</span>)}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.06] p-5">
          <div className="text-sm font-black text-emerald-100">Register your own agent</div>
          <p className="mt-1 text-sm text-emerald-100/75">Mint a signed agent card for any enterprise or government agent — purpose-bound, guardrail-declared, Ed25519-signed to Layer 0, and reviewable by the council. Governance that travels with the agent.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="/agent-governance" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-black text-[#03110b] hover:bg-emerald-400">How agent governance works →</a>
            <a href="/tool-commons" className="rounded-xl border border-emerald-500/30 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Run the governance MCP →</a>
            <a href="/try" className="rounded-xl border border-emerald-500/30 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Council review a decision →</a>
          </div>
        </div>
        <p className="mt-6 text-[11px] text-emerald-300/70">Shown agents are part of the CSOAI agent network. Enterprise/government agent registration mints cards under your own namespace.</p>
      </div>
    </div>
  );
}
