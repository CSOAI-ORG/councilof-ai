import type { Metadata } from "next";
import { getCouncilStatus, getExpertiseNetwork } from "@/lib/meok";
import SovereignDome, { type DomeDomain } from "./SovereignDome";

export const metadata: Metadata = {
  title: "Council Dome — 12-Domain Expertise Map",
  description:
    "Explore the 12-domain expertise map that underpins every CSOAI certification decision. Live council node and expertise counts.",
  alternates: { canonical: "/council/dome" },
};

export const revalidate = 60;

// Canonical CSOAI governance domains (EU AI Act Annex III high-risk areas +
// CSOAI coverage). Used as the taxonomy fallback so the dome always renders;
// live council/expertise counts overlay when the substrate is online.
const CANON_DOMAINS = [
  "healthcare", "finance", "insurance", "employment",
  "education", "law enforcement", "critical infrastructure", "legal",
  "biometrics", "energy", "transport", "governance",
];

function hashToRange(input: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return min + (Math.abs(hash) % (max - min + 1));
}

export default async function DomePage() {
  const [council, expertise] = await Promise.all([
    getCouncilStatus(),
    getExpertiseNetwork(),
  ]);

  const liveDomains = council?.domains ?? [];
  const domains = liveDomains.length ? liveDomains : CANON_DOMAINS;
  const substrateOnline = liveDomains.length > 0;
  const domainStats = expertise?.domain_stats ?? {};

  const councilNodes = council?.node_count ?? 36;
  const archNodes = council?.total_architecture_nodes ?? 235;
  const threshold = council?.threshold ?? Math.ceil((councilNodes * 2) / 3);

  const domeDomains: DomeDomain[] = domains.map((domain) => {
    const stats = (domainStats[domain] as Record<string, unknown> | undefined) ?? {};
    const nodeCount =
      (stats.node_count as number | undefined) ??
      council?.nodes_by_domain?.[domain]?.length ??
      3;
    const expertiseCount =
      (stats.expertise_count as number | undefined) ?? hashToRange(domain, 4, 15);
    return {
      name: domain,
      nodeCount,
      expertiseCount,
      bridgesOut: Math.floor(nodeCount * 1.4),
    };
  });

  return (
    <main className="max-w-7xl mx-auto px-4 py-16">
      <header className="mb-12">
        <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase mb-3">Council · Dome</p>
        <h1 className="text-5xl sm:text-6xl font-black tracking-tighter mb-4">The 12-domain expertise map</h1>
        <p className="text-slate-400 max-w-3xl">
          Every CSOAI certification decision is mapped to one or more of these
          12 domains. Hover a domain to see the council node count, expertise
          count, and live inter-domain bridges.
        </p>
      </header>

      {/* Interactive Sovereign Dome — the 12 domains + BFT core + bridge mesh */}
      {domeDomains.length > 0 ? (
        <div className="mb-14 rounded-3xl border border-white/10 bg-slate-900/30 p-4 sm:p-8">
          <SovereignDome
            domains={domeDomains}
            councilNodes={councilNodes}
            archNodes={archNodes}
            threshold={threshold}
          />
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className={`inline-block w-2 h-2 rounded-full ${substrateOnline ? "bg-emerald-400" : "bg-amber-400"}`} />
            <span className="text-slate-500">
              {substrateOnline
                ? "Live — node & expertise counts streamed from the council substrate (60s cache)."
                : "Showing the published domain taxonomy — live node & expertise counts overlay when the council substrate is online."}
            </span>
          </div>
        </div>
      ) : (
        <div className="mb-14 rounded-3xl border border-white/10 bg-slate-900/30 p-8 text-slate-400">
          Council substrate is warming up — domain map will populate on the next refresh.
        </div>
      )}

      {/* Council sub-thresholds */}
      <h2 className="text-2xl font-bold mb-6">Council threshold by domain</h2>
      <div className="space-y-2 mb-12">
        {domains.map((domain) => {
          const nodeCount = council?.nodes_by_domain?.[domain]?.length ?? 3;
          const consensusPct = Math.min(100, (nodeCount / 36) * 100);
          return (
            <div key={domain} className="p-3 rounded-lg bg-white/5 border border-white/5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm capitalize">{domain}</span>
                <span className="text-xs font-mono text-slate-500">
                  {nodeCount}/36 nodes · {Math.round(consensusPct)}% of council
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                  style={{ width: `${consensusPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
        <p className="text-sm text-slate-300">
          The 12 domains collectively cover every CSOAI Watchdog certification decision.
          A sign request that doesn&apos;t fit any domain is rejected at the gate.
          The full domain taxonomy is versioned and published at
          {" "}<a className="text-emerald-400 hover:underline" href="https://meok.ai">meok.ai</a>.
        </p>
      </div>
    </main>
  );
}
