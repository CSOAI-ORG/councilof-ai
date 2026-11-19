// POST /api/a2a/route: the per-client burst limit (2026-11-16). It runs before the body is read and
// before anything is signed, and it only counts requests that came through the Cloudflare edge.
import { beforeEach, describe, expect, it } from "vitest";
import { onRequestPost as route, ROUTE_BURST_LIMIT, ROUTE_BURST_WINDOW_MS, resetRouteBurst, routeBurstRetryAfter } from "./route";

beforeEach(() => resetRouteBurst());

const OK = { from: { party: "did:example:probe" }, to: { party: "nobody" }, action: "probe.read", payload: { probe: true } };
const post = (ip: string | null) =>
  route({
    request: new Request("https://councilof.ai/api/a2a/route", {
      method: "POST",
      headers: { "content-type": "application/json", ...(ip ? { "cf-connecting-ip": ip } : {}) },
      body: JSON.stringify(OK),
    }),
    env: {},
  } as never);

describe("routeBurstRetryAfter", () => {
  it("lets one client make ROUTE_BURST_LIMIT requests in a window, refuses the next, and lets it in again after the window", () => {
    const t0 = 1_700_000_000_000;
    for (let i = 0; i < ROUTE_BURST_LIMIT; i++) expect(routeBurstRetryAfter("203.0.113.7", t0 + i)).toBeNull();
    const wait = routeBurstRetryAfter("203.0.113.7", t0 + ROUTE_BURST_LIMIT);
    expect(wait).toBeGreaterThanOrEqual(1);
    expect(wait).toBeLessThanOrEqual(ROUTE_BURST_WINDOW_MS / 1000);
    expect(routeBurstRetryAfter("203.0.113.7", t0 + ROUTE_BURST_WINDOW_MS + 1)).toBeNull();
  });

  it("counts clients separately", () => {
    for (let i = 0; i < ROUTE_BURST_LIMIT; i++) routeBurstRetryAfter("203.0.113.7", 1_000 + i);
    expect(routeBurstRetryAfter("203.0.113.7", 2_000)).not.toBeNull();
    expect(routeBurstRetryAfter("198.51.100.9", 2_000)).toBeNull();
  });

  it("does not count a request that did not come through the edge", () => {
    for (let i = 0; i < ROUTE_BURST_LIMIT * 2; i++) expect(routeBurstRetryAfter(null, 1_000 + i)).toBeNull();
  });
});

describe("the door", () => {
  it("answers 429 with Retry-After once one client passes the limit, before reading or signing anything", async () => {
    for (let i = 0; i < ROUTE_BURST_LIMIT; i++) expect((await post("203.0.113.7")).status).not.toBe(429);
    const res = await post("203.0.113.7");
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("retry-after"))).toBeGreaterThanOrEqual(1);
    const body = (await res.json()) as { limit: { requests: number; scope: string } };
    expect(body.limit.requests).toBe(ROUTE_BURST_LIMIT);
    expect(body.limit.scope).toMatch(/not a global quota/);
    expect((await post("198.51.100.9")).status).not.toBe(429);
  });

  it("never limits requests without CF-Connecting-IP (tests, local dev)", async () => {
    for (let i = 0; i < ROUTE_BURST_LIMIT + 5; i++) expect((await post(null)).status).not.toBe(429);
  });
});
