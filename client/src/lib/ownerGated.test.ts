import { describe, expect, it } from "vitest";
import { boardTiles } from "@/components/home/LiveBoardGlance";
import { loadBoard } from "@/data/axis-sets";
import { AXES_D } from "../../../functions/api/_gspc_axes_d";
import { isOwnerGated } from "./ownerGated";

const board = { axes: AXES_D } as any;
const gated = AXES_D.filter(isOwnerGated).map((a) => a.axis);
const RELEASED = ["regulator-transparency", "watchdog-ingest"];

// The board holds no slot back today, so the filters are exercised on a held row added here
// rather than passing vacuously over an empty list.
const HELD = { ...AXES_D[0], axis: "held-slot-fixture", public_pages: "HIDDEN_PENDING_OWNER_GO" };
const withHeld = { axes: [...AXES_D, HELD] } as any;

describe("owner-gated axes never render publicly", () => {
  it("no subject slot is held: the owner released both held slots on 2026-11-18", () => {
    // The owner's words: "Release both". Holding a slot again is a new owner decision,
    // so this test is meant to fail until that decision is recorded here.
    expect(gated).toEqual([]);
    for (const id of RELEASED) {
      const axis = AXES_D.find((a) => a.axis === id);
      expect(axis, id).toBeDefined();
      expect(axis?.public_pages, id).toBeUndefined();
    }
  });
  it("the released slots render on the homepage tiles and the board table", () => {
    const tiles = boardTiles(board).map((t) => t.axis);
    const rows = loadBoard(board).rows.map((r) => r.id);
    for (const id of RELEASED) {
      expect(tiles).toContain(id);
      expect(rows).toContain(id);
    }
    expect(tiles.length).toBe(AXES_D.length);
  });
  it("homepage tiles drop a held axis", () => {
    const ids = boardTiles(withHeld).map((t) => t.axis);
    expect(ids).not.toContain(HELD.axis);
    expect(ids.length).toBe(AXES_D.length);
  });
  it("board table rows drop a held axis", () => {
    const ids = loadBoard(withHeld).rows.map((r) => r.id);
    expect(ids).not.toContain(HELD.axis);
    expect(ids.length).toBe(AXES_D.length);
  });
});

describe("declared-slot method_status", () => {
  it("every new axis carries method_status", () => {
    for (const a of AXES_D) {
      // All 11 subject axes are promoted to MEASURED (claim-maintenance on 2026-10-29;
      // the remaining 10 subject axes on 2026-11-02) with frozen, sha-pinned banks and n_valid >= 30.
      expect(a.method_status, a.axis).toBe("meets-rule");
      expect(a.kind, a.axis).toBe("measured-subject");
      expect(a.status, a.axis).toBe("MEASURED");
      expect(a.n, a.axis).toBeGreaterThanOrEqual(30);
    }
    // DERIVED, not typed: the estate adds subject axes (slot 34 = watchdog-ingest,
    // 2026-10-30) and a typed 10 here would fail on a correct board.
    expect(AXES_D.length).toBeGreaterThan(0);
    expect(AXES_D.length).toBe(AXES_D.filter((a) => a.family === "subject").length);
  });
});
