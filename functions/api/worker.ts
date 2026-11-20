/**
 * GET /api/worker — the GSPC compute engines' own health endpoints, read at request time.
 *
 * Since 2026-11-18 (owner decision: "we don't use RunPod anymore") the estate's engines run on
 * Hugging Face Spaces, and this route probes an ORDERED LIST of them — primary plus backup — and
 * reports the first engine that answers, alongside every engine it tried. Two health shapes are
 * accepted: the worker schema (a string `state`) and the probe shape (`{"ok":true}` served by
 * csoai-gspc-node and csoai-gspc-mill). Nothing is stored as truth, nothing is invented — if no
 * engine answers, the state is OFFLINE with the HTTP results, never a remembered number. The last
 * live answer is kept in KV only as a STALE fallback and is always labelled stale. Engine counters
 * are the engine's own (since its process started), and staged outputs need separate admission and
 * guarded release; engine counters do not prove publication.
 */
import { headFromGet } from "./_head";
type Env = { WORKER_HEALTH_URLS?: string; RUNPOD_WORKER_HEALTH_URL?: string; WORKER_STATE_KV?: KVNamespace };

/** Primary first, backup second. Override without redeploy via WORKER_HEALTH_URLS (comma-separated). */
export const DEFAULT_HEALTH_URLS = [
  "https://csoai-gspc-node.hf.space/health", // probe runner — eat-overnight.yml probes this too
  "https://csoai-gspc-mill.hf.space/healthz", // free coverage engine (discovers → probes → grades)
];
export const DEFAULT_HEALTH_URL = DEFAULT_HEALTH_URLS[0];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=30", "access-control-allow-origin": "*" },
  });

const pick = (h: Record<string, unknown>, keys: string[]) =>
  Object.fromEntries(keys.filter((k) => k in h).map((k) => [k, h[k]]));

const CACHE_KEY = "worker:last-live";
const CACHE_TTL_S = 3600; // 1 hour

function engineList(env: Env): string[] {
  const raw = env.WORKER_HEALTH_URLS || env.RUNPOD_WORKER_HEALTH_URL;
  const list = (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : DEFAULT_HEALTH_URLS;
}

async function cacheLive(kv: KVNamespace | undefined, payload: Record<string, unknown>) {
  if (!kv) return;
  try { await kv.put(CACHE_KEY, JSON.stringify(payload), { expirationTtl: CACHE_TTL_S }); } catch { /* best-effort */ }
}

async function readStale(kv: KVNamespace | undefined): Promise<Record<string, unknown> | null> {
  if (!kv) return null;
  try {
    const raw = await kv.get(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

type Attempt = { engine: string; http: number | null; body: Record<string, unknown> | null; error: string | null };

async function probeEngine(url: string, fetcher: typeof fetch): Promise<Attempt> {
  try {
    const r = await fetcher(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return { engine: url, http: r.status, body: null, error: null };
    const b = (await r.json()) as unknown;
    if (!b || typeof b !== "object") return { engine: url, http: r.status, body: null, error: "schema" };
    return { engine: url, http: r.status, body: b as Record<string, unknown>, error: null };
  } catch (e) {
    return { engine: url, http: null, body: null, error: (e as Error).name || "unreachable" };
  }
}

/** A body counts as an engine health when it is the worker schema (string `state`) or the probe shape (`ok` boolean). */
function bodyState(b: Record<string, unknown>): string | null {
  if (typeof b.state === "string") return b.state;
  if (typeof b.ok === "boolean") return b.ok === true ? "RUNNING" : "DEGRADED";
  return null;
}

const FAILURE_FRAGMENT_KEYS = ["job", "model", "axis", "cycle", "jobs_total", "jobs_degraded", "invalid_config_count",
  "successful_runs", "failed_runs", "transport_ok", "transport_errors", "attempted", "correct",
  "parse_errors_excluded", "graded_n", "last_run_detail_code", "bank_items", "last_success_at", "started_at", "updated_at", "disk_free_bytes"];
const PROBE_SHAPE_KEYS = ["ok", "writes_board", "router", "queue_total", "probed_this_pass", "atoms_staged", "reachability_atoms", "grade_atoms"];

export async function buildWorker(env: Env, fetcher: typeof fetch = fetch) {
  const engines = engineList(env);
  const base = {
    schema: "csoai.worker-state/0.2",
    endpoint: "/api/worker",
    source: engines[0],
    what: "The GSPC compute engines' own health endpoints on Hugging Face Spaces (primary plus backup), read at request time. Compute state only: no counter here is a signed measurement or publication receipt. Staged outputs require separate admission and guarded release; unadmitted or withdrawn rows do not reach the board.",
  };

  const attempts: Attempt[] = [];
  for (const url of engines) attempts.push(await probeEngine(url, fetcher));

  const winner = attempts.find((a) => a.body !== null && bodyState(a.body) !== null);
  if (winner && winner.body) {
    const h = winner.body;
    const oldSchema = typeof h.state === "string";
    let commission_dispatch: Record<string, unknown> | null = null;
    try {
      const dispatchUrl = new URL("/commission-dispatch", winner.engine).toString();
      const dispatchResponse = await fetcher(dispatchUrl, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000) });
      if (dispatchResponse.ok) {
        const d = (await dispatchResponse.json()) as Record<string, unknown>;
        commission_dispatch = pick(d, ["schema", "status", "queue_schema", "last_run", "source_revision", "admitted", "refused", "created", "already_present"]);
      }
    } catch {
      commission_dispatch = null;
    }
    const live = {
      ...base,
      source: winner.engine,
      engine: winner.engine,
      engines: attempts.map((a) => a.engine === winner.engine
        ? { engine: a.engine, http: a.http, status: "LIVE" }
        : { engine: a.engine, http: a.http, status: "OFFLINE", note: failureFragment(a) }),
      status: "LIVE",
      http: winner.http,
      read_at: new Date().toISOString(),
      worker: oldSchema
        ? pick(h, ["schema", "state", "detail_code", ...FAILURE_FRAGMENT_KEYS])
        : { state: bodyState(h), ...pick(h, PROBE_SHAPE_KEYS) },
      ...(oldSchema ? { counters_scope: typeof h.counters_scope === "string" ? h.counters_scope : "successful_runs/failed_runs count this engine process since started_at" } : {}),
      commission_dispatch,
    };
    await cacheLive(env.WORKER_STATE_KV, live);
    return live;
  }

  const fragments = attempts.map((a) => failureFragment(a)).filter(Boolean);
  const reason = `no engine answered (${engines.length} tried) — ${fragments.join("; ") || "no response"}`;
  const stale = await readStale(env.WORKER_STATE_KV);
  if (stale) return { ...stale, status: "STALE", stale: true, stale_reason: reason, stale_age_seconds: staleAge(stale.read_at) };
  const lastHttp = attempts.map((a) => a.http).reverse().find((v) => v !== null) ?? null;
  return { ...base, status: "OFFLINE", http: lastHttp, worker: null, note: `${reason} — state unknown, not zero` };
}

function failureFragment(a: Attempt): string {
  if (a.error === "schema") return `${a.engine} answered but not in a known engine health schema`;
  if (a.error) return `${a.engine} unreachable (${a.error})`;
  return `${a.engine} answered HTTP ${a.http}`;
}

function staleAge(readAt: unknown): number | null {
  if (typeof readAt !== "string") return null;
  const ms = Date.now() - new Date(readAt).getTime();
  return ms >= 0 ? Math.round(ms / 1000) : null;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => json(await buildWorker(env));

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
