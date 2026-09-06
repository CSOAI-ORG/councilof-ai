/**
 * PHASE B. osPanels.ts landed with tests and was then imported by nothing but
 * its own test — a derive layer nothing renders is built-but-unwired, which is
 * the condition this phase exists to clear. These assert it is wired, and that
 * the pane cannot turn an unread source into a zero.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { a2aPanel, banksPanel, financePanel, swiftLadder } from "@/lib/osPanels";

const pane = readFileSync(resolve(__dirname, "OsPanels.tsx"), "utf8");
const host = readFileSync(resolve(__dirname, "DashboardStatePane.tsx"), "utf8");

/** The live shapes, measured 2026-09-06 against councilof.ai. */
const XRPL = { n: 16, assets: new Array(16).fill({}) };
const SWIFT = { n: 26, n_measured: 0, n_live: 3, n_committed: 9, n_discovered: 14 };
const BANK = { total_banks: 26, banks: new Array(26).fill({}) };
const CARD = { skills: new Array(7).fill({}) };
const A2A = { protocolVersion: "1.0" };

describe("the derive layer is actually mounted", () => {
  it("is rendered by the dashboard state tab", () => {
    expect(host).toContain("OsPanels");
    expect(host).toContain('data-testid="dashboard-state-panels"');
  });

  it("renders all four panels", () => {
    for (const id of ["panel-finance", "panel-swift", "panel-banks", "panel-a2a"]) {
      expect(pane).toContain(id);
    }
  });

  it("reads each door by name rather than deriving one from another", () => {
    for (const door of [
      "/api/xrpl",
      "/api/swift",
      "/api/bank-complete",
      "/.well-known/agent-card.json",
      "/api/a2a",
    ]) {
      expect(pane).toContain(door);
    }
    // the board is not a source for any of these panels
    expect(pane).not.toContain("/api/gspc");
  });

  it("shows the endpoint and field beside every figure", () => {
    expect(pane).toContain("{n.endpoint}");
    expect(pane).toContain("{n.field}");
  });
});

describe("an unread source is never a zero", () => {
  it("renders UNREAD and the reason when a door did not answer", () => {
    expect(pane).toContain("UNREAD");
    expect(pane).toContain("{n.unavailable}");
    // no coalescing of a null figure into 0 anywhere in the pane
    expect(pane).not.toMatch(/value\s*\?\?\s*0|\.value\s*\|\|\s*0/);
  });

  it("the panels themselves report null, not 0, for a door that did not answer", () => {
    expect(financePanel(null).assets.value).toBeNull();
    expect(financePanel(null).assets.unavailable).toContain("did not answer");
    expect(banksPanel(null).banks.value).toBeNull();
    expect(swiftLadder(null).total.value).toBeNull();
    expect(a2aPanel(null, null).skills.value).toBeNull();
  });
});

describe("the figures equal the endpoints", () => {
  it("finance quotes /api/xrpl's own n and list length", () => {
    const f = financePanel(XRPL);
    expect(f.assets.value).toBe(16);
    expect(f.assetsListed.value).toBe(16);
    expect(f.evidenceDoor.state).toBe("METERED");
  });

  it("the SWIFT ladder adds up against the endpoint's own total", () => {
    const l = swiftLadder(SWIFT);
    expect(l.rungSum).toBe(26); // 3 live + 9 committed + 14 discovered
    expect(l.total.value).toBe(26);
    expect(l.consistent).toBe(true);
    expect(l.rungs.measured.value).toBe(0); // top rung, counted separately
  });

  it("says so loudly when the rungs do NOT add up", () => {
    const l = swiftLadder({ ...SWIFT, n: 99 });
    expect(l.consistent).toBe(false);
    expect(pane).toContain("They disagree, so this ladder is not a count you should quote");
  });

  it("banks keeps the declared total and the shipped rows apart", () => {
    const b = banksPanel(BANK);
    expect(b.banks.value).toBe(26);
    expect(b.banksListed.value).toBe(26);
    expect(b.banks.field).not.toBe(b.banksListed.field);
  });

  it("A2A counts skills from the SERVED card and flags the live version mismatch", () => {
    const a = a2aPanel(CARD, A2A);
    expect(a.skills.value).toBe(7);
    expect(a.skills.endpoint).toContain("agent-card.json");
    // measured live: the card declares no protocolVersion, the route says 1.0
    expect(a.cardVersion).toBeNull();
    expect(a.routeVersion).toBe("1.0");
    expect(a.versionMismatch).toBe(true);
    expect(a.mismatchNote).toContain("A consumer reads the card");
    expect(pane).toContain("a2a-mismatch");
  });
});
