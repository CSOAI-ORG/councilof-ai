/**
 * GET /api/worker — the GPU worker's state, read from the pod's own health endpoint at request time.
 *
 * Until 2026-09-14 this route was a NOT_IMPLEMENTED stub while the RunPod worker
 * (scripts/runpod_gspc_worker.py, --forever) served a live /health on the pod. The site now proxies
 * that read: the pod's counters, the job it is on, and when it last succeeded. Nothing is stored,
 * nothing is invented — if the pod does not answer, the state is OFFLINE with the HTTP result,
 * never a remembered number. Counters are the worker's own (since its process started), and the
 * cards it stages reach the board only through runpod-intake → runpod-land → OIDC signer → PR.
 */
type Env = { RUNPOD_WORKER_HEALTH_URL?: string };

export const DEFAULT_HEALTH_URL = "https://fpowppss5ngtkw-8888.proxy.runpod.net/health";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=30", "access-control-allow-origin": "*" },
  });

const pick = (h: Record<string, unknown>, keys: string[]) =>
  Object.fromEntries(keys.filter((k) => k in h).map((k) => [k, h[k]]));

export async function buildWorker(env: Env, fetcher: typeof fetch = fetch) {
  const url = env.RUNPOD_WORKER_HEALTH_URL || DEFAULT_HEALTH_URL;
  const base = {
    schema: "csoai.worker-state/0.1",
    endpoint: "/api/worker",
    source: url,
    what: "The RunPod GSPC compute worker's own /health, read at request time. A compute lane, not an authority lane: nothing here is signed or MEASURED; staged cards reach the board only through the intake → signer → human-merged PR path.",
  };
  let http: number | null = null;
  try {
    const r = await fetcher(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000) });
    http = r.status;
    if (!r.ok) return { ...base, status: "OFFLINE", http, worker: null, note: `pod health answered HTTP ${r.status} — state unknown, not zero` };
    const h = (await r.json()) as Record<string, unknown>;
    if (!h || typeof h !== "object" || typeof h.state !== "string") {
      return { ...base, status: "OFFLINE", http, worker: null, note: "pod health answered but not in the worker schema — state unknown" };
    }
    return {
      ...base,
      status: "LIVE",
      http,
      read_at: new Date().toISOString(),
      worker: pick(h, [
        "schema", "state", "detail_code", "job", "model", "axis", "cycle", "jobs_total", "jobs_degraded",
        "invalid_config_count", "successful_runs", "failed_runs", "transport_ok", "transport_errors",
        "attempted", "correct", "bank_items", "last_success_at", "started_at", "updated_at", "disk_free_bytes",
      ]),
      counters_scope: typeof h.counters_scope === "string" ? h.counters_scope : "successful_runs/failed_runs count this worker process since started_at",
    };
  } catch (e) {
    return { ...base, status: "OFFLINE", http, worker: null, note: `pod health unreachable (${(e as Error).name}) — state unknown, not zero` };
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => json(await buildWorker(env));
