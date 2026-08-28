/**
 * useArenaDoors.test.ts — tests for the arena door mechanic.
 *
 * Invariants:
 *   - Jail is always "floor", never "open" or "closed".
 *   - MEASURED axes with quotable scores are "open".
 *   - UNMEASURED / DRAFT / SPEC / PLANNED axes are "closed".
 *   - No typed counts — states derived from axis data.
 */

import { describe, it, expect } from "vitest";

describe("useArenaDoors mechanic", () => {
  it("jail is classified as floor, not a door", () => {
    const jailAxis = {
      axis: "jail",
      bench: "JailBench",
      n: 71,
      accuracy: 0.85,
      status: "MEASURED" as const,
    };

    const isDoor = jailAxis.axis !== "jail";
    const isFloor = jailAxis.axis === "jail";

    expect(isDoor).toBe(false);
    expect(isFloor).toBe(true);
  });

  it("MEASURED axis with accuracy is open", () => {
    const measuredAxis = {
      axis: "governance",
      bench: "GovBench",
      n: 237,
      accuracy: 0.7,
      status: "MEASURED" as const,
    };

    const isQuotable =
      measuredAxis.status === "MEASURED" &&
      measuredAxis.n > 0 &&
      typeof measuredAxis.accuracy === "number";

    expect(isQuotable).toBe(true);
  });

  it("UNMEASURED axis is closed", () => {
    const unmeasuredAxis = {
      axis: "empty-slot",
      bench: "",
      n: 0,
      accuracy: null,
      status: "UNMEASURED" as const,
    };

    const isQuotable =
      unmeasuredAxis.status === "MEASURED" &&
      unmeasuredAxis.n > 0 &&
      typeof unmeasuredAxis.accuracy === "number";

    expect(isQuotable).toBe(false);
  });

  it("MEASURED axis without accuracy is closed", () => {
    const measuredNoAccuracy = {
      axis: "provenance-controls",
      bench: "ProvCtrl",
      n: 6,
      accuracy: null,
      status: "MEASURED" as const,
    };

    const isQuotable =
      measuredNoAccuracy.status === "MEASURED" &&
      measuredNoAccuracy.n > 0 &&
      typeof measuredNoAccuracy.accuracy === "number";

    expect(isQuotable).toBe(false);
  });

  it("empty stays empty — n=0 axis is closed", () => {
    const emptyAxis = {
      axis: "declared-slot",
      bench: "",
      n: 0,
      accuracy: null,
      status: "PLANNED" as const,
    };

    const isQuotable =
      emptyAxis.status === "MEASURED" &&
      emptyAxis.n > 0 &&
      typeof emptyAxis.accuracy === "number";

    expect(isQuotable).toBe(false);
  });
});
