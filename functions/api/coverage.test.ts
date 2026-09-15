import { afterEach, describe, expect, it, vi } from "vitest";
import { MCP_TOOL_TABLE, onRequestGet } from "./coverage";
import GSPC_TOOLS from "../mcp/gspc-tools.json";
import PAID_TOOLS from "../mcp/paid-tools.json";

const payloads: Record<string, unknown> = {
  // The three agent-economy sources added with the mcp/a2a/erc8004 rows; every
  // owning source must answer or `complete` is false by design.
  "/mcp": { ok: true, server_info: { version: "1.4.2" } },
  "/api/a2a": { protocolVersion: "1.0" },
  "/.well-known/agent-card.json": { skills: [{ id: "gspc-board" }, { id: "x402-discovery" }] },
  "/interop/erc8004-callable/probe-registered-vs-callable-2026-09-02.json": {
    registry_totals: { registered_all_indexer: 137046 },
  },
  "/interop/root-kinds.json": { by_kind: { "csoai.wrapper.parity/0.1": 17, "csoai.eater.xrpl-issuer/0.1": 16 }, card_count: 294 },
  "/datasets/csoai/x402-bazaar-conformance/resolve/main/summary-latest.json": {
    as_of: "2026-09-14T02:29:40Z",
    hosts_distinct: 2990,
    hosts_probed: 2990,
    indexes: { cdp: { resources: 15403 }, payai: { resources: 28619 } },
    headline: { conformant: 414, conformant_pct: 13.85, unreachable: 284 },
  },
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
      "bazaar",
    ]);
    expect(body.rows.find((row: any) => row.id === "stablecoins").indexed.value).toBe(425);
    expect(body.rows.find((row: any) => row.id === "xrpl").measured.value).toBe(0);
    expect(body.rows.find((row: any) => row.id === "x402").paid.value).toBe(1);
    // The MCP count is the tool table tools/list serves (paid-tools.test.ts pins tools/list to
    // exactly these two files), so a tool added to either file moves this number with it.
    const tableCount = GSPC_TOOLS.tools.length + PAID_TOOLS.tools.length;
    expect(MCP_TOOL_TABLE.free.length + MCP_TOOL_TABLE.paid.length).toBe(tableCount);
    expect(body.rows.find((row: any) => row.id === "mcp").indexed.value).toBe(tableCount);
    expect(body.rows.find((row: any) => row.id === "mcp").note).toContain(
      `serves ${tableCount} tools (${GSPC_TOOLS.tools.length} free readers + ${PAID_TOOLS.tools.length} x402-metered`,
    );
    expect(body.rows.find((row: any) => row.id === "mcp").measured.value).toBeNull();
    expect(body.rows.find((row: any) => row.id === "a2a").indexed.value).toBe(2);
    expect(body.sources.a2a_card).toMatchObject({ http: 200, parsed: true });
    expect(body.rows.find((row: any) => row.id === "a2a").measured.value).toBeNull();
    expect(body.rows.find((row: any) => row.id === "erc8004").indexed.value).toBe(137046);
    expect(body.rows.find((row: any) => row.id === "erc8004").measured.value).toBeNull();
    expect(body.rows.find((row: any) => row.id === "erc8004").signed.value).toBeNull();
    expect(body.rows.find((row: any) => row.id === "wrappers").indexed.value).toBe(17);
    expect(body.rows.find((row: any) => row.id === "wrappers").measured.value).toBeNull();
    expect(body.rows.find((row: any) => row.id === "wrappers").signed.value).toBe(17);
    expect(body.rows.find((row: any) => row.id === "wrappers").rooted.value).toBe(17);
    expect(body.rows.find((row: any) => row.id === "wrappers").note).toMatch(/escrow-parity reads: 8/);
    expect(body.rows.find((row: any) => row.id === "bazaar").indexed.value).toBe(2990);
    expect(body.rows.find((row: any) => row.id === "bazaar").measured.value).toBeNull();
    expect(body.rows.find((row: any) => row.id === "bazaar").note).toMatch(/414 answered a conformant v2 402/);
    expect(body.rows.find((row: any) => row.id === "bazaar").note).toMatch(/our own 9 doors are the x402 row/);
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
