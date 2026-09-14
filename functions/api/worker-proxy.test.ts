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

  it("answers 200 pod-health from public artifact, not 501", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          schema: "csoai.pod-health/0.1",
          status: "STALE",
          pod: { id: "fpowppss5ngtkw" },
          secret_token: "must-strip",
        }),
      ),
    );
    const res = await (onRequest as unknown as (c: unknown) => Promise<Response>)({
      request: new Request("https://councilof.ai/api/worker"),
      env: {},
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.endpoint).toBe("/api/worker");
    expect(body.never_secrets).toBe(true);
    expect(body.secret_token).toBeUndefined();
    expect(body.schema).toBe("csoai.pod-health/0.1");
  });
});
