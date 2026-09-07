/**
 * The Pages directory functions/api/worker/ swallows GET /api/worker
 * (worker.ts never runs). The catch-all proxied that to WORKER_URL/api
 * which 404s. Spec says 501 NOT_IMPLEMENTED. What would make this fail:
 * treating the empty rest as /api.
 */
import { describe, expect, it } from "vitest";
import { onRequest, workerProxyPath } from "./worker/[[path]]";

describe("workerProxyPath", () => {
  it("does not proxy the worker root — that route is NOT_IMPLEMENTED", () => {
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
  it("answers 501 NOT_IMPLEMENTED, not an upstream 404", async () => {
    const res = await (onRequest as unknown as (c: unknown) => Promise<Response>)({
      request: new Request("https://councilof.ai/api/worker"),
      env: {},
    });
    expect(res.status).toBe(501);
    const body = (await res.json()) as { state?: string; endpoint?: string };
    expect(body.state).toBe("NOT_IMPLEMENTED");
    expect(body.endpoint).toBe("/api/worker");
  });
});
