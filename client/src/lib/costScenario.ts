export type CostScenarioInputs = {
  annualSpend: number;
  reductionPercent: number;
  oneTimeCost: number;
  annualCost: number;
};

export function calculateCostScenario(inputs: CostScenarioInputs) {
  const nonnegative = (value: number) => Number.isFinite(value) ? Math.max(0, value) : 0;
  const annualSavings = nonnegative(inputs.annualSpend) * Math.min(100, nonnegative(inputs.reductionPercent)) / 100;
  const annualCost = nonnegative(inputs.annualCost);
  const threeYearCost = nonnegative(inputs.oneTimeCost) + 3 * annualCost;
  const threeYearNetBenefit = 3 * annualSavings - threeYearCost;
  return {
    annualSavings,
    annualNetSavings: annualSavings - annualCost,
    threeYearNetBenefit,
    threeYearROI: threeYearCost > 0 ? threeYearNetBenefit / threeYearCost * 100 : null,
  };
}
