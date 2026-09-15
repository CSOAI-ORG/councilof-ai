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
  a2a_card: { skills: [{ id: "gspc-board" }, { id: "x402-discovery" }, { id: "article50-detect" }] },
  erc8004: {
    indexer: "https://api.8004scan.io/api/v1/agents",
    probed_at: "2026-09-02T03:30:51Z",
    registry_totals: {
      registered_all_indexer: 803294,
      with_feedback_ge1: 138979,
    },
  },
  wrappers: {
    // UNMEASURED deliberately absent: the note must print "?" for it, never 0.
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

  const TABLE = {
    free: ["board_totals", "get_axis", "verify_card"],
    paid: ["commission_card", "rwa_evidence"],
  };

  it("counts the MCP tool table, not a typed number — control: another table gives another count", () => {
    const mcp = buildCoverageLedger(input, { mcpTools: TABLE }).find((row) => row.id === "mcp")!;
    expect(mcp.indexed.value).toBe(5);
    expect(mcp.note).toMatch(/serves 5 tools \(3 free readers \+ 2 x402-metered/);
    expect(mcp.note).toMatch(/v1\.4\.2/);
    expect(mcp.note).not.toMatch(/\b12 tools\b|Registry entry lags/);
    const bigger = buildCoverageLedger(input, {
      mcpTools: { free: [...TABLE.free, "mcp_trust"], paid: TABLE.paid },
    }).find((row) => row.id === "mcp")!;
    expect(bigger.indexed.value).toBe(6);
  });

  it("leaves the MCP count null without a tool table, without a live server, or when GET /mcp disagrees", () => {
    const noTable = buildCoverageLedger(input).find((row) => row.id === "mcp")!;
    expect(noTable.indexed.value).toBeNull();
    expect(noTable.indexed.unavailable).toMatch(/tool table is not available/);
    const down = buildCoverageLedger({ ...input, mcp: null }, { mcpTools: TABLE }).find((row) => row.id === "mcp")!;
    expect(down.indexed.value).toBeNull();
    expect(down.note).toMatch(/null, not zero/);
    const disagree = buildCoverageLedger(
      { ...input, mcp: { ...input.mcp, paid_tools: { names: ["commission_card"] } } },
      { mcpTools: TABLE },
    ).find((row) => row.id === "mcp")!;
    expect(disagree.indexed.value).toBeNull();
    expect(disagree.indexed.unavailable).toMatch(/disagrees/);
    const agree = buildCoverageLedger(
      { ...input, mcp: { ...input.mcp, paid_tools: { names: ["rwa_evidence", "commission_card"] } } },
      { mcpTools: TABLE },
    ).find((row) => row.id === "mcp")!;
    expect(agree.indexed.value).toBe(5);
  });

  it("keeps the MCP row's other stages null", () => {
    const mcp = buildCoverageLedger(input, { mcpTools: TABLE }).find((row) => row.id === "mcp")!;
    expect(mcp.measured.value).toBeNull();
    expect(mcp.measured.field).toMatch(/implemented tool count is not a measurement/);
    expect(mcp.measured.unavailable).toBeTruthy();
    expect(mcp.paid.value).toBe(1);
    expect(mcp.writesBoard).toBe(false);
  });

  it("counts A2A skills from the published agent card — control: no card, no count", () => {
    const a2a = buildCoverageLedger(input).find((row) => row.id === "a2a")!;
    expect(a2a.indexed.value).toBe(3);
    expect(a2a.indexed.source).toBe("GET /.well-known/agent-card.json");
    expect(a2a.note).toMatch(/3 implemented skills/);
    expect(a2a.note).toMatch(/gspc-board, x402-discovery, article50-detect/);
    expect(buildCoverageLedger({ ...input, a2a_card: null }).find((row) => row.id === "a2a")!.indexed.value).toBeNull();
    expect(buildCoverageLedger({ ...input, a2a: null }).find((row) => row.id === "a2a")!.indexed.value).toBeNull();
    expect(a2a.measured.value).toBeNull();
    expect(a2a.measured.field).toMatch(/implemented skill count is not a measurement/);
    expect(a2a.measured.unavailable).toBeTruthy();
    expect(a2a.signed.value).toBeNull();
    expect(a2a.writesBoard).toBe(false);
  });

  it("derives ERC-8004 row from registry_totals", () => {
    const erc = buildCoverageLedger(input).find((row) => row.id === "erc8004")!;
    expect(erc.indexed.value).toBe(803294);
    // The note repeats only what the probe publishes; the per-chain figures it once typed are gone.
    expect(erc.note).toMatch(/803294 registered, 138979 with at least one feedback/);
    expect(erc.note).not.toMatch(/50,783|86,263|16,518/);
    expect(erc.indexed.source).not.toMatch(/\/api\/erc8004\b/);
    expect(erc.measured.value).toBeNull();
    expect(erc.measured.field).toMatch(/indexer census is not a measurement/);
    expect(erc.measured.unavailable).toBeTruthy();
    expect(erc.signed.value).toBeNull();
  });

  it("never prints an unpublished wrapper or door count as 0", () => {
    const rows = buildCoverageLedger(input);
    const wrappers = rows.find((row) => row.id === "wrappers")!;
    expect(wrappers.note).toMatch(/escrow-parity reads: 8/);
    expect(wrappers.note).toMatch(/unmeasured: \?/);
    const bazaar = rows.find((row) => row.id === "bazaar")!;
    expect(bazaar.note).toMatch(/our own 9 doors are the x402 row/);
    const noDoors = buildCoverageLedger({ ...input, x402: null }).find((row) => row.id === "bazaar")!;
    expect(noDoors.note).toMatch(/our own \? doors/);
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
      a2a_card: null,
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
