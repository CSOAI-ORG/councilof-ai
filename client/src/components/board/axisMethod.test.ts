/**
 * axisMethod — the readers behind "how this number was made".
 *
 * Every assertion is provably about the payload passed in: a field that is absent must
 * produce a labelled absence, never a zero, never a number of ours, and never a verdict.
 */
import { describe, expect, it } from "vitest";
import {
  axisMde,
  leaderCardState,
  measuredOn,
  mdeSentence,
  peritemSha,
  separationP,
  separationSentence,
} from "./axisMethod";

const MEASURED_AXIS = {
  axis: "governance",
  kind: "model-comparison",
  status: "MEASURED",
  separation: "TIE",
  separation_p: 0.3787,
  separation_sentence:
    "No model separated from the next best on this axis (exact McNemar, p≥0.05, n=237; p=0.3787).",
  mde: {
    value: 0.138,
    state: "MEASURED",
    unit: "accuracy difference (proportion), leader minus the best base model",
    alpha: 0.05,
    power: 0.8,
  },
  measurement_time: {
    state: "DAY",
    precision: "day",
    observed_on: "2026-08-12",
    note: "The source publishes day precision only. No midnight timestamp is invented.",
  },
  leader_card_state: "CARD_RECORDS_A_DIFFERENT_MEASUREMENT",
  peritem_file_sha256: "3a1d3193d3651448dd311efe4c7efcbdffb19e07fba06c15e628b844bfbfa2a5",
};

describe("axisMde", () => {
  it("reads the object shape the board serves, keeping the value as served", () => {
    const mde = axisMde(MEASURED_AXIS);
    expect(mde).not.toBeNull();
    expect(mde?.text).toBe("0.138");
    expect(mde?.value).toBe(0.138);
    expect(mde?.state).toBe("MEASURED");
    expect(mde?.alpha).toBe(0.05);
    expect(mde?.power).toBe(0.8);
  });

  it("accepts a bare number and reads the state the board gave it", () => {
    expect(axisMde({ mde: 0.2 })?.text).toBe("0.2");
  });

  it("returns null when the board publishes no MDE — never 0", () => {
    expect(axisMde({})).toBeNull();
    expect(axisMde({ mde: null })).toBeNull();
    expect(axisMde({ mde: {} })).toBeNull();
    expect(axisMde({ mde: "0.138" })).toBeNull();
  });
});

describe("mdeSentence", () => {
  it("says what the axis could have detected, with the value the board served", () => {
    const s = mdeSentence(MEASURED_AXIS);
    expect(s).toContain("0.138");
    expect(s).toContain("or more");
    expect(s).toContain("alpha 0.05");
    expect(s).toContain("power 0.8");
  });

  it("is null when there is no MDE", () => {
    expect(mdeSentence({})).toBeNull();
  });
});

describe("separation", () => {
  it("quotes the board's own sentence verbatim and reads the p", () => {
    expect(separationSentence(MEASURED_AXIS)).toBe(MEASURED_AXIS.separation_sentence);
    expect(separationP(MEASURED_AXIS)).toBe(0.3787);
  });

  it("reads an absent p as null, never 0 — 0.3787 and 0 are different facts", () => {
    expect(separationP({})).toBeNull();
    expect(separationP({ separation_p: null })).toBeNull();
    expect(separationP({ separation_p: "0.3787" })).toBeNull();
    expect(separationSentence({})).toBeNull();
  });
});

describe("measuredOn", () => {
  it("reads the observed day and the precision the source published", () => {
    const w = measuredOn(MEASURED_AXIS);
    expect(w?.observedOn).toBe("2026-08-12");
    expect(w?.precision).toBe("day");
    expect(w?.note).toContain("No midnight timestamp is invented");
  });

  it("is null when the board publishes no measurement time", () => {
    expect(measuredOn({})).toBeNull();
    expect(measuredOn({ measurement_time: { precision: "day" } })).toBeNull();
  });
});

describe("leaderCardState", () => {
  it("says in words that a card recording a different measurement does not back the number", () => {
    const s = leaderCardState(MEASURED_AXIS);
    expect(s).toContain("DIFFERENT measurement");
    expect(s).toContain("does not back the number shown");
  });

  it("says plainly when no signed per-model card stands behind the leader", () => {
    expect(leaderCardState({ leader_card_state: "NO_SIGNED_PER_MODEL_CARD" })).toContain(
      "no signed per-model card",
    );
  });

  it("prints an unknown state as served — never folded into a state we invented", () => {
    expect(leaderCardState({ leader_card_state: "SOMETHING_NEW" })).toBe("SOMETHING_NEW");
  });

  it("is null when the board declares no card state — silence, not a clean bill", () => {
    expect(leaderCardState({})).toBeNull();
    expect(leaderCardState({ leader_card_state: "  " })).toBeNull();
  });
});

describe("peritemSha", () => {
  it("reads the rows file sha as served", () => {
    expect(peritemSha(MEASURED_AXIS)).toBe(MEASURED_AXIS.peritem_file_sha256);
  });

  it("is null when the board publishes no rows sha", () => {
    expect(peritemSha({})).toBeNull();
  });
});
