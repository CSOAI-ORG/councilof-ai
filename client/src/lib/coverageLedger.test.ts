import { describe, expect, it } from "vitest";
import { buildCoverageLedger, isCoverageSnapshot } from "./coverageLedger";

const input = {
  gspc: {
    totals: {
      axes: 22,
      measured_axes: 22,
      financial_run_attestations: { ed25519_signed: 1 },
    },
  },
  stablecoins: {
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
  xrpl: {
    n: 16,
    writes_board: false,
    assets: [
      {
        sig_ed25519: "a",
        holders_state: "UNMEASURED",
        supply_state: "UNMEASURED",
      },
      {
        sig_ed25519: "b",
        holders_state: "MEASURED",
        supply_state: "UNMEASURED",
      },
      {
        sig_ed25519: null,
        holders_state: "UNMEASURED",
        supply_state: "UNMEASURED",
      },
    ],
  },
  swift: { n: 26, n_measured: 0, writes_board: false },
  banks: {
    total_banks: 26,
    writes_board: false,
    banks: [{ status: "DISCOVERED" }, { status: "UNCHECKABLE" }],
  },
  x402: { resources: Array.from({ length: 9 }, () => ({})) },
  revenue: { one_number: { settlements: 1 } },
  mcp: { ok: true, server_info: { version: "1.4.2" } },
  a2a: { protocolVersion: "1.0", endpoint: "https://councilof.ai/api/a2a" },
  erc8004: {
    registry_totals: {
      registered_all_indexer: 803294,
      with_feedback_ge1: 138979,
    },
  },
  wrappers: {
    counts: { ESCROW_PARITY_READ: 8, UNCHECKABLE_NATIVE_ISSUANCE: 4, INDEXED_CUSTODIAL: 5 },
    records: Array.from({ length: 17 }, (_, i) => ({ id: `pair-${i}` })),
  },
  root_kinds: { by_kind: { "csoai.wrapper.parity/0.1": 17 }, card_count: 294 },
  bazaar: {
    as_of: "2026-09-14T02:29:40Z",
    hosts_distinct: 2990,
    hosts_probed: 2990,
    indexes: { cdp: { resources: 15403 }, payai: { resources: 28619 } },
    headline: { conformant: 414, conformant_pct: 13.85, unreachable: 284 },
  },
};

describe("master GSPC coverage ledger", () => {
  it("recognizes only the versioned machine-readable snapshot", () => {
    expect(
      isCoverageSnapshot({
        schema: "csoai.master-coverage/0.1",
        complete: true,
        rows: [],
      }),
    ).toBe(true);
    expect(
      isCoverageSnapshot({ schema: "csoai.master-coverage/0.1", rows: [] }),
    ).toBe(false);
    expect(
      isCoverageSnapshot({ schema: "wrong", complete: true, rows: [] }),
    ).toBe(false);
  });

  it("keeps indexed, measured, signed, anchored and paid as separate states", () => {
    const rows = buildCoverageLedger(input);
    const stablecoins = rows.find((row) => row.id === "stablecoins")!;
    expect(stablecoins.indexed.value).toBe(425);
    expect(stablecoins.measured.value).toBe(1);
    expect(stablecoins.signed.value).toBe(1);
    expect(stablecoins.anchored.value).toBe(1);
    expect(stablecoins.paid.value).toBe(0);
  });

  it("derives XRPL row states from the served asset rows", () => {
    const xrpl = buildCoverageLedger(input).find((row) => row.id === "xrpl")!;
    expect(xrpl.indexed.value).toBe(16);
    expect(xrpl.measured.value).toBe(1);
    expect(xrpl.signed.value).toBe(2);
    expect(xrpl.writesBoard).toBe(false);
  });

  it("counts no measured bank when every row is discovery or uncheckable", () => {
    const banks = buildCoverageLedger(input).find((row) => row.id === "banks")!;
    expect(banks.indexed.value).toBe(26);
    expect(banks.measured.value).toBe(0);
  });

  it("keeps unsupported lifecycle stages null rather than inventing zero", () => {
    const x402 = buildCoverageLedger(input).find((row) => row.id === "x402")!;
    expect(x402.indexed.value).toBe(9);
    expect(x402.measured.value).toBeNull();
    expect(x402.paid.value).toBe(1);
  });

  it("derives MCP row from server_info", () => {
    const mcp = buildCoverageLedger(input).find((row) => row.id === "mcp")!;
    expect(mcp.indexed.value).toBe(12);
    expect(mcp.measured.value).toBeNull();
    expect(mcp.measured.field).toMatch(/implemented tool count is not a measurement/);
    expect(mcp.measured.unavailable).toBeTruthy();
    expect(mcp.paid.value).toBe(1);
    expect(mcp.writesBoard).toBe(false);
  });

  it("derives A2A row from protocol version", () => {
    const a2a = buildCoverageLedger(input).find((row) => row.id === "a2a")!;
    expect(a2a.indexed.value).toBe(7);
    expect(a2a.measured.value).toBeNull();
    expect(a2a.measured.field).toMatch(/implemented skill count is not a measurement/);
    expect(a2a.measured.unavailable).toBeTruthy();
    expect(a2a.signed.value).toBeNull();
    expect(a2a.writesBoard).toBe(false);
  });

  it("derives ERC-8004 row from registry_totals", () => {
    const erc = buildCoverageLedger(input).find((row) => row.id === "erc8004")!;
    expect(erc.indexed.value).toBe(803294);
    expect(erc.measured.value).toBeNull();
    expect(erc.measured.field).toMatch(/indexer census is not a measurement/);
    expect(erc.measured.unavailable).toBeTruthy();
    expect(erc.signed.value).toBeNull();
  });

  it("AP2 row does not exist (no implementation)", () => {
    const rows = buildCoverageLedger(input);
    const ap2 = rows.find((row) => row.id === "ap2");
    expect(ap2).toBeUndefined();
  });

  it("fails closed when an endpoint is unavailable", () => {
    const rows = buildCoverageLedger({
      gspc: null,
      stablecoins: null,
      xrpl: null,
      swift: null,
      banks: null,
      x402: null,
      revenue: null,
      mcp: null,
      a2a: null,
      erc8004: null,
      wrappers: null,
      root_kinds: null,
      bazaar: null,
    });
    for (const row of rows) {
      expect(row.indexed.value).toBeNull();
      expect(row.indexed.unavailable).toBeTruthy();
    }
  });
});
