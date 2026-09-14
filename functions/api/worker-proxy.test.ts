/**
 * The Pages directory functions/api/worker/ swallows GET /api/worker
 * (worker.ts never runs). Empty rest serves read-only pod-health (no secrets).
 */
import { describe, expect, it, vi, afterEach } from "vitest";
import { onRequest, workerProxyPath } from "./worker/[[path]]";

describe("workerProxyPath", () => {
  it("does not proxy the worker root — that route is pod-health", () => {
    expect(workerProxyPath("/api/worker")).toBeNull();
    expect(workerProxyPath("/api/worker/")).toBeNull();
  });

  it("proxies subpaths to the same-origin /api/* worker", () => {
    expect(workerProxyPath("/api/worker/ledger")).toBe("/api/ledger");
    expect(workerProxyPath("/api/worker/anchors")).toBe("/api/anchors");
    expect(workerProxyPath("/api/worker/ledger/stats")).toBe("/api/ledger/stats");
  });
});

describe("GET /api/worker", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("delegates the bare route to the live pod proxy (worker-state schema, only known fields)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ state: "RUNNING", jobs_total: 182, cycle: 127, axis: "safety", secret_token: "must-strip" }),
      ),
    );
    const res = await (onRequest as unknown as (c: unknown) => Promise<Response>)({
      request: new Request("https://councilof.ai/api/worker"),
      env: {},
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, any>;
    expect(body.schema).toBe("csoai.worker-state/0.1");
    expect(body.endpoint).toBe("/api/worker");
    expect(body.status).toBe("LIVE");
    expect(body.worker.jobs_total).toBe(182);
    expect(JSON.stringify(body)).not.toContain("must-strip");
  });

  it("is OFFLINE, never a stale artifact, when the pod does not answer", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("fetch failed"); }));
    const res = await (onRequest as unknown as (c: unknown) => Promise<Response>)({
      request: new Request("https://councilof.ai/api/worker"),
      env: {},
    });
    const body = (await res.json()) as Record<string, any>;
    expect(body.status).toBe("OFFLINE");
    expect(body.worker).toBeNull();
  });
});
