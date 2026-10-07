/**
 * GET /api/usage — daily counts of what callers did at the agent doors (MCP, A2A, chat, AG-UI).
 *
 * Aggregate only: names and counts, never who. See functions/_lib/usage.ts for what is written
 * and what never is. Our own monitors, canaries and smoke scripts are excluded BY NAME and the
 * list is returned here as `self_excluded`.
 *
 * Grammar: kind "measured" — each count is the number of rows actually written for that day.
 * It is a LOWER BOUND: a write is best-effort and a failed write is not retried, and traffic of
 * ours that does not identify itself is counted as external. Usage is not revenue, a download
 * or a listing; this endpoint adds its counts to nothing.
 */
import { SELF_TOOLS, USAGE_DAY_NOTES, USAGE_DIMS, USAGE_LABEL_NOTES, USAGE_RETENTION_DAYS, USAGE_SCHEMA, countDay, utcDay, type DayCounts } from "../_lib/usage";
import { headFromGet } from "./_head";
import { CLIENT_CLASSES, CLIENT_CLASS_RULE } from "../_lib/usage";

type KV = Parameters<typeof countDay>[0];
interface Env { SOV_ARENA_STATE?: KV }

const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, OPTIONS" };
const MAX_DAYS = 14;
const CACHE_SECONDS = 300;
/** The first UTC day the counter existed. Days before it are not "0"; they were never counted. */
export const COUNTING_SINCE = "2026-09-29";
/**
 * The first UTC day a row carried its client class, as KV metadata on the row (functions/_lib/usage.ts);
 * the row's key and value are unchanged. Rows written before it have no metadata: "unrecorded".
 */
export const CLIENT_CLASS_SINCE = "2026-10-07";

export const onRequestOptions: PagesFunction = async () => new Response(null, { status: 204, headers: CORS });

export async function buildUsage(kv: KV | undefined, days: number, now: Date = new Date()): Promise<Record<string, unknown>> {
  const base = {
    schema: USAGE_SCHEMA,
    kind: "measured",
    as_of: now.toISOString(),
    what: "Daily counts of calls at the agent doors: MCP initialize clientInfo.name (mcp_client), MCP tools/call names (mcp_tool), A2A outcomes (a2a_outcome), /api/chat reply states (chat_state), AG-UI run states (agui_state) and the body shape of a request a door refused as unreadable (reject_shape: content class and allowlisted key names, never a value).",
    privacy: "No IP address, user-agent string, message text, arguments or identifier is stored. Rows expire after " + USAGE_RETENTION_DAYS + " days.",
    completeness: "LOWER_BOUND: each count is the rows actually written; a failed best-effort write is not retried, and our own traffic that does not identify itself is counted as external.",
    self_excluded: SELF_TOOLS.map((t) => ({ name: t.name, kind: t.kind, runs_on: t.runs_on, match: t.ua_token ? `User-Agent token ${t.ua_token}` : null })),
    self_excluded_rule: "A request is ours, and is not written, only when it sends header x-csoai-self with a name listed here or a User-Agent carrying a listed token. Nothing is excluded by guess (no IP, timing or heuristic).",
    not: "Not revenue, not downloads, not listings, not adoption. These counts are added to no other figure.",
    dims: [...USAGE_DIMS],
    label_notes: USAGE_LABEL_NOTES,
    day_notes: USAGE_DAY_NOTES,
  };
  if (!kv) {
    return { ...base, kind: "unmeasured", state: "UNMEASURED", reason: "the SOV_ARENA_STATE binding is not available to this deployment", days: [] };
  }
  // TODAY IS NOT A CLOSED DAY (7 Oct 2026, sell organ SG-13). `complete: true` on today's row meant
  // only that the KV listing finished; read as "the day is complete" it made a partial day look like
  // a whole one. Every row now says day_closed: false while its UTC day is still running.
  const today = utcDay(now);
  const out: Array<{
    day: string;
    state: string;
    complete: boolean;
    day_closed: boolean;
    rows: number | null;
    counts: DayCounts | null;
    client_class: DayCounts | null;
    reason?: string;
  }> = [];
  for (let i = 0; i < days; i++) {
    const day = utcDay(new Date(now.getTime() - i * 86_400_000));
    if (day < COUNTING_SINCE) break;
    const day_closed = day < today;
    try {
      const r = await countDay(kv, day);
      out.push({ day, state: r.complete ? "MEASURED" : "PARTIAL", complete: r.complete, day_closed, rows: r.rows, counts: r.counts, client_class: r.client_class });
    } catch (e) {
      // A failed read is UNMEASURED with its reason, never 0.
      out.push({ day, state: "UNMEASURED", complete: false, day_closed, rows: null, counts: null, client_class: null, reason: `list failed: ${e instanceof Error ? e.message : String(e)}` });
    }
  }
  return {
    ...base,
    state: "MEASURED",
    counting_since: COUNTING_SINCE,
    row_fields: {
      complete: "LIST completeness: true when the KV listing for that day reached its end. It does not mean the day is over.",
      day_closed: "true once the UTC day has ended. Today's row is day_closed false: its counts are still growing and are not a day's total.",
      client_class: `Per dimension, the same rows counted by the kind of client the request declared in its User-Agent (${CLIENT_CLASSES.join(", ")}). "unrecorded" = rows written before ${CLIENT_CLASS_SINCE}, when no class was kept.`,
    },
    client_class_rule: CLIENT_CLASS_RULE.map((r) => ({ class: r.cls, when: r.when })),
    client_class_note: "A class is what the caller's User-Agent declared, never who the caller is; the header itself is not stored. Rows of our own listed tools are not written at all (self_excluded).",
    days: out,
  };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  const url = new URL(request.url);
  const asked = Number(url.searchParams.get("days") ?? "7");
  const days = Number.isInteger(asked) && asked >= 1 ? Math.min(asked, MAX_DAYS) : 7;
  const cacheKey = new Request(`${url.origin}/api/usage?days=${days}`);
  const cache = (globalThis as { caches?: { default?: Cache } }).caches?.default;
  if (cache) {
    const hit = await cache.match(cacheKey).catch(() => undefined);
    if (hit) return hit;
  }
  const body = await buildUsage(env?.SOV_ARENA_STATE, days);
  const res = new Response(JSON.stringify(body, null, 2), {
    headers: { ...CORS, "content-type": "application/json; charset=utf-8", "cache-control": `public, max-age=${CACHE_SECONDS}` },
  });
  if (cache) waitUntil(cache.put(cacheKey, res.clone()).catch(() => undefined));
  return res;
};

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
