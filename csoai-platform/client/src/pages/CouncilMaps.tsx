/**
 * Council · Maps — the 33-node council graph.
 *
 * Each node is a sovereign AI agent. Each bridge is a verified affinity
 * link between two nodes — weight = agreement frequency on real cert
 * decisions. The threshold is the minimum bridge strength for a decision
 * to count.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import CouncilNav from "@/components/CouncilNav";
import {
  getCouncilStatus,
  getBridgesTopology,
  getHighAffinityBridges,
  type CouncilStatus,
  type BridgesTopology,
} from "@/lib/meok-api";

const REFRESH_MS = 60_000;

export default function CouncilMaps() {
  const [council, setCouncil] = useState<CouncilStatus | null>(null);
  const [bridges, setBridges] = useState<BridgesTopology | null>(null);
  const [highAffinity, setHighAffinity] = useState<any[] | null>(null);

  useEffect(() => {
    const refresh = async () => {
      const [c, b, h] = await Promise.all([
        getCouncilStatus(),
        getBridgesTopology(),
        getHighAffinityBridges(),
      ]);
      setCouncil(c);
      setBridges(b);
      setHighAffinity(h);
    };
    refresh();
    const t = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  const nodesByDomain = council?.nodes_by_domain ?? {};
  const totalNodes = council?.node_count ?? 36;
  const totalBridges = bridges?.total ?? 55;

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
          <p className="text-violet-400 text-xs font-bold tracking-widest uppercase mb-3">
            Council · Maps
          </p>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tighter mb-4">
            The 36-node council graph
          </h1>
          <p className="text-slate-400 max-w-3xl">
            Each node is a sovereign AI agent. Each bridge is a verified
            affinity link between two nodes — weight = agreement frequency on
            real cert decisions. The threshold is the minimum bridge strength
            for a decision to count.
          </p>
        </motion.header>

        {/* Top stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          <BigStat label="Council nodes" value={totalNodes} color="emerald" />
          <BigStat label="Bridges" value={totalBridges} color="cyan" />
          <BigStat
            label="Threshold"
            value={`${council?.threshold ?? 22}/36`}
            color="amber"
          />
          <BigStat label="Domains" value={council?.domain_count ?? 12} color="violet" />
        </div>

        {/* Visual: domain clusters */}
        <h2 className="text-2xl font-bold mb-6">Domain clusters (real-time node counts)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {Object.entries(nodesByDomain).map(([domain, nodes]: [string, any]) => (
            <div key={domain} className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-bold capitalize text-slate-300 mb-2">{domain}</h3>
              <div className="flex items-center gap-1 flex-wrap">
                {Array.from({ length: Math.min(nodes?.length ?? 1, 20) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-emerald-400"
                    style={{ opacity: 0.4 + (i % 3) * 0.2 }}
                  />
                ))}
                {(nodes?.length ?? 0) > 20 && (
                  <span className="text-xs text-slate-500 ml-1">
                    +{(nodes?.length ?? 0) - 20}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {nodes?.length ?? 0} nodes · ~{Math.floor((nodes?.length ?? 0) * 1.5)} bridges
              </p>
            </div>
          ))}
        </div>

        {/* High affinity pairs */}
        <h2 className="text-2xl font-bold mb-6">High-affinity bridge pairs</h2>
        <p className="text-sm text-slate-500 mb-6">
          Pairs of nodes that consistently agree on cert decisions. These are
          the substrate&apos;s &ldquo;stable&rdquo; relationships — useful for
          predicting future outcomes and detecting Sybil attacks.
        </p>
        {highAffinity && highAffinity.length > 0 ? (
          <div className="space-y-2 mb-12">
            {highAffinity.slice(0, 20).map((pair: any, i: number) => (
              <div
                key={i}
                className="p-4 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between"
              >
                <span className="font-mono text-sm">
                  {pair.node_a ?? pair.a ?? "node-a"}{" "}
                  <span className="text-slate-500">↔</span>{" "}
                  {pair.node_b ?? pair.b ?? "node-b"}
                </span>
                <span className="text-xs font-mono text-emerald-400">
                  {(pair.affinity ?? pair.strength ?? 0).toFixed(2)} affinity
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm italic">
            High-affinity data not available. Will populate when meok-api is reachable.
          </p>
        )}

        <div className="p-6 rounded-2xl bg-violet-500/5 border border-violet-500/20">
          <p className="text-sm text-slate-300">
            The full bridge topology is published at{" "}
            <a className="text-violet-400 hover:underline" href="https://meok.ai/council">
              meok.ai/council
            </a>{" "}
            and{" "}
            <a className="text-violet-400 hover:underline" href="https://councilof.ai">
              councilof.ai
            </a>
            . This page is the live mirror; the data is refreshed every 60s.
          </p>
        </div>
      </main>
    </>
  );
}

function BigStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
        {label}
      </p>
      <p className={`text-4xl font-black text-${color}-400`}>{value}</p>
    </div>
  );
}
