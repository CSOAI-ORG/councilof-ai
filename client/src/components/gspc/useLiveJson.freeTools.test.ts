/**
 * The dashboard's "For developers" tile (E2E 2026-11-20 finding 13, follow-up): it printed
 * "49 free tools, no account · Source date not supplied" for a number read live from
 * POST /mcp/free → tools/list seconds before. The read has a time; the tile now cites it. The
 * figure never prints the render time in its place: a read with no time still says "not supplied".
 */
import { describe, expect, it } from "vitest";
import { freeToolsFigure } from "./useLiveJson";

describe("freeToolsFigure", () => {
  it("cites the time the door answered tools/list as the figure's as_of", () => {
    const f = freeToolsFigure({ count: 49, read_at: "2026-11-21T06:37:12.000Z" });
    expect(f).toEqual({
      value: "49",
      label: "free tools, no account",
      source:
        "POST https://councilof.ai/mcp/free → tools/list (the door this card installs; the paid tools are on /mcp only) · declared by tools/list; a tool is runtime-observed only after its own tools/call",
      as_of: "2026-11-21T06:37:12.000Z",
    });
  });

  it("leaves as_of null when the read carries no time (never the render time)", () => {
    expect(freeToolsFigure({ count: 49 })?.as_of).toBeNull();
    expect(freeToolsFigure({ count: 49, read_at: null })?.as_of).toBeNull();
    expect(freeToolsFigure({ count: 49, read_at: "  " })?.as_of).toBeNull();
    expect(freeToolsFigure({ count: 49, read_at: 1763707032 })?.as_of).toBeNull();
  });

  it("is null, not a number, when the count is absent or malformed", () => {
    expect(freeToolsFigure({ read_at: "2026-11-21T06:37:12.000Z" })).toBeNull();
    expect(freeToolsFigure({ count: "49" })).toBeNull();
    expect(freeToolsFigure({ count: -1 })).toBeNull();
    expect(freeToolsFigure({ count: 4.5 })).toBeNull();
    expect(freeToolsFigure(49)).toBeNull();
    expect(freeToolsFigure(null)).toBeNull();
  });

  it("prints zero as zero: an empty door is a real reading, not a missing one", () => {
    expect(freeToolsFigure({ count: 0, read_at: "2026-11-21T06:37:12.000Z" })?.value).toBe("0");
  });
});
