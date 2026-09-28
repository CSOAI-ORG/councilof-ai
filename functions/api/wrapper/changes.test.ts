import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet as changes } from "./changes";

const ORIGIN = "https://councilof.ai";
const PAY = btoa(JSON.stringify({ x402Version: 2, scheme: "exact", network: "eip155:8453", payload: {} }));
const ctx = (path: string, env: Record<string, unknown> = {}, headers: Record<string, string> = {}) =>
  ({ request: new Request(ORIGIN + path, { headers }), env, params: {} }) as never;

const record = (supply: string, escrow: string, id = "usdc.e:arbitrum") => ({
  id,
  reads: { wrapped_total_supply: { normalized: supply }, escrow_balance: { normalized: escrow } },
  state: "ESCROW_PARITY_READ",
});

function stubWorld(opts: {
  current?: ReturnType<typeof record> | null;
  previous?: ReturnType<typeof record> | null;
  facilitatorCalls?: string[];
} = {}) {
  const current = opts.current === undefined ? record("110.25", "105.5") : opts.current;
  const previous = opts.previous === undefined ? record("100", "100") : opts.previous;
  vi.stubGlobal("fetch", async (u: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(u instanceof Request ? u.url : u));
    if (url.host === "f.example") {
      opts.facilitatorCalls?.push(url.pathname);
      if (url.pathname.endsWith("/supported")) return new Response("nope", { status: 404 });
      if (url.pathname.endsWith("/settle")) return new Response(JSON.stringify({ success: true, transaction: "0xtx", network: "base", payer: "0xp" }));
      return new Response(JSON.stringify({ isValid: true }));
    }
    if (url.pathname.endsWith("wrapped-asset-parity-latest.json")) {
      if (!current) return new Response("{}", { status: 404 });
      return new Response(JSON.stringify({ as_of: "2026-09-14T00:00:00Z", records: [current] }));
    }
    if (url.pathname.endsWith("wrapped-asset-parity-2026-09-13.json")) {
      if (!previous) return new Response("{}", { status: 404 });
      return new Response(JSON.stringify({ as_of: "2026-09-13T00:00:00Z", records: [previous] }));
    }
    throw new Error(`unexpected fetch ${url}`);
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("/api/wrapper/changes — buyer-safe maintenance door", () => {
  it("rejects missing, malformed and unknown subjects before any payment call", async () => {
    const calls: string[] = []; stubWorld({ facilitatorCalls: calls });
    expect((await changes(ctx("/api/wrapper/changes"))).status).toBe(400);
    expect((await changes(ctx("/api/wrapper/changes?id=INVALID"))).status).toBe(400);
    const unknown = await changes(ctx("/api/wrapper/changes?id=nope:chain", { X402_FACILITATOR_URL: "https://f.example" }, { "x-payment": PAY }));
    expect(unknown.status).toBe(404);
    expect(unknown.headers.get("PAYMENT-REQUIRED")).toBeNull();
    expect((await unknown.json()).known_ids).toContain("usdc.e:arbitrum");
    expect(calls).toEqual([]);
  });

  it("free preview computes exact decimal deltas without binary floating point", async () => {
    stubWorld({
      current: record("9007199254740993.000000000000000001", "1000000000000000000.000000000000000001"),
      previous: record("9007199254740992.999999999999999999", "1000000000000000000.000000000000000000"),
    });
    const r = await changes(ctx("/api/wrapper/changes?id=usdc.e:arbitrum&preview=1"));
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b).toMatchObject({ state: "DELTA_READ", preview: true, wrapped_supply_delta: "0.000000000000000002", escrow_delta: "0.000000000000000001" });
    expect(b.arithmetic).toMatch(/no binary floating point/);
  });

  it("an unavailable previous snapshot is read-before-settle: 402 reason, zero facilitator calls", async () => {
    const calls: string[] = []; stubWorld({ previous: null, facilitatorCalls: calls });
    const r = await changes(ctx("/api/wrapper/changes?id=usdc.e:arbitrum", { X402_FACILITATOR_URL: "https://f.example" }, { "x-payment": PAY }));
    expect(r.status).toBe(402);
    expect(r.headers.get("x-payment-response")).toBeNull();
    const b = await r.json();
    expect(b.csoai.read_before_settle).toMatchObject({ state: "UNCHECKABLE", settled: false });
    expect(String(b.csoai.not_paid_reason)).toMatch(/Nothing was sent to the facilitator/);
    expect(calls).toEqual([]);
  });

  it("a deliverable unpaid delta advertises one x402 challenge only after source readiness", async () => {
    const calls: string[] = []; stubWorld({ facilitatorCalls: calls });
    const r = await changes(ctx("/api/wrapper/changes?id=usdc.e:arbitrum", { X402_FACILITATOR_URL: "https://f.example" }));
    expect(r.status).toBe(402);
    const b = await r.json();
    expect(b.x402Version).toBe(2);
    expect(b.accepts).toHaveLength(1);
    expect(b.csoai.deliverable).toMatch(/exact delivered JSON bytes/);
    expect(calls).toEqual([]);
  });

  it("paid success verifies and settles once, returns exact-byte digest and settlement echo", async () => {
    const calls: string[] = []; stubWorld({ facilitatorCalls: calls });
    const r = await changes(ctx("/api/wrapper/changes?id=usdc.e:arbitrum", { X402_FACILITATOR_URL: "https://f.example" }, { "x-payment": PAY }));
    expect(r.status).toBe(200);
    const text = await r.text();
    const body = JSON.parse(text);
    expect(body).toMatchObject({ state: "DELTA_READ", wrapped_supply_delta: "10.25", escrow_delta: "5.5" });
    expect(r.headers.get("x-csoai-delivery-sha256")).toBe(createHash("sha256").update(text).digest("hex"));
    expect(r.headers.get("x-payment-response")).toBeTruthy();
    expect(r.headers.get("x-csoai-maintenance-source")).toContain("/api/wrapper?id=usdc.e%3Aarbitrum&preview=1");
    expect(r.headers.get("access-control-expose-headers")).toContain("x-csoai-delivery-sha256");
    expect(calls.filter((x) => x.endsWith("/verify"))).toHaveLength(1);
    expect(calls.filter((x) => x.endsWith("/settle"))).toHaveLength(1);
  });
});
