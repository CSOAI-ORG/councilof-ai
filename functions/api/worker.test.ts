import { describe, expect, it } from "vitest";
import { buildWorker, DEFAULT_HEALTH_URL } from "./worker";

const health = {
  schema: "csoai.runpod-gspc-worker/0.1", state: "RUNNING", detail_code: "COMPUTE_ONLY", job: "041-02-qwen3-4b-care",
  model: "qwen3:4b", axis: "care", cycle: 181, jobs_total: 168, jobs_degraded: 0, invalid_config_count: 0,
  successful_runs: 180, failed_runs: 0, transport_ok: 237, transport_errors: 0, last_success_at: "2026-09-14T02:41:19Z",
  started_at: "2026-09-12T15:33:12Z", updated_at: "2026-09-14T02:41:19Z", disk_free_bytes: 110687039488,
  counters_scope: "this process", secret_looking_field: "never copied",
};
const fetcherWith = (status: number, body: unknown) => (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

describe("/api/worker — the pod's own health, proxied, never remembered", () => {
  it("reads the live health into a LIVE summary and copies only the known worker fields", async () => {
    const out = await buildWorker({}, fetcherWith(200, health));
    expect(out.status).toBe("LIVE");
    expect(out.source).toBe(DEFAULT_HEALTH_URL);
    expect(out.worker).toMatchObject({ state: "RUNNING", jobs_total: 168, successful_runs: 180, failed_runs: 0, model: "qwen3:4b", axis: "care" });
    expect(JSON.stringify(out)).not.toContain("secret_looking_field");
  });

  it("is OFFLINE with the HTTP result when the pod does not answer — never a stale number", async () => {
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
