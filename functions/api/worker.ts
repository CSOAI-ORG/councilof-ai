/**
 * GET /api/worker — the GPU worker's state, read from the pod's own health endpoint at request time.
 *
 * Until 2026-09-14 this route was a NOT_IMPLEMENTED stub while the RunPod worker
 * (scripts/runpod_gspc_worker.py, --forever) served a live /health on the pod. The site now proxies
 * that read: the pod's counters, the job it is on, and when it last succeeded. Nothing is stored,
 * nothing is invented — if the pod does not answer, the state is OFFLINE with the HTTP result,
 * never a remembered number. Counters are the worker's own (since its process started), and the
 * staged outputs need separate admission and guarded release; worker counters do not prove publication.
 *
 * 2026-11-20 (lane lane/worker-hf-engines-20261118): the probe became multi-engine. The
 * fail-closed default is unchanged — with no configured URL this route still refuses to guess.
 * When production declares WORKER_HEALTH_URLS (comma-separated, primary first), the route probes
 * them in order, reports the first engine that answers, and publishes every engine it tried in
 * `engines[]`. Two health shapes are accepted: the worker schema (a string `state`) and the probe
 * shape (`{"ok":true}`, served by the verified Hugging Face Space engines in
 * VERIFIED_HEALTH_URLS). The last live answer stays in KV only as a STALE fallback, always labelled.
 */
import { headFromGet } from "./_head";
type Env = { WORKER_HEALTH_URLS?: string; RUNPOD_WORKER_HEALTH_URL?: string; WORKER_STATE_KV?: KVNamespace };

// Historical pod fpowppss5ngtkw was decommissioned. The 7 Nov 2026 inventory reported
// zero RunPod pods. Never silently probe its obsolete URL as if it were the active worker.
// Production must declare an authenticated, reviewed RUNPOD_WORKER_HEALTH_URL.
export const DEFAULT_HEALTH_URL: string | null = null;

// Verified replacement engines (probed live 2026-11-18 and 2026-11-19: each answered
// HTTP 200 {"ok":true} — csoai-gspc-node /health and csoai-gspc-mill /healthz; the mill's
// /status showed a live pass at 03:28Z). They are OFFERED, not silently probed: this route
// stays fail-closed until production declares WORKER_HEALTH_URLS (comma-separated, primary
// first). Setting it is the owner's single action to bring this surface back to LIVE.
export const VERIFIED_HEALTH_URLS = [
  "https://csoai-gspc-node.hf.space/health",
  "https://csoai-gspc-mill.hf.space/healthz",
];

const RETIRED_HOST = "fpowppss5ngtkw-8888.proxy.runpod.net";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=30", "access-control-allow-origin": "*" },
  });

const pick = (h: Record<string, unknown>, keys: string[]) =>
  Object.fromEntries(keys.filter((k) => k in h).map((k) => [k, h[k]]));

const CACHE_KEY = "worker:last-live";
const CACHE_TTL_S = 3600; // 1 hour

type Attempt = { engine: string; http: number | null; body: Record<string, unknown> | null; diagnostic: string | null };

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

function engineList(env: Env): string[] {
  const raw = env.WORKER_HEALTH_URLS || env.RUNPOD_WORKER_HEALTH_URL;
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Pre-flight guards, per engine: malformed, insecure, or the retired RunPod origin never gets a request. */
function preflight(url: string): string | null {
  let parsed: URL;
  try { parsed = new URL(url); }
  catch { return "INVALID_WORKER_ORIGIN"; }
  if (parsed.protocol !== "https:") return "INSECURE_WORKER_ORIGIN";
  if (parsed.hostname.toLowerCase() === RETIRED_HOST) return "RETIRED_WORKER_ORIGIN";
  return null;
}

/** A body counts as engine health when it is the worker schema (string `state`) or the probe shape (`ok` boolean). */
function bodyState(b: Record<string, unknown>): string | null {
  if (typeof b.state === "string") return b.state;
  if (typeof b.ok === "boolean") return b.ok === true ? "RUNNING" : "DEGRADED";
  return null;
}

async function probeEngine(url: string, fetcher: typeof fetch): Promise<Attempt> {
  const guard = preflight(url);
  if (guard) return { engine: url, http: null, body: null, diagnostic: guard };
  try {
    const r = await fetcher(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return { engine: url, http: r.status, body: null, diagnostic: r.status === 404 ? "HEALTH_ROUTE_NOT_FOUND" : "HEALTH_HTTP_ERROR" };
    const b = (await r.json()) as unknown;
    if (!b || typeof b !== "object") return { engine: url, http: r.status, body: null, diagnostic: "SCHEMA" };
    return { engine: url, http: r.status, body: b as Record<string, unknown>, diagnostic: null };
  } catch (e) {
    return { engine: url, http: null, body: null, diagnostic: `UNREACHABLE_${(e as Error).name || "ERROR"}` };
  }
}

function failureFragment(a: Attempt): string {
  if (a.diagnostic === "SCHEMA") return `${a.engine} answered but not in a known engine health schema`;
  if (a.diagnostic?.startsWith("UNREACHABLE_")) return `${a.engine} unreachable (${a.diagnostic.slice("UNREACHABLE_".length)})`;
  if (a.diagnostic === "HEALTH_ROUTE_NOT_FOUND") return `${a.engine} answered HTTP 404 — this checks a URL, not proof the compute process stopped`;
  if (a.diagnostic === "HEALTH_HTTP_ERROR") return `${a.engine} answered HTTP ${a.http} — this checks a URL, not proof the compute process stopped`;
  if (a.diagnostic) return `${a.engine}: ${a.diagnostic}`;
  return `${a.engine} answered HTTP ${a.http}`;
}

const FAILURE_FIELD_KEYS = ["job", "model", "axis", "cycle", "jobs_total", "jobs_degraded", "invalid_config_count",
  "successful_runs", "failed_runs", "transport_ok", "transport_errors", "attempted", "correct",
  "parse_errors_excluded", "graded_n", "last_run_detail_code", "bank_items", "last_success_at", "started_at", "updated_at", "disk_free_bytes"];
const PROBE_SHAPE_KEYS = ["ok", "writes_board", "router", "queue_total", "probed_this_pass", "atoms_staged", "reachability_atoms", "grade_atoms"];

export async function buildWorker(env: Env, fetcher: typeof fetch = fetch) {
  const engines = engineList(env);
  const url = engines[0] ?? DEFAULT_HEALTH_URL;
  const base = {
    schema: "csoai.worker-state/0.1",
    endpoint: "/api/worker",
    source: url,
    what: "The RunPod GSPC compute worker's own /health, read at request time. Compute state only: no counter here is a signed measurement or publication receipt. Staged outputs require separate admission and guarded release; unadmitted or withdrawn rows do not reach the board.",
  };
  if (!url) {
    return { ...base, status: "OFFLINE", http: null, worker: null,
      worker_state: "UNKNOWN", diagnostic_code: "HEALTH_URL_NOT_CONFIGURED",
      note: "No active worker URL is configured. The historical RunPod 3090 was decommissioned; this API is not proof of running compute. Set WORKER_HEALTH_URLS (comma-separated, primary first) only after verifying a replacement worker and its /health schema — VERIFIED_HEALTH_URLS holds the reviewed Hugging Face Space candidates." };
  }
  const attempts: Attempt[] = [];
  for (const engine of engines) attempts.push(await probeEngine(engine, fetcher));
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
        ? pick(h, ["schema", "state", "detail_code", ...FAILURE_FIELD_KEYS])
        : { state: bodyState(h), ...pick(h, PROBE_SHAPE_KEYS) },
      ...(oldSchema ? { counters_scope: typeof h.counters_scope === "string" ? h.counters_scope : "successful_runs/failed_runs count this engine process since started_at" } : {}),
      commission_dispatch,
    };
    await cacheLive(env.WORKER_STATE_KV, live);
    return live;
  }
  const fragments = attempts.map((a) => failureFragment(a)).filter(Boolean);
  const stale = await readStale(env.WORKER_STATE_KV);
  if (stale) return { ...stale, status: "STALE", stale: true, stale_reason: `no engine answered — ${fragments.join("; ")}`, stale_age_seconds: staleAge(stale.read_at) };
  const lastHttp = attempts.map((a) => a.http).reverse().find((v) => v !== null) ?? null;
  const single = attempts.length === 1 ? attempts[0] : null;
  const singleNote = single && single.diagnostic === "HEALTH_HTTP_ERROR"
    ? `worker health answered HTTP ${single.http} — this checks a URL, not proof the compute process stopped; verify WORKER_HEALTH_URLS and the engine health route`
    : null;
  return { ...base, status: "OFFLINE", http: lastHttp, worker: null,
    worker_state: "UNKNOWN", diagnostic_code: single ? single.diagnostic ?? "HEALTH_HTTP_ERROR" : "NO_ENGINE_ANSWERED",
    note: singleNote ?? `no engine answered (${engines.length} configured) — ${fragments.join("; ") || "no response"} — state unknown, not zero` };
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
