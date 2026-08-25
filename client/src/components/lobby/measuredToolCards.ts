/**
 * Controlled generative-UI registry: MCP measured-tool name → Lobby card.
 * Agent (or AG-UI TOOL_CALL_*) picks a tool; we render a prebuilt card — never raw HTML.
 * Measurement, not certification. Scores never sold.
 */

import type { LobbyTabId } from "./tabs";

export type MeasuredToolCardSpec = {
  tool: string;
  title: string;
  blurb: string;
  /** Site path for “Open surface” */
  path: string;
  /** Optional lobby pane to open */
  pane?: LobbyTabId;
  /** Honest status line shown on the card */
  status: string;
};

/** Measured MCP tools + honest UNMEASURED index catalog card */
export const MEASURED_TOOL_CARDS: Record<string, MeasuredToolCardSpec> = {
  gspc_board: {
    tool: "gspc_board",
    title: "GSPC board",
    blurb: "Live 14-slot board — 13 measured of 14. Per-axis n, leader, Wilson interval.",
    path: "/gspc-scoreboard",
    pane: "board",
    status: "MEASURED surface · GET /api/gspc",
  },
  east_west_board: {
    tool: "east_west_board",
    title: "East-West board",
    blurb: "One signed measurement mapped across EU / UK / Illinois / China. Mapping ≠ determination.",
    path: "/east-west",
    pane: "east-west",
    status: "Branch API · GET /api/east-west (live after master merge)",
  },
  ecosystem_index: {
    tool: "ecosystem_index",
    title: "Ecosystem index",
    blurb: "Regulators, enterprises, SMBs — public cited org data only.",
    path: "/intel",
    pane: "ecosystem",
    status: "Branch API · GET /api/ecosystem",
  },
  verify_tally: {
    tool: "verify_tally",
    title: "Verify tally",
    blurb: "Self-reported ✓/✗ opt-in counters only. Not a MEASURED number.",
    path: "/gspc-verify",
    pane: "verify",
    status: "Opt-in tally · never scores sold",
  },
  benchmark_quality: {
    tool: "benchmark_quality",
    title: "Benchmark quality",
    blurb: "Third-party benchmark quality register. Deterministic predicates; our instruments excluded.",
    path: "/benchmark-quality",
    status: "Public register · measurement not certification",
  },
  instruments_catalog: {
    tool: "instruments_catalog",
    title: "Instruments catalogue",
    blurb: "Published instruments with links to live measurement surfaces.",
    path: "/instruments",
    pane: "routes",
    status: "Eunomia Router · MCP instruments_catalog",
  },
  indices_catalog: {
    tool: "indices_catalog",
    title: "Labour & AI-economy indices",
    blurb: "AI-economy · human-labour · humanoid-labour — declared UNMEASURED. Contextual firewall only; never GSPC cell inputs.",
    path: "/indices",
    status: "UNMEASURED surfaces · GET /api/indices",
  },
  rwa_attestation_catalog: {
    tool: "rwa_attestation_catalog",
    title: "RWA attestation catalog",
    blurb: "Stage 2 prep — OUSG, BUIDL, RLUSD, BENJI, JMWH (demo). Declared UNMEASURED; measured_score null. Attestation ≠ tokenization ≠ ownership.",
    path: "/products",
    status: "UNMEASURED Stage 2 · GET /api/rwa-attestation",
  },
};

export type ToolCardInstance = MeasuredToolCardSpec & {
  /** Optional payload snippet from TOOL_CALL_RESULT (truncated for display) */
  preview?: string;
  phase?: "running" | "done" | "error";
};

export function cardForTool(
  name: string,
  opts?: { preview?: string; phase?: ToolCardInstance["phase"] },
): ToolCardInstance | null {
  const base = MEASURED_TOOL_CARDS[name];
  if (!base) return null;
  return {
    ...base,
    preview: opts?.preview,
    phase: opts?.phase ?? "done",
  };
}

/** Infer measured tool from AG-UI result payload when name is missing. */
export function inferToolFromResult(result: Record<string, unknown>): string | null {
  if (typeof result.tool === "string" && MEASURED_TOOL_CARDS[result.tool]) return result.tool;
  if (typeof result.name === "string" && MEASURED_TOOL_CARDS[result.name]) return result.name;
  if (result.schema === "csoai.gspc-axes/0.5" || result.axes) return "gspc_board";
  if (result.kind === "csoai.east-west-board" || result.crosswalk) return "east_west_board";
  if (result.accounts || result.counts) return "ecosystem_index";
  if (result.instruments || result.layers) return "instruments_catalog";
  if (result.schema === "csoai.rwa-attestation-catalog/0.1") return "rwa_attestation_catalog";
  if (
    result.schema === "csoai.labour-economy-index-catalog/0.1" ||
    result.schema === "csoai.labour-economy-index/0.1"
  ) {
    return "indices_catalog";
  }
  return null;
}

export function previewFromResult(result: Record<string, unknown>): string {
  try {
    const s = JSON.stringify(result);
    return s.length > 280 ? s.slice(0, 277) + "…" : s;
  } catch {
    return "";
  }
}
