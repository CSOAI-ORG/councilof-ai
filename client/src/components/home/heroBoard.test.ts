import { describe, expect, it } from "vitest";
import { heroCells, heroStrip } from "./heroBoard";
import type { GspcPayload } from "@/components/board/useGspcBoard";

/**
 * Drive the shipped hero math. Counts come from the payload; empty ≠ 0.
 * The fixture is a miniature board — tests never type the live 22/15/7.
 */

function payload(axes: GspcPayload["axes"], totals: GspcPayload["totals"]): GspcPayload {
  return { schema: "csoai.gspc-axes/0.5", totals, axes };
}

const mini = payload(
  [
    { axis: "governance", status: "MEASURED", n: 237, accuracy: 0.7, family: "gspc" },
    {
      axis: "provenance-controls",
      status: "MEASURED",
      kind: "deterministic-facts",
      n: 6,
      coverage: "6 of 6 issuers",
      family: "financial",
    },
    {
      axis: "reserve-attestation",
      status: "UNMEASURED",
      kind: "declared-slot",
      n: 0,
      family: "financial",
    },
  ],
  {
    axes: 3,
    measured_axes: 2,
    unmeasured_axes: 1,
    public_count: "3 axis · 2 measured",
  },
);

describe("heroStrip", () => {
  it("derives the strip from totals, including empty slots", () => {
    const s = heroStrip(mini);
    expect(s.live).toBe(true);
    expect(s.text).toBe("3 axis · 2 measured · 1 empty");
    expect(s.text).not.toMatch(/\b22\b/);
  });

  it("does not invent a count when the board is unreachable", () => {
    const s = heroStrip(null, true);
    expect(s.live).toBe(false);
    expect(s.text).toBe("board unreachable — GET /api/gspc");
    expect(s.text).not.toMatch(/\d+\s+axis/);
  });

  it("does not treat a missing payload as zero measurements", () => {
    const s = heroStrip(null, false);
    expect(s.live).toBe(false);
    expect(s.text).toMatch(/reading/i);
    expect(s.text).not.toContain("0 measured");
  });
});

describe("heroCells", () => {
  it("fills measured rows and leaves UNMEASURED hollow with n as em-dash", () => {
    const cells = heroCells(mini);
    expect(cells).toHaveLength(3);

    const gov = cells.find((c) => c.axis === "governance")!;
    expect(gov.filled).toBe(true);
    expect(gov.nLabel).toBe("237");
    expect(gov.figureLabel).toBe("70.0%");

    const facts = cells.find((c) => c.axis === "provenance-controls")!;
    expect(facts.filled).toBe(true);
    expect(facts.nLabel).toBe("6");
    expect(facts.figureLabel).not.toBe("0%");
    expect(facts.figureLabel).not.toBe("NaN%");

    const reserve = cells.find((c) => c.axis === "reserve-attestation")!;
    expect(reserve.filled).toBe(false);
    expect(reserve.nLabel).toBe("—");
    expect(reserve.figureLabel).toBe("—");
    expect(reserve.nLabel).not.toBe("0");
  });

  it("returns no cells when there is no payload — does not invent axis 23", () => {
    expect(heroCells(null)).toEqual([]);
  });
});
