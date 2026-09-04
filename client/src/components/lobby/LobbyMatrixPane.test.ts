import { describe, expect, it } from "vitest";
import { matrixAxisState, matrixBoardSummary } from "./LobbyMatrixPane";

describe("regulation matrix measurement state", () => {
  it("uses published status rather than the presence of an accuracy score", () => {
    expect(matrixAxisState({ status: "MEASURED" })).toBe("MEASURED");
    expect(matrixAxisState({ status: "UNMEASURED" })).toBe("UNMEASURED");
  });

  it("cannot say every axis is measured while an unmeasured slot exists", () => {
    expect(
      matrixBoardSummary([
        { status: "MEASURED" },
        { status: "MEASURED" },
        { status: "UNMEASURED" },
      ]),
    ).toBe("3 axes · 2 measured · 1 unmeasured");
  });
});
