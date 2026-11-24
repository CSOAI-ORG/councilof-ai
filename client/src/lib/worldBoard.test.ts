import { describe, it, expect } from "vitest";
import { parseWorldBoard } from "./worldBoard";

const data = {
  schema: "csoai.gspc-axes/0.5",
  totals: { axes: 3, measured_axes: 2, separated_leads: 0, ties: 1, untested_separations: 1,
    public_count: "3 axes · 2 measured", separation_public_count: "0 separated · 1 TIE · 1 UNTESTED" },
  axes: [
    { axis: "governance", family: "gspc", kind: "model-comparison", status: "MEASURED",
      separation: "TIE", n: 237, method_status: "meets-rule", task: "Cautious classification" },
    { axis: "safety", family: "gspc", kind: "model-comparison", status: "MEASURED", separation: "UNTESTED", n: 12 },
    { axis: "compliance", family: "subject", kind: "subject-facts", status: "UNMEASURED", n: null },
  ],
};
describe("real-board presentation guards", () => {
  it("preserves separation distinctions, counts and facts", () => {
    const b = parseWorldBoard(data);
    expect([b.nMeasured,b.nModelComparison,b.nSeparated,b.nTie,b.nUntested]).toEqual([2,2,0,1,1]);
    expect(b.axes[0].path).toBe("/gspc/governance");
    expect(b.axes[1].separation).toBe("UNTESTED");
    expect(b.axes[2].separation).toBeNull();
    expect(b.axes[2].n).toBeNull();
  });
  it("refuses false board totals and false separation winners", () => {
    expect(() => parseWorldBoard({ ...data, totals:{...data.totals, measured_axes:3} })).toThrow();
    expect(() => parseWorldBoard({ ...data, totals:{...data.totals, separated_leads:1} })).toThrow();
    expect(() => parseWorldBoard({ ...data, axes:data.axes.map((x,i)=>i===0?{...x,separation:"WINNER"}:x) })).toThrow();
    expect(() => parseWorldBoard({ ...data, axes:[data.axes[0],data.axes[0],data.axes[2]] })).toThrow();
  });
  it("rejects unsafe route identifiers, invented n, unsupported schema", () => {
    expect(() => parseWorldBoard({ ...data, axes:data.axes.map((x,i)=>i===0?{...x,axis:"javascript:alert(1)"}:x) })).toThrow();
    expect(() => parseWorldBoard({ ...data, axes:data.axes.map((x,i)=>i===0?{...x,n:-1}:x) })).toThrow();
    expect(() => parseWorldBoard({ ...data, schema:"fabricated-board" })).toThrow();
  });
});
