import { describe, expect, it } from "vitest";
import type { GspcAxis } from "@/components/board/useGspcBoard";
import type { FleetMatrix } from "@/lib/gspcFleet";
import { axisStatEvidence } from "./Leaderboard";

function matrix(axisId: string, accuracy: number, cardUrl = `/signed/${axisId}.json`): FleetMatrix {
  return {
    counts: {},
    axes: [{ id: axisId, cards: 1, models: 1, mean_accuracy: accuracy, best_accuracy: accuracy, as_of: "2026-09-07" }],
    models: [{ id: "benchmark-leader", name_published: true, cards: 1, axes: [axisId], mean_accuracy: accuracy, best_accuracy: accuracy, as_of: "2026-09-07" }],
    cells: [{ model: "benchmark-leader", axis: axisId, accuracy, created: "2026-09-07", card: "abc123", card_url: cardUrl, signed: true }],
  };
}

describe("axisStatEvidence — cohort identity boundary", () => {
  it("does not borrow a related governance interval from a different leader and cohort", () => {
    const safetyTwin: GspcAxis = {
      axis: "safety",
      leader: "governance-leader",
      accuracy: 0.944,
      n: 36,
      interval: [0.819, 0.985],
      evidence_url: "/runs/governance-safety.json",
      status: "MEASURED",
    };

    expect(axisStatEvidence("gspc-safety", matrix("gspc-safety", 1), safetyTwin)).toBeNull();
  });

  it("uses the exact benchmark leader and cohort declared by a *-n axis", () => {
    const evidence = axisStatEvidence("mmlu-30", matrix("mmlu-30", 0.9));

    expect(evidence).not.toBeNull();
    expect(evidence?.n).toBe(30);
    expect(evidence?.nSource).toBe("benchmark axis id declares cohort n");
    expect(evidence?.lo).toBeLessThan(0.9);
    expect(evidence?.hi).toBeGreaterThan(0.9);
  });

  it("accepts a published interval only when it identifies the same signed measurement", () => {
    const cardUrl = "/signed/shared-measurement.json";
    const exact: GspcAxis = {
      axis: "shared-30",
      leader: "benchmark-leader",
      accuracy: 0.8,
      n: 30,
      interval: [0.627, 0.905],
      evidence_url: cardUrl,
      status: "MEASURED",
    };

    expect(axisStatEvidence("shared-30", matrix("shared-30", 0.8, cardUrl), exact)).toEqual({
      lo: 0.627,
      hi: 0.905,
      n: 30,
      nSource: "exact matching signed measurement",
    });
  });

  it("returns null when the axis, leader cell, or supported cohort n is unavailable", () => {
    const noCells = matrix("gspc-jail", 0.563);
    noCells.cells = [];

    expect(axisStatEvidence("missing", matrix("gspc-jail", 0.563))).toBeNull();
    expect(axisStatEvidence("gspc-jail", noCells)).toBeNull();
    expect(axisStatEvidence("gspc-jail", matrix("gspc-jail", 0.563))).toBeNull();
  });
});
