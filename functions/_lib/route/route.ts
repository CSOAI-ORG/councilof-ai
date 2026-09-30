/**
 * GSPC Route: one core, used by the free MCP tool `route`, the A2A skill `route` and the pod service
 * (services/gspc-router). Decide-only. It returns the chosen path and the UNSIGNED route record.
 *
 * Out of scope until the owner rules (spec §8): route_execute, executing /v1/chat/completions, x402
 * amounts, a route signing key, and caller-key passthrough. mode "execute" answers NOT_ENABLED (501).
 */
import { isSeparated } from "../leaderLabel";
import { buildCandidates } from "./candidates";
import { decide } from "./decide";
import { buildRouteRecord, sha256Hex } from "./evidence";
import { callerPolicy, type PolicyContext } from "./policy";
import {
  DATA_CLASSES,
  DEFAULT_TIE_BREAK,
  TIE_BREAK_RULES,
  type BoardAxis,
  type BoardRead,
  type DataClass,
  type Objective,
  type TieBreakRule,
} from "./types";

export const NOT_ENABLED = {
  state: "NOT_ENABLED",
  http_status: 501,
  mode: "execute",
  note:
    "Execute mode is not enabled. GSPC Route is decide-only until the owner rules on execution, " +
    "caller-key passthrough, x402 amounts and the route signing key. Nothing was called and nothing was charged.",
} as const;

/** Every string the router itself writes into a response. Caller-supplied ids are echoed as given. */
export const BANNED_ROUTE_WORDS = /\b(best|safest|recommended|compliant|certified)\b/i;

export type RouteDeps = {
  /** Reads /api/gspc; injected so tests and the pod service supply their own board. */
  fetchBoard: () => Promise<unknown>;
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

export async function route(args: Record<string, unknown>, deps: RouteDeps): Promise<RouteResult> {
  if (args.mode !== undefined && args.mode !== "decide") {
    return args.mode === "execute"
      ? { ...NOT_ENABLED }
      : { state: "BAD_ARGUMENTS", errors: ['mode must be "decide" (execute is not enabled)'] };
  }
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
  const { candidates, errors: candErrors } = buildCandidates(args.candidates);
  errors.push(...candErrors);
  if (errors.length) return { state: "BAD_ARGUMENTS", errors };

  const taskSha = taskShaIn ?? (await sha256Hex(taskText as string));
  const policy = callerPolicy(args.policy);
  const ctx: PolicyContext = { confirm: policy.confirm, caller_wallet: policy.caller_wallet, data_class };

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
  const decision = decide(candidates, policy, ctx, objective, board.axis);
  const readAt = (deps.now ?? (() => new Date()))().toISOString();
  const uuid = (deps.uuid ?? (() => crypto.randomUUID()))();
  const record = await buildRouteRecord({
    task: { sha256: taskSha, data_class, needs_write: args.needs_write === true, content_retained: false },
    policy,
    objective,
    candidates,
    decision,
    board: {
      state: board.state === "LIVE" && !board.axis ? "AXIS_NOT_ON_BOARD" : board.state,
      source: board.source,
      board_separation: board.axis?.separation ?? null,
    },
    locator: `urn:gspc:route:${uuid}`,
    readAt,
  });
  return {
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
}

/** The one-line summary MCP clients show first. Written only from router-controlled words. */
export function routeSummary(r: RouteResult): string {
  if (r.state === "NOT_ENABLED") return "NOT_ENABLED (501): execute mode is off; GSPC Route is decide-only.";
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
