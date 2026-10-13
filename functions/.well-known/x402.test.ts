/**
 * Regression: the suffix-less /.well-known/x402 must serve the SAME handler as x402.json.
 * (2026-10-13: a bare "./x402.json" specifier resolved to a JSON import and the route
 * silently served empty — no test covered it, so CI stayed green.)
 */
import { describe, expect, it } from "vitest";
import { onRequestGet as fromSuffixless } from "./x402";
import { onRequestGet as fromJson } from "./x402.json";

describe("well-known x402 (suffix-less)", () => {
  it("exports the same handler as x402.json (bundler resolution)", () => {
    expect(typeof fromSuffixless).toBe("function");
    expect(fromSuffixless).toBe(fromJson);
  });
});
