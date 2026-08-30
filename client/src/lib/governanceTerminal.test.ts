import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { rowsByKind, TERMINAL_PITCH, TERMINAL_RULING, TERMINAL_ROWS } from "./governanceTerminal";

const products = readFileSync(resolve(__dirname, "../pages/Products.tsx"), "utf8");

describe("Governance terminal moat", () => {
  it("keeps the chart as the moat and lists what we forgot", () => {
    expect(TERMINAL_RULING).toMatch(/moat is the chart/);
    expect(TERMINAL_PITCH).toMatch(/Not a trust-score terminal/);
    expect(rowsByKind("moat").some((r) => r.id === "moat-corrections")).toBe(true);
    expect(rowsByKind("moat").some((r) => r.id === "moat-empty")).toBe(true);
    expect(rowsByKind("forgot").some((r) => r.id === "forgot-mnemonics")).toBe(true);
    expect(rowsByKind("forgot").some((r) => r.id === "forgot-watchlist")).toBe(true);
    expect(rowsByKind("steal").some((r) => r.id === "steal-hf")).toBe(true);
    expect(rowsByKind("steal").some((r) => r.id === "steal-bberg")).toBe(true);
    expect(rowsByKind("never").some((r) => r.id === "never-trust-score")).toBe(true);
    expect(TERMINAL_ROWS.length).toBeGreaterThanOrEqual(14);
  });

  it("does not invent payTo or a sold rank", () => {
    const blob = JSON.stringify({ TERMINAL_RULING, TERMINAL_PITCH, TERMINAL_ROWS });
    expect(blob).not.toMatch(/£79|£499|rank for sale|22\/22|dorado|cibola|sovos/i);
    expect(blob).toMatch(/Do not invent a receiver/);
    expect(products).toContain("GovernanceTerminal");
    expect(products).toContain("HealthTerms");
  });
});
