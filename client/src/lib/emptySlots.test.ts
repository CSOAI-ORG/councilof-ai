import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { BoardCount } from "./boardCount";
import { BOARD_COUNT_OBSERVED } from "./boardCount";
import { BOARD_LIVE_RULING, boardRulingFrom } from "./emptySlots";

const count = (over: Partial<BoardCount>): BoardCount => ({ ...BOARD_COUNT_OBSERVED, ...over });

describe("board-honesty ruling is derived from totals (Inspector K1)", () => {
  it("unmeasured 0: says every declared slot carries a measurement, and names no empty slot", () => {
    const line = boardRulingFrom(count({ live: true, axes: 23, measured_axes: 23, unmeasured_axes: 0, public_count: "23 axis · 23 measured" }));
    expect(line).toMatch(/^Live board \(GET \/api\/gspc\): 23 axis · 23 measured\./);
    expect(line).toContain("totals.unmeasured_axes = 0");
    expect(line).not.toMatch(/effect-binding|no run behind it|one declared slot/);
    expect(line).toMatch(/UNMEASURED until a signed cell/);
  });

  it("unmeasured > 0: the empty-as-finding wording comes back, with the live count", () => {
    expect(boardRulingFrom(count({ live: true, unmeasured_axes: 1 }))).toContain("1 declared slot has no run behind it");
    expect(boardRulingFrom(count({ live: true, unmeasured_axes: 2 }))).toContain("2 declared slots have no run behind it");
  });

  it("the recorded fallback names its observation date and defers to the live GET", () => {
    const line = boardRulingFrom(count({ live: false }));
    expect(line).toMatch(/^Board as last observed/);
    expect(line).toContain("GET /api/gspc supersedes this");
  });

  it("no typed ADR-002 sentence survives in the source or the fallback", () => {
    const src = readFileSync(join(__dirname, "emptySlots.ts"), "utf8");
    expect(src).not.toMatch(/which since ADR-002 \(16 Sep 2026\) it is/);
    expect(BOARD_LIVE_RULING).toBe(boardRulingFrom(BOARD_COUNT_OBSERVED));
  });

  it("the /products panel renders the derived line from useBoardCount, not a constant", () => {
    const tsx = readFileSync(join(__dirname, "../components/EmptySlots.tsx"), "utf8");
    expect(tsx).toContain("useBoardCount()");
    expect(tsx).toContain("boardRulingFrom(board)");
    expect(tsx).not.toMatch(/\{BOARD_LIVE_RULING\}/);
  });
});
