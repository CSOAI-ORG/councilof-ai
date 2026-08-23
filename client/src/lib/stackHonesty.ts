/**
 * Canonical stack honesty register — single source for counts and labels.
 *
 * Binding register (never blend):
 *   MEASURED  — our signed deterministic runs (GSPC board, /api/gspc)
 *   UNMEASURED — honestly empty, reason stated
 *   REPORTED  — third-party figures, cited + dated, not measured here
 *   DESIGN    — architecture thesis, scenario, or roadmap — not a live claim
 *   SHIPPED   — repo + site surface exists and is reachable
 *   PARTIAL   — repo or stub only; not wired end-to-end on councilof.ai
 *   GAP       — design only, no repo yet
 */
import mcpRegistry from "@/data/mcpRegistry.json";
import { HIVE } from "@/data/hive-frameworks";
import { COUNTS as GSPC_COUNTS } from "@/lib/gspcAxes";

export type StackRegister =
  | "MEASURED"
  | "UNMEASURED"
  | "REPORTED"
  | "DESIGN"
  | "SHIPPED"
  | "PARTIAL"
  | "GAP"
  | "PLANNED"
  | "SPEC";

/** Counts we can cite from checked-in artefacts — not inflated marketing numbers. */
export const STACK_STATS = {
  /** MCP servers in client/src/data/mcpRegistry.json */
  mcpServers: mcpRegistry.total as number,
  mcpRegistryCapturedAt: mcpRegistry.generatedAt as string,
  mcpRegistrySource: mcpRegistry.source as string,
  /** Distinct framework tags on MCP server records */
  mcpFrameworkTags: (mcpRegistry.frameworkCounts as { name: string }[]).length,
  /** Frameworks in hive-frameworks crosswalk */
  hiveFrameworks: HIVE.length,
  /** GSPC core axes (13 in AXES; public board may reserve a 14th jail slot) */
  gspcAxesTotal: GSPC_COUNTS.total,
  gspcAxesMeasured: GSPC_COUNTS.measured,
  routerLayers: 5,
} as const;

/** Industry bond market size — REPORTED context, not CSOAI measurement */
export const BOND_MARKET_REPORTED_T = 130;

export const REGISTER_CHIP: Record<StackRegister, string> = {
  MEASURED: "border-emerald-500/40 bg-emerald-950/30 text-emerald-300",
  UNMEASURED: "border-slate-500/40 bg-slate-900/40 text-slate-400",
  REPORTED: "border-amber-500/40 bg-amber-950/30 text-amber-300",
  DESIGN: "border-violet-500/40 bg-violet-950/30 text-violet-300",
  SHIPPED: "border-emerald-500/40 bg-emerald-950/20 text-emerald-400",
  PARTIAL: "border-amber-500/40 bg-amber-950/20 text-amber-400",
  GAP: "border-slate-600/40 bg-slate-900/30 text-slate-500",
  PLANNED: "border-slate-500/40 bg-slate-900/40 text-slate-400",
  SPEC: "border-slate-500/40 bg-slate-900/40 text-slate-400",
};

export const HONESTY_REGISTER_COPY = {
  measured: "Our own signed, deterministic runs — live at GET /api/gspc.",
  unmeasured: "Honestly withheld — insufficient n or no frozen instrument yet.",
  reported: "Third-party context, cited and dated — not measured here.",
  design: "Architecture thesis or scenario — not a committed forecast or live product.",
} as const;
