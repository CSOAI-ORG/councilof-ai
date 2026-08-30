import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  EARN_RULING,
  EARN_WEDGE,
  earnableNow,
  OPEN_SDKS,
  OPENINGS,
  openingsWhen,
} from "./permissionlessRevenue";

const products = readFileSync(resolve(__dirname, "../pages/Products.tsx"), "utf8");

describe("Permissionless revenue — work, not rank", () => {
  it("opens enquiry, RAS, census and SDK funnels now", () => {
    expect(EARN_RULING).toMatch(/assembling and licensing work/i);
    expect(EARN_RULING).toMatch(/Do not mint, mine or coupon a grade/);
    expect(EARN_WEDGE).toMatch(/assembly/);
    expect(earnableNow().map((o) => o.id)).toEqual(
      expect.arrayContaining(["enquiry-skus", "ras-refresh", "census-data", "corrections-sla", "sdk-funnel"]),
    );
    expect(OPEN_SDKS.some((s) => s.id === "x402-card")).toBe(true);
    expect(OPEN_SDKS.some((s) => s.id === "ras-pack")).toBe(true);
    expect(OPEN_SDKS.some((s) => s.id === "npm")).toBe(true);
    expect(OPEN_SDKS.some((s) => s.id === "a2a-card")).toBe(true);
    expect(openingsWhen("after-payto").some((o) => o.id === "x402-assemble" && /invented payTo/i.test(o.never))).toBe(
      true,
    );
    expect(openingsWhen("after-100").some((o) => o.id === "rerun-work")).toBe(true);
  });

  it("forbids minting tokens from scores and keeps attester-not-issuer", () => {
    expect(openingsWhen("never").some((o) => o.id === "mint-sov")).toBe(true);
    expect(OPENINGS.some((o) => o.id === "attester-not-issuer" && /Never.*issuer|never the coupon/i.test(o.eats + o.never))).toBe(
      true,
    );
    const blob = JSON.stringify({ EARN_RULING, EARN_WEDGE, OPENINGS, OPEN_SDKS });
    expect(blob).not.toMatch(/£79|£499|rank for sale|22\/22|dorado|cibola|sovos|sov3/i);
    expect(blob).not.toMatch(/we (?:mine|mint) (?:XRP|SOV|GAT)/i);
    expect(products).toContain("PermissionlessRevenue");
  });
});
