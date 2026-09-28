import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  partitionModelRegistryAxes,
  presentRegistryLimitation,
  type GspcAxis,
} from "./ModelRegistry";

describe("model registry axis families", () => {
  it("uses canonical kind fields, not the presence of a public leader", () => {
    const board = JSON.parse(
      readFileSync(
        resolve(__dirname, "../../../public/signed/gspc-board.signed.json"),
        "utf8",
      ),
    ) as { axes: GspcAxis[] };
    const partition = partitionModelRegistryAxes(board.axes);

    expect(partition.modelComparison).toHaveLength(14);
    expect(partition.deterministicFacts).toHaveLength(8);
    expect(partition.unclassified).toHaveLength(0);
    expect(
      partition.modelComparison.filter((axis) => Boolean(axis.leader)),
    ).toHaveLength(3);
    expect(
      partition.modelComparison.filter((axis) => !axis.leader),
    ).toHaveLength(11);
  });
});

describe("model registry limitation presentation", () => {
  it("labels the old seven-axis separation sentence as a named subset, not a board total", () => {
    const old = "Separation on 7 axes (governance, safety, provenance, continuity, conformance, openness, care) is computed from the published per-item rows.";
    const shown = presentRegistryLimitation(old);
    expect(shown).toContain("Legacy subset note");
    expect(shown).toContain("named model-comparison subset");
    expect(shown).toContain("governance, safety, provenance, continuity, conformance, openness, care");
    expect(shown).not.toContain("7 axes");
  });

  it("leaves current limitations unchanged", () => {
    const current = "Of the 14 model-comparison axes, 8 have a published separation determination.";
    expect(presentRegistryLimitation(current)).toBe(current);
  });
});

