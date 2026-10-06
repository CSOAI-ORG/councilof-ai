import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  axisView,
  comparedModels,
  daysSince,
  freshness,
  groupAxis,
  isOwnModel,
  modelCells,
  spreadsOverlap,
  type BoardDoc,
  type FleetDoc,
  type FleetModel,
} from "./livingBoard";

const FLEET = JSON.parse(
  readFileSync(resolve(__dirname, "../../../public/interop/gspc-fleet-2026-08-12.json"), "utf8"),
) as FleetDoc;

const m = (model: string, lo: number, hi: number, spread: [number, number]): FleetModel => ({
  model,
  base_model: true,
  k: 0,
  n: 10,
  accuracy: (lo + hi) / 2,
  wilson95: [lo, hi],
  rank_spread: spread,
});

/** A board built from the fleet file itself, so the join is exercised without typing a number. */
function boardFromFleet(over: Partial<Record<string, string>> = {}): BoardDoc {
  return {
    peritem_rows: { peritem_sha256: FLEET.peritem_sha256 },
    axes: Object.entries(FLEET.axes).map(([axis, f]) => ({
      axis,
      kind: "model-comparison",
      separation: over[axis] ?? f.board_determination,
      measurement_time: { observed_on: "2026-08-12" },
      ...(f.board_determination === "UNTESTED" ? { separation_untested_reason: "board reason" } : {}),
    })),
  };
}

describe("rank spread grouping", () => {
  it("puts every model whose spread overlaps the leader's under no clear winner on a TIE axis", () => {
    const g = groupAxis("TIE", [m("a", 0.5, 0.7, [1, 3]), m("b", 0.4, 0.6, [1, 3]), m("c", 0.1, 0.2, [4, 4])]);
    expect(g[0].label).toBe("no-clear-winner");
    expect(g[0].models.map((x) => x.model)).toEqual(["a", "b"]);
    expect(g[1].models.map((x) => x.model)).toEqual(["c"]);
  });
  it("never labels a SEPARATED axis a tie", () => {
    const g = groupAxis("SEPARATED", [m("a", 0.8, 0.9, [1, 1]), m("b", 0.4, 0.6, [2, 3])]);
    expect(g.map((x) => x.label)).toEqual(["separated-leader", "ordered"]);
  });
  it("overlap is inclusive at the boundary", () => {
    expect(spreadsOverlap([1, 2], [2, 4])).toBe(true);
    expect(spreadsOverlap([1, 1], [2, 4])).toBe(false);
  });
});

describe("the committed fleet file", () => {
  it("ranks only axes the board decided, and withholds every UNTESTED axis", () => {
    for (const [axis, f] of Object.entries(FLEET.axes)) {
      if (f.board_determination === "UNTESTED") {
        expect(f.models, axis).toEqual([]);
        expect(f.models_withheld, axis).toBeGreaterThan(0);
      } else {
        expect(f.models.length, axis).toBeGreaterThan(1);
      }
    }
  });
  it("never lists one of our own models", () => {
    for (const f of Object.values(FLEET.axes)) {
      for (const x of f.models) expect(isOwnModel(x.model), x.model).toBe(false);
      expect(f.own_overlays.excluded_before_comparison).toBe(true);
      expect(f.own_overlays.listed).toBe(false);
    }
  });
  it("every spread follows the published rule from the published intervals", () => {
    for (const [axis, f] of Object.entries(FLEET.axes)) {
      for (const x of f.models) {
        const others = f.models.filter((o) => o.model !== x.model);
        // The rule, re-read from the published (3-decimal) bounds. The producer used unrounded
        // bounds; no published pair sits within rounding of a boundary, so the two must agree.
        const best = 1 + others.filter((o) => o.wilson95[0] > x.wilson95[1]).length;
        const worst = 1 + others.filter((o) => o.wilson95[1] > x.wilson95[0]).length;
        expect(x.rank_spread, `${axis} ${x.model}`).toEqual([best, worst]);
      }
    }
  });
  it("counts the compared models from the file", () => {
    const models = comparedModels(FLEET);
    expect(models.length).toBeGreaterThan(1);
    expect(new Set(models).size).toBe(models.length);
  });
});

describe("joining the fleet file to the live board", () => {
  it("fails closed when the board binds other rows", () => {
    const b = boardFromFleet();
    b.peritem_rows = { peritem_sha256: "0".repeat(64) };
    const axis = Object.keys(FLEET.axes)[0];
    expect(axisView(axis, FLEET, b).kind).toBe("mismatch");
  });
  it("fails closed when the board's determination differs", () => {
    const ranked = Object.entries(FLEET.axes).find(([, f]) => f.board_determination === "TIE")?.[0];
    expect(ranked).toBeTruthy();
    const v = axisView(ranked!, FLEET, boardFromFleet({ [ranked!]: "SEPARATED" }));
    expect(v.kind).toBe("mismatch");
  });
  it("uses the board's own reason on a withheld axis", () => {
    const untested = Object.entries(FLEET.axes).find(([, f]) => f.board_determination === "UNTESTED")?.[0];
    expect(untested).toBeTruthy();
    const v = axisView(untested!, FLEET, boardFromFleet());
    expect(v.kind).toBe("withheld");
    if (v.kind === "withheld") expect(v.reason).toBe("board reason");
  });
  it("a model page says 'not in fleet' rather than inventing a cell", () => {
    const cells = modelCells("no-such-model", FLEET, boardFromFleet());
    for (const c of cells) expect(["not-in-fleet", "withheld"]).toContain(c.kind);
  });
});

describe("freshness", () => {
  it("reads dates from measurement evidence and reports the newest axis", () => {
    const f = freshness({
      axes: [
        { axis: "a", kind: "model-comparison", measurement_time: { observed_on: "2026-08-12" } },
        { axis: "b", kind: "deterministic-facts", measurement_time: { observed_at: "2026-09-22T05:43:05Z" } },
        { axis: "c", kind: "model-comparison" },
      ],
    });
    expect(f.comparisonDates).toEqual(["2026-08-12"]);
    expect(f.newest).toEqual({ date: "2026-09-22", axis: "b" });
    expect(f.axesWithDate).toBe(2);
    expect(f.axesTotal).toBe(3);
  });
  it("counts whole days in UTC", () => {
    expect(daysSince("2026-08-12", new Date("2026-10-06T01:00:00Z"))).toBe(55);
  });
});
