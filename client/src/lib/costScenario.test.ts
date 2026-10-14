import { describe, expect, it } from "vitest";
import { calculateCostScenario } from "./costScenario";

describe("review-cost scenario", () => {
  it("makes no savings or return claim in the initial zero-reduction scenario", () => {
    expect(calculateCostScenario({ annualSpend: 500000, reductionPercent: 0, oneTimeCost: 0, annualCost: 0 })).toEqual({ annualSavings: 0, annualNetSavings: 0, threeYearNetBenefit: 0, threeYearROI: null });
  });
  it("includes one-time and all three years of recurring cost in the net return", () => {
    expect(calculateCostScenario({ annualSpend: 100000, reductionPercent: 20, oneTimeCost: 10000, annualCost: 5000 })).toEqual({ annualSavings: 20000, annualNetSavings: 15000, threeYearNetBenefit: 35000, threeYearROI: 140 });
  });
  it("shows a loss when the assumed costs exceed the assumed savings", () => {
    const result = calculateCostScenario({ annualSpend: 10000, reductionPercent: 10, oneTimeCost: 10000, annualCost: 2000 });
    expect(result.annualNetSavings).toBe(-1000);
    expect(result.threeYearNetBenefit).toBe(-13000);
    expect(result.threeYearROI).toBe(-81.25);
  });
  it("does not produce an infinite return for a zero-cost scenario", () => {
    expect(calculateCostScenario({ annualSpend: 100000, reductionPercent: 10, oneTimeCost: 0, annualCost: 0 }).threeYearROI).toBeNull();
  });
  it("bounds a reduction to the baseline and excludes invalid cost inputs", () => {
    expect(calculateCostScenario({ annualSpend: 100, reductionPercent: 150, oneTimeCost: -5, annualCost: Infinity })).toEqual({ annualSavings: 100, annualNetSavings: 100, threeYearNetBenefit: 300, threeYearROI: null });
  });
});
