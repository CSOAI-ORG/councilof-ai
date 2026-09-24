import { describe, expect, it } from "vitest";
import { buildWorker, DEFAULT_HEALTH_URL } from "./worker";

const health = {
  schema: "csoai.runpod-gspc-worker/0.1", state: "RUNNING", detail_code: "COMPUTE_ONLY", job: "041-02-qwen3-4b-care",
  model: "qwen3:4b", axis: "care", cycle: 181, jobs_total: 168, jobs_degraded: 0, invalid_config_count: 0,
  successful_runs: 180, failed_runs: 0, transport_ok: 237, transport_errors: 0, last_success_at: "2026-09-14T02:41:19Z",
  started_at: "2026-09-12T15:33:12Z", updated_at: "2026-09-14T02:41:19Z", disk_free_bytes: 110687039488,
  counters_scope: "this process", secret_looking_field: "never copied",
  attempted: 37, correct: 0, parse_errors_excluded: 37, graded_n: 0, last_run_detail_code: "ALL_UNPARSED",
};
const fetcherWith = (status: number, body: unknown) => (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

/** Fake KV that stores in-memory for tests. */
function fakeKV(initial?: string): { binding: any; store: Map<string, string> } {
  const store = new Map<string, string>();
  if (initial) store.set("worker:last-live", initial);
  return {
    binding: {
      get: async (k: string) => store.get(k) ?? null,
      put: async (k: string, v: string) => { store.set(k, v); },
    } as any,
    store,
  };
}

describe("/api/worker — the pod's own health, proxied, never remembered", () => {
  it("reads the live health into a LIVE summary and copies only the known worker fields", async () => {
    const out = await buildWorker({}, fetcherWith(200, health));
    expect(out.status).toBe("LIVE");
    expect(out.source).toBe(DEFAULT_HEALTH_URL);
    expect(out.what).toContain("separate admission and guarded release");
    expect(out.what).toContain("unadmitted or withdrawn rows");
    expect(out.what).not.toMatch(/OIDC signer|human-merged PR/);
    expect(out.worker).toMatchObject({ state: "RUNNING", jobs_total: 168, successful_runs: 180, failed_runs: 0, model: "qwen3:4b", axis: "care" });
    expect(JSON.stringify(out)).not.toContain("secret_looking_field");
  });

  it("carries graded_n and parse_errors_excluded so 0 correct of 37 cut-off answers is not read as 37 wrong", async () => {
    const out = await buildWorker({}, fetcherWith(200, health));
    expect(out.worker).toMatchObject({ attempted: 37, correct: 0, parse_errors_excluded: 37, graded_n: 0, last_run_detail_code: "ALL_UNPARSED" });
  });

  it("caches the LIVE response in KV for fallback", async () => {
    const { binding: kv, store } = fakeKV();
    await buildWorker({ WORKER_STATE_KV: kv }, fetcherWith(200, health));
    expect(store.has("worker:last-live")).toBe(true);
    const cached = JSON.parse(store.get("worker:last-live")!);
    expect(cached.status).toBe("LIVE");
    expect(cached.worker.state).toBe("RUNNING");
  });

  it("returns STALE with cached data when pod is offline and KV has a previous LIVE response", async () => {
    const cachedLive = JSON.stringify({ ...({ schema: "csoai.worker-state/0.1", status: "LIVE", read_at: new Date(Date.now() - 120_000).toISOString(), worker: { state: "RUNNING", jobs_total: 168 } }) });
    const { binding: kv } = fakeKV(cachedLive);
    const down = await buildWorker({ WORKER_STATE_KV: kv }, fetcherWith(502, { error: "bad gateway" }));
    expect(down.status).toBe("STALE");
    expect(down.stale).toBe(true);
    expect(down.stale_reason).toContain("HTTP 502");
    expect(down.stale_age_seconds).toBeGreaterThanOrEqual(120);
    expect(down.worker).toMatchObject({ state: "RUNNING", jobs_total: 168 });
  });

  it("returns STALE with cached data when pod throws and KV has a previous LIVE response", async () => {
    const cachedLive = JSON.stringify({ ...({ schema: "csoai.worker-state/0.1", status: "LIVE", read_at: new Date(Date.now() - 60_000).toISOString(), worker: { state: "IDLE" } }) });
    const { binding: kv } = fakeKV(cachedLive);
    const throwing = (async () => { throw new TypeError("fetch failed"); }) as unknown as typeof fetch;
    const off = await buildWorker({ WORKER_STATE_KV: kv }, throwing);
    expect(off.status).toBe("STALE");
    expect(off.stale).toBe(true);
    expect(off.stale_reason).toContain("unreachable");
    expect(off.worker).toMatchObject({ state: "IDLE" });
  });

  it("is OFFLINE with no fallback when pod is down and no KV cache exists", async () => {
    const down = await buildWorker({}, fetcherWith(502, { error: "bad gateway" }));
    expect(down.status).toBe("OFFLINE");
    expect(down.http).toBe(502);
    expect(down.worker).toBeNull();
    const throwing = (async () => { throw new TypeError("fetch failed"); }) as unknown as typeof fetch;
    const off = await buildWorker({}, throwing);
    expect(off.status).toBe("OFFLINE");
    expect(off.worker).toBeNull();
  });

  it("refuses a body that is not in the worker schema", async () => {
    const odd = await buildWorker({ RUNPOD_WORKER_HEALTH_URL: "https://example.test/health" }, fetcherWith(200, { hello: "world" }));
    expect(odd.status).toBe("OFFLINE");
    expect(odd.source).toBe("https://example.test/health");
  });
});
