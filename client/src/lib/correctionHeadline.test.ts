import { describe, expect, it } from "vitest";
import { correctionHeadline, correctionHref } from "./correctionHeadline";

describe("correctionHeadline", () => {
  it("keeps the first sentence and drops the numbered detail", () => {
    expect(
      correctionHeadline(
        "Public surfaces sent readers to places they could not reach, and some sentences said more than the record behind them. (1) Every page's footer …",
      ),
    ).toBe("Public surfaces sent readers to places they could not reach, and some sentences said more than the record behind them.");
  });
  it("cuts before a numbered list that starts mid-sentence", () => {
    expect(correctionHeadline("Two pages disagreed (1) the board and (2) the FAQ. More detail.")).toBe("Two pages disagreed");
  });
  it("returns a one-sentence entry whole and an empty one as empty", () => {
    expect(correctionHeadline("The board said 22.")).toBe("The board said 22.");
    expect(correctionHeadline(undefined)).toBe("");
  });
  it("links to the entry on the corrections page", () => {
    expect(correctionHref("C-2026-0930-12")).toBe("/corrections/#C-2026-0930-12");
    expect(correctionHref(undefined)).toBe("/corrections/");
  });
});
