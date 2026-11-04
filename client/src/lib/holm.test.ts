/**
 * holm.test.ts — every number checked by hand. The Holm step thresholds are the arithmetic of the
 * procedure (α/(m−rank+1)); the required-n vector is the score-test formula stated in the source.
 * If these fail, the disclosure component must not render a table.
 */
import { describe, expect, it } from "vitest";
import {
  holmThresholdAt,
  holmThresholds,
  holmVerdict,
  mcnemarRequiredPairedN,
  naiveFamilyFalseLeaderOdds,
} from "./holm";

describe("the Holm family rule, by hand", () => {
  it("step thresholds are α/(m−rank+1)", () => {
    expect(holmThresholdAt(14, 1)).toBeCloseTo(0.05 / 14, 12);
    expect(holmThresholdAt(14, 7)).toBeCloseTo(0.05 / 8, 12);
    expect(holmThresholdAt(14, 14)).toBeCloseTo(0.05, 12);
  });

  it("the 14-axis table widens monotonically and ends at α", () => {
    const steps = holmThresholds(14);
    expect(steps).toHaveLength(14);
    for (let i = 1; i < steps.length; i++) expect(steps[i]).toBeGreaterThan(steps[i - 1]);
    expect(steps[0]).toBeCloseTo(0.0035714285714285713, 12);
    expect(steps[13]).toBeCloseTo(0.05, 12);
  });

  it("the naive family risk at 14 axes is ≈51%, which is the whole reason the rule exists", () => {
    expect(naiveFamilyFalseLeaderOdds(14)).toBeCloseTo(0.5123250208844705, 10);
    expect(naiveFamilyFalseLeaderOdds(1)).toBeCloseTo(0.05, 12);
  });

  it("walks down and stops at the first miss", () => {
    // rank 1: p=0.003 clears 0.05/14≈0.003571 · rank 2: p=0.01 misses 0.05/13≈0.003846 → stop.
    const v = holmVerdict([0.003, 0.01, 0.02, 0.04, 0.5, 0.9, 0.2, 0.6, 0.15, 0.7, 0.3, 0.05, 0.08, 0.45], 0.05);
    expect(v.rejected).toBe(1);
    expect(v.firstFailureThreshold).not.toBeNull();
    expect(v.firstFailureThreshold as number).toBeCloseTo(0.05 / 13, 12);
    expect(v.strongestClearedP).toBe(0.003);
  });

  it("rejects in family order: a tiny late p does not rescue a stopped walk", () => {
    // p=0.0001 sits at rank 2 behind 0.002; rank1 clears, rank2 threshold 0.05/13 ≈ 0.003846 > 0.0001
    // so it ALSO clears — Holm ordering, not data order. Both rejected, walk continues.
    const v = holmVerdict([0.002, 0.0001, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.09, 0.08, 0.07], 0.05);
    expect(v.rejected).toBeGreaterThanOrEqual(2);
  });

  it("a p-value that is not published occupies the family size but is never judged or given a rank", () => {
    // m=3 family, judged ranks come from the two published p-values sorted: [0.001, 0.9].
    // rank1: 0.001 clears 0.05/3≈0.01667 · rank2: 0.9 misses 0.05/2=0.025 → stop. Rejected: 1.
    const v = holmVerdict([0.001, null, 0.9], 0.05);
    expect(v.rejected).toBe(1);
    expect(v.strongestClearedP).toBe(0.001);
    expect(v.firstFailureThreshold).toBeCloseTo(0.025, 12);
  });

  it("an empty family rejects nothing", () => {
    expect(holmVerdict([])).toEqual({ rejected: 0, firstFailureThreshold: null, strongestClearedP: null });
    expect(holmThresholds(0)).toEqual([]);
    expect(Number.isNaN(holmThresholdAt(0, 1))).toBe(true);
  });
});

describe("planning arithmetic for the explorer, by hand", () => {
  // z_{1−α/2}=1.959964, z_{0.8}=0.841621 · score form: (zA·0.5 + zB·√(s(1−s)))²/(s−0.5)²
  it("10% discordance at 80/20 skew needs 193 paired items", () => {
    // (0.979982 + 0.336648)² / 0.09 = 19.2612 discordants → /0.10 → 192.6 → 193
    expect(mcnemarRequiredPairedN(0.1, 0.8)).toBe(193);
  });

  it("the current banks' trap: 2.5% discordance needs ~771 paired items, 36 cannot separate", () => {
    expect(mcnemarRequiredPairedN(0.025, 0.8)).toBe(771);
    expect(mcnemarRequiredPairedN(0.15, 0.8)).toBe(129);
  });

  it("refuses inputs outside the arithmetic's range instead of producing a number", () => {
    expect(mcnemarRequiredPairedN(0, 0.8)).toBeNull();
    expect(mcnemarRequiredPairedN(0.1, 0.5)).toBeNull(); // skew 0.5 can never separate
    expect(mcnemarRequiredPairedN(0.1, 1)).toBeNull();
    expect(mcnemarRequiredPairedN(0.1, 0.8, 1.1, 0.8)).toBeNull(); // α outside (0,1)
  });
});
