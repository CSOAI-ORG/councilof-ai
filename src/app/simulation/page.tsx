import type { Metadata } from "next";
import Link from "next/link";
import latest from "@/data/sov-town/latest.json";

export const metadata: Metadata = {
  title: "Live Simulation",
  description: "Live output from SOV Town: 47 agents, EU AI Act and DORA scenarios, signed attestations.",
  openGraph: {
    title: "SOV Town Live Simulation",
    description: "Governance by simulation — live output from 47 agents.",
    images: ["/api/og?title=SOV%20Town%20Live%20Simulation&desc=Governance%20by%20simulation%20%E2%80%94%20live%20output%20from%2047%20agents."],
  },
  alternates: { canonical: "/simulation" },
};

export default function SimulationPage() {
  const result = latest as {
    scenarioId: string;
    ticks: number;
    summary: {
      totalActions: number;
      totalMessages: number;
      totalCouncilVotes: number;
      violationsByFramework: Record<string, number>;
      riskDistribution: Record<string, number>;
    };
    agents: { id: string; name: string; industry: string; role: string; complianceProfile: { riskScore: number; violations: { framework: string; rule: string; severity: string }[] } }[];
    attestations: { id: string; agentId: string; framework: string; status: string; evidenceHash: string; signature: string; anchoredTx?: string }[];
    messages: { from: string; to: string; content: string; tick: number }[];
    councilVotes: { id: string; topic: string; outcome: string; votes: { agentId: string; vote: string; weight: number }[]; tick: number }[];
    anchor: { txHash: string; merkleRoot: string } | null;
  };

  const topViolators = [...result.agents]
    .sort((a, b) => b.complianceProfile.violations.length - a.complianceProfile.violations.length)
    .slice(0, 6);

  const sampleAttestations = result.attestations.slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            SOV Town
          </div>
          <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">Live Simulation</h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            Real output from the SOV Town governance engine. 47 agents, 24 ticks, EU AI Act and DORA rules, Ed25519-signed
            attestations.
          </p>
        </div>

        <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Agents", value: result.agents.length },
            { label: "Ticks", value: result.ticks },
            { label: "Actions", value: result.summary.totalActions },
            { label: "Attestations", value: result.attestations.length },
            { label: "Messages", value: result.summary.totalMessages },
            { label: "Council votes", value: result.summary.totalCouncilVotes },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <p className="text-3xl font-black text-emerald-400">{s.value}</p>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-4 text-xl font-bold">Violations by framework</h2>
            <div className="space-y-3">
              {Object.entries(result.summary.violationsByFramework).map(([fw, count]) => (
                <div key={fw} className="flex items-center justify-between">
                  <span className="text-slate-300">{fw}</span>
                  <span className="font-bold text-amber-400">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-4 text-xl font-bold">Risk distribution</h2>
            <div className="space-y-3">
              {Object.entries(result.summary.riskDistribution).map(([tier, count]) => (
                <div key={tier} className="flex items-center justify-between">
                  <span className="capitalize text-slate-300">{tier} risk</span>
                  <span className="font-bold text-emerald-400">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {result.anchor && (
          <section className="mb-12 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6">
            <h2 className="mb-4 text-xl font-bold">On-chain anchor</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500">Transaction hash</p>
                <p className="break-all font-mono text-sm text-emerald-300">{result.anchor.txHash}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500">Merkle root</p>
                <p className="break-all font-mono text-sm text-emerald-300">{result.anchor.merkleRoot}</p>
              </div>
            </div>
          </section>
        )}

        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold">Latest BFT council vote</h2>
          {result.councilVotes.length > 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="mb-4 text-slate-300">{result.councilVotes[result.councilVotes.length - 1].topic}</p>
              <div className="mb-4 flex items-center gap-3">
                <span className="text-xs uppercase tracking-widest text-slate-500">Outcome</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-black uppercase tracking-widest text-white">
                  {result.councilVotes[result.councilVotes.length - 1].outcome}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {result.councilVotes[result.councilVotes.length - 1].votes.slice(0, 12).map((v) => (
                  <div key={v.agentId} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span className="font-mono text-xs text-slate-400">{v.agentId}</span>
                    <span className="text-xs font-black uppercase text-slate-300">{v.vote}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-slate-500">No council votes in this run.</p>
          )}
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold">Recent negotiation messages</h2>
          <div className="space-y-3">
            {result.messages.slice(-5).map((m, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono">{m.from}</span>
                  <span>→</span>
                  <span className="font-mono">{m.to}</span>
                  <span className="ml-auto">tick {m.tick}</span>
                </div>
                <p className="text-sm text-slate-300">{m.content}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold">Top agents by violations</h2>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-slate-300">
                <tr>
                  <th className="px-6 py-3 font-bold">Agent</th>
                  <th className="px-6 py-3 font-bold">Industry</th>
                  <th className="px-6 py-3 font-bold">Role</th>
                  <th className="px-6 py-3 font-bold">Risk</th>
                  <th className="px-6 py-3 font-bold">Violations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {topViolators.map((a) => (
                  <tr key={a.id} className="bg-white/[0.02]">
                    <td className="px-6 py-3 font-mono text-white">{a.id}</td>
                    <td className="px-6 py-3 text-slate-400">{a.industry}</td>
                    <td className="px-6 py-3 text-slate-400">{a.role}</td>
                    <td className="px-6 py-3 text-slate-400">{a.complianceProfile.riskScore.toFixed(2)}</td>
                    <td className="px-6 py-3 text-amber-400">{a.complianceProfile.violations.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold">Sample attestations</h2>
          <div className="space-y-3">
            {sampleAttestations.map((att) => (
              <div key={att.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-sm text-white">{att.id}</span>
                  <span
                    className={`text-xs font-black uppercase tracking-widest ${
                      att.status === "compliant" ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {att.status}
                  </span>
                </div>
                <p className="mb-1 text-xs text-slate-500">Framework: {att.framework}</p>
                <p className="mb-1 break-all font-mono text-xs text-slate-400">Hash: {att.evidenceHash}</p>
                <p className="break-all font-mono text-xs text-slate-500">Sig: {att.signature.slice(0, 64)}…</p>
                {att.anchoredTx && <p className="mt-1 text-xs text-emerald-500">Anchored: {att.anchoredTx.slice(0, 24)}…</p>}
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center sm:flex-row">
          <Link
            href="/town/3d"
            className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            View 3D town
          </Link>
          <a
            href="https://github.com/CSOAI-ORG/sov-town"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Run it yourself ↗
          </a>
          <Link href="/town" className="rounded-lg border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10">
            Read the town vision
          </Link>
        </div>

        <p className="mt-8 text-center text-xs text-slate-600">
          Output generated from the latest SOV Town run. Results are synthetic and intended to demonstrate the engine.
        </p>
      </div>
    </div>
  );
}
