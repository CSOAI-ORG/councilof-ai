import { describe, expect, it, vi, afterEach } from "vitest";
import { onRequestGet as changes } from "./changes";

const ORIGIN = "https://councilof.ai";
const ctx = (path: string, env: Record<string, unknown> = {}) =>
  ({ request: new Request(ORIGIN + path, { headers: {} }), env, params: {} }) as never;

afterEach(() => vi.unstubAllGlobals());

describe("/api/wrapper/changes", () => {
  it("returns 400 without id param", async () => {
    const res = await changes(ctx("/api/wrapper/changes"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("bad_request");
  });

  it("returns 400 with invalid id format", async () => {
    const res = await changes(ctx("/api/wrapper/changes?id=INVALID"));
    expect(res.status).toBe(400);
  });

  it("returns 402 without preview param (paid mode)", async () => {
    // Stub fetch to return a snapshot
    vi.stubGlobal("fetch", async (u: string | URL | Request) => {
      const url = String(u instanceof Request ? u.url : u);
      if (url.includes("wrapped-asset-parity-latest")) {
        return new Response(JSON.stringify({
          as_of: "2026-09-14T00:00:00Z",
          pairs: [{ id: "usdc.e:arbitrum", wrapped_total_supply: "1000000000000", escrow_balance: "1000000000000", state: "ESCROW_PARITY_READ" }],
        }));
      }
      return new Response("{}", { status: 404 });
    });
    const res = await changes(ctx("/api/wrapper/changes?id=usdc.e:arbitrum"));
    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.x402Version).toBe(2);
    expect(body.accepts).toBeDefined();
  });

  it("returns 200 with preview=1", async () => {
    vi.stubGlobal("fetch", async (u: string | URL | Request) => {
      const url = String(u instanceof Request ? u.url : u);
      if (url.includes("wrapped-asset-parity-latest")) {
        return new Response(JSON.stringify({
          as_of: "2026-09-14T00:00:00Z",
          pairs: [{ id: "usdc.e:arbitrum", wrapped_total_supply: "1000000000000", escrow_balance: "1000000000000", state: "ESCROW_PARITY_READ" }],
        }));
      }
      return new Response("{}", { status: 404 });
    });
    const res = await changes(ctx("/api/wrapper/changes?id=usdc.e:arbitrum&preview=1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.schema).toBe("csoai.wrapper.changes/0.1");
    expect(body.id).toBe("usdc.e:arbitrum");
    expect(body.preview).toBe(true);
  });

  it("returns UNCHECKABLE when only one snapshot exists", async () => {
    vi.stubGlobal("fetch", async (u: string | URL | Request) => {
      const url = String(u instanceof Request ? u.url : u);
      if (url.includes("wrapped-asset-parity-latest")) {
        return new Response(JSON.stringify({
          as_of: "2026-09-14T00:00:00Z",
          pairs: [{ id: "usdc.e:arbitrum", wrapped_total_supply: "1000000000000", escrow_balance: "1000000000000", state: "ESCROW_PARITY_READ" }],
        }));
      }
      return new Response("{}", { status: 404 });
    });
    const res = await changes(ctx("/api/wrapper/changes?id=usdc.e:arbitrum&preview=1"));
    const body = await res.json();
    expect(body.state).toBe("UNCHECKABLE");
    expect(body.reason).toContain("Only one snapshot");
  });

  it("computes delta when two snapshots exist", async () => {
    vi.stubGlobal("fetch", async (u: string | URL | Request) => {
      const url = String(u instanceof Request ? u.url : u);
      if (url.includes("wrapped-asset-parity-latest")) {
        return new Response(JSON.stringify({
          as_of: "2026-09-14T00:00:00Z",
          pairs: [{ id: "usdc.e:arbitrum", wrapped_total_supply: "1100000000000", escrow_balance: "1050000000000", state: "ESCROW_PARITY_READ" }],
        }));
      }
      if (url.includes("wrapped-asset-parity-2026-09-13")) {
        return new Response(JSON.stringify({
          as_of: "2026-09-13T00:00:00Z",
          pairs: [{ id: "usdc.e:arbitrum", wrapped_total_supply: "1000000000000", escrow_balance: "1000000000000", state: "ESCROW_PARITY_READ" }],
        }));
      }
      return new Response("{}", { status: 404 });
    });
    const res = await changes(ctx("/api/wrapper/changes?id=usdc.e:arbitrum&preview=1"));
    const body = await res.json();
    expect(body.state).toBe("DELTA_READ");
    expect(body.wrapped_supply_delta).toBe(100000000000);
    expect(body.escrow_delta).toBe(50000000000);
    expect(body.current_as_of).toBe("2026-09-14T00:00:00Z");
    expect(body.previous_as_of).toBe("2026-09-13T00:00:00Z");
  });
});
