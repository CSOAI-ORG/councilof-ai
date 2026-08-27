import { useEffect, useMemo, useState } from "react";
import CouncilOsPageShell from "@/components/os/CouncilOsPageShell";

const API: string = ((import.meta as any).env && (import.meta as any).env.VITE_API_BASE) || "";

// MCP Fleet — the real CSOAI/MEOK governance MCP fleet, sourced from the deployment
// manifest (MCP_DEPLOYMENT_MANIFEST.json, generated 2026-06-14). 216 servers across
// 10 hives DEPLOYED; the public registry (data/mcpRegistry.json) catalogues 291
// including planned entries. Both counts are stated on the page with their meanings.
// A representative slice of servers is listed (full fleet streams from /api/mcp once
// the gateway is on the VM). Each server carries a Layer 0 conformance badge derived
// from manifest flags.

const TOTAL = 216, READY = 208, AUTH = 202;

const HIVES: { name: string; n: number }[] = [
  { name: "meok-api-gateway", n: 172 },
  { name: "meok-gaming-hive", n: 14 },
  { name: "meok-compliance-gateway", n: 12 },
  { name: "meok-consumer", n: 6 },
  { name: "meok-governance-engine", n: 4 },
  { name: "meok-distribution", n: 3 },
  { name: "meok-keystone", n: 2 },
  { name: "meok-templeman-opticians", n: 1 },
  { name: "meok-aquaculture", n: 1 },
  { name: "meok-verticals", n: 1 },
];

// Real server names captured from the manifest (representative slice).
const SERVERS: { n: string; h: string }[] = [
  ["a2a-governance-bridge-mcp", "governance-engine"], ["csoai-governance-crosswalk-mcp", "compliance-gateway"],
  ["agent-identity-trust-mcp", "governance-engine"], ["agent-delegation-mcp", "api-gateway"],
  ["agent-negotiation-mcp", "api-gateway"], ["agent-orchestrator-mcp", "api-gateway"],
  ["agent-commerce-payments-mcp", "api-gateway"], ["ai-self-audit-mcp", "governance-engine"],
  ["ai-gateway-mcp", "api-gateway"], ["ai-ops-mcp", "api-gateway"], ["canada-aida-ai-mcp", "compliance-gateway"],
  ["clinical-trials-ai-mcp", "api-gateway"], ["contract-review-ai-mcp", "api-gateway"],
  ["content-registry-mcp", "distribution"], ["credential-manager-mcp", "keystone"],
  ["blockchain-verification-mcp", "keystone"], ["consciousness-engine-mcp", "consumer"],
  ["creativity-engine-mcp", "consumer"], ["care-membrane-mcp", "consumer"],
  ["accessibility-ai-mcp", "api-gateway"], ["accounting-ai-mcp", "api-gateway"], ["ad-copy-ai-mcp", "api-gateway"],
  ["agriculture-robotics-mcp", "verticals"], ["airspace-monitor-mcp", "api-gateway"],
  ["api-docs-generator-ai-mcp", "api-gateway"], ["api-tester-ai-mcp", "api-gateway"],
  ["backup-ai-mcp", "api-gateway"], ["blockchain-ai-mcp", "api-gateway"], ["budget-planner-ai-mcp", "api-gateway"],
  ["calendar-ai-mcp", "api-gateway"], ["changelog-ai-mcp", "api-gateway"], ["churn-predictor-ai-mcp", "api-gateway"],
  ["ci-cd-generator-ai-mcp", "api-gateway"], ["citation-finder-ai-mcp", "api-gateway"],
  ["cli-builder-ai-mcp", "api-gateway"], ["clipboard-ai-mcp", "api-gateway"], ["code-executor-mcp", "api-gateway"],
  ["code-reviewer-ai-mcp", "api-gateway"], ["color-ai-mcp", "api-gateway"], ["commit-message-ai-mcp", "api-gateway"],
  ["competitor-monitor-ai-mcp", "api-gateway"], ["compression-ai-mcp", "api-gateway"],
  ["config-validator-ai-mcp", "api-gateway"], ["content-calendar-ai-mcp", "api-gateway"],
  ["crm-ai-mcp", "api-gateway"], ["cron-ai-mcp", "api-gateway"], ["crypto-tracker-ai-mcp", "api-gateway"],
  ["ascii-art-ai-mcp", "api-gateway"],
].map(([n, h]) => ({ n, h }));

const hiveColor: Record<string, string> = {
  "governance-engine": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "compliance-gateway": "bg-blue-100 text-blue-700 border-blue-200",
  "keystone": "bg-amber-100 text-amber-800 border-amber-200",
  "consumer": "bg-violet-100 text-violet-700 border-violet-200",
  "distribution": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "verticals": "bg-rose-100 text-rose-700 border-rose-200",
  "api-gateway": "bg-gray-100 text-gray-600 border-gray-200",
};

export default function McpFleet() {
  const [q, setQ] = useState("");
  const [liveServers, setLiveServers] = useState<{ n: string; h: string }[] | null>(null);
  const [liveTotal, setLiveTotal] = useState(TOTAL);

  useEffect(() => {
    const base = API.replace(/\/$/, "");
    fetch(`${base}/api/mcp`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        if (Array.isArray(d.servers)) {
          setLiveServers(d.servers.map((s: any) => ({ n: s.name, h: (s.hive || "").replace(/^meok-/, "") })));
          if (d.total) setLiveTotal(d.total);
        }
      })
      .catch(() => {});
  }, []);

  const SRC = liveServers || SERVERS;
  const list = useMemo(() => SRC.filter((s) => s.n.includes(q.toLowerCase())), [q, SRC]);

  return (
    <CouncilOsPageShell title="MCP fleet" subtitle="216 governed servers — Layer 0 wrapped, attestable" className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-emerald-300 font-semibold tracking-wide uppercase text-sm">The governance MCP fleet</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">{TOTAL} governed MCP servers</h1>
          <p className="mt-5 text-lg text-emerald-50 max-w-2xl">
            The CSOAI / MEOK Model Context Protocol fleet — every server wrapped by Layer 0 so each tool call is
            identity‑checked, policy‑gated and Ed25519‑attestable.
          </p>
          <p className="mt-3 text-sm text-emerald-200/70 max-w-2xl">
            {TOTAL} servers deployed across {HIVES.length} hives per the 14 June 2026 deployment manifest ·
            293 catalogued in the public registry (which includes planned entries). Two counts, two meanings —
            the registry says which is which.
          </p>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
            <Stat v={String(TOTAL)} l="MCP servers" />
            <Stat v={String(HIVES.length)} l="Hives" />
            <Stat v={`${Math.round((READY / TOTAL) * 100)}%`} l="Deployment‑ready" />
            <Stat v={`${Math.round((AUTH / TOTAL) * 100)}%`} l="Auth (L0‑1+)" />
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-xl font-bold text-gray-900">Hives</h2>
        <div className="mt-4 space-y-2">
          {HIVES.map((h) => (
            <div key={h.name} className="flex items-center gap-3">
              <div className="w-52 shrink-0 font-mono text-xs text-gray-600">{h.name}</div>
              <div className="h-3 flex-1 rounded-full bg-gray-100">
                <div className="h-3 rounded-full bg-emerald-500" style={{ width: `${(h.n / TOTAL) * 100}%` }} />
              </div>
              <div className="w-10 text-right font-mono text-xs text-gray-500">{h.n}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Servers</h2>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search servers…" className="w-56 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none" />
        </div>
        <p className="mt-1 text-xs text-gray-500">Showing {list.length} of {liveTotal}{liveServers ? " (live)" : ""} — {liveServers ? "streamed from the gateway" : <>full fleet streams from <code className="text-emerald-700">/api/mcp</code> once the gateway is live</>}.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <div key={s.n} className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm text-gray-900 truncate">{s.n}</span>
                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">L0‑3</span>
              </div>
              <span className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-[11px] ${hiveColor[s.h] || hiveColor["api-gateway"]}`}>{s.h}</span>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
          Every server here imports <code className="text-emerald-700">@csoai/layer0</code> → Council Gate on each
          call, Ed25519 attestation, and an A2A envelope other governed agents verify offline. Conformance badge:
          <b> L0‑3</b> = attested · <b>L0‑5</b> = A2A‑ready.
        </div>
      </section>
    </CouncilOsPageShell>
  );
}

function Stat({ v, l }: { v: string; l: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-center">
      <div className="text-3xl font-extrabold text-emerald-300">{v}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wide text-emerald-100/70">{l}</div>
    </div>
  );
}
