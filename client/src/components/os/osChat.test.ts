import { describe, expect, it } from "vitest";
import {
  FOUR_TOOLS_HELP,
  formatAxis,
  formatBoardTotals,
  formatCardList,
  liveCountLine,
  looksLikeCardJson,
  namedAxis,
  OS_PROMPT,
  OS_TOOLS,
  wantsBoardTotals,
  wantsGetMeasured,
  wantsListCards,
} from "./osChat";

describe("osChat — four tools", () => {
  it("names the four tools and no fifth", () => {
    expect(OS_TOOLS).toEqual(["board_totals", "get_axis", "verify_card", "list_cards"]);
    expect(FOUR_TOOLS_HELP).toMatch(/do not certify/);
    expect(FOUR_TOOLS_HELP).not.toMatch(/SOVOS|sov33|Certified Organization/);
  });

  it("routes read-the-board and paste, not a greeting", () => {
    expect(wantsBoardTotals("Walk me through the live GSPC board")).toBe(true);
    expect(wantsBoardTotals("read the board")).toBe(true);
    expect(wantsBoardTotals("ask the board")).toBe(true);
    expect(wantsBoardTotals("open the board")).toBe(true);
    expect(wantsBoardTotals("Show the board")).toBe(true);
    expect(wantsBoardTotals("BOARD")).toBe(true);
    expect(wantsListCards("list cards")).toBe(true);
    expect(looksLikeCardJson('{"id":"abc","signature":"x","body":{}}')).toBe(true);
    expect(looksLikeCardJson("hello")).toBe(false);
    expect(namedAxis("jail")).toBe("jail");
    expect(namedAxis("governance")).toBe("governance");
    expect(namedAxis("hello")).toBeNull();
  });

  it("routes a shop/ChatGPT stranger to get-measured, not a four-tools dump", () => {
    expect(wantsGetMeasured("I run a shop with ChatGPT")).toBe(true);
    expect(wantsGetMeasured("I use AI at work")).toBe(true);
    expect(wantsGetMeasured("Show the board")).toBe(false);
    expect(OS_PROMPT).toBe("Paste a signed card, or say what you use AI for.");
    expect(FOUR_TOOLS_HELP).toMatch(/do not certify/i);
    expect(FOUR_TOOLS_HELP).not.toMatch(/name an axis/);
  });

  it("builds the live count line from totals, never a typed 22", () => {
    expect(liveCountLine({ axes: 3, measured_axes: 2, unmeasured_axes: 1 })).toBe(
      "3 slots · 2 measured · 1 empty",
    );
    expect(liveCountLine({ public_count: "GET /api/gspc" })).toBe("Board loading…");
  });

  it("formats UNMEASURED as a first-class cell, never a typed 22", () => {
    const totals = formatBoardTotals({
      totals: { public_count: "3 axis · 2 measured", unmeasured_axes: 1, separated_leads: 0, ties: 1 },
    });
    expect(totals).toContain("3 axis · 2 measured");
    expect(totals).toContain("1 UNMEASURED");
    expect(totals).not.toMatch(/\b22\b/);

    const empty = formatAxis({ axis: "reserve-attestation", status: "UNMEASURED" }, "reserve-attestation");
    expect(empty).toContain("UNMEASURED");
    expect(empty).toContain("first-class");
    expect(empty).not.toMatch(/0%/);

    const missing = formatAxis(null, "axis-23");
    expect(missing).toMatch(/do not invent a 23rd axis/i);

    const list = formatCardList({
      cards: { count: 4 },
      board: { signature: { verification_state: "UNVERIFIABLE" } },
    });
    expect(list).toContain("4 listed");
    expect(list).toContain("UNVERIFIABLE");
  });
});
