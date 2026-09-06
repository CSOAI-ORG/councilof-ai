/**
 * Every figure is pinned to the endpoint field it came from, using the shapes those
 * endpoints actually returned on 2026-09-06. Typing a number in by hand fails here.
 */
import { describe, expect, it } from "vitest";
import { a2aPanel, banksPanel, financePanel, swiftLadder } from "./osPanels";

/** Verbatim shapes, trimmed to the fields these panels read. */
const XRPL = { n: 16, assets: Array.from({ length: 16 }, (_, i) => ({ symbol: `A${i}` })) };
const SWIFT = { n: 26, n_measured: 0, n_live: 3, n_committed: 9, n_discovered: 14 };
const BANK = { total_banks: 26, total_records: 4000, status: "READER", banks: Array.from({ length: 26 }, () => ({})) };
const CARD = { skills: Array.from({ length: 7 }, (_, i) => ({ id: `s${i}` })) };
const A2A_ROUTE = { protocolVersion: "1.0" };

describe("finance panel", () => {
  it("takes its count from /api/xrpl and says so", () => {
    const p = financePanel(XRPL);
    expect(p.assets).toEqual({ value: 16, endpoint: "GET /api/xrpl", field: "n" });
    expect(p.assetsListed.value).toBe(16);
  });

  it("marks the per-asset evidence door as metered, not free", () => {
    // measured: GET /api/rwa/evidence?asset=RLUSD -> 402 with accepts[]
    expect(financePanel(XRPL).evidenceDoor.state).toBe("METERED");
  });

  it("reports null, never 0, when the endpoint did not answer", () => {
    const p = financePanel(null);
    expect(p.assets.value).toBeNull();
    expect(p.assets.value).not.toBe(0);
    expect(p.assets.unavailable).toMatch(/did not answer/);
  });

  it("reports null when the endpoint answered without the field", () => {
    const p = financePanel({ something_else: 1 });
    expect(p.assets.value).toBeNull();
    expect(p.assets.unavailable).toMatch(/without n/);
  });
});

describe("swift ladder", () => {
  it("reads every rung from /api/swift", () => {
    const l = swiftLadder(SWIFT);
    expect(l.total.value).toBe(26);
    expect(l.rungs.live.value).toBe(3);
    expect(l.rungs.committed.value).toBe(9);
    expect(l.rungs.discovered.value).toBe(14);
    expect(l.rungs.measured.value).toBe(0);
    expect(l.rungs.live.endpoint).toBe("GET /api/swift");
  });

  it("checks the rungs actually sum to the total", () => {
    const l = swiftLadder(SWIFT);
    expect(l.rungSum).toBe(26);
    expect(l.consistent).toBe(true);
  });

  it("says INCONSISTENT rather than rendering a ladder that does not add up", () => {
    const l = swiftLadder({ ...SWIFT, n: 30 });
    expect(l.rungSum).toBe(26);
    expect(l.consistent).toBe(false);
  });

  it("keeps measured as its own rung — 0 is a real measurement, not missing data", () => {
    const l = swiftLadder(SWIFT);
    expect(l.rungs.measured.value).toBe(0);
    expect(l.rungs.measured.unavailable).toBeUndefined();
  });

  it("legend says only MEASURED is a run against a frozen bank", () => {
    expect(swiftLadder(SWIFT).legend).toMatch(/Only MEASURED means a run against a frozen bank/i);
  });
});

describe("banks panel", () => {
  it("keeps institutions and rows apart", () => {
    const b = banksPanel(BANK);
    expect(b.banks.value).toBe(26);
    expect(b.records.value).toBe(4000);
    expect(b.banks.field).toBe("total_banks");
    expect(b.records.field).toBe("total_records");
    expect(b.note).toMatch(/different things/);
  });

  it("cross-checks the declared count against the array actually served", () => {
    expect(banksPanel(BANK).banksListed.value).toBe(26);
    expect(banksPanel({ ...BANK, banks: [{}] }).banksListed.value).toBe(1);
  });

  it("carries the endpoint's own status rather than implying MEASURED", () => {
    expect(banksPanel(BANK).status).toBe("READER");
  });
});

describe("a2a panel", () => {
  it("counts skills from the SERVED card, not the route that points at it", () => {
    const a = a2aPanel(CARD, A2A_ROUTE);
    expect(a.skills.value).toBe(7);
    expect(a.skills.endpoint).toBe("GET /.well-known/agent-card.json");
  });

  it("catches the live disagreement: the route claims 1.0, the card declares none", () => {
    const a = a2aPanel(CARD, A2A_ROUTE);
    expect(a.cardVersion).toBeNull();
    expect(a.routeVersion).toBe("1.0");
    expect(a.versionMismatch).toBe(true);
    expect(a.mismatchNote).toMatch(/A consumer reads the card/);
  });

  it("reports agreement when both surfaces say the same thing", () => {
    const a = a2aPanel({ ...CARD, protocolVersion: "1.0" }, A2A_ROUTE);
    expect(a.versionMismatch).toBe(false);
    expect(a.mismatchNote).toBeNull();
  });
});
