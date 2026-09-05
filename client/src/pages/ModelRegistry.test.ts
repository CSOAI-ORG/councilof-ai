import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  partitionModelRegistryAxes,
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
