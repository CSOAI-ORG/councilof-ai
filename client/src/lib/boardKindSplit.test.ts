import { describe, expect, it } from "vitest";
import { boardKindSplitFromPayload } from "./boardCount";

describe("board kind split", () => {
  it("counts a GSPC-family fact run as a fact, not a model comparison", () => {
    const axes = [
      ...Array.from({ length: 14 }, (_, index) => ({ axis: `model-${index}`, family: "gspc", kind: "model-comparison" })),
      { axis: "effect-binding", family: "gspc", kind: "deterministic-facts" },
      ...Array.from({ length: 8 }, (_, index) => ({ axis: `financial-${index}`, family: "financial", kind: "deterministic-facts" })),
    ];
    expect(boardKindSplitFromPayload({
      axes,
      totals: { by_family: { gspc: { axes: 15 }, financial: { axes: 8 } } },
    })).toEqual({ comparison_axes: 14, fact_runs: 9 });
  });

  it("withholds a split if axes are missing or include an unclassified slot", () => {
    expect(boardKindSplitFromPayload(null)).toBeNull();
    expect(boardKindSplitFromPayload({ axes: [] })).toBeNull();
    expect(boardKindSplitFromPayload({ axes: [{ kind: "model-comparison" }, { kind: "declared-slot" }] })).toBeNull();
  });
});
