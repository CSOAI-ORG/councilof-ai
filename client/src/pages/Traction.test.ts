import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Traction.tsx", import.meta.url), "utf8");
const ia = readFileSync(new URL("../data/library-ia.ts", import.meta.url), "utf8");

describe("traction public-truth contract", () => {
  it("derives operating and commercial counters from public JSON", () => {
    for (const endpoint of ["/root.json", "/api/revenue", "/api/commissions", "/api/coverage", "/api/worker"]) {
      expect(source).toContain(endpoint);
    }
    expect(source).toContain("No cached number substituted");
  });

  it("separates standards participation and discovery from endorsement and customers", () => {
    expect(source).toContain("Founder Nicholas Templeman participates in the W3C Agent Conformance and Benchmarking Community Group");
    expect(source).toContain("does not imply W3C endorsement, certification or conformance");
    expect(source).toContain("not a customer count or endorsement");
    expect(source).toContain("strict ledger above counts verified non-self payers");
  });

  it("removes the stale August vanity inventory and keeps traction primary", () => {
    expect(source).not.toMatch(/15574|21091|579 public repos|last audit: 2026-08-10/);
    expect(ia).toMatch(/"\/faq", "\/traction"/);
  });
});
