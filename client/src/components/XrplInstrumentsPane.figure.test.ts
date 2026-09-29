import { describe, expect, it } from "vitest";
import { xrplFigure } from "./XrplInstrumentsPane";

describe("XRPL holders / supply cells", () => {
  it("prints the API state for a null figure, never a dash", () => {
    expect(xrplFigure(null, "UNMEASURED")).toBe("UNMEASURED");
    expect(xrplFigure(undefined, undefined)).toBe("UNCHECKABLE");
    expect(xrplFigure(null, "  ")).toBe("UNCHECKABLE");
  });

  it("prints a real figure, including a measured zero", () => {
    expect(xrplFigure(1234, "MEASURED")).toBe((1234).toLocaleString());
    expect(xrplFigure(0, "MEASURED")).toBe("0");
  });
});
