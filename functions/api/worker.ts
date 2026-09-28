/**
 * GET /api/worker — the GPU worker's state, read from the pod's own health endpoint at request time.
 *
 * Until 2026-09-14 this route was a NOT_IMPLEMENTED stub while the RunPod worker
 * (scripts/runpod_gspc_worker.py, --forever) served a live /health on the pod. The site now proxies
 * that read: the pod's counters, the job it is on, and when it last succeeded. Nothing is stored,
 * nothing is invented — if the pod does not answer, the state is OFFLINE with the HTTP result,
 * never a remembered number. Counters are the worker's own (since its process started), and the
 * staged outputs need separate admission and guarded release; worker counters do not prove publication.
 */
type Env = { RUNPOD_WORKER_HEALTH_URL?: string; WORKER_STATE_KV?: KVNamespace };

export const DEFAULT_HEALTH_URL = "https://fpowppss5ngtkw-8888.proxy.runpod.net/health";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=30", "access-control-allow-origin": "*" },
  });

const pick = (h: Record<string, unknown>, keys: string[]) =>
  Object.fromEntries(keys.filter((k) => k in h).map((k) => [k, h[k]]));

const CACHE_KEY = "worker:last-live";
const CACHE_TTL_S = 3600; // 1 hour

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

export async function buildWorker(env: Env, fetcher: typeof fetch = fetch) {
  const url = env.RUNPOD_WORKER_HEALTH_URL || DEFAULT_HEALTH_URL;
  const base = {
    schema: "csoai.worker-state/0.1",
    endpoint: "/api/worker",
    source: url,
    what: "The RunPod GSPC compute worker's own /health, read at request time. Compute state only: no counter here is a signed measurement or publication receipt. Staged outputs require separate admission and guarded release; unadmitted or withdrawn rows do not reach the board.",
  };
  let http: number | null = null;
  try {
    const r = await fetcher(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000) });
    http = r.status;
    if (!r.ok) {
      const stale = await readStale(env.WORKER_STATE_KV);
      if (stale) return { ...stale, status: "STALE", stale: true, stale_reason: `pod health answered HTTP ${r.status}`, stale_age_seconds: staleAge(stale.read_at) };
      return { ...base, status: "OFFLINE", http, worker: null, note: `pod health answered HTTP ${r.status} — state unknown, not zero` };
    }
    const h = (await r.json()) as Record<string, unknown>;
    if (!h || typeof h !== "object" || typeof h.state !== "string") {
      const stale = await readStale(env.WORKER_STATE_KV);
      if (stale) return { ...stale, status: "STALE", stale: true, stale_reason: "pod health answered but not in the worker schema", stale_age_seconds: staleAge(stale.read_at) };
      return { ...base, status: "OFFLINE", http, worker: null, note: "pod health answered but not in the worker schema — state unknown" };
    }
    let commission_dispatch: Record<string, unknown> | null = null;
    try {
      const dispatchUrl = new URL("/commission-dispatch", url).toString();
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
      status: "LIVE",
      http,
      read_at: new Date().toISOString(),
      worker: pick(h, [
        "schema", "state", "detail_code", "job", "model", "axis", "cycle", "jobs_total", "jobs_degraded",
        "invalid_config_count", "successful_runs", "failed_runs", "transport_ok", "transport_errors",
        "attempted", "correct", "parse_errors_excluded", "graded_n", "last_run_detail_code", "bank_items", "last_success_at", "started_at", "updated_at", "disk_free_bytes",
      ]),
      counters_scope: typeof h.counters_scope === "string" ? h.counters_scope : "successful_runs/failed_runs count this worker process since started_at",
      commission_dispatch,
    };
    await cacheLive(env.WORKER_STATE_KV, live);
    return live;
  } catch (e) {
    const stale = await readStale(env.WORKER_STATE_KV);
    if (stale) return { ...stale, status: "STALE", stale: true, stale_reason: `pod health unreachable (${(e as Error).name})`, stale_age_seconds: staleAge(stale.read_at) };
    return { ...base, status: "OFFLINE", http, worker: null, note: `pod health unreachable (${(e as Error).name}) — state unknown, not zero` };
  }
}

function staleAge(readAt: unknown): number | null {
  if (typeof readAt !== "string") return null;
  const ms = Date.now() - new Date(readAt).getTime();
  return ms >= 0 ? Math.round(ms / 1000) : null;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => json(await buildWorker(env));
