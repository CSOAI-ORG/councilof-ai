/**
 * canonCounters — ONE source for every public number (Lane-2 canonification,
 * 2026-08-01). The register law: one number per metric, one file per number,
 * every number traces to a signed artefact with a measurement date.
 *
 * Import this everywhere a count renders. If a number isn't here, it doesn't
 * go on a page. UNMEASURED is a label, never a gap to paper over.
 */

export type CanonCounter = {
  value: number;
  source: string;
  measuredAt: string;
  note?: string;
};

export const CANON = {
  /** MCP servers in the master registry (the hub's gateway serves this file). */
  MCP_SERVERS: {
    value: 291,
    source: "client/src/data/mcpRegistry.json · servers.length (2 test fixtures purged 2026-08-01)",
    measuredAt: "2026-08-01",
  },
  MCP_SITES: {
    value: 14,
    source: "client/src/data/canonMcpRegistry.ts · CANON_COUNTS",
    measuredAt: "2026-08-01",
  },
  MCP_PACKS: {
    value: 5,
    source: "client/src/data/canonMcpRegistry.ts · CANON_COUNTS",
    measuredAt: "2026-08-01",
  },
  /** Public repos on GitHub CSOAI-ORG (the "369" underclaim is dead; 570 verified). */
  PUBLIC_REPOS: {
    value: 570,
    source: "GitHub API, user CSOAI-ORG (Series A readiness addendum)",
    measuredAt: "2026-07-31",
  },
  /** Anchor nodes in the anchors data file (globe3d falls back to these). */
  ANCHOR_NODES_TOTAL: {
    value: 6,
    source: "client/src/data/anchors.ts",
    measuredAt: "2026-08-01",
  },
  ANCHOR_NODES_LIVE: {
    value: 5,
    source: "client/src/data/anchors.ts · status=live",
    measuredAt: "2026-08-01",
    note: "Live count also streams from /api/worker/anchors (D1) — static fallback must match this file.",
  },
  /** Frozen counter: 126 AI Act + 99 GDPR + 71 CRA + 64 DORA + 46 NIS2 + 11 CSRD. */
  FROZEN_PROVISIONS: {
    value: 417,
    source: "public/interop/regulatory-inventory.json · frozen_provisions",
    measuredAt: "2026-08-03",
    note: "Verified frozen counter. The public repository does not yet expose 417 addressable provision rows; do not call it a complete inspectable corpus.",
  },
  /** Source-and-routing records. This is not a count of live regulator APIs. */
  REGULATOR_AUTHORITY_ADAPTERS: {
    value: 17,
    source: "public/interop/regulatory-inventory.json · authority_adapters.length",
    measuredAt: "2026-09-10",
    note: "Regulators, authority networks, framework owners and a treaty body are typed separately in the manifest.",
  },
  /** Heterogeneous crosswalk estate: statements, mappings, catalog, producer and views. */
  CROSSWALK_ASSETS: {
    value: 25,
    source: "public/interop/regulatory-inventory.json · crosswalk_assets.length",
    measuredAt: "2026-09-10",
    note: "Not 25 equivalent signed legal crosswalks. See each asset_type and evidence_state in the manifest.",
  },
  /** The signed GSPC board derives this count from its axis array. */
  GSPC_AXES: {
    value: 22,
    source: "public/signed/gspc-board.signed.json · axes.length",
    measuredAt: "2026-08-26",
    note: "Dated measurements, not certification or a legal compliance verdict.",
  },
  /** The public east-west mapping currently contains four jurisdiction rows. */
  PUBLISHED_CROSSWALK_REGIMES: {
    value: 4,
    source: "public/crosswalk/east-west-v1.json · jurisdictions.length",
    measuredAt: "2026-08-29",
    note: "Do not replace this with the 25-asset inventory count; they measure different things.",
  },
  /** Sovereign network agent cards (csoai.org is the crown — not counted as an agent). */
  NETWORK_AGENTS: {
    value: 19,
    source: "client/src/pages/NetworkPage.tsx · AGENTS[]",
    measuredAt: "2026-08-01",
  },
  LAYER0_NODES: {
    value: 27,
    source: "client/src/data/layer0Nodes.ts",
    measuredAt: "2026-08-01",
  },
  /** Jurisdictions/regimes in the public east-west crosswalk. */
  FRAMEWORKS_CROSSWALKED: {
    value: 4,
    source: "public/crosswalk/east-west-v1.json · jurisdictions.length",
    measuredAt: "2026-08-29",
    note: "EU · UK · US-IL · CN. The separate 25 count is an inventory of heterogeneous crosswalk assets, not 25 crosswalked legal regimes."
  },
  // ── camelCase entries for direct CANON.x.value access (NewHome-v2 FAQ,
  // TrustMarquee). Adding these fixed the 2026-08-01 P0: CANON.councilAgents
  // was undefined → "reading 'value'" crashed / on the live site.
  /** Council seats — a DESIGN figure. Copy that renders it must say DESIGNED
   *  (the NewHome-v2 FAQ does) and point at /refutation-ledger for measured status. */
  councilAgents: {
    value: 33,
    source: "33-seat council design (AGENTS.md: 33-seat council, 12 Generals) — DESIGN, not a live count",
    measuredAt: "2026-08-01",
    note: "DESIGN figure — never render as measured. Measured status lives on /refutation-ledger.",
  },
  /** Council quorum — 23/33 ≈ 70%, by DESIGN only. The fault-tolerance guarantee was retracted under DR-0007; its historical numeric result is unbound because the cited artifact is absent. Never render the design as a measured property. */
  councilConsensus: {
    value: 23,
    source: "council quorum, design figure only (23/33 = 70%) — guarantee retracted per DR-0007",
    measuredAt: "2026-08-01",
    note: "DESIGN figure — same labelling rule as councilAgents.",
  },
  /** MCP servers live-deployable from the master registry — same measured count as MCP_SERVERS. */
  // RENAMED 2026-08-26. This was `mcpLiveDeployed`, and the name was false about its own
  // contents: the value is `mcpRegistry.json · servers.length` — rows in a file. Nothing here
  // was ever probed, reached, or deployed. It was rendered on 8+ pages as "governed MCP tools
  // (deployed)" under a footer reading "live from the Council engine", which turned a file's
  // row count into a claim about running infrastructure. It also counts SERVERS while the
  // chip labelled it TOOLS. The live probe reaches 6 servers / 30 tools.
  mcpRegistryEntries: {
    value: 291,
    source: "client/src/data/mcpRegistry.json · servers.length (2 test fixtures purged 2026-08-01)",
    measuredAt: "2026-08-01",
    note:
      "CATALOGUED SERVERS — rows in a registry file, not reachable services and not tools. " +
      "A catalogue entry is not a running server; never render this as live or deployed.",
  },
} as const satisfies Record<string, CanonCounter>;

/** Lookup by page-facing key. Keeps NewHome-v2 honest: provisions→FROZEN_PROVISIONS,
 *  frameworks→FRAMEWORKS_CROSSWALKED, councilAgents→NETWORK_AGENTS (the 33-seat
 *  council is DESIGN — never render it as a live count). */
const CANON_KEY_MAP: Record<string, keyof typeof CANON> = {
  totalProvisions: "FROZEN_PROVISIONS",
  frameworks: "FRAMEWORKS_CROSSWALKED",
  councilAgents: "NETWORK_AGENTS",
  mcpServers: "MCP_SERVERS",
  mcpSites: "MCP_SITES",
  publicRepos: "PUBLIC_REPOS",
  anchorNodes: "ANCHOR_NODES_TOTAL",
  anchorNodesLive: "ANCHOR_NODES_LIVE",
  networkAgents: "NETWORK_AGENTS",
  layer0Nodes: "LAYER0_NODES",
};

export function canonValue(key: string): number {
  const k = CANON_KEY_MAP[key];
  if (!k) throw new Error(`canonValue: untracked key "${key}" — add it to canonCounters.ts with a source, or do not render the number`);
  return CANON[k].value;
}

/** Number-to-word for headlines that must not show digits (e.g. "Nineteen signed agents."). */
export const ONES = [
  "zero","one","two","three","four","five","six","seven","eight","nine","ten",
  "eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen","twenty",
] as const;

export function asWord(n: number): string {
  return n >= 0 && n < ONES.length ? ONES[n] : String(n);
}
