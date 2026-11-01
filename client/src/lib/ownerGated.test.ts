import { describe, expect, it } from "vitest";
import { boardTiles } from "@/components/home/LiveBoardGlance";
import { loadBoard } from "@/data/axis-sets";
import { AXES_D } from "../../../functions/api/_gspc_axes_d";
import { isOwnerGated } from "./ownerGated";

const board = { axes: AXES_D } as any;
const gated = AXES_D.filter(isOwnerGated).map((a) => a.axis);

describe("owner-gated axes never render publicly", () => {
  it("the owner-gated slots are exactly the ones the board marks", () => {
    // DERIVED, not typed: the estate adds subject axes and an owner-gated one can be
    // added at any time. Naming them here would make the test fail on a correct board
    // — and would name an axis that is NOT gated as if it were.
    expect(gated).toContain("regulator-transparency");
    expect(gated).toContain("watchdog-ingest");
    for (const id of gated) {
      const axis = AXES_D.find((a) => a.axis === id);
      expect(axis?.public_pages, id).toBe("HIDDEN_PENDING_OWNER_GO");
    }
  });
  it("homepage tiles drop every owner-gated axis", () => {
    const ids = boardTiles(board).map((t) => t.axis);
    for (const id of gated) expect(ids).not.toContain(id);
    expect(ids.length).toBe(AXES_D.length - gated.length);
  });
  it("board table rows drop every owner-gated axis", () => {
    const ids = loadBoard(board).rows.map((r) => r.id);
    for (const id of gated) expect(ids).not.toContain(id);
  });
});

describe("declared-slot method_status", () => {
  it("every new axis carries method_status", () => {
    for (const a of AXES_D) {
      if (a.axis === "serving-fidelity") {
        expect(a.method_status).toBe("reviewed, not run");
        expect(a.method).toBe("serving-fidelity v0.2");
        expect(a.method_sha).toBe("18206f71");
      } else expect(a.method_status, a.axis).toBe("no-method: declared slot");
    }
    // DERIVED, not typed: the estate adds subject axes (slot 34 = watchdog-ingest,
    // 2026-10-30) and a typed 10 here would fail on a correct board.
    expect(AXES_D.length).toBeGreaterThan(0);
    expect(AXES_D.length).toBe(AXES_D.filter((a) => a.family === "subject").length);
  });
});
