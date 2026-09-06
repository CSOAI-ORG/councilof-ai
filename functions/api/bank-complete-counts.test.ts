import { describe, expect, it } from "vitest";
import { deriveBankCounts } from "./bank-complete";

describe("/api/bank-complete recounts the census and splits it by the ladder", () => {
  const census = [
    { bank: "a", records: 180, statuses: ["UNCHECKABLE"] },
    { bank: "b", records: 170, statuses: ["UNCHECKABLE"] },
    { bank: "c", records: 150, statuses: ["DISCOVERED"] },
  ];

  it("totals are summed from rows, not read off a header", () => {
    const c = deriveBankCounts(census);
    expect(c.total_banks).toBe(3);
    expect(c.total_records).toBe(500);
  });

  it("records behind UNCHECKABLE are counted, not folded into the total", () => {
    const c = deriveBankCounts(census);
    // The defect: `total_records: 4000` was published flat while 78.8% of it sat
    // behind banks the estate says it could not check.
    expect(c.records_behind_uncheckable).toBe(350);
    expect(c.records_behind_uncheckable_pct).toBe(70);
    expect(c.records_by_status.DISCOVERED).toBe(150);
  });

  it("the ladder can move, which a flat total could never show", () => {
    const before = deriveBankCounts(census);
    expect(before.banks_staged_or_measured).toBe(0);
    const after = deriveBankCounts([
      { bank: "a", records: 180, statuses: ["STAGED"] },
      { bank: "b", records: 170, statuses: ["UNCHECKABLE"] },
      { bank: "c", records: 150, statuses: ["MEASURED"] },
    ]);
    expect(after.banks_staged_or_measured).toBe(2);
    expect(after.records_behind_uncheckable).toBe(170);
    // and the total is unchanged, which is exactly why the total alone was not enough
    expect(after.total_records).toBe(before.total_records);
  });

  it("a bank with no status is UNSTATED, never silently counted as checked", () => {
    const c = deriveBankCounts([{ bank: "x", records: 10 }]);
    expect(c.banks_by_status.UNSTATED).toBe(1);
    expect(c.banks_staged_or_measured).toBe(0);
  });

  it("banks_by_status partitions the banks and never adds to the total", () => {
    const c = deriveBankCounts(census);
    const banks = Object.values(c.banks_by_status).reduce((a, b) => a + b, 0);
    expect(banks).toBe(c.total_banks);
  });

  it("counts name their producer", () => {
    expect(deriveBankCounts([]).producer).toContain("deriveBankCounts");
  });
});
