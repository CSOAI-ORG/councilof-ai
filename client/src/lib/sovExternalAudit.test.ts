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
import { BOARD_COUNT_OBSERVED, BOARD_OBSERVATION } from "./boardCount";

const products = readFileSync(resolve(__dirname, "../pages/Products.tsx"), "utf8");
const internal = readFileSync(resolve(__dirname, "../pages/YieldInternal.tsx"), "utf8");

describe("External XRPL / T-REX form", () => {
  it("keeps the three-arm map and the living board pin", () => {
    expect(SOV_AUDIT_RULING).toMatch(/living board/);
    expect(keepCount()).toBeGreaterThanOrEqual(10);
    // Board fields come from the recorded observation, never a number typed in the pin.
    expect(LIVE_PIN.public_count).toBe(BOARD_COUNT_OBSERVED.public_count);
    expect(LIVE_PIN.axes).toBe(BOARD_COUNT_OBSERVED.axes);
    expect(LIVE_PIN.measured_axes).toBe(BOARD_COUNT_OBSERVED.measured_axes);
    expect(LIVE_PIN.measured_axes).toBeLessThanOrEqual(LIVE_PIN.axes);
    expect(LIVE_PIN.public_count).toContain(String(LIVE_PIN.measured_axes));
    expect(LIVE_PIN.items).toBe(BOARD_OBSERVATION.items);
    expect(LIVE_PIN.board_as_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(LIVE_PIN.corrections).toBe(39);
    // A pinned count is a dated snapshot, so it must carry its date.
    expect(LIVE_PIN.as_at).toBeTruthy();
    expect(LIVE_PIN.index_schema).toBe("csoai.sov-signal-index/1");
    expect(LIVE_PIN.index_not_certification).toBe(true);
    expect(KEEP_ARMS).toHaveLength(3);
    expect(KEEP_ARMS[2].maps).toMatch(/reader|attester/i);
    expect(claimsByVerdict("stale").some((c) => c.id === "xrpl-devnet")).toBe(true);
    expect(claimsByVerdict("stale").some((c) => c.id === "six-axis")).toBe(false);
    expect(LIVE_PIN.index_public_label).toBe("signed coverage index");
    expect(JSON.stringify(SOV_AUDIT_CLAIMS)).not.toMatch(/Six-axis benchmarks|sov-claim-six-axis/i);
    expect(claimsByVerdict("keep").some((c) => c.id === "no-index-token")).toBe(true);
    expect(claimsByVerdict("keep").some((c) => c.id === "four-skus")).toBe(true);
  });

  it("drops stale counts, fused tokens and Council-issued bonds", () => {
    expect(claimsByVerdict("stale").some((c) => c.id === "stale-board-counts")).toBe(true);
    expect(claimsByVerdict("false").some((c) => c.id === "no-hf-org")).toBe(true);
    expect(claimsByVerdict("false").some((c) => c.id === "mcp-three-hundred")).toBe(true);
    expect(claimsByVerdict("forbidden").some((c) => c.id === "fused-index-token")).toBe(true);
    expect(claimsByVerdict("forbidden").some((c) => c.id === "release-bond-oracle")).toBe(true);
    expect(claimsByVerdict("forbidden").some((c) => c.id === "onchain-measured")).toBe(true);
    expect(claimsByVerdict("forbidden").some((c) => c.id === "seat-prices")).toBe(true);
    expect(claimsByVerdict("forbidden").some((c) => c.id === "invented-issuer")).toBe(true);
    const blob = JSON.stringify({ SOV_AUDIT_CLAIMS, LIVE_PIN, KEEP_ARMS, SOV_AUDIT_RULING });
    expect(blob).not.toMatch(/£79|£499|rank for sale|22\/22|dorado|cibola|sovos|sov3/i);
    expect(blob).not.toMatch(/rCsoai/i);
    // Operator notes live on the noindex /status/internal page, never on /products (6 Oct 2026).
    expect(internal).toContain("<SovExternalAudit ");
    expect(products).not.toContain("<SovExternalAudit");
  });
});
