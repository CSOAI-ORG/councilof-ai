/**
 * gspcFleet.test — the leaderboard data core under both evidence states:
 *
 *  - the generated matrix is checked as an integration fixture, including the
 *    honest case where every retained card is still non-quotable; and
 *  - algorithms use a small synthetic ADMITTED_VERIFIED fixture, so a truthful
 *    zero-admission corpus does not force tests to invent production scores.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  deriveCounts,
  buildGrid,
  cellFor,
  topModelsForAxis,
  leaderLabel,
  rowsForModel,
  compositeAcrossAxes,
  axisBankN,
  wilson,
  splitAxes,
  badgeSVG,
  isAdmittedMatrixCell,
  type FleetMatrix,
  type MatrixCell,
} from "./gspcFleet";

const generatedMatrix: FleetMatrix = JSON.parse(
  readFileSync(resolve(__dirname, "../../../public/signed/card-matrix.json"), "utf8"),
);

function admittedCell(model: string, axis: string, accuracy: number, hex: string): MatrixCell {
  return {
    model,
    axis,
    accuracy,
    created: "2026-09-04T12:00:00Z",
    card: hex.repeat(64),
    card_url: `/signed/cards/${hex.repeat(64)}.json`,
    evidence_state: "ADMITTED_VERIFIED",
    signature_verified: true,
    admitted: true,
    quotable: true,
    signed: true,
    alg: "Ed25519",
    pubkey: "ab".repeat(32),
    did: "did:web:csoai.org#card-attestation-1",
  };
}

const syntheticMatrix: FleetMatrix = {
  schema: "csoai.card-matrix/2",
  as_of: "2026-09-04T12:00:00Z",
  counts: {
    cards_read: 3,
    cells: 3,
    models: 2,
    axes: 2,
    signed_cells: 3,
    admitted_cells: 3,
    quotable_cells: 3,
    signature_verified_records: 3,
    legacy_unadjudicated_records: 0,
    unverified_records: 0,
    non_quotable_records: 0,
    inventory_models: 2,
    inventory_axes: 2,
    possible_cells: 4,
  },
  axes: [
    { id: "mmlu-30", cards: 2, models: 2, mean_accuracy: 0.85, best_accuracy: 0.9, as_of: "2026-09-04T12:00:00Z" },
    { id: "gspc-safety", cards: 1, models: 1, mean_accuracy: 0.4, best_accuracy: 0.4, as_of: "2026-09-04T12:00:00Z" },
  ],
  models: [
    { id: "fixture/alpha", name_published: true, cards: 2, axes: ["mmlu-30", "gspc-safety"], mean_accuracy: 0.6, best_accuracy: 0.8, as_of: "2026-09-04T12:00:00Z" },
    { id: "fixture/beta", name_published: true, cards: 1, axes: ["mmlu-30"], mean_accuracy: 0.9, best_accuracy: 0.9, as_of: "2026-09-04T12:00:00Z" },
  ],
  cells: [
    admittedCell("fixture/alpha", "mmlu-30", 0.8, "a"),
    admittedCell("fixture/alpha", "gspc-safety", 0.4, "b"),
    admittedCell("fixture/beta", "mmlu-30", 0.9, "c"),
  ],
  non_quotable_records: [],
};

const zeroAdmissionMatrix: FleetMatrix = {
  schema: "csoai.card-matrix/2",
  as_of: null,
  inventory_as_of: "2026-09-04T11:00:00Z",
  counts: {
    cards_read: 1,
    cells: 0,
    models: 0,
    axes: 0,
    signed_cells: 0,
    admitted_cells: 0,
    quotable_cells: 0,
    signature_verified_records: 1,
    legacy_unadjudicated_records: 1,
    unverified_records: 0,
    non_quotable_records: 1,
    inventory_models: 1,
    inventory_axes: 1,
    possible_cells: 0,
  },
  axes: [],
  models: [],
  cells: [],
  non_quotable_records: [
    {
      model: "fixture/legacy",
      axis: "mmlu-30",
      accuracy: null,
      recorded_accuracy_in_card: true,
      created: "2026-09-04T11:00:00Z",
      card: "d".repeat(64),
      card_url: `/signed/cards/${"d".repeat(64)}.json`,
      evidence_state: "LEGACY_UNADJUDICATED",
      signature_verified: true,
      admitted: false,
      quotable: false,
      signed: false,
      alg: "Ed25519",
    },
  ],
};

describe("generated corpus — the admission boundary stays visible", () => {
  it("contains only fully admitted records in cells", () => {
    expect(generatedMatrix.cells.every(isAdmittedMatrixCell)).toBe(true);
    expect(generatedMatrix.cells).toHaveLength(generatedMatrix.counts.admitted_cells ?? generatedMatrix.cells.length);
    expect(generatedMatrix.cells).toHaveLength(generatedMatrix.counts.quotable_cells ?? generatedMatrix.cells.length);
  });

  it("retains non-quotable inventory without exposing its recorded scores", () => {
    const inventory = generatedMatrix.non_quotable_records ?? [];
    expect(inventory).toHaveLength(generatedMatrix.counts.non_quotable_records ?? inventory.length);
    for (const record of inventory) {
      expect(record.accuracy).toBeNull();
      expect(record.admitted).toBe(false);
      expect(record.quotable).toBe(false);
      expect(record.signed).toBe(false);
      expect(["LEGACY_UNADJUDICATED", "UNVERIFIED"]).toContain(record.evidence_state);
    }
  });

  it("derives null coverage rather than 0% when the admitted denominator is empty", () => {
    if (generatedMatrix.cells.length !== 0) return;
    expect(deriveCounts(generatedMatrix)).toEqual({
      models: 0,
      axes: 0,
      measuredCells: 0,
      possibleCells: 0,
      coverage: null,
      signedCells: 0,
      withheldNames: 0,
    });
  });
});

describe("zero-admission behavior", () => {
  it("does not turn retained legacy inventory into models, axes, cells, or coverage", () => {
    expect(deriveCounts(zeroAdmissionMatrix)).toEqual({
      models: 0,
      axes: 0,
      measuredCells: 0,
      possibleCells: 0,
      coverage: null,
      signedCells: 0,
      withheldNames: 0,
    });
  });

  it("returns empty rankings and composites without inventing a score", () => {
    const grid = buildGrid(zeroAdmissionMatrix);
    expect(grid.cellIndex.size).toBe(0);
    expect(cellFor(grid, "fixture/legacy", "mmlu-30")).toBeNull();
    expect(topModelsForAxis(zeroAdmissionMatrix, "mmlu-30")).toEqual([]);
    expect(leaderLabel(zeroAdmissionMatrix, "mmlu-30")).toBeNull();
    expect(compositeAcrossAxes(zeroAdmissionMatrix, ["mmlu-30"])).toEqual([]);
    expect(splitAxes(zeroAdmissionMatrix)).toEqual([]);
  });

  it("rejects signed-by-presence compatibility objects", () => {
    expect(isAdmittedMatrixCell({ signed: true, accuracy: 0.99 })).toBe(false);
  });
});

describe("deriveCounts — read, never typed", () => {
  it("derives model/axis/cell counts from the admitted arrays", () => {
    const counts = deriveCounts(syntheticMatrix);
    expect(counts.models).toBe(2);
    expect(counts.axes).toBe(2);
    expect(counts.measuredCells).toBe(3);
    expect(counts.possibleCells).toBe(4);
    expect(counts.coverage).toBe(0.75);
    expect(counts.signedCells).toBe(3);
  });
});

describe("the grid — an unmeasured pair is absent, not zero", () => {
  it("returns a cell for a measured pair and null for an unmeasured one", () => {
    const grid = buildGrid(syntheticMatrix);
    expect(cellFor(grid, "fixture/alpha", "mmlu-30")?.accuracy).toBe(0.8);
    expect(cellFor(grid, "fixture/beta", "gspc-safety")).toBeNull();
  });
});

describe("shaping functions", () => {
  it("topModelsForAxis orders best-first and only lists measured models", () => {
    const rows = topModelsForAxis(syntheticMatrix, "mmlu-30");
    expect(rows.map((row) => row.model)).toEqual(["fixture/beta", "fixture/alpha"]);
    expect(rows.map((row) => row.accuracy)).toEqual([0.9, 0.8]);
  });

  it("leaderLabel is the top row and equals the axis's declared best", () => {
    const axis = syntheticMatrix.axes[0];
    const leader = leaderLabel(syntheticMatrix, axis.id);
    expect(leader).not.toBeNull();
    expect(leader!.accuracy).toBeCloseTo(axis.best_accuracy, 5);
  });

  it("rowsForModel returns one entry per axis, measured and unmeasured alike", () => {
    const rows = rowsForModel(buildGrid(syntheticMatrix), "fixture/beta");
    expect(rows).toHaveLength(2);
    expect(rows.filter((row) => row.cell === null)).toHaveLength(1);
  });

  it("splitAxes keeps every admitted axis", () => {
    const total = splitAxes(syntheticMatrix).reduce((sum, family) => sum + family.axes.length, 0);
    expect(total).toBe(syntheticMatrix.axes.length);
  });
});

describe("composite — opt-in, transparent, and it reports its own denominator", () => {
  it("averages only measured cells and never invents a blank", () => {
    const rows = compositeAcrossAxes(syntheticMatrix, syntheticMatrix.axes.map((axis) => axis.id));
    expect(rows.map((row) => row.model)).toEqual(["fixture/beta", "fixture/alpha"]);
    expect(rows[0]).toMatchObject({ mean: 0.9, measuredOn: 1, outOf: 2 });
    expect(rows[1]).toMatchObject({ measuredOn: 2, outOf: 2 });
    expect(rows[1].mean).toBeCloseTo(0.6, 10);
  });
});

describe("statistics honesty boundary", () => {
  it("axisBankN parses n only from a *-NN id and is null otherwise", () => {
    expect(axisBankN("mmlu-30")).toBe(30);
    expect(axisBankN("arc-30")).toBe(30);
    expect(axisBankN("gspc-safety")).toBeNull();
    expect(axisBankN("care-refusal-protect")).toBeNull();
  });

  it("wilson returns null without a positive n — never an interval with no basis", () => {
    expect(wilson(0.9, null, "x")).toBeNull();
    expect(wilson(0.9, 0, "x")).toBeNull();
    expect(wilson(1.2, 30, "x")).toBeNull();
    const interval = wilson(0.9, 30, "declared bank");
    expect(interval).not.toBeNull();
    expect(interval!.lo).toBeGreaterThanOrEqual(0);
    expect(interval!.hi).toBeLessThanOrEqual(1);
    expect(interval!.lo).toBeLessThan(interval!.hi);
    expect(interval!.nSource).toBe("declared bank");
  });
});

describe("badgeSVG — self-contained, no external assets", () => {
  it("emits an svg carrying the figure and no remote references", () => {
    const svg = badgeSVG("safety", 0.734);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("73.4%");
    expect(svg).not.toMatch(/(href|src)\s*=|url\(/i);
  });
});
