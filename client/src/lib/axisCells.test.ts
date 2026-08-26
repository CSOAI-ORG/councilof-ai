import { describe, expect, it } from "vitest";
import { accuracyCell, intervalCell, separationNote, UNMEASURED_WORD } from "./axisCells";

/**
 * The regression suite for `NaN%` on the board.
 *
 * The defect: `/insurers` and `/gspc-scoreboard` computed `(a.accuracy * 100)`
 * unconditionally. For the 8 financial/domain axes /api/gspc honestly carries no
 * `accuracy` field at all, so `undefined * 100` produced `NaN` and the board
 * printed `NaN%` on 8 of 22 rows — including provenance-controls, the one
 * financial axis that carries a real signed measurement.
 *
 * Every assertion below is about what a cell RENDERS, and the first one is the
 * blunt invariant: no cell may ever contain the string "NaN".
 */

/** The real shape of the one measured financial axis, from functions/api/_gspc_axes_fin.ts. */
const provenanceControls = {
  axis: "provenance-controls",
  family: "financial",
  kind: "deterministic-facts",
  n: 6,
  n_unit: "issuer accounts (not bank items)",
  status: "MEASURED",
  coverage: "6 of the 16 instruments named in the registry",
  evidence_url: "/interop/financial-measure-run-v2.json",
  // No accuracy, no leader, no separation, no interval — honest absence.
};

/** The real shape of a declared slot: published so the gap is visible, no run behind it. */
const declaredSlot = {
  axis: "reserve-attestation",
  family: "financial",
  kind: "declared-slot",
  n: 0,
  n_unit: "nothing measured",
  status: "UNMEASURED",
};

/** A normal behavioural axis, which must be untouched by the fix. */
const behavioural = {
  axis: "governance",
  family: "gspc",
  kind: "model-comparison",
  n: 237,
  status: "MEASURED",
  accuracy: 0.7,
  separation: "SEPARATED",
  interval: [0.639, 0.755] as [number, number],
};

const everyCellText = (a: Parameters<typeof accuracyCell>[0]) => {
  const acc = accuracyCell(a);
  const parts = [acc.text, intervalCell(a).text, separationNote(a) ?? ""];
  if (acc.state === "figure") parts.push(acc.prefix);
  if (acc.state === "facts") parts.push(acc.detail ?? "");
  return parts.join(" | ");
};

describe("no board cell renders NaN", () => {
  for (const axis of [provenanceControls, declaredSlot, behavioural]) {
    it(`${axis.axis} — every cell is NaN-free`, () => {
      expect(everyCellText(axis)).not.toMatch(/NaN/);
    });
  }

  it("an axis with a garbage accuracy is not rendered as a figure", () => {
    // Defence in depth: NaN arriving IN the payload must not become "NaN%" either.
    expect(everyCellText({ ...behavioural, accuracy: NaN })).not.toMatch(/NaN/);
    expect(everyCellText({ ...behavioural, accuracy: Infinity })).not.toMatch(/NaN/);
  });
});

describe("a slot with no measurement", () => {
  it("renders the published status word, not a percentage", () => {
    const cell = accuracyCell(declaredSlot);
    expect(cell.state).toBe("unmeasured");
    expect(cell.text).toBe(UNMEASURED_WORD);
  });

  it("never renders 0% — a zero would assert a measurement of zero", () => {
    expect(accuracyCell(declaredSlot).text).not.toMatch(/0\s*%/);
    expect(accuracyCell(declaredSlot).text).not.toMatch(/%/);
  });

  it("never renders a blank — hiding the slot is not an option", () => {
    expect(accuracyCell(declaredSlot).text.trim().length).toBeGreaterThan(0);
  });

  it("does not claim its interval was withheld — there is no measurement to withhold", () => {
    expect(intervalCell(declaredSlot).text).not.toMatch(/withheld/);
  });
});

describe("provenance-controls — measured, but not by a model comparison", () => {
  it("is NOT rendered as unmeasured: it carries a real signed run", () => {
    expect(accuracyCell(provenanceControls).state).toBe("facts");
  });

  it("renders what it DOES have — its coverage — rather than an empty percentage", () => {
    const cell = accuracyCell(provenanceControls);
    expect(cell.state).toBe("facts");
    if (cell.state !== "facts") return;
    expect(cell.detail).toBe("6 of the 16 instruments named in the registry");
    expect(cell.text).not.toMatch(/%/);
  });

  it("says no separation test is applicable — not that one is merely untested", () => {
    expect(separationNote(provenanceControls)).toMatch(/not applicable/i);
    expect(separationNote(provenanceControls)).not.toMatch(/untested/i);
  });

  it("does not claim an interval was withheld for an accuracy that does not exist", () => {
    expect(intervalCell(provenanceControls).text).toMatch(/not applicable/i);
  });
});

describe("a measured model-comparison axis is unchanged by the fix", () => {
  it("still renders the leader percentage exactly as before", () => {
    const cell = accuracyCell(behavioural);
    expect(cell.state).toBe("figure");
    if (cell.state !== "figure") return;
    expect(cell.prefix).toBe("");
    expect(cell.text).toBe("70.0%");
  });

  it("still renders its Wilson interval", () => {
    expect(intervalCell(behavioural).text).toBe("63.9–75.5%");
  });

  it("prefixes a stated lower bound with ≥", () => {
    const cell = accuracyCell({ ...behavioural, accuracy_is: "Wilson lower bound" });
    expect(cell.state).toBe("figure");
    if (cell.state !== "figure") return;
    expect(cell.prefix).toBe("≥");
  });

  it("keeps the honest withheld-interval reason where a figure exists but n is not independent", () => {
    const swarm = { ...behavioural, axis: "swarm", interval: undefined };
    expect(intervalCell(swarm).text).toMatch(/withheld/);
  });

  it("adds no separation note when the axis carries a separation determination", () => {
    expect(separationNote(behavioural)).toBeNull();
  });
});
