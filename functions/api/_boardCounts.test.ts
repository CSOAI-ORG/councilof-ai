import { describe, expect, it } from "vitest";
import type { AxisScore } from "./_gspc_types";
import { deriveBoardCounts } from "./_boardCounts";

const axis = (id: string, family: AxisScore["family"], status: AxisScore["status"]): AxisScore => ({
  axis: id,
  bench: `${id}-bench`,
  task: id,
  family,
  kind: status === "MEASURED" ? "deterministic-facts" : "declared-slot",
  n: status === "MEASURED" ? 1 : 0,
  status,
  colour: "#000",
  hue: 0,
});

describe("board count convergence", () => {
  it("derives slots, measurements and families from the same rows", () => {
    const counts = deriveBoardCounts([
      axis("a", "gspc", "MEASURED"),
      axis("b", "gspc", "UNMEASURED"),
      axis("c", "financial", "MEASURED"),
    ]);
    expect(counts).toMatchObject({
      axes: 3,
      measured_axes: 2,
      unmeasured_axes: 1,
      public_count: "3 axis · 2 measured",
      by_family: {
        gspc: { axes: 2, measured: 1 },
        financial: { axes: 1, measured: 1 },
      },
    });
  });
});
