/**
 * Regression: the suffix-less aliases must resolve to the canonical manifest handlers.
 * (2026-10-13: a wrong export name compiled into an undefined Pages route binding and the
 * route served empty — the IronBridge grade caught it: "reachable 200, not JSON / empty".)
 * Shape (GET+HEAD, no catch-all, body parity) is asserted by x402-alias-parity.test.ts.
 */
import { describe, expect, it } from "vitest";
import { onRequestGet as slashlessGet, onRequestHead as slashlessHead } from "./x402";
import { onRequestGet as jsonGet, onRequestHead as jsonHead } from "./x402.json";

describe("well-known x402 (suffix-less) resolution", () => {
  it("resolves to the canonical handlers (bare specifier, both methods)", () => {
    expect(typeof slashlessGet).toBe("function");
    expect(typeof slashlessHead).toBe("function");
    expect(slashlessGet).toBe(jsonGet);
    expect(slashlessHead).toBe(jsonHead);
  });
});
