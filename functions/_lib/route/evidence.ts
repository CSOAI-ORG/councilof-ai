/**
 * GSPC Route: the route record, csoai.route-evidence/0.1 — a PROFILE of csoai.evidence-event/0.1
 * (packages/evidence-fabric), not a new signing grammar. It absorbs csoai.route-receipt/0.1
 * (packages/otel/route_receipt.py) as observed.execution.
 *
 * event_id = "sha256:" + sha256(RFC 8785 JCS of the record without event_id, signature, anchors),
 * byte-identical to packages/evidence-fabric/event.py compute_event_id.
 *
 * Decide-only records are UNSIGNED previews: signature null, state UNMEASURED, value null. Execution
 * receipts (execute.ts) are signed under #route-attestation-1 (sign.ts); the board key never signs route volume.
 * No prompt or response bytes are stored: the task is carried as its sha256 only.
 */
import type { CallerPolicy } from "./policy";
import { CEDAR_SCHEMA, FLOOR_CEDAR, renderCedar } from "./policy";
import type { Decision } from "./decide";
import type { CensusRead } from "./census";
import type { Candidate, Objective, Task } from "./types";
import type { DiscoveryRead } from "./discovery";

export const DISCOVERY_LIMIT =
  "Discovered candidates are LISTED by a directory, nothing more. The directory's own trust, verification, scan and usage " +
  "metadata was read by no rule; a discovered candidate is measured only where our signed census has its endpoint.";


export const EVENT_SCHEMA = "csoai.evidence-event/0.1";
export const ROUTE_PROFILE = "csoai.route-evidence/0.1";
export const ROUTE_METHOD_VERSION = "0.1.0";

/** RFC 8785 JCS. JSON.stringify already writes strings and numbers the way JCS requires. */
export function jcs(v: unknown): string {
  if (v === null || typeof v === "boolean" || typeof v === "string") return JSON.stringify(v);
  if (typeof v === "number") {
    if (!Number.isFinite(v)) throw new Error("non-finite number cannot be canonicalised");
    return JSON.stringify(v);
  }
  if (Array.isArray(v)) return `[${v.map(jcs).join(",")}]`;
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    // JCS orders property names by UTF-16 code units: JavaScript's default sort.
    const keys = Object.keys(o).filter((k) => o[k] !== undefined).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${jcs(o[k])}`).join(",")}}`;
  }
  throw new Error(`not JSON: ${typeof v}`);
}

export async function sha256Hex(s: string | Uint8Array): Promise<string> {
  const bytes = typeof s === "string" ? new TextEncoder().encode(s) : s;
  const d = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const ID_EXCLUDE = new Set(["event_id", "signature", "anchors"]);

export async function computeEventId(ev: Record<string, unknown>): Promise<string> {
  const body: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(ev)) if (!ID_EXCLUDE.has(k)) body[k] = v;
  return `sha256:${await sha256Hex(jcs(body))}`;
}

export const ROUTE_LIMITS = [
  "Route decision only: it applies the caller's policy to published measurements; it is not a quality verdict on the chosen candidate.",
  "Decide-only preview: nothing was executed, so provider and model served were not observed; state is UNMEASURED and value is null.",
  "Unsigned: a decide-only preview carries no signature and makes no signed statement; only execution receipts (POST /api/route/execute) are signed, under did:web:csoai.org#route-attestation-1.",
  "Only the board's top two rows per axis carry numbers here; every other candidate is UNTESTED on the axis, never imputed.",
  "The task text is carried as its sha256 only; no prompt or response bytes are stored.",
];

/** The census line of the limits, written from the read state (census.ts), never a fixed claim. */
export function censusLimit(c: CensusRead | undefined): string {
  if (!c || c.state === "NOT_WIRED")
    return "Effect-binding census was not read for this decision (no census source wired): every candidate carries UNMEASURED, so the floor's DIVERGENT rule could not fire.";
  if (c.state !== "LIVE")
    return `Effect-binding census ${c.source} was ${c.state}: every candidate carries UNMEASURED, so the floor's DIVERGENT rule could not fire. Nothing cached was substituted.`;
  return (
    `Effect-binding census read from ${c.source} (signed server-probe run as of ${c.run_as_of}, artifact sha256 ${c.artifact_sha256}): ` +
    `DOES_NOT_BIND is DIVERGENT and forbidden by the floor, BINDS is CONSISTENT, every other outcome and every endpoint the run did not probe is UNMEASURED. ` +
    `One probe of one public endpoint on one day; P2 sees the server boundary, not its backend.`
  );
}

export type RecordInput = {
  task: Task;
  policy: CallerPolicy;
  objective: Objective;
  candidates: Candidate[];
  decision: Decision;
  board: { state: string; source: string | null; board_separation: string | null };
  census?: CensusRead;
  discovery?: DiscoveryRead;
  locator: string;
  readAt: string;
  declaredBy?: string;
};

export async function buildRouteRecord(inp: RecordInput): Promise<Record<string, unknown>> {
  const callerCedar = renderCedar(inp.policy.rules);
  const [policySha, floorSha, schemaSha, candSha] = await Promise.all([
    sha256Hex(callerCedar),
    sha256Hex(FLOOR_CEDAR),
    sha256Hex(CEDAR_SCHEMA),
    sha256Hex(jcs(inp.candidates)),
  ]);
  const d = inp.decision;
  const ev: Record<string, unknown> = {
    schema: EVENT_SCHEMA,
    profile: ROUTE_PROFILE,
    subject: { kind: "route", locator: inp.locator, declared_by: inp.declaredBy ?? "caller:anon" },
    claim: {
      text: `Route chosen for task sha256:${inp.task.sha256} under caller policy sha256:${policySha}`,
      source_url: null,
      source_sha256: null,
      read_at: inp.readAt,
    },
    method: { id: "gspc-route", version: ROUTE_METHOD_VERSION, code_sha256: null, holder: "csoai" },
    declared: {
      task: inp.task,
      policy: {
        caller_sha256: policySha,
        floor_sha256: floorSha,
        cedar_schema_sha256: schemaSha,
        presets: inp.policy.presets,
        rules: inp.policy.rules.map((r) => r.id),
        uncheckable: inp.policy.uncheckable,
        confirm_destructive: inp.policy.confirm,
        caller_wallet: inp.policy.caller_wallet,
        allow_divergent_effect_binding: inp.policy.allow_divergent_effect_binding,
      },
      objective: inp.objective,
      candidates_sha256: candSha,
    },
    observed: {
      considered: d.considered.map((x) => ({
        id: x.candidate.id,
        kind: x.candidate.kind,
        source: x.candidate.source,
        permit: x.verdict.permit,
        forbid_policy: x.verdict.forbid_policy,
        forbids_matched: x.verdict.forbids_matched,
        uncheckable: x.candidate.uncheckable,
        ignored_fields: x.candidate.ignored_fields,
        measurements: x.measurement ? [x.measurement] : [],
        census: x.candidate.census,
        ...(x.candidate.directory
          ? { directory: { listing: x.candidate.directory.listing, identifier: x.candidate.directory.identifier, record_sha256: x.candidate.directory.record_sha256, listing_state: x.candidate.directory.listing_state, declared_by: x.candidate.directory.declared_by } }
          : {}),
      })),
      permitted: d.permitted,
      chosen: d.chosen,
      separation: d.separation,
      label: d.label,
      board: inp.board,
      ...(inp.census ? { census: inp.census } : {}),
      ...(inp.discovery ? { discovery: inp.discovery } : {}),
      execution: {
        mode: "decide_only",
        status: "n/a",
        provider_observed: null,
        model_observed: null,
        latency_ms: null,
        usage: null,
        cost_declared: null,
        receipt_schema: "csoai.route-receipt/0.1",
        receipt: null,
      },
      heal: [],
      payment: { x402: "none", tx: null, payer_is_self: false },
    },
    state: "UNMEASURED",
    value: null,
    negative_control: { id: null, expected: null, got: "NOT_RUN" },
    limits: [...ROUTE_LIMITS.slice(0, 4), censusLimit(inp.census), ...ROUTE_LIMITS.slice(4), ...(inp.discovery ? [DISCOVERY_LIMIT] : [])],
    supersedes: null,
    signature: null,
    anchors: { ots: "none", rekor: { log_index: null, uuid: null } },
    maintenance: null,
  };
  ev.event_id = await computeEventId(ev);
  return ev;
}

/** The Cedar actually evaluated, for callers who want to re-run it with `cedar authorize`. */
export function policyTexts(policy: CallerPolicy) {
  return { schema: CEDAR_SCHEMA, floor: FLOOR_CEDAR, caller: renderCedar(policy.rules) };
}
