import { describe, expect, it } from "vitest";
import {
  FILL7_PUBLIC_COUNT,
  applyFill7ChromeHonesty,
  isFill7Stamp,
} from "./fill7ChromeHonesty";

function fill7Payload() {
  const gspc = [
    "governance",
    "safety",
    "provenance",
    "continuity",
    "conformance",
    "openness",
    "machinery-conformity",
    "care",
    "cross-reality",
    "detector-interop",
    "art5-safeguard",
    "swarm",
    "affect",
    "jail",
  ].map((axis) => ({
    axis,
    family: "gspc",
    kind: "model-comparison",
    status: "MEASURED",
    n: 30,
    accuracy: 0.5,
  }));
  const financial = [
    "provenance-controls",
    "reserve-attestation",
    "regulatory-framework",
    "distribution-integrity",
    "custody-disclosure",
    "ai-adoption-components",
    "labour-components",
    "humanoid-labour-index",
  ].map((axis) => ({
    axis,
    family: "financial",
    kind: "deterministic-facts",
    status: "MEASURED",
    n: axis === "provenance-controls" ? 6 : 16,
    coverage: "facts",
  }));
  return {
    schema: "csoai.gspc-axes/0.5",
    totals: {
      axes: 22,
      measured_axes: 22,
      unmeasured_axes: 0,
      public_count: "22 axis · 22 measured",
      by_family: {
        gspc: { axes: 14, measured: 14 },
        financial: { axes: 8, measured: 8 },
      },
    },
    axes: [...gspc, ...financial],
  };
}

describe("fill7ChromeHonesty", () => {
  it("detects the fill-7 stamp", () => {
    expect(isFill7Stamp(fill7Payload())).toBe(true);
  });

  it("rewrites counts to 22·15·7 and empties the seven financial slots", () => {
    const out = applyFill7ChromeHonesty(fill7Payload()) as any;
    expect(out.totals.public_count).toBe(FILL7_PUBLIC_COUNT);
    expect(out.totals.measured_axes).toBe(15);
    expect(out.totals.unmeasured_axes).toBe(7);
    expect(out.chrome_honesty).toBe("fill-7→22·15·7");

    const empty = out.axes.filter((a: any) => a.status === "UNMEASURED");
    expect(empty).toHaveLength(7);
    for (const a of empty) {
      expect(a.kind).toBe("declared-slot");
      expect(a.accuracy).toBeUndefined();
      expect(a.coverage).toBeUndefined();
    }
    const pc = out.axes.find((a: any) => a.axis === "provenance-controls");
    expect(pc.status).toBe("MEASURED");
    expect(pc.kind).toBe("deterministic-facts");
  });

  it("is a no-op when GET is already 15/7", () => {
    const honest = fill7Payload() as any;
    for (const a of honest.axes) {
      if (
        [
          "reserve-attestation",
          "regulatory-framework",
          "distribution-integrity",
          "custody-disclosure",
          "ai-adoption-components",
          "labour-components",
          "humanoid-labour-index",
        ].includes(a.axis)
      ) {
        a.status = "UNMEASURED";
        a.kind = "declared-slot";
      }
    }
    honest.totals.measured_axes = 15;
    honest.totals.unmeasured_axes = 7;
    honest.totals.public_count = "22 axis · 15 measured";
    expect(isFill7Stamp(honest)).toBe(false);
    expect(applyFill7ChromeHonesty(honest)).toBe(honest);
  });

  it("does not invent scores", () => {
    const out = applyFill7ChromeHonesty(fill7Payload()) as any;
    for (const a of out.axes) {
      if (a.status === "UNMEASURED") {
        expect(typeof a.accuracy === "number").toBe(false);
      }
    }
  });
});
