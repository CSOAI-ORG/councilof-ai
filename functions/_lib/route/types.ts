/**
 * GSPC Route: types. Decide-only (MVP, spec ~/_alignment/GSPC-ROUTER-SPEC-2026-09-30.md §5).
 *
 * Routing is not ranking. The router applies the CALLER's policy to OUR measurements, prints TIE and
 * UNTESTED as they are, and says "separated leader" only for a comparison the board separated.
 */

export const CANDIDATE_KINDS = ["model", "mcp_tool", "a2a_agent", "x402_resource", "local_gpu"] as const;
export type CandidateKind = (typeof CANDIDATE_KINDS)[number];

export const DATA_CLASSES = ["public", "internal", "confidential", "pii"] as const;
export type DataClass = (typeof DATA_CLASSES)[number];

export type CensusState = "CONSISTENT" | "DIVERGENT" | "UNMEASURED";

/** A candidate after normalisation. Nothing here came from a field the router does not understand. */
export type Candidate = {
  id: string;
  kind: CandidateKind;
  provider: string;
  model: string | null;
  region: string;
  endpoint: string | null;
  /** The MCP tool this candidate names (fleet: its tool name; caller-declared: the `tool` field), else null. */
  tool: string | null;
  local: boolean;
  read_only: boolean;
  destructive: boolean;
  paid: boolean;
  data_class_allowed: DataClass[];
  cost_declared: number | null;
  latency_declared_ms: number | null;
  source: "gspc_fleet" | "caller_declared";
  /** effect_binding only, until a census lookup ran; then also the run's raw outcome and why (census.ts). */
  census: { effect_binding: CensusState; outcome?: string | null; basis?: string; tool?: ToolCensus };
  /** Non-empty => the candidate is UNCHECKABLE and is never permitted (fail closed). */
  uncheckable: string[];
  /** Commercial fields (sponsor, bid, ...) that were present and dropped before any rule saw them. */
  ignored_fields: string[];
};

/**
 * The per-tool row of the census (schema 0.2) for a candidate that names a tool. listed_read_only is true
 * only when the signed probe listed this tool in the server's read_only_tools; null when the index carries
 * no per-tool data (schema 0.1) or the endpoint was not probed.
 */
export type ToolCensus = {
  listed_read_only: boolean | null;
  p2: "REJECTS" | "ACCEPTS_SILENTLY" | "INDETERMINATE" | "NOT_PROBED" | null;
};

export type Separation = "SEPARATED" | "TIE" | "UNTESTED";

export type Measurement = {
  axis: string;
  state: "MEASURED" | "UNTESTED";
  /** Only a number the board published for this model on this axis; never imputed, never 0 for UNTESTED. */
  value: number | null;
  interval: [number, number] | null;
  n: number | null;
  source: string | null;
  source_sha256: string | null;
  /** leaderLabel(separation) for a measured candidate, else null. */
  label: string | null;
};

export const TIE_BREAK_RULES = ["cheapest_declared", "local_first", "lexical_id"] as const;
export type TieBreakRule = (typeof TIE_BREAK_RULES)[number];
export const DEFAULT_TIE_BREAK: TieBreakRule[] = ["cheapest_declared", "local_first", "lexical_id"];

export type Objective = {
  quality_axis: string | null;
  weights: { quality: number; cost: number; latency: number };
  tie_break: TieBreakRule[];
};

export type Task = {
  sha256: string;
  data_class: DataClass;
  needs_write: boolean;
  content_retained: false;
};

export type PolicyVerdict = {
  permit: boolean;
  /** The first forbid that matched, or the reason no permit applied. null when permitted. */
  forbid_policy: string | null;
  forbids_matched: string[];
};

/** One axis row of the live board, reduced to what the router may use. */
export type BoardAxis = {
  axis: string;
  separation: string | null;
  leader: { model: string; accuracy: number | null; wilson95: [number, number] | null; n: number | null } | null;
  next_best: { model: string; accuracy: number | null; wilson95: [number, number] | null; n: number | null } | null;
  source: string | null;
  source_sha256: string | null;
};

export type BoardRead =
  | { state: "LIVE"; axis: BoardAxis | null; source: string }
  | { state: "UNREACHABLE" | "NOT_REQUESTED"; axis: null; source: string | null };
