import { describe, expect, it } from "vitest";
import { boardTiles } from "@/components/home/LiveBoardGlance";
import { loadBoard } from "@/data/axis-sets";
import { AXES_D } from "../../../functions/api/_gspc_axes_d";
import { isOwnerGated } from "./ownerGated";

const board = { axes: AXES_D } as any;
const gated = AXES_D.filter(isOwnerGated).map((a) => a.axis);

describe("owner-gated axes never render publicly", () => {
  it("regulator-transparency is the owner-gated slot", () => {
    expect(gated).toEqual(["regulator-transparency"]);
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
    expect(AXES_D).toHaveLength(10);
  });
});
