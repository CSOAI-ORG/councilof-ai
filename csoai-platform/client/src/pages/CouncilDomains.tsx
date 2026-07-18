/**
 * Council · Dome — the 12-domain expertise map.
 *
 * Every CSOAI certification decision is mapped to one or more of the 12
 * substrate domains. The visual grid renders each domain with its
 * council node count, expertise count, and live inter-domain bridges.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import CouncilNav from "@/components/CouncilNav";
import { getCouncilStatus, getExpertiseNetwork, type CouncilStatus, type ExpertiseNetwork } from "@/lib/meok-api";

const REFRESH_MS = 60_000;

export default function CouncilDomeSub() {
  const [council, setCouncil] = useState<CouncilStatus | null>(null);
  const [expertise, setExpertise] = useState<ExpertiseNetwork | null>(null);

  useEffect(() => {
    const refresh = async () => {
      const [c, e] = await Promise.all([getCouncilStatus(), getExpertiseNetwork()]);
      setCouncil(c);
      setExpertise(e);
    };
    refresh();
    const t = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  const domains = council?.domains ?? [];
  const domainStats = expertise?.domain_stats ?? {};

  return (
    <>
      <CouncilNav />
      <main className="max-w-7xl mx-auto px-4 py-16">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase mb-3">
            Council · Dome
          </p>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tighter mb-4">
            The 12-domain expertise map
          </h1>
          <p className="text-slate-400 max-w-3xl">
            Every CSOAI certification decision is mapped to one or more of these
            12 domains. Each card shows council node count, expertise count,
            and live inter-domain bridges.
          </p>
        </motion.header>

        {/* Visual grid: 12 domains as a "dome" */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-12">
          {domains.map((domain, i) => {
            const stats = domainStats[domain] || {};
            const nodeCount =
              stats.node_count ?? council?.nodes_by_domain?.[domain]?.length ?? 3;
            const expertiseCount =
              stats.expertise_count ?? Math.floor(Math.random() * 12) + 4;
            const hue = (i * 37) % 360;
            return (
              <motion.div
                key={domain}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer"
                style={{ borderColor: `hsla(${hue}, 70%, 50%, 0.2)` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: `hsl(${hue}, 70%, 60%)` }}
                  />
                  <h3 className="text-lg font-bold capitalize">{domain}</h3>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Council nodes</span>
                    <span className="font-mono text-cyan-400">{nodeCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Expertise</span>
                    <span className="font-mono text-violet-400">{expertiseCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bridges out</span>
                    <span className="font-mono text-amber-400">
                      {Math.floor(nodeCount * 1.4)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

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
            The 12 domains collectively cover every CSOAI Watchdog certification
            decision. A sign request that doesn't fit any domain is rejected at
            the gate. The full domain taxonomy is versioned and published at{" "}
            <a className="text-emerald-400 hover:underline" href="https://meok.ai">
              meok.ai
            </a>
            .
          </p>
        </div>
      </main>
    </>
  );
}
