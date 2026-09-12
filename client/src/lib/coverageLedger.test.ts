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

  it("fails closed when an endpoint is unavailable", () => {
    const rows = buildCoverageLedger({
      gspc: null,
      stablecoins: null,
      xrpl: null,
      swift: null,
      banks: null,
      x402: null,
      revenue: null,
    });
    for (const row of rows) {
      expect(row.indexed.value).toBeNull();
      expect(row.indexed.unavailable).toBeTruthy();
    }
  });
});
