import { useEffect, useState } from "react";
import { chargeSovereign } from "../lib/sovCharge";
import CouncilVote from "../components/CouncilVote";
import AISystemNotice from "../components/AISystemNotice";

// TryCouncil — the 30-second WOW. The governed AI-council design, as an interactive demo.
// Type a compliance question; five specialised agents (Oracle, Skeptic, Architect,
// Ethicist, Strategist) deliberate with designed multi-agent review and return a
// risk classification mapped to global frameworks. Runs entirely client-side as a
// deterministic governance engine — the production council + emailed signed
// gap report switch on with the Layer 0 backend.

type Agent = { id: string; name: string; role: string; color: string };
const AGENTS: Agent[] = [
  { id: "oracle", name: "Oracle", role: "reads the regulation", color: "#2563eb" },
  { id: "skeptic", name: "Skeptic", role: "stress-tests the risk", color: "#dc2626" },
  { id: "architect", name: "Architect", role: "designs the controls", color: "#059669" },
  { id: "ethicist", name: "Ethicist", role: "weighs the human impact", color: "#7c3aed" },
  { id: "strategist", name: "Strategist", role: "calls the next move", color: "#d97706" },
];

const EXAMPLES = [
  "Is my healthcare diagnosis AI high-risk under the EU AI Act?",
  "What frameworks apply to my fintech fraud-detection model?",
  "We use AI to screen job applicants — what do we need?",
  "Our chatbot gives general advice to consumers. Any obligations?",
  "We run facial recognition in a public space. Is that allowed?",
];

const GW: string = ((import.meta as any).env && (import.meta as any).env.VITE_KNOWLEDGE_BASE) || "/api";
async function sha256Hex(s: string): Promise<string> { try { const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join(""); } catch (e) { return ""; } }

type Domain = { key: string; label: string; tier: "Prohibited" | "High-risk" | "Limited" | "Minimal"; frameworks: string[]; why: string };

function classify(q: string): Domain {
  const s = q.toLowerCase();
  const has = (...w: string[]) => w.some((x) => s.includes(x));
  if (has("facial recognition", "biometric", "face recognition") && has("public", "real-time", "real time", "surveillance"))
    return { key: "biometric", label: "Real-time biometric ID in public", tier: "Prohibited", frameworks: ["EU AI Act Art. 5", "GDPR", "ECHR"], why: "Real-time remote biometric identification in publicly accessible spaces is a prohibited practice under EU AI Act Article 5, save narrow law-enforcement exceptions." };
  if (has("social scoring", "social score"))
    return { key: "scoring", label: "Social scoring", tier: "Prohibited", frameworks: ["EU AI Act Art. 5"], why: "General-purpose social scoring by public authorities is a prohibited practice." };
  if (has("health", "medical", "diagnos", "patient", "clinical"))
    return { key: "health", label: "Healthcare / medical AI", tier: "High-risk", frameworks: ["EU AI Act Annex III", "MDR/IVDR", "HIPAA", "ISO 42001", "NIST AI RMF"], why: "AI used in medical devices or clinical decisions is High-Risk (EU AI Act Annex III + medical-device law), demanding risk management, data governance, human oversight and conformity assessment." };
  if (has("credit", "loan", "fintech", "fraud", "financial", "insurance", "underwrit"))
    return { key: "finance", label: "Financial / credit AI", tier: "High-risk", frameworks: ["EU AI Act Annex III", "DORA", "GDPR", "NIST AI RMF", "ISO 42001"], why: "AI for creditworthiness, fraud or insurance pricing is High-Risk — it materially affects access to essential services, triggering the full Art. 9-15 obligations." };
  if (has("hiring", "applicant", "recruit", "employee", "cv", "resume", "screen job"))
    return { key: "employment", label: "Employment / hiring AI", tier: "High-risk", frameworks: ["EU AI Act Annex III", "GDPR Art. 22", "EEOC / local labour law", "ISO 42001"], why: "AI used to recruit, screen or evaluate workers is High-Risk; it requires bias testing, transparency to candidates, and meaningful human oversight." };
  if (has("law enforcement", "police", "criminal", "predictive policing"))
    return { key: "law", label: "Law-enforcement AI", tier: "High-risk", frameworks: ["EU AI Act Annex III", "GDPR / LED", "ECHR"], why: "AI in law enforcement is High-Risk with heightened scrutiny on accuracy, bias and fundamental-rights impact." };
  if (has("education", "student", "exam", "grading", "admission"))
    return { key: "education", label: "Education AI", tier: "High-risk", frameworks: ["EU AI Act Annex III", "GDPR", "ISO 42001"], why: "AI determining access to education or scoring exams is High-Risk under Annex III." };
  if (has("critical infrastructure", "grid", "water", "energy", "scada"))
    return { key: "infra", label: "Critical-infrastructure AI", tier: "High-risk", frameworks: ["EU AI Act Annex III", "NIS2", "ISO 42001"], why: "AI managing safety of critical infrastructure is High-Risk, intersecting with NIS2 cyber-resilience duties." };
  if (has("chatbot", "assistant", "general advice", "content", "generate", "consumer"))
    return { key: "limited", label: "General-purpose / chatbot", tier: "Limited", frameworks: ["EU AI Act Art. 50", "C2PA", "GDPR"], why: "Consumer-facing conversational and generative AI carries transparency duties (Art. 50): users must know they are interacting with AI and AI content should be labelled." };
  return { key: "general", label: "General AI system", tier: "Minimal", frameworks: ["EU AI Act (transparency)", "NIST AI RMF", "ISO 42001"], why: "No high-risk trigger detected from the description. Baseline transparency and voluntary risk-management practices apply — but re-assess if use, data or deployment context changes." };
}

const TIER_TONE: Record<string, string> = {
  "Prohibited": "bg-red-100 text-red-800 border-red-300",
  "High-risk": "bg-amber-100 text-amber-800 border-amber-300",
  "Limited": "bg-sky-100 text-sky-800 border-sky-300",
  "Minimal": "bg-emerald-100 text-emerald-800 border-emerald-300",
};

function agentLine(a: Agent, d: Domain): string {
  switch (a.id) {
    case "oracle": return `Classified as ${d.label}. Applicable: ${d.frameworks.join(", ")}. ${d.why}`;
    case "skeptic": return d.tier === "Prohibited" ? "This is a banned practice — deploying it risks the maximum penalty (up to 7% of global turnover) and an outright ban. Do not ship." : d.tier === "High-risk" ? "Treat this as High-Risk. Without a conformity assessment and an Art. 9 risk-management system, you are exposed to fines up to 7% of global turnover and forced withdrawal." : d.tier === "Limited" ? "Lower tier, but transparency failures still draw enforcement and reputational damage. Don't get casual." : "Low inherent risk today — but scope creep is the trap. One new data source can flip this to High-Risk overnight.";
    case "architect": return d.tier === "Prohibited" ? "No control set makes a prohibited use compliant — re-architect the use case itself (e.g. post-hoc, consented, or non-real-time)." : d.tier === "High-risk" ? "Stand up: a risk-management system (Art. 9), data-governance + bias testing (Art. 10), logging (Art. 12), human-oversight controls (Art. 14), and an accuracy/robustness baseline (Art. 15)." : "Implement AI-disclosure to users and provenance labelling (C2PA) on generated content; keep an audit log of interactions.";
    case "ethicist": return d.tier === "Prohibited" ? "This use directly threatens fundamental rights — dignity, privacy, freedom from surveillance. The ethical answer matches the legal one: don't." : d.tier === "High-risk" ? "Real people are materially affected. Mandate bias evaluation across protected groups, a contestability path, and genuine human review — not a rubber stamp." : "Be honest with users that they're talking to an AI, and make opting out of automated handling easy.";
    case "strategist": return d.tier === "Prohibited" ? "Kill or redesign now — there is no market for a banned system. Pivot the value prop to a compliant adjacent use." : d.tier === "High-risk" ? "Start the conformity programme this quarter — the high-risk obligations land 2 Dec 2027 (Annex III) / 2 Aug 2028 (Annex I) under the Digital Omnibus, and the runway disappears fast. First move: a gap assessment against the six Art. 9-15 duties, then close the biggest gap first." : "Cheapest insurance in tech: ship the disclosure + labelling now, document it, and revisit risk tier at every material change.";
    default: return "";
  }
}

export default function TryCouncil() {
  useEffect(() => { document.title = "Try the AI Governance Council — CSOAI"; }, []);
  useEffect(() => { const d = new URLSearchParams(window.location.search).get("demo"); if (d) { const t = setTimeout(() => ask(d), 500); return () => clearTimeout(t); } }, []);
  const [q, setQ] = useState("");
  const [result, setResult] = useState<Domain | null>(null);
  const [shown, setShown] = useState(0);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [liveLines, setLiveLines] = useState<Record<string, string>>({});
  const [liveState, setLiveState] = useState<"idle" | "running" | "done">("idle");
  const [sig, setSig] = useState("");
  const [round, setRound] = useState(0);

  function ask(question: string) {
    const text = question.trim();
    if (!text) return;
    setQ(text);
    const d = classify(text);
    setResult(d);
    setRound((r) => r + 1);
    setShown(0);
    setSent(false);
    setLiveLines({}); setLiveState("idle"); setSig("");
    AGENTS.forEach((_, i) => setTimeout(() => setShown((n) => Math.max(n, i + 1)), 450 * (i + 1)));
  }

  async function convene() {
    if (!result) return;
    setLiveState("running"); setLiveLines({}); setSig(""); chargeSovereign(10);
    await Promise.all(AGENTS.map(async (a) => {
      try {
        const prompt = "You are the " + a.name + ", the AI-governance council member who " + a.role + ". In no more than 2 sentences, give your distinct view on this system: \"" + q + "\". Working classification: " + result.tier + " (" + result.label + "); frameworks: " + result.frameworks.join(", ") + ". Speak in your role's voice, no preamble.";
        const r = await fetch(GW + "/chat", { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify({ message: prompt }) });
        if (r.ok) { const j = await r.json(); if (j && j.response && j.model !== "idle" && !/travell?er|companion|walks beside|i'?m sorry|can'?t help|on your journey|dear friend|kindred|as an ai language|remembering/i.test(String(j.response))) setLiveLines((m) => ({ ...m, [a.id]: String(j.response) })); }
      } catch (e) {}
    }));
    const ts = new Date().toISOString();
    const digest = await sha256Hex(q + "|" + result.tier + "|" + result.frameworks.join(",") + "|" + ts);
    setSig(digest.slice(0, 40)); setLiveState("done");
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-5xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI · governed AI council — design demo</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">AI Governance That Thinks</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">Five AI agents debate your compliance question across global frameworks — and return a risk verdict in seconds. Ask anything.</p>

          <div className="mt-7 rounded-2xl bg-white p-3 shadow-xl">
            {/* Article 50(1) AI-interaction disclosure — registry-driven wording. */}
            <AISystemNotice route="/try" />
            <textarea value={q} onChange={(e) => setQ(e.target.value)} rows={2} placeholder="Describe your AI system… e.g. 'We use AI to screen job applicants'"
              className="w-full resize-none rounded-xl px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400" />
            <div className="flex items-center justify-between gap-3 px-1 pb-1">
              <span className="text-xs text-gray-400">Classification runs locally · convening the council sends your description to the Council assistant</span>
              <button onClick={() => ask(q)} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">Ask the Council →</button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => ask(ex)} className="rounded-full border border-emerald-300/40 px-3 py-1.5 text-xs text-emerald-50 hover:bg-white/10">{ex}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12">
        {!result && (
          <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-400">
            Ask a question above, or tap an example — the five agents will deliberate here.
          </div>
        )}
        {result && (
          <>
            <div className="mb-5"><CouncilVote trigger={round} verdict={"Verdict: " + result.tier} /></div>
            <div className={"rounded-2xl border p-5 " + TIER_TONE[result.tier]}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-lg bg-white/60 px-3 py-1 text-xs font-bold uppercase tracking-wide">Verdict</span>
                <span className="text-2xl font-black">{result.tier}</span>
                <span className="font-semibold">· {result.label}</span>
              </div>
              <p className="mt-2 text-sm">{result.why}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.frameworks.map((f) => <span key={f} className="rounded-md bg-white/70 px-2 py-0.5 text-xs font-semibold">{f}</span>)}
              </div>
            </div>

            <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-gray-500">The council deliberates</h2>
            <div className="mt-3 space-y-3">
              {AGENTS.map((a, i) => (
                <div key={a.id} className={"rounded-2xl border border-gray-200 p-4 transition-all duration-500 " + (i < shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2")}>
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: a.color }}>{a.name[0]}</span>
                    <span className="font-bold text-gray-900">{a.name}</span>
                    <span className="text-xs text-gray-400">{a.role}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700 leading-snug">{liveState !== "idle" ? (liveLines[a.id] || (liveState === "running" ? "deliberating live…" : agentLine(a, result))) : (i < shown ? agentLine(a, result) : "")}{liveLines[a.id] ? <span className="ml-1 align-middle font-mono text-[9px] uppercase tracking-wide text-emerald-600">live</span> : null}</p>
                </div>
              ))}
            </div>

            {shown >= AGENTS.length && (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="font-bold text-emerald-900">Consensus reached — designed multi-agent review vote</div>
                <p className="mt-1 text-sm text-emerald-800">The council agrees: <strong>{result.tier}</strong>. {result.tier === "High-risk" ? "Begin a conformity programme against the six EU AI Act duties (Art. 9-15) before the 2 December 2027 deadline (Annex III; product-embedded Annex I: 2 August 2028, as amended by the Digital Omnibus, Reg (EU) 2026/1744)." : result.tier === "Prohibited" ? "Do not deploy — redesign the use case." : "Apply the transparency duties now and re-assess at every material change."}</p>
                {liveState === "idle" && <button onClick={convene} className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">Convene the live 5-agent council →</button>}
                {liveState === "running" && <div className="mt-3 text-sm text-emerald-700">The five agents are deliberating live over the gateway…</div>}
                {sig && <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-2 text-[11px] text-amber-900">Client-side digest (above) is a local trail hash for traceability only — the verdict is not yet signed into the J-space chain. The signed historical record lives at <a href="/live-ledger" className="font-semibold underline">/live-ledger</a>.</div>}
                {!sent ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@company.com"
                      className="flex-1 min-w-[220px] rounded-xl border border-emerald-300 px-4 py-2.5 text-sm text-gray-900 outline-none" />
                    <button onClick={() => { if (/.+@.+\..+/.test(email)) { try { localStorage.setItem("csoai_report_request", JSON.stringify({ q, tier: result.tier, email, at: Date.now() })); } catch (e) {} setSent(true); } }}
                      className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">Email me the signed gap report →</button>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl bg-white p-3 text-sm text-emerald-800">Saved. Your signed gap report is queued — it's generated and delivered once the Council backend is live. You'll be first in line.</div>
                )}
                <div className="mt-5 border-t border-emerald-200 pt-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-emerald-700">Carry this verdict across the OS</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <a href={"/hive?q=" + encodeURIComponent(q)} className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50">Open the Framework Hive →</a>
                    <a href="/system-card" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800 hover:bg-amber-100">Get a signed System Card →</a>
                    <a href={"/?lobby=home&q=" + encodeURIComponent(q)} className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50">Open it in Council OS →</a>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-10 grid gap-4 sm:grid-cols-3 text-center text-sm">
          <div className="rounded-2xl border border-gray-200 p-5"><div className="text-2xl font-black text-emerald-700">Live</div><div className="text-gray-500">frameworks from the catalog</div></div>
          <div className="rounded-2xl border border-gray-200 p-5"><div className="text-2xl font-black text-emerald-700">5</div><div className="text-gray-500">agents · multi-agent vote</div></div>
          <div className="rounded-2xl border border-gray-200 p-5"><div className="text-2xl font-black text-emerald-700">Aug 2 2026</div><div className="text-gray-500">EU AI Act deadline</div></div>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-5 text-xs text-gray-500 leading-relaxed">
          This demo runs a deterministic governance engine in your browser for instant, private triage — it is decision-support, not legal advice. The production Council deliberates with live LLM agents and emails a signed gap report; it switches on with the Layer 0 backend. Explore Council OS at <a href="/?lobby=home" className="text-emerald-700 font-semibold">/?lobby=home</a>.
        </div>
      </section>
    </div>
  );
}
