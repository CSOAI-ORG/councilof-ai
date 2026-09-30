/**
 * GSPC Route: one core, used by the free MCP tool `route`, the A2A skill `route` and the pod service
 * (services/gspc-router). Decide-only. It returns the chosen path and the UNSIGNED route record.
 *
 * Execution is a separate door, POST /api/route/execute (execute.ts, owner ruling 2026-09-30, phases 1-4);
 * this decide-only core never calls a target. mode "execute" here answers NOT_ENABLED (501).
 */
import { isSeparated } from "../leaderLabel";
import { buildCandidates } from "./candidates";
import { applyCensus } from "./census";
import { ARD_LISTINGS, MAX_DISCOVERED, type CandidateSource, type DiscoveryResult } from "./discovery";
import { decide, type Decision } from "./decide";
import type { CensusRead } from "./census";
import type { CallerPolicy } from "./policy";
import { buildRouteRecord, sha256Hex } from "./evidence";
import { callerPolicy, type PolicyContext } from "./policy";
import {
  DATA_CLASSES,
  DEFAULT_TIE_BREAK,
  TIE_BREAK_RULES,
  type BoardAxis,
  type BoardRead,
  type Candidate,
  type Task,
  type DataClass,
  type Objective,
  type TieBreakRule,
} from "./types";

export const NOT_ENABLED = {
  state: "NOT_ENABLED",
  http_status: 501,
  mode: "execute",
  note:
    "The route tool is decide-only. Execution is POST /api/route/execute: it runs verified read-only targets, " +
    "answers paid first-party tools with their x402 challenge, hands anything needing your credentials back as a " +
    "client-side plan, and signs a receipt. Nothing was called and nothing was charged here.",
} as const;

/** Every string the router itself writes into a response. Caller-supplied ids are echoed as given. */
export const BANNED_ROUTE_WORDS = /\b(best|safest|recommended|compliant|certified)\b/i;

export type RouteDeps = {
  /** Reads /api/gspc; injected so tests and the pod service supply their own board. */
  fetchBoard: () => Promise<unknown>;
  /** Reads the effect-binding census index (census.ts). Absent => every candidate stays UNMEASURED (NOT_WIRED). */
  fetchCensus?: () => Promise<unknown>;
  /** Discovery sources by listing name (discovery.ts). Absent => `discover` is refused on this surface. */
  discovery?: Partial<Record<keyof typeof ARD_LISTINGS, CandidateSource>>;
  now?: () => Date;
  uuid?: () => string;
};

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function pair(v: unknown): [number, number] | null {
  return Array.isArray(v) && v.length === 2 && v.every((x) => typeof x === "number") ? [v[0], v[1]] : null;
}

/** One board row reduced to what the router may use (separation_evidence carries the top two rows). */
export function boardAxis(board: unknown, axisName: string): BoardAxis | null {
  const rows = ((board as { axes?: unknown[] })?.axes ?? []) as Record<string, unknown>[];
  const want = axisName.trim().toLowerCase();
  const row = rows.find((r) => String(r.axis ?? "").toLowerCase() === want);
  if (!row) return null;
  const ev = (row.separation_evidence ?? {}) as Record<string, unknown>;
  const side = (x: unknown): BoardAxis["leader"] => {
    const o = x as Record<string, unknown> | undefined;
    if (!o || typeof o.model !== "string") return null;
    return { model: o.model, accuracy: num(o.accuracy), wilson95: pair(o.wilson95), n: num(o.n) };
  };
  let leader = side(ev.leader);
  // A row without separation evidence still names its top observed model; it carries the row's own
  // accuracy and interval, and nothing about a runner-up.
  if (!leader && typeof row.leader === "string" && row.leader.trim())
    leader = { model: row.leader, accuracy: num(row.accuracy), wilson95: pair(row.interval), n: num(row.n) };
  const fileSha = typeof ev.file_sha256 === "string" && /^[0-9a-f]{64}$/.test(ev.file_sha256) ? ev.file_sha256 : null;
  return {
    axis: String(row.axis),
    separation: typeof row.separation === "string" ? row.separation : null,
    leader,
    next_best: side(ev.next_best),
    source: typeof ev.source === "string" ? ev.source : "https://councilof.ai/api/gspc",
    source_sha256: fileSha,
  };
}

function objectiveOf(raw: unknown, errors: string[]): Objective {
  const o = (raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>;
  const axis = typeof o.quality_axis === "string" && /^[a-z0-9-]{1,60}$/.test(o.quality_axis) ? o.quality_axis : null;
  if (o.quality_axis !== undefined && axis === null) errors.push("objective.quality_axis must be a board axis id such as governance");
  const w = (o.weights && typeof o.weights === "object" ? o.weights : {}) as Record<string, unknown>;
  const weight = (k: string, d: number) => {
    const v = w[k];
    if (v === undefined) return d;
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 1) {
      errors.push(`objective.weights.${k} must be a number from 0 to 1`);
      return d;
    }
    return v;
  };
  const weights = { quality: weight("quality", axis ? 1 : 0), cost: weight("cost", 0), latency: weight("latency", 0) };
  let tie_break: TieBreakRule[] = [...DEFAULT_TIE_BREAK];
  if (o.tie_break !== undefined) {
    const list = Array.isArray(o.tie_break) ? o.tie_break : [o.tie_break];
    if (list.length && list.every((x) => (TIE_BREAK_RULES as readonly string[]).includes(String(x))))
      tie_break = [...new Set(list as TieBreakRule[])];
    else errors.push(`objective.tie_break must be drawn from ${TIE_BREAK_RULES.join(", ")}`);
  }
  return { quality_axis: axis, weights, tie_break };
}

export type RouteResult = Record<string, unknown> & { state: string };

/** What execute.ts needs beyond the public result: the decision it must execute, never re-derive. */
export type RouteInternals = {
  candidates: Candidate[];
  decision: Decision;
  policy: CallerPolicy;
  task: Task;
  objective: Objective;
  board: { state: string; source: string | null; board_separation: string | null };
  census: CensusRead;
  locator: string;
  readAt: string;
};

export async function route(args: Record<string, unknown>, deps: RouteDeps): Promise<RouteResult> {
  if (args.mode !== undefined && args.mode !== "decide") {
    return args.mode === "execute"
      ? { ...NOT_ENABLED }
      : { state: "BAD_ARGUMENTS", errors: ['mode must be "decide" (execution is POST /api/route/execute)'] };
  }
  return (await routeCore(args, deps)).result;
}

/** The decide step shared by route (decide-only) and execute.ts. mode is not read here. */
export async function routeCore(
  args: Record<string, unknown>,
  deps: RouteDeps,
): Promise<{ result: RouteResult; internals: RouteInternals | null }> {
  const errors: string[] = [];
  const taskText = typeof args.task === "string" ? args.task : null;
  const taskShaIn = typeof args.task_sha256 === "string" ? args.task_sha256.toLowerCase() : null;
  if (taskShaIn !== null && !/^[0-9a-f]{64}$/.test(taskShaIn)) errors.push("task_sha256 must be 64 hex characters");
  if (taskText === null && taskShaIn === null) errors.push("pass task (hashed, never stored) or task_sha256");
  const data_class = (args.data_class ?? "public") as DataClass;
  if (!(DATA_CLASSES as readonly string[]).includes(String(data_class)))
    errors.push(`data_class must be one of ${DATA_CLASSES.join(", ")}`);
  if (args.needs_write !== undefined && typeof args.needs_write !== "boolean") errors.push("needs_write must be true or false");
  const objective = objectiveOf(args.objective, errors);
  const { candidates: declared, errors: candErrors } = buildCandidates(args.discover !== undefined && args.candidates === undefined ? [] : args.candidates);
  errors.push(...candErrors);
  let source: CandidateSource | null = null;
  let discoverMax = 8;
  if (args.discover !== undefined) {
    const d = (args.discover && typeof args.discover === "object" && !Array.isArray(args.discover) ? args.discover : {}) as Record<string, unknown>;
    const name = typeof d.listing === "string" ? d.listing : "";
    if (d.max !== undefined) discoverMax = typeof d.max === "number" && Number.isInteger(d.max) ? d.max : -1;
    if (!Object.prototype.hasOwnProperty.call(ARD_LISTINGS, name)) errors.push(`discover.listing must be one of ${Object.keys(ARD_LISTINGS).join(", ")}`);
    else if (discoverMax < 1 || discoverMax > MAX_DISCOVERED) errors.push(`discover.max must be an integer from 1 to ${MAX_DISCOVERED}`);
    else if (!deps.discovery?.[name as keyof typeof ARD_LISTINGS]) errors.push("discover is not wired on this surface");
    else source = deps.discovery[name as keyof typeof ARD_LISTINGS] as CandidateSource;
  }
  if (errors.length) return { result: { state: "BAD_ARGUMENTS", errors }, internals: null };
  let discovered: DiscoveryResult | null = null;
  if (source) discovered = await source.discover(discoverMax);
  const candidates = discovered ? [...declared, ...discovered.candidates] : declared;
  if (discovered) {
    const seen = new Set<string>();
    for (const c of candidates) {
      if (seen.has(c.id) && !c.uncheckable.includes("duplicate id")) c.uncheckable.push("duplicate id");
      seen.add(c.id);
    }
  }

  const taskSha = taskShaIn ?? (await sha256Hex(taskText as string));
  const policy = callerPolicy(args.policy);
  const ctx: PolicyContext = {
    confirm: policy.confirm,
    caller_wallet: policy.caller_wallet,
    data_class,
    allow_divergent_effect_binding: policy.allow_divergent_effect_binding,
  };

  let board: BoardRead = { state: "NOT_REQUESTED", axis: null, source: null };
  if (objective.quality_axis) {
    try {
      const b = await deps.fetchBoard();
      board = { state: "LIVE", axis: boardAxis(b, objective.quality_axis), source: "/api/gspc" };
    } catch {
      // UNREACHABLE: every candidate is UNTESTED on the axis. No cached number is substituted.
      board = { state: "UNREACHABLE", axis: null, source: "/api/gspc" };
    }
  }
  const census = await applyCensus(candidates, deps.fetchCensus);
  const decision = decide(candidates, policy, ctx, objective, board.axis);
  const readAt = (deps.now ?? (() => new Date()))().toISOString();
  const uuid = (deps.uuid ?? (() => crypto.randomUUID()))();
  const task: Task = { sha256: taskSha, data_class, needs_write: args.needs_write === true, content_retained: false };
  const boardSummary = {
    state: board.state === "LIVE" && !board.axis ? "AXIS_NOT_ON_BOARD" : board.state,
    source: board.source,
    board_separation: board.axis?.separation ?? null,
  };
  const locator = `urn:gspc:route:${uuid}`;
  const record = await buildRouteRecord({
    task,
    policy,
    objective,
    candidates,
    decision,
    board: boardSummary,
    census,
    ...(discovered ? { discovery: discovered.read } : {}),
    locator,
    readAt,
  });
  const internals: RouteInternals = {
    candidates,
    decision,
    policy,
    task,
    objective,
    board: boardSummary,
    census,
    locator,
    readAt,
  };
  const result: RouteResult = {
    state: decision.chosen ? "ROUTED" : "NO_PERMITTED_CANDIDATE",
    mode: "decide_only",
    preview: true,
    signed: false,
    chosen: decision.chosen,
    separation: decision.separation,
    label: decision.label,
    considered: decision.considered.length,
    permitted: decision.permitted.length,
    forbidden: decision.considered
      .filter((x) => !x.verdict.permit)
      .map((x) => ({ id: x.candidate.id, forbid_policy: x.verdict.forbid_policy })),
    record,
    note:
      "Routing is not ranking: the caller's policy applied to published measurements. TIE and UNTESTED are " +
      "stated as they are. Unsigned decide-only preview; nothing was executed or charged.",
  };
  return { result, internals };
}

/** The one-line summary MCP clients show first. Written only from router-controlled words. */
export function routeSummary(r: RouteResult): string {
  if (r.state === "NOT_ENABLED") return "NOT_ENABLED (501): the route tool is decide-only; execution is POST /api/route/execute.";
  if (r.state === "BAD_ARGUMENTS") return `BAD_ARGUMENTS: ${(r.errors as string[]).join("; ")}`;
  const chosen = r.chosen as { id: string; choice_basis: string } | null;
  const sep = String(r.separation);
  const tail = `${r.permitted} of ${r.considered} candidates permitted; separation ${sep}${
    r.label ? ` (${r.label})` : ""
  }. Unsigned decide-only preview.`;
  if (!chosen) return `NO_PERMITTED_CANDIDATE: the policy permitted none of ${r.considered} candidates.`;
  return `ROUTED to ${chosen.id} on basis ${chosen.choice_basis}; ${tail}${
    isSeparated(sep) ? "" : " Not a ranking."
  }`;
}
