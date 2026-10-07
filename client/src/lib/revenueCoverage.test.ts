import { describe, expect, it } from "vitest";
import { readAllTimeRevenue } from "./revenueCoverage";

// Relevant source-qualified fields from Release temporal-v2:
// revenue.temporal.test.ts:55–63. These are contract fixtures, not a live response.
const partial = () => ({
  one_number: {
    status: "PARTIAL", all_time: 1, last_30d: null, settlements: 2,
    settled_usdc_atomic: 40000,
    repeat_nonself_payers: { all_time: 1, last_30d: null },
    coverage: { complete: true },
    temporal_coverage: { complete: false, eligible_records: 2, records_with_time: 1, records_without_time: 1 },
    observed_records: { last_30d: 1, repeat_nonself_payers: { last_30d: 0 } },
  },
  settled_usdc: { status: "MEASURED", count: 40000 },
});

describe("all-time revenue consumer preserves independent coverage", () => {
  it("retains independently complete all-time observations when window coverage is PARTIAL", () => {
    expect(readAllTimeRevenue(partial())).toEqual({ state: "partial", payers: 1, settlements: 2, atomic: 40000 });
  });
  it("never exposes unknown window counts or substitutes observed lower bounds", () => {
    const body = partial();
    body.one_number.observed_records.last_30d = 99;
    body.one_number.observed_records.repeat_nonself_payers.last_30d = 99;
    expect(readAllTimeRevenue(body)).toEqual(readAllTimeRevenue(partial()));
    expect(readAllTimeRevenue(body)).not.toHaveProperty("last_30d");
    expect(readAllTimeRevenue(body)).not.toHaveProperty("repeat_nonself_payers");
  });
  it("preserves actual zero after a complete empty scan", () => {
    expect(readAllTimeRevenue({ one_number: {
      status: "MEASURED", all_time: 0, settlements: 0, settled_usdc_atomic: 0,
      coverage: { complete: true }, temporal_coverage: { complete: true },
    }, settled_usdc: { status: "MEASURED", count: 0 } }))
      .toEqual({ state: "measured", payers: 0, settlements: 0, atomic: 0 });
  });
  it("keeps definitive nulls unknown despite readable subset observations", () => {
    expect(readAllTimeRevenue({ one_number: {
      status: "UNMEASURED", all_time: null, settlements: null, settled_usdc_atomic: null,
      coverage: { complete: false }, observed_records: { all_time: 1, settlements: 2, settled_usdc_atomic: 40000 },
    }, settled_usdc: { status: "UNMEASURED", count: null } })).toBeNull();
  });
  it("does not trust a numeric total contradicted by incomplete storage", () => {
    const body = partial(); body.one_number.status = "MEASURED"; body.one_number.coverage.complete = false;
    expect(readAllTimeRevenue(body)).toBeNull();
  });
  it("requires storage coverage for the new PARTIAL status", () => {
    const { coverage: _coverage, ...one_number } = partial().one_number;
    expect(readAllTimeRevenue({ ...partial(), one_number })).toBeNull();
  });
  it("does not repair null definitive counts from an observed record", () => {
    expect(readAllTimeRevenue({ ...partial(), one_number: { ...partial().one_number, all_time: null } })).toBeNull();
  });
  it("keeps null or invalid definitive amounts unknown instead of substituting the aggregate", () => {
    for (const atomic of [null, undefined, -1, Number.NaN, Number.MAX_SAFE_INTEGER + 1]) {
      expect(readAllTimeRevenue({
        ...partial(),
        one_number: { ...partial().one_number, settled_usdc_atomic: atomic },
      })).toBeNull();
    }
  });
  it("rejects contradictory independent amount readings", () => {
    expect(readAllTimeRevenue({ ...partial(), settled_usdc: { status: "MEASURED", count: 50000 } })).toBeNull();
  });
  it("retains the legacy MEASURED input accepted by these consumers", () => {
    expect(readAllTimeRevenue({ one_number: { status: "MEASURED", all_time: 1, settlements: 2 }, settled_usdc: { count: 40000 } }))
      .toEqual({ state: "measured", payers: 1, settlements: 2, atomic: 40000 });
  });
});
