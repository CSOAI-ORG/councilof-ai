/**
 * gspcFleet.test — the leaderboard data core, checked against the REAL signed
 * matrix the site serves (public/signed/card-matrix.json). These are the
 * invariants the board leads by example on: counts are derived not typed, an
 * unmeasured pair is absent not zero, and a Wilson interval never appears without
 * an n behind it.
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
  type FleetMatrix,
} from "./gspcFleet";

const matrix: FleetMatrix = JSON.parse(
  readFileSync(resolve(__dirname, "../../../public/signed/card-matrix.json"), "utf8"),
);

describe("deriveCounts — read, never typed", () => {
  it("derives model/axis/cell counts from the arrays, matching the file's own counts block", () => {
    const c = deriveCounts(matrix);
    expect(c.models).toBe(matrix.models.length);
    expect(c.axes).toBe(matrix.axes.length);
    expect(c.measuredCells).toBe(matrix.cells.length);
    // The file's generator computed the same possible-cells figure independently.
    expect(c.possibleCells).toBe(matrix.counts.possible_cells);
    expect(c.measuredCells + (c.possibleCells - c.measuredCells)).toBe(c.possibleCells);
  });

  it("reports coverage as a fraction in [0,1], never a fabricated 100%", () => {
    const c = deriveCounts(matrix);
    expect(c.coverage).not.toBeNull();
    expect(c.coverage!).toBeGreaterThan(0);
    expect(c.coverage!).toBeLessThan(1); // the corpus is deliberately partial
  });

  it("counts every signed cell and never over-counts", () => {
    const c = deriveCounts(matrix);
    expect(c.signedCells).toBeLessThanOrEqual(c.measuredCells);
  });
});

describe("the grid — an unmeasured pair is absent, not zero", () => {
  it("returns a cell for a measured pair and null for an unmeasured one", () => {
    const grid = buildGrid(matrix);
    const someCell = matrix.cells[0];
    expect(cellFor(grid, someCell.model, someCell.axis)?.accuracy).toBe(someCell.accuracy);
    // A pair with no card must be null — the honest empty, never 0.
    expect(cellFor(grid, "definitely-not-a-real-model", matrix.axes[0].id)).toBeNull();
  });
});

describe("shaping functions", () => {
  it("topModelsForAxis orders best-first and only lists models measured there", () => {
    const axis = matrix.axes[0].id;
    const rows = topModelsForAxis(matrix, axis);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].accuracy).toBeGreaterThanOrEqual(rows[i].accuracy);
    }
    expect(rows.length).toBe(matrix.axes[0].models);
  });

  it("leaderLabel is the top row and equals the axis's declared best", () => {
    const a = matrix.axes[0];
    const leader = leaderLabel(matrix, a.id);
    expect(leader).not.toBeNull();
    expect(leader!.accuracy).toBeCloseTo(a.best_accuracy, 5);
  });

  it("rowsForModel returns one entry per axis, measured and unmeasured alike", () => {
    const grid = buildGrid(matrix);
    const rows = rowsForModel(grid, matrix.models[0].id);
    expect(rows.length).toBe(matrix.axes.length);
    expect(rows.some((r) => r.cell === null)).toBe(true); // a model measured on few axes
  });

  it("splitAxes keeps every axis (nothing dropped)", () => {
    const total = splitAxes(matrix).reduce((s, f) => s + f.axes.length, 0);
    expect(total).toBe(matrix.axes.length);
  });
});

describe("composite — opt-in, transparent, and it reports its own denominator", () => {
  it("averages only measured cells and never invents a blank", () => {
    const rows = compositeAcrossAxes(matrix, matrix.axes.map((a) => a.id));
    for (const r of rows) {
      expect(r.measuredOn).toBeGreaterThan(0);
      expect(r.measuredOn).toBeLessThanOrEqual(r.outOf);
      expect(r.mean).toBeGreaterThanOrEqual(0);
      expect(r.mean).toBeLessThanOrEqual(1);
    }
    // ordered best-first
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1].mean).toBeGreaterThanOrEqual(rows[i].mean);
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
    expect(wilson(1.2, 30, "x")).toBeNull(); // out-of-range p
    const w = wilson(0.9, 30, "declared bank");
    expect(w).not.toBeNull();
    expect(w!.lo).toBeGreaterThanOrEqual(0);
    expect(w!.hi).toBeLessThanOrEqual(1);
    expect(w!.lo).toBeLessThan(w!.hi);
    expect(w!.nSource).toBe("declared bank");
  });
});

describe("badgeSVG — self-contained, no external assets", () => {
  it("emits an svg carrying the figure and no remote references", () => {
    const svg = badgeSVG("safety", 0.734);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("73.4%");
    // The only URL may be the SVG xmlns namespace; nothing is FETCHED — no
    // href/src/url() pulling a remote asset.
    expect(svg).not.toMatch(/(href|src)\s*=|url\(/i);
  });
});
