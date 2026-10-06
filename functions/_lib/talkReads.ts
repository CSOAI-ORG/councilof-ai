/**
 * talkReads — three read-only answers the talk router gives that are NOT /mcp tools: the corrections
 * ledger summary, the Claim Maintenance register summary and (6 Oct 2026) one model's row in the list
 * of models measured.
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

export const ROUTER_READ_TOOLS: ReadonlySet<string> = new Set(["corrections_summary", "claim_maintenance_register", "model_lookup"]);

/** An ISO date or datetime string, else null ("UNRECORDED" is a recorded absence, not a date). */
function isoOf(v: unknown): string | null {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) ? v : null;
}

/**
 * Corrections, newest first. GET /api/corrections lists them newest-first but not strictly (a few
 * older rows sit at the end in ascending order), so the old `rows.slice(-limit).reverse()` returned
 * the five OLDEST corrections as "recent". Sorted here by published_at when it is a recorded date,
 * else the entry date, descending; rows with the same key keep the source's order (stable sort).
 */
export function newestFirst(rows: Json[]): Json[] {
  const key = (row: Json) => isoOf(row.published_at) ?? isoOf(row.date) ?? "";
  return rows
    .map((row, i) => ({ row, i, k: key(row) }))
    .sort((a, b) => (a.k === b.k ? a.i - b.i : a.k < b.k ? 1 : -1))
    .map(({ row }) => row);
}

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
  const recent = newestFirst(rows)
    .slice(0, limit)
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

/** The same normalisation Get results uses (client/src/lib/resultCard.ts matchModels). */
function normModel(s: string): string {
  return s.toLowerCase().replace(/^(ollama:|t4:|hf:)/, "").replace(/:latest$/, "").replace(/[\s_]+/g, "-");
}

/**
 * model_lookup — what is published about ONE named model, read from /interop/models-measured.json
 * (built from the signed cards at deploy time). Tools audit retest, 6 Oct 2026: "qwen3:8b" and
 * "Is gpt-4o safe?" got "I could not match that question to a tool". A count of signed results is
 * not a score and says nothing about safety; NOT_MEASURED is not a finding either way.
 */
export async function modelLookup(origin: string, args: Json): Promise<Json> {
  const path = "/interop/models-measured.json";
  const typed = typeof args.model === "string" ? args.model.trim().slice(0, 120) : "";
  let d: Json;
  try {
    d = (await fetchOriginJson(origin, path)) as Json;
  } catch (e) {
    return unreachablePayload(origin, path, e) as Json;
  }
  const rows = (Array.isArray(d.models) ? d.models : []) as Json[];
  const q = normModel(typed);
  const id = (r: Json) => (typeof r.id === "string" ? r.id : "");
  const exact = rows.filter((r) => normModel(id(r)) === q);
  const partial = q.length >= 3 ? rows.filter((r) => normModel(id(r)) !== q && normModel(id(r)).includes(q)) : [];
  const hits = [...exact, ...partial].slice(0, 5);
  const top = hits[0];
  const note =
    "A count of signed results on file, not a score and not a safety verdict. The leaderboard compares a fixed set of models, and a tie stays a tie.";
  if (!top)
    return {
      state: "NOT_MEASURED",
      source: `${origin}${path}`,
      model: typed,
      cards: 0,
      note: "No published result names this model. That is not a finding either way; a fresh run can be requested.",
    };
  return {
    state: "MEASURED",
    source: `${origin}${path}`,
    model: id(top),
    cards: typeof top.cards === "number" ? top.cards : null,
    axes: typeof top.axes === "number" ? top.axes : null,
    whose: top.kind === "own" ? "ours (listed apart, never ranked)" : "third party",
    other_matches: hits.slice(1).map(id),
    note,
  };
}

/** The same result shape callTool returns for an /mcp tool, so the router renders both alike. */
export async function routerReadResult(name: string, args: Json, origin: string) {
  const payload =
    name === "corrections_summary"
      ? await correctionsSummary(origin, args)
      : name === "model_lookup"
        ? await modelLookup(origin, args)
        : await claimMaintenanceRegister(origin);
  const summary =
    name === "corrections_summary"
      ? `${payload.state ?? "?"} — ${payload.count ?? "?"} correction records; signature state is source-reported and not reverified here.`
      : name === "model_lookup"
        ? payload.state === "MEASURED"
          ? `MEASURED — ${payload.model} has ${payload.cards ?? "?"} signed results on file. A count, not a score.`
          : `${payload.state ?? "?"} — nothing published names ${String(payload.model ?? args.model ?? "this model")} yet.`
        : `${payload.state ?? "?"} — Claim Maintenance register${payload.as_of ? ` as of ${payload.as_of}` : ""}.`;
  const ok = name === "model_lookup" ? payload.state === "MEASURED" || payload.state === "NOT_MEASURED" : payload.state === "LIVE";
  return {
    content: [{ type: "text" as const, text: summary }],
    structuredContent: payload,
    isError: !ok,
  };
}
