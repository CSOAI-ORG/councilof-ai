import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./YieldDashboard.tsx", import.meta.url), "utf8");
const apiSource = readFileSync(
  new URL("../../../functions/api/yield.ts", import.meta.url),
  "utf8",
);

describe("yield dashboard contract", () => {
  it("fetches /api/yield with period param", () => {
    expect(source).toContain("/api/yield?period=");
  });

  it("renders a table with all four yield columns", () => {
    expect(source).toContain("Proofs Sold");
    expect(source).toContain("Feed Subs");
    expect(source).toContain("Attributed");
    expect(source).toContain("Total Yield");
  });

  it("has week/month toggle", () => {
    expect(source).toContain('"week"');
    expect(source).toContain('"month"');
    expect(source).toContain("setPeriod");
  });

  it("shows grand total prominently", () => {
    expect(source).toContain("total_yield");
    expect(source).toContain("Grand Total");
  });

  it("uses noindex (internal dashboard)", () => {
    expect(source).toContain('noindex,nofollow,noarchive');
  });
});

describe("yield API contract", () => {
  it("reads from REVENUE_KV when bound", () => {
    expect(apiSource).toContain("REVENUE_KV");
    expect(apiSource).toContain("settled:tx:");
  });

  it("returns zeros when KV is unbound, never errors", () => {
    expect(apiSource).toContain("UNMEASURED");
    expect(apiSource).not.toMatch(/status:\s*500/);
  });

  it("supports family filter", () => {
    expect(apiSource).toContain("searchParams.get");
    expect(apiSource).toContain("family");
  });

  it("supports week/month period", () => {
    expect(apiSource).toContain('"week"');
    expect(apiSource).toContain('"month"');
  });

  it("excludes self-settlements and zero-value", () => {
    expect(apiSource).toContain("selfWallets");
    expect(apiSource).toContain("zero_value");
  });

  it("derives families from resource patterns", () => {
    expect(apiSource).toContain("proofs");
    expect(apiSource).toContain("feeds");
    expect(apiSource).toContain("attributed");
  });
});
