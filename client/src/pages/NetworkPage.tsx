import { useEffect, useState } from "react";

// /network — the Council assistant Network directory. The public face of the ecosystem:
// every signed agent domain, what it's for, and the one thing they share — each
// action sealed to Layer 0 and answerable to a single council. Public-safe by
// design: domain + role only. No keys, fingerprints, ports, or infrastructure.

const GW = "/api";

type Agent = { domain: string; role: string; blurb: string; group: "core" | "governance" | "protection" | "applied" };
const CROWN: Agent = { domain: "csoai.org", role: "the standards crown", blurb: "The Charter, the frameworks and the council that every agent below answers to.", group: "core" };
const AGENTS: Agent[] = [
  { domain: "councilof.ai", role: "the Council of AI", blurb: "The Council's designed multi-provider oversight; its measured status is published on the public Refutation Ledger.", group: "core" },
  { domain: "proofof.ai", role: "deepfake & identity proof", blurb: "Sign what's really you; a deepfake carries no seal and fails verification.", group: "protection" },
  { domain: "safetyof.ai", role: "AI safety", blurb: "Safety evaluation and harm monitoring across the AI estate.", group: "governance" },
  { domain: "accountabilityof.ai", role: "accountability", blurb: "Traceable, answerable AI — who decided, on what basis, and when.", group: "governance" },
  { domain: "ethicalgovernanceof.ai", role: "ethical governance", blurb: "The ethics layer — human impact weighed into every decision.", group: "governance" },
  { domain: "dataprivacyof.ai", role: "data privacy", blurb: "Privacy-by-design, consent-first, GDPR-aligned data governance.", group: "governance" },
  { domain: "careshield.ai", role: "care & safeguarding", blurb: "The care floor — safeguarding the vulnerable in every AI interaction.", group: "protection" },
];

const GROUPS: { id: Agent["group"]; label: string }[] = [
  { id: "core", label: "Core" },
  { id: "governance", label: "Governance" },
  { id: "protection", label: "Protection" },
  { id: "applied", label: "Applied" },
];

function AgentCard({ a, crown }: { a: Agent; crown?: boolean }) {
  const href = a.domain.includes("://") ? a.domain : "https://" + a.domain;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className={"group flex flex-col rounded-2xl border p-5 transition-all hover:-translate-y-0.5 " + (crown ? "border-amber-400/40 bg-gradient-to-br from-amber-400/10 to-transparent" : "border-cyan-400/20 bg-[#05140d] hover:border-cyan-400/50")}>
      <div className="flex items-center justify-between">
        <span className={"h-2.5 w-2.5 rounded-full " + (crown ? "bg-amber-400" : "bg-cyan-400")} style={{ boxShadow: crown ? "0 0 10px #fbbf24" : "0 0 8px #22d3ee" }} />
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-200/60">{crown ? "crown" : a.role}</span>
      </div>
      <div className={"mt-3 font-bold " + (crown ? "text-amber-100 text-lg" : "text-cyan-50")}>{a.domain}</div>
      <p className="mt-1 flex-1 text-[13px] text-emerald-100/70">{a.blurb}</p>
      <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-300/60 group-hover:text-emerald-300">visit <span className="transition-transform group-hover:translate-x-0.5">→</span></div>
    </a>
  );
}

export default function NetworkPage() {
  const [live, setLive] = useState(false);
  useEffect(() => { document.title = "The Council Network — every signed agent, one council | CSOAI"; }, []);
  useEffect(() => { let ok = true; fetch(GW + "/health").then((r) => r.ok ? r.json() : null).then((d) => { if (ok && d) setLive(true); }).catch(() => {}); return () => { ok = false; }; }, []);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="relative overflow-hidden border-b border-emerald-500/15">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(900px 420px at 50% -10%, rgba(34,211,238,.14), transparent 60%)" }} />
        <div className="relative mx-auto max-w-6xl px-6 pt-14 pb-9 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-cyan-300/70">CSOAI OS · the Council network</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">One crown. <span className="bg-gradient-to-r from-cyan-300 via-emerald-300 to-teal-300 bg-clip-text text-transparent">Signed measurement surfaces.</span></h1>
          <p className="mx-auto mt-4 max-w-2xl text-emerald-100/80">The public Council of AI surfaces — what each one does, and where to find it. Personal and side-trade domains are not listed here.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <span className={"inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold " + (live ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" : "border-emerald-500/20 text-emerald-200/60")}>
              <span className={"h-1.5 w-1.5 rounded-full " + (live ? "bg-emerald-400 animate-pulse" : "bg-emerald-500/40")} />{live ? "Council engine · LIVE" : "Council engine"}
            </span>
            <a href="/globe3d.html" className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-1.5 text-xs font-bold text-cyan-100 hover:bg-cyan-500/20">See it on the globe →</a>
            <a href="/system-card" className="rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1.5 text-xs font-bold text-amber-100 hover:bg-amber-400/20">How signing works →</a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-9">
        <div className="mb-2 text-sm font-bold uppercase tracking-wide text-amber-300/80">The crown</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><AgentCard a={CROWN} crown /></div>

        {GROUPS.map((g) => {
          const items = AGENTS.filter((a) => a.group === g.id);
          if (!items.length) return null;
          return (
            <div key={g.id} className="mt-8">
              <div className="mb-2 text-sm font-bold uppercase tracking-wide text-cyan-300/70">{g.label}</div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((a) => <AgentCard key={a.domain} a={a} />)}</div>
            </div>
          );
        })}

        <div className="mt-10 rounded-2xl border border-emerald-500/15 bg-white/[0.02] p-6 text-center">
          <div className="text-sm font-bold text-emerald-100">Every agent, one guarantee.</div>
          <p className="mx-auto mt-1 max-w-2xl text-[13px] text-emerald-100/70">No agent acts alone. Each is answerable to the council, held to the care floor, and every decision is sealed to Layer 0 — provable, not promised. That's what makes it a network and not just a list of sites.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <a href="/try" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#03110b] hover:bg-emerald-400">Meet the council →</a>
            <a href="/dashboard?tab=home" className="rounded-xl border border-emerald-400/40 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Govern anything →</a>
            <a href="/protect" className="rounded-xl border border-emerald-400/40 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Protect a person →</a>
          </div>
        </div>
      </section>
    </div>
  );
}
