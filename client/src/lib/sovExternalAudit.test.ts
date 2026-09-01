import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  KEEP_ARMS,
  LIVE_PIN,
  SOV_AUDIT_CLAIMS,
  SOV_AUDIT_RULING,
  claimsByVerdict,
  keepCount,
} from "./sovExternalAudit";

const products = readFileSync(resolve(__dirname, "../pages/Products.tsx"), "utf8");

describe("External SOV / XRPL / T-REX form", () => {
  it("keeps the three-arm map and the living board pin", () => {
    expect(SOV_AUDIT_RULING).toMatch(/living board/);
    expect(keepCount()).toBeGreaterThanOrEqual(10);
    expect(LIVE_PIN.public_count).toBe("22 axis · 15 measured");
    expect(LIVE_PIN.measured_axes).toBe(15);
    expect(LIVE_PIN.items).toBe(893);
    expect(LIVE_PIN.corrections).toBe(30);
    expect(LIVE_PIN.index_schema).toBe("csoai.sov-signal-index/1");
    expect(LIVE_PIN.index_not_certification).toBe(true);
    expect(KEEP_ARMS).toHaveLength(3);
    expect(KEEP_ARMS[2].maps).toMatch(/reader|attester/i);
    expect(claimsByVerdict("stale").some((c) => c.id === "xrpl-devnet")).toBe(true);
    expect(claimsByVerdict("keep").some((c) => c.id === "no-sov-token")).toBe(true);
    expect(claimsByVerdict("keep").some((c) => c.id === "four-skus")).toBe(true);
  });

  it("drops stale counts, fused tokens and Council-issued bonds", () => {
    expect(claimsByVerdict("stale").some((c) => c.id === "stale-board-counts")).toBe(true);
    expect(claimsByVerdict("false").some((c) => c.id === "no-hf-org")).toBe(true);
    expect(claimsByVerdict("false").some((c) => c.id === "mcp-three-hundred")).toBe(true);
    expect(claimsByVerdict("forbidden").some((c) => c.id === "fused-sov-token")).toBe(true);
    expect(claimsByVerdict("forbidden").some((c) => c.id === "release-bond-oracle")).toBe(true);
    expect(claimsByVerdict("forbidden").some((c) => c.id === "onchain-measured")).toBe(true);
    expect(claimsByVerdict("forbidden").some((c) => c.id === "seat-prices")).toBe(true);
    expect(claimsByVerdict("forbidden").some((c) => c.id === "invented-issuer")).toBe(true);
    const blob = JSON.stringify({ SOV_AUDIT_CLAIMS, LIVE_PIN, KEEP_ARMS, SOV_AUDIT_RULING });
    expect(blob).not.toMatch(/£79|£499|rank for sale|22\/22|dorado|cibola|sovos|sov3/i);
    expect(blob).not.toMatch(/rCsoai/i);
    expect(products).toContain("SovExternalAudit");
  });
});
