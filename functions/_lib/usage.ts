/**
 * usage — a privacy-preserving, aggregate-only daily tally of who USES the agent doors
 * (lane growth-gaps-20260929, gap A2: "USED" was UNMEASURED because nothing recorded a caller).
 *
 * WHAT IS COUNTED (per UTC day, one row per event, nothing else):
 *   mcp_client  — the `clientInfo.name` an MCP client declares in `initialize` (POST /mcp, /mcp/free)
 *   mcp_tool    — the tool name of each `tools/call` (only names on the /mcp tools/list; anything
 *                 else is counted as "not-a-tool")
 *   a2a_outcome — POST /api/a2a: "ok" or "error<JSON-RPC code>", prefixed by the version the
 *                 REQUEST declared: "v1.0_" (A2A-Version 1.0, patch ignored), "v0.3_" (served by
 *                 the 0.3 shim), "unversioned_" (no header, not served as 0.3: not JSON-RPC, or
 *                 not a 0.3 method) or "vother_" (any other header value, including a 0.x header
 *                 on a request the 0.3 shim did not serve). Until the deploy that shipped lane
 *                 chat-door-20261007 (not before 2026-10-07) the prefix was read off the RESPONSE
 *                 header, so every request not served as 0.3 - including bodies that were not
 *                 JSON-RPC at all - was labelled "v1.0_".
 *   chat_state  — POST /api/chat: the reply's `state` (grounded / unknown / needs_input / ...);
 *                 "error" is any HTTP status >= 400, including a handler that threw (counted
 *                 from the deploy of lane chat-door-20261007; before it a thrown handler wrote
 *                 nothing).
 *   agui_state  — POST /api/agui/run: grounded / unknown / needs_input / confirm_required / error
 *   reject_shape — a request a door refused because it could not be read as a question or a
 *                 JSON-RPC request (POST /api/chat HTTP 400; POST /api/a2a -32600 / -32700):
 *                 "<door>.<content class>.<top-level key NAMES>", keys from a fixed allowlist in
 *                 functions/_lib/askInput.ts, anything else "other". Never a value. Written from
 *                 the deploy of lane chat-door-20261007; the name is not cut (USAGE_NAME_MAX).
 *
 * WHAT IS NEVER STORED: no IP address, no user-agent string, no message text, no arguments, no
 * cookie, no identifier of any kind. A stored key is `usage:v1:<day>:<dim>:<name>:<random>`; the
 * random suffix only keeps two events from overwriting each other and links to nothing.
 *
 * SELF-EXCLUSION IS BY NAME, NEVER BY GUESS. A request is ours — and is not written at all — only
 * when it carries the header `x-csoai-self: <name>` with a name in SELF_TOOLS, or a User-Agent
 * whose product token is one of SELF_TOOLS' declared tokens. The list is published verbatim on
 * GET /api/usage as `self_excluded`. Anything not on it is counted, including traffic of ours that
 * does not identify itself (the page says so).
 *
 * Usage is not revenue and a listing is not adoption: this module writes to SOV_ARENA_STATE, never
 * to REVENUE_KV, and /api/usage never adds these counts to anything.
 */

export const USAGE_SCHEMA = "csoai.usage/0.1";
export const USAGE_PREFIX = "usage:v1:";
/** Rows expire on their own; nothing is kept past this. */
export const USAGE_RETENTION_DAYS = 400;

export const USAGE_DIMS = ["mcp_client", "mcp_tool", "a2a_outcome", "chat_state", "agui_state", "reject_shape"] as const;
export type UsageDim = (typeof USAGE_DIMS)[number];

export type SelfTool = {
  name: string;
  kind: "monitor" | "canary" | "smoke" | "audit" | "internal-job";
  /** Where it runs, so a reader can check the claim. */
  runs_on: string;
  /** A User-Agent product token (case-insensitive, matched as a whole token before "/" or end). */
  ua_token?: string;
};

/**
 * Our own traffic, by name. Every entry is a tool that already sends this token (read from its
 * source on 29 Sep 2026) or was tagged in the same change that introduced this list.
 * The header `x-csoai-self: <name>` also excludes a request when <name> is listed here.
 */
export const SELF_TOOLS: readonly SelfTool[] = [
  { name: "harness-x-check", kind: "internal-job", runs_on: "scripts/harness-x/check.mjs", ua_token: "harness-x-check" },
  { name: "outward-gate", kind: "internal-job", runs_on: "scripts/outward-gate/outward_gate.py", ua_token: "CSOAI-outward-gate" },
  { name: "presence-loop", kind: "monitor", runs_on: "oracle-micro-2 ~/lanes/presence/presence_loop.py (every minute)", ua_token: "csoai-presence" },
  { name: "prod-canary", kind: "canary", runs_on: "oracle-micro-2 ~/lanes/ops-guard-20260928/bin/prod-canary.py (every 10 min)", ua_token: "CSOAI-ops-canary" },
  { name: "audit-watchdog", kind: "audit", runs_on: "oracle-micro-2 ~/lanes/automation-runpod-20260928/watchdog-audit (twice hourly)", ua_token: "CSOAI-audit-watchdog" },
  { name: "smoke-talk", kind: "smoke", runs_on: "scripts/smoke-talk.sh (post-deploy smoke)", ua_token: "csoai-smoke-talk" },
  { name: "fleet-lock-test", kind: "internal-job", runs_on: "functions/mcp/tool-fleet.lock.test.ts (live probe)", ua_token: "csoai-fleet-lock" },
  { name: "fresh-capsule", kind: "internal-job", runs_on: "functions/api/measurement/fresh-capsule.ts (server-side MCP probe)", ua_token: "csoai-fresh-capsule" },
  // Its User-Agent has carried this token since the script was written (22 Sep 2026); it was not
  // listed, so every run was counted as external use of /mcp and /api/a2a.
  { name: "axis-doors-probe", kind: "audit", runs_on: "scripts/axis-doors-probe.mjs (run by hand)", ua_token: "csoai-axis-doors-probe" },
];

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const TOKEN_RES = SELF_TOOLS.filter((t) => t.ua_token).map((t) => ({
  name: t.name,
  re: new RegExp(`(^|[\\s;(,])${esc(t.ua_token as string)}(\\/|[\\s;),]|$)`, "i"),
}));
const SELF_NAMES = new Set(SELF_TOOLS.map((t) => t.name));

/** The listed self tool this request identifies as, else null. Never inferred from IP or timing. */
export function selfToolOf(headers: Headers): string | null {
  const declared = (headers.get("x-csoai-self") ?? "").trim().toLowerCase();
  if (declared && SELF_NAMES.has(declared)) return declared;
  const ua = headers.get("user-agent") ?? "";
  if (!ua) return null;
  for (const t of TOKEN_RES) if (t.re.test(ua)) return t.name;
  return null;
}

/** A bounded, key-safe name. Letters, digits, "." "_" "-" only; everything else becomes "_". */
export function cleanName(v: unknown, max = 48): string {
  if (typeof v !== "string") return "none";
  const s = v.trim().replace(/\s+/g, "-").replace(/[^A-Za-z0-9._-]/g, "_").slice(0, max);
  return s && /[A-Za-z0-9]/.test(s) ? s : "none";
}

/**
 * The longest name a dimension stores. cleanName cuts at 48 by default, which cut reject_shape
 * labels mid-key (an AG-UI body refused at /api/a2a became "a2a.-32600.json.forwardedProps_messages_runId_th").
 * A reject_shape label is bounded by construction (askInput.ts: four allowlisted keys plus
 * "other"); usage.test.ts checks the worst case fits under this cap, so no label is cut.
 */
export const USAGE_NAME_MAX: Readonly<Record<UsageDim, number>> = {
  mcp_client: 48,
  mcp_tool: 48,
  a2a_outcome: 48,
  chat_state: 48,
  agui_state: 48,
  reject_shape: 96,
};

export const utcDay = (d: Date = new Date()): string => d.toISOString().slice(0, 10);

export function usageKey(day: string, dim: UsageDim, name: string, rand: string): string {
  return `${USAGE_PREFIX}${day}:${dim}:${name}:${rand}`;
}

/** Parse a stored key back into its dimensions; null for anything malformed. */
export function parseUsageKey(key: string): { day: string; dim: UsageDim; name: string } | null {
  if (!key.startsWith(USAGE_PREFIX)) return null;
  const rest = key.slice(USAGE_PREFIX.length).split(":");
  if (rest.length !== 4) return null;
  const [day, dim, name] = rest;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !(USAGE_DIMS as readonly string[]).includes(dim)) return null;
  return { day, dim: dim as UsageDim, name };
}

type KV = {
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
  list(opts: { prefix: string; cursor?: string; limit?: number }): Promise<{ keys: { name: string }[]; list_complete: boolean; cursor?: string }>;
};

export type UsageCtx = {
  request: Request;
  env?: unknown;
  waitUntil?: (p: Promise<unknown>) => void;
};

function kvOf(env: unknown): KV | null {
  const kv = (env as { SOV_ARENA_STATE?: KV } | undefined)?.SOV_ARENA_STATE;
  return kv && typeof kv.put === "function" ? kv : null;
}

/**
 * Record one event, best-effort and off the response path. A self request, a missing binding or a
 * failed write records nothing; the response is never delayed or changed by this.
 * Returns the key that would be written (or null when nothing is written) so tests can read it.
 */
export function recordUsage(ctx: UsageCtx, dim: UsageDim, rawName: string): string | null {
  try {
    if (selfToolOf(ctx.request.headers)) return null;
    if (dim === "mcp_client" && SELF_NAMES.has(cleanName(rawName).toLowerCase())) return null;
    const kv = kvOf(ctx.env);
    if (!kv) return null;
    const key = usageKey(utcDay(), dim, cleanName(rawName, USAGE_NAME_MAX[dim]), crypto.randomUUID().slice(0, 8));
    const p = kv.put(key, "1", { expirationTtl: USAGE_RETENTION_DAYS * 86_400 }).catch(() => undefined);
    if (ctx.waitUntil) ctx.waitUntil(p);
    return key;
  } catch {
    return null;
  }
}

/**
 * When a label change took effect. A change takes effect when it is DEPLOYED, not on the day it
 * was written, and this code cannot know its own deploy time, so a note never names a calendar
 * day as its start. The deploy day itself carries both labellings.
 */
export const LABEL_CHANGE_EFFECTIVE =
  "From the production deploy that shipped lane chat-door-20261007 (not before 2026-10-07; the deploy time is not recorded here). The day of that deploy carries both labellings: its rows written before the deploy use the old labels and its rows after it use the new ones. Every earlier day uses the old labels only.";

/**
 * Label changes a reader needs to compare days across a change. Published verbatim on GET
 * /api/usage, so a series that moved from one label to another is never read as a drop.
 */
export const USAGE_LABEL_NOTES: readonly { effective: string; not_before: string; dim: UsageDim; note: string }[] = [
  {
    effective: LABEL_CHANGE_EFFECTIVE,
    not_before: "2026-10-07",
    dim: "a2a_outcome",
    note: "The prefix names the version the request declared: v1.0_ (A2A-Version 1.0, patch ignored), v0.3_ (served by the 0.3 shim), unversioned_ (no header, not served as 0.3) or vother_ (any other header value, including a 0.x header on a request the 0.3 shim did not serve). Before the change every request not served by the 0.3 shim was prefixed v1.0_, including bodies that were not JSON-RPC at all (-32600) and requests with no A2A-Version header (-32009). An A2A-Version with a patch number (1.0.0, 1.0.1) is served as 1.0, as A2A v1.0 section 3.6 requires, instead of -32009.",
  },
  {
    effective: LABEL_CHANGE_EFFECTIVE,
    not_before: "2026-10-07",
    dim: "a2a_outcome",
    note: "With no A2A-Version header (0.3), a method name that is neither A2A 0.3 nor A2A 1.0 (for example the MCP methods initialize or tools/list) answers -32601 method not found instead of -32009 version not supported. A 1.0 method name with no header still answers -32009.",
  },
  {
    effective: LABEL_CHANGE_EFFECTIVE,
    not_before: "2026-10-07",
    dim: "chat_state",
    note: "POST /api/chat reads the question from more body shapes (question, query, q, input, text, an A2A message, OpenAI content parts, a text/plain or form body). error still counts every HTTP status >= 400, and also a handler that threw, which before the change wrote no row. Whether the change lowers the production error count is UNMEASURED: the shapes of the refused bodies were never recorded before reject_shape, and the lane's reproduction set (44 questions in body shapes the lane chose) is not the production population.",
  },
  {
    effective: LABEL_CHANGE_EFFECTIVE,
    not_before: "2026-10-07",
    dim: "reject_shape",
    note: "New dimension. Before the change the shape of a refused request was not recorded anywhere: UNMEASURED, not zero.",
  },
];

/**
 * Days whose counts hold traffic of ours that did not identify itself, and so cannot be told apart
 * from external rows. The rows are not removed (nothing identifies them); the day is flagged so it
 * is never used as a baseline. Published verbatim on GET /api/usage as day_notes.
 */
export const USAGE_DAY_NOTES: readonly { day: string; dims: readonly UsageDim[]; note: string }[] = [
  {
    day: "2026-10-07",
    dims: ["chat_state", "a2a_outcome"],
    note: "Not a baseline. Lane chat-door-20261007 sent a 58-request reproduction to production before 04:00Z without the x-csoai-self header, so it was counted as external: its replies were 30 error, 9 grounded and 7 unknown on /api/chat, and on /api/a2a 8 errors (5 x -32009, 3 x -32600) of 12, all under the old labels. Other chat errors written between 04:00Z and 04:36Z that day have no matching A2A -32600 and are unattributed; they may also be our own unidentified probes. A reviewer's replay of the same 58 requests sent x-csoai-self and was not counted.",
  },
];

export type DayCounts = Record<UsageDim, Record<string, number>>;

const emptyDay = (): DayCounts =>
  Object.fromEntries(USAGE_DIMS.map((d) => [d, {} as Record<string, number>])) as DayCounts;

/** Count the rows under one day's prefix. `pages` caps the list calls; the result says if it was cut. */
export async function countDay(kv: KV, day: string, maxPages = 20): Promise<{ counts: DayCounts; complete: boolean; rows: number }> {
  const counts = emptyDay();
  let cursor: string | undefined;
  let rows = 0;
  for (let i = 0; i < maxPages; i++) {
    const page = await kv.list({ prefix: `${USAGE_PREFIX}${day}:`, cursor, limit: 1000 });
    for (const k of page.keys) {
      const p = parseUsageKey(k.name);
      if (!p || p.day !== day) continue;
      counts[p.dim][p.name] = (counts[p.dim][p.name] ?? 0) + 1;
      rows++;
    }
    if (page.list_complete || !page.cursor) return { counts, complete: true, rows };
    cursor = page.cursor;
  }
  return { counts, complete: false, rows };
}
