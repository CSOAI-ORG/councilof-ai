// Surface inspection, 12 Oct 2026: the 23·23 count carries "measured on <date>" read from the
// payload's own measured_on.date (never typed, never the clock).
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import LiveBoardGlance from "@/components/home/LiveBoardGlance";
import { BOARD_COUNT_OBSERVED, boardCountFromPayload } from "./boardCount";

const payload = {
  totals: { axes: 2, measured_axes: 2, public_count: "mock 2 axes · 2 measured" },
  measured_on: { date: "mock run 2026-01-01" },
  axes: [],
};

describe("measured on, beside the board count", () => {
  it("reads measured_on.date off the live payload and nothing else", () => {
    expect(boardCountFromPayload(payload)?.measured_on).toBe("mock run 2026-01-01");
    expect(boardCountFromPayload({ ...payload, measured_on: undefined })?.measured_on).toBeNull();
    expect(BOARD_COUNT_OBSERVED.measured_on).toBeNull();
  });
  it("home board band prints it next to the count, and omits it when the payload has none", () => {
    const html = renderToStaticMarkup(<Router ssrPath="/"><LiveBoardGlance data={payload as never} models={null} /></Router>);
    expect(html).toContain('data-testid="board-public-count-measured-on"');
    expect(html).toContain("measured on mock run 2026-01-01");
    const none = renderToStaticMarkup(<Router ssrPath="/"><LiveBoardGlance data={{ ...payload, measured_on: undefined } as never} models={null} /></Router>);
    expect(none).not.toContain("board-public-count-measured-on");
  });
});
