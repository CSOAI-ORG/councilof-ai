import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  A_PLUS_PLUS_PLUS,
  CENSUS_STEPS,
  ELIGIBILITY_STATES,
  gateComplete,
  HUNDRED_ENVELOPE,
  HUNDRED_RULING,
  HUNDRED_TARGET,
  hundredResponses,
  HUB_LISTING,
  MILLIONS_NEVER_CLAIM,
  MILLIONS_PUBLIC_CLAIM,
  PERMISSIONLESS_NEVER,
  PERMISSIONLESS_UNLOCKS,
  PLANTED_CATALOG,
  PLANTED_QUEUE,
  publicCensusLine,
} from "./hundredGate";

const tools = readFileSync(resolve(__dirname, "../pages/ToolsPage.tsx"), "utf8");
const flags = readFileSync(resolve(__dirname, "./nSitesFlags.ts"), "utf8");

describe("100/100 A+++ permissionless gate", () => {
  it("covers millions by census and unlocks only after 100 unique lineages", () => {
    expect(HUNDRED_RULING).toMatch(/census/i);
    expect(HUNDRED_RULING).toMatch(/100 unique lineages/);
    expect(HUNDRED_RULING).toMatch(/permissionless/);
    expect(HUNDRED_TARGET).toBe(100);
    expect(hundredResponses()).toBe(45_000);
    expect(HUNDRED_ENVELOPE.tokens_approx).toBe(29_250_000);
    expect(A_PLUS_PLUS_PLUS).toHaveLength(7);
    expect(A_PLUS_PLUS_PLUS.some((c) => c.id === "unique-digest" && /:latest/i.test(c.must))).toBe(
      true,
    );
    expect(A_PLUS_PLUS_PLUS.some((c) => c.id === "rerun" && /second-provider|external/i.test(c.must))).toBe(
      true,
    );
    expect(A_PLUS_PLUS_PLUS.some((c) => c.id === "verify" && /did:web/i.test(c.must))).toBe(true);
    expect(gateComplete(99)).toBe(false);
    expect(gateComplete(100)).toBe(true);
  });

  it("walks Hub metadata without weights and keeps planted queues UNMEASURED", () => {
    expect(HUB_LISTING.digest).toMatch(/blobs=true/);
    expect(HUB_LISTING.digest).toMatch(/sha256/);
    expect(HUB_LISTING.digest).not.toMatch(/download.*weight|from_pretrained/i);
    expect(HUB_LISTING.mcp_limit).toMatch(/not the census rail/i);
    expect(HUB_LISTING.no_total).toMatch(/more than two million/);
    expect(CENSUS_STEPS).toHaveLength(4);
    expect(CENSUS_STEPS[0].does).toMatch(/No weights/);
    expect(ELIGIBILITY_STATES.map((s) => s.id)).toContain("DUPLICATE-DIGEST");
    expect(ELIGIBILITY_STATES.map((s) => s.id)).toContain("ELIGIBLE");
    expect(PLANTED_QUEUE.n).toBe(2410);
    expect(PLANTED_QUEUE.status_all).toBe("UNMEASURED");
    expect(PLANTED_QUEUE.n_measured).toBe(0);
    expect(PLANTED_CATALOG.items).toBe(154);
    expect(MILLIONS_PUBLIC_CLAIM).toMatch(/dated Hub walk/);
    expect(MILLIONS_NEVER_CLAIM).toMatch(/two million models/);
    expect(
      publicCensusLine({
        discovered: 2410,
        eligible: 0,
        unique: 0,
        measured: 0,
        axes: 15,
      }),
    ).toBe(
      "2410 discovered artefacts in a dated Hub walk; 0 licence-eligible; 0 unique immutable weight lineages; 0 measured across 15 GSPC axes.",
    );
  });

  it("permissionless after 100 is flags and census, not a 2M sweep or a sold rank", () => {
    expect(PERMISSIONLESS_UNLOCKS.some((u) => u.id === "flags")).toBe(true);
    expect(PERMISSIONLESS_UNLOCKS.some((u) => u.id === "census-refresh")).toBe(true);
    expect(PERMISSIONLESS_NEVER.some((n) => /2-million-model inference/i.test(n))).toBe(true);
    expect(PERMISSIONLESS_NEVER.some((n) => /hub-queue/i.test(n))).toBe(true);
    expect(PERMISSIONLESS_NEVER.some((n) => /sold rank/i.test(n))).toBe(true);
    expect(flags).toMatch(/Hundred unique weight lineages/);
    expect(flags).not.toMatch(/Fifty unique weight lineages/);
    const blob = JSON.stringify({
      HUNDRED_RULING,
      MILLIONS_NEVER_CLAIM,
      PERMISSIONLESS_NEVER,
      A_PLUS_PLUS_PLUS,
    });
    expect(blob).not.toMatch(/£79|£499|rank for sale|22\/22|dorado|cibola|sovos/i);
    expect(tools).toContain("HundredGate");
  });
});
