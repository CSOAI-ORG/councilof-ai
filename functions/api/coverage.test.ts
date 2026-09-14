import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet } from "./coverage";

const payloads: Record<string, unknown> = {
  // The three agent-economy sources added with the mcp/a2a/erc8004 rows; every
  // owning source must answer or `complete` is false by design.
  "/mcp": { ok: true, server_info: { version: "1.4.2" } },
  "/api/a2a": { protocolVersion: "1.0" },
  "/interop/erc8004-callable/probe-registered-vs-callable-2026-09-02.json": {
    registry_totals: { registered_all_indexer: 137046 },
  },
  "/interop/root-kinds.json": { by_kind: { "csoai.wrapper.parity/0.1": 17, "csoai.eater.xrpl-issuer/0.1": 16 }, card_count: 294 },
  "/interop/wrapped-asset-parity-latest.json": {
    counts: { ESCROW_PARITY_READ: 8, UNCHECKABLE_NATIVE_ISSUANCE: 4, INDEXED_CUSTODIAL: 5 },
    records: Array.from({ length: 17 }, (_, i) => ({ id: `pair-${i}` })),
  },
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
      "mcp",
      "a2a",
      "erc8004",
      "wrappers",
    ]);
    expect(body.rows.find((row: any) => row.id === "stablecoins").indexed.value).toBe(425);
    expect(body.rows.find((row: any) => row.id === "xrpl").measured.value).toBe(0);
    expect(body.rows.find((row: any) => row.id === "x402").paid.value).toBe(1);
    expect(body.rows.find((row: any) => row.id === "mcp").indexed.value).toBe(12);
    expect(body.rows.find((row: any) => row.id === "a2a").indexed.value).toBe(7);
    expect(body.rows.find((row: any) => row.id === "erc8004").indexed.value).toBe(137046);
    expect(body.rows.find((row: any) => row.id === "erc8004").signed.value).toBeNull();
    expect(body.rows.find((row: any) => row.id === "wrappers").indexed.value).toBe(17);
    expect(body.rows.find((row: any) => row.id === "wrappers").measured.value).toBeNull();
    expect(body.rows.find((row: any) => row.id === "wrappers").signed.value).toBe(17);
    expect(body.rows.find((row: any) => row.id === "wrappers").rooted.value).toBe(17);
    expect(body.rows.find((row: any) => row.id === "wrappers").note).toMatch(/escrow-parity reads: 8/);
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
