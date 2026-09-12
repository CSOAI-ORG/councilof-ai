import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet } from "./coverage";

const payloads: Record<string, unknown> = {
  "/api/gspc": {
    totals: {
      axes: 22,
      measured_axes: 22,
      financial_run_attestations: { ed25519_signed: 1 },
    },
  },
  "/interop/stablecoin-universe-2026-09/readiness.json": {
    coverage: {
      indexed_assets: 425,
      deeply_measured_assets: 1,
      asset_measurements_signed: 1,
      asset_measurements_current_root_included: 1,
      asset_measurements_rekor_witnessed_via_root: 1,
      asset_measurements_bitcoin_anchored_via_current_root: 1,
      asset_specific_x402_settlements_verified: 0,
    },
  },
  "/api/xrpl": {
    n: 16,
    writes_board: false,
    assets: [{ sig_ed25519: "sig", holders_state: "UNMEASURED", supply_state: "UNMEASURED" }],
  },
  "/api/swift": { n: 26, n_measured: 0, writes_board: false },
  "/api/bank-complete": {
    total_banks: 26,
    writes_board: false,
    banks: [{ status: "DISCOVERED" }],
  },
  "/api/x402": { resources: Array.from({ length: 9 }, () => ({})) },
  "/api/revenue": { one_number: { settlements: 1 } },
};

afterEach(() => vi.unstubAllGlobals());

describe("GET /api/coverage", () => {
  it("returns one non-additive lifecycle contract over every owning source", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const path = new URL(url).pathname;
        return new Response(JSON.stringify(payloads[path]), {
          status: payloads[path] ? 200 : 404,
          headers: { "content-type": "application/json" },
        });
      }),
    );

    const response = await onRequestGet({
      request: new Request("https://councilof.ai/api/coverage"),
    } as never);
    const body = (await response.json()) as any;

    expect(body.schema).toBe("csoai.master-coverage/0.1");
    expect(body.complete).toBe(true);
    expect(body.writes_board).toBe(false);
    expect(body.rows.map((row: any) => row.id)).toEqual([
      "gspc",
      "stablecoins",
      "xrpl",
      "swift",
      "banks",
      "x402",
    ]);
    expect(body.rows.find((row: any) => row.id === "stablecoins").indexed.value).toBe(425);
    expect(body.rows.find((row: any) => row.id === "xrpl").measured.value).toBe(0);
    expect(body.rows.find((row: any) => row.id === "x402").paid.value).toBe(1);
  });

  it("keeps a failed source visible and renders its lifecycle cells unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const path = new URL(url).pathname;
        if (path === "/api/swift") return new Response("unavailable", { status: 503 });
        return new Response(JSON.stringify(payloads[path]), {
          status: payloads[path] ? 200 : 404,
          headers: { "content-type": "application/json" },
        });
      }),
    );

    const response = await onRequestGet({
      request: new Request("https://councilof.ai/api/coverage"),
    } as never);
    const body = (await response.json()) as any;
    const swift = body.rows.find((row: any) => row.id === "swift");

    expect(body.complete).toBe(false);
    expect(body.sources.swift).toMatchObject({ http: 503, parsed: false });
    expect(swift.indexed.value).toBeNull();
    expect(swift.measured.value).toBeNull();
  });
});
