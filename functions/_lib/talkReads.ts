/**
 * talkReads — two read-only answers the talk router gives that are NOT /mcp tools: the corrections
 * ledger summary and the Claim Maintenance register summary.
 *
 * ORIGIN. The grounded-claims fix for corrections and claim-maintenance questions was written as
 * uncommitted edits in ~/clawd/wt-talk-claims-grounded-20260930 (talkRouter.ts, talkRouter.test.ts,
 * mcp/_handlers.ts, mcp/gspc-tools.json). It is applied here with one change: the two reads stay
 * router-internal instead of joining the public /mcp fleet, because the fleet is locked by name
 * (functions/mcp/tool-fleet.lock.json, K-1: 19 tools) and every registry listing and discovery file
 * renders from that lock. Growing the fleet is its own change with its own discovery re-render.
 *
 * Both read served JSON from this origin and quote fields. Neither re-verifies a signature (the
 * corrections summary says signature_verification: NOT_RUN), remeasures, corrects or publishes.
 */
import { fetchOriginJson, unreachablePayload } from "../mcp/_board";

type Json = Record<string, unknown>;

export const ROUTER_READ_TOOLS: ReadonlySet<string> = new Set(["corrections_summary", "claim_maintenance_register"]);

export async function correctionsSummary(origin: string, args: Json): Promise<Json> {
  const path = "/api/corrections";
  let d: Json;
  try {
    d = (await fetchOriginJson(origin, path)) as Json;
  } catch (e) {
    return unreachablePayload(origin, path, e) as Json;
  }
  const rows = Array.isArray(d.corrections) ? (d.corrections as Json[]) : [];
  const asked = Number.isInteger(args.limit) ? Number(args.limit) : 5;
  const limit = Math.max(1, Math.min(20, asked));
  const recent = rows
    .slice(-limit)
    .reverse()
    .map((row) => ({
      id: row.id ?? null,
      date: row.date ?? null,
      detected_at: row.detected_at ?? null,
      published_at: row.published_at ?? null,
      status: row.status ?? null,
      reached_the_public: row.reached_the_public ?? null,
      what_was_wrong: row.what_was_wrong ?? null,
      what_changed: row.what_changed ?? null,
    }));
  return {
    state: "LIVE",
    source: `${origin}${path}`,
    schema: d.schema ?? null,
    count: rows.length,
    signature_state_reported: d.signature_state ?? null,
    signature_verification: "NOT_RUN",
    correction_latency: d.correction_latency ?? null,
    recent,
    note: "Source-maintained correction rows. A recorded correction is not proof that a fix is deployed, and the source-reported signature state is not independently reverified by this tool.",
  };
}

export async function claimMaintenanceRegister(origin: string): Promise<Json> {
  const path = "/api/claims/register";
  let d: Json;
  try {
    d = (await fetchOriginJson(origin, path)) as Json;
  } catch (e) {
    return unreachablePayload(origin, path, e) as Json;
  }
  return {
    state: "LIVE",
    source: `${origin}${path}`,
    schema: d.schema ?? null,
    as_of: d.as_of ?? null,
    totals: d.totals ?? null,
    state_definitions: d.states ?? null,
    subject_count: Array.isArray(d.subjects) ? d.subjects.length : null,
    registry_count: Array.isArray(d.registries) ? d.registries.length : null,
    right_of_reply: d.right_of_reply ?? null,
    does_not_prove: d.does_not_prove ?? null,
    note: "Register metadata and maintained-claim state only. Reading this view performs no remeasurement, correction, signing or publication.",
  };
}

/** The same result shape callTool returns for an /mcp tool, so the router renders both alike. */
export async function routerReadResult(name: string, args: Json, origin: string) {
  const payload = name === "corrections_summary" ? await correctionsSummary(origin, args) : await claimMaintenanceRegister(origin);
  const summary =
    name === "corrections_summary"
      ? `${payload.state ?? "?"} — ${payload.count ?? "?"} correction records; signature state is source-reported and not reverified here.`
      : `${payload.state ?? "?"} — Claim Maintenance register${payload.as_of ? ` as of ${payload.as_of}` : ""}.`;
  return {
    content: [{ type: "text" as const, text: summary }],
    structuredContent: payload,
    isError: payload.state !== "LIVE",
  };
}
