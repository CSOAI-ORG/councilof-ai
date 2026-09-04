import { useEffect } from "react";
import FaqBlock from "@/components/FaqBlock";
import SpotInfographic from "@/components/SpotInfographic";
import { LANE4 } from "@/data/lane4Content";

const L4 = LANE4["agent-governance"];

// /agent-governance — CSOAI's claim on the category competitors are racing into
// (Drata declared "AI Agent Governance" a category; Credo shipped GAIA + an Agent
// Registry). CSOAI is agentic-NATIVE: signed agent cards, A2A, a designed 33-seat council
// council, and Ed25519 Layer-0 attestations — mapped to EU AI Act Art. 14 & 50.
const RISKS = [
  { t: "Tool misuse", d: "An agent calls a tool it shouldn't, or with unsafe inputs.", ctrl: "Target control: scoped MCP policy plus retained call evidence" },
  { t: "Scope drift", d: "An agent quietly expands beyond its intended purpose.", ctrl: "Target control: a signed agent card declaring purpose, tools and guardrails" },
  { t: "Inter-agent risk", d: "Multi-agent chains amplify errors no single agent owns.", ctrl: "Designed council review — no single model decides; measured status on the Refutation Ledger" },
  { t: "No human oversight", d: "Autonomous actions with no meaningful control point.", ctrl: "Target control: Article 14-aligned human checkpoints; enforcement is not wired here" },
  { t: "No disclosure", d: "Users can't tell they're dealing with AI.", ctrl: "Art. 50 transparency — disclosure + marking at first interaction" },
  { t: "Unaccountable actions", d: "No provable record of what an agent did or why.", ctrl: "Target control: selectively signed records that can be verified offline" },
];
const FAQ = [
  { q: "What is AI agent governance?", a: "AI agent governance is the discipline of controlling autonomous AI agents — systems that plan, call tools, and act with limited human input. It covers agent identity, purpose limits, human oversight, tool-use control, inter-agent risk, and an auditable record of every action." },
  { q: "How is governing AI agents different from governing AI models?", a: "A model produces an output; an agent takes actions across tools and other agents. That adds new risks — tool misuse, scope drift, and inter-agent failures — plus stronger duties for human oversight (EU AI Act Art. 14) and transparency/disclosure (Art. 50). Governance has to move from documenting a model to controlling an actor." },
  { q: "How does CSOAI approach AI-agent governance?", a: "The public estate catalogues agent-card, A2A, MCP, evidence and signature patterns. The 33-seat Council and its care floor are design targets, not a live review service. Only a specifically published card should be treated as signed or measured." },
  { q: "Does CSOAI establish EU AI Act compliance for agents?", a: "No. The site maps candidate controls to provisions such as Articles 9, 11–12, 14 and 50. Applicability, implementation and legal conformity remain scoped decisions for accountable people and competent authorities." },
];

export default function AgentGovernance() {
  useEffect(() => { document.title = "AI agent governance — governing the agentic era | CSOAI"; }, []);
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="mx-auto max-w-5xl px-6 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">The agentic era · governance that acts</p>
        <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Govern the <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">AI agents</span>, not just the models.</h1>
        <p className="mt-4 max-w-3xl text-lg text-emerald-100/80">Agents plan, call tools and act. This page maps that risk surface to agent-card, A2A, MCP and evidence patterns plus a <b>designed 33-seat Council</b>. It is a control design, not proof that runtime enforcement or Council review is live.</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RISKS.map((r) => (
            <div key={r.t} className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-4">
              <div className="text-sm font-black text-emerald-100">{r.t}</div>
              <p className="mt-1 text-xs text-emerald-100/72">{r.d}</p>
              <div className="mt-3 border-t border-emerald-500/15 pt-2 text-[12px] text-emerald-300/90">▸ {r.ctrl}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.06] p-5">
          <div className="text-sm font-black text-emerald-100">Why CSOAI is a generation ahead on agents</div>
          <ul className="mt-2 space-y-1.5 text-sm text-emerald-100/80">
            <li>▸ <b>Agent-card discovery:</b> the public <code className="text-emerald-300">/.well-known/agent-card.json</code> describes the exposed agent surface. It does not establish that every catalogued agent is signed or purpose-enforced.</li>
            <li>▸ <b>council review:</b> designed so no single model approves an agent action — a designed supermajority quorum. The <a href="/interop/council-independence.json" className="underline text-emerald-300">latest point experiment measured rho=1 and n_eff=1</a>, so fault tolerance is not demonstrated. The 33-seat quorum remains a design, not a live claim.</li>
            <li>▸ <b>Measurement tools:</b> the public board and verify paths expose admitted records. Ordinary tool calls do not automatically become signed measurements.</li>
            <li>▸ <b>Verifiable when published:</b> a card can be checked against its declared subject, method and signature; absent evidence remains unmeasured.</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="/try" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-black text-[#03110b] hover:bg-emerald-400">See the council rule on an agent →</a>
            <a href="/classifier" className="rounded-xl border border-emerald-500/30 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Classify an agent's risk →</a>
            <a href="/tool-commons" className="rounded-xl border border-emerald-500/30 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Run the governance MCP →</a>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-black">Frequently asked</h2>
          <div className="mt-4 space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="rounded-xl border border-emerald-500/20 bg-[#05140d] p-4">
                <summary className="cursor-pointer font-semibold text-emerald-100">{f.q}</summary>
                <p className="mt-2 text-sm leading-relaxed text-emerald-100/75">{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        <SpotInfographic title={L4.spotTitle} stats={L4.spotStats} source={L4.spotSource} />
        <FaqBlock title={L4.faqTitle} intro={L4.faqIntro} items={L4.faq} />
      </div>
    </div>
  );
}
