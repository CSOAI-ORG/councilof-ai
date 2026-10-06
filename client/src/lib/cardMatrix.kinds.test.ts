import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isR1, isR2, UNCONFIRMED_TAGS } from "../../../scripts/build-own-model-disclosure.mjs";

// T02 / T07 (persona audit 2026-10-06). public/signed/card-matrix.json is a derived index of the
// signed card corpus (corpus 3). It must (a) say which rows are our own models, classified on the
// raw card name before any name is withheld, so /board/models can list them apart and never rank
// them with third-party models; and (b) flag zeros that point at the scoring rather than the model,
// keeping them out of every average and best.

const matrix = JSON.parse(readFileSync(resolve(__dirname, "../../../public/signed/card-matrix.json"), "utf8"));
type Model = { id: string; kind: string; mean_accuracy: number | null; best_accuracy: number | null; zero_not_quotable: number };
type Cell = { model: string; axis: string; accuracy: number | null; zero_flag?: string };
const models: Model[] = matrix.models;
const cells: Cell[] = matrix.cells;

describe("card-matrix: own models are labelled, never inferred in the client", () => {
  it("every model row carries a kind from the three-value set", () => {
    for (const m of models) expect(["third_party", "own", "own_unconfirmed"]).toContain(m.kind);
  });

  it("every withheld-name-N row is one of our own models", () => {
    const withheld = models.filter((m) => m.id.startsWith("withheld-name-"));
    expect(withheld.length).toBe(matrix.display_name_policy.withheld_names);
    for (const m of withheld) expect(m.kind).toBe("own");
  });

  it("published names are classified by the imported disclosure rules", () => {
    for (const m of models.filter((x) => !x.id.startsWith("withheld-name-"))) {
      const want = isR1(m.id) || isR2(m.id) ? "own" : UNCONFIRMED_TAGS.includes(m.id) ? "own_unconfirmed" : "third_party";
      expect(m.kind, m.id).toBe(want);
    }
  });

  it("the three groups add up to counts.models, and counts.models is still the whole corpus", () => {
    const c = matrix.counts;
    expect(c.models_third_party + c.models_own + c.models_own_unconfirmed).toBe(c.models);
    expect(c.models).toBe(models.length);
    expect(c.models_third_party).toBe(models.filter((m) => m.kind === "third_party").length);
    expect(c.cells_third_party).toBe(
      cells.filter((x) => models.find((m) => m.id === x.model)?.kind === "third_party").length,
    );
    expect(c.signed_cells).toBe(c.cells);
  });
});

describe("card-matrix: zeros that point at the scoring are not quoted", () => {
  it("AXIS_FLOOR marks exactly the axes where every model scored exactly 0", () => {
    const axes = [...new Set(cells.map((c) => c.axis))];
    for (const ax of axes) {
      const own = cells.filter((c) => c.axis === ax);
      const floor = own.every((c) => c.accuracy === 0);
      for (const c of own) expect(c.zero_flag === "AXIS_FLOOR", `${ax}`).toBe(floor);
    }
  });

  it("MODEL_FLOOR marks a model that is exactly 0 everywhere while another model beat it somewhere", () => {
    for (const m of models) {
      const mine = cells.filter((c) => c.model === m.id && c.zero_flag !== "AXIS_FLOOR");
      const all = cells.filter((c) => c.model === m.id);
      const allZero = all.length > 0 && all.every((c) => c.accuracy === 0);
      const axes = new Set(all.map((c) => c.axis));
      const beaten = cells.some((c) => c.model !== m.id && axes.has(c.axis) && (c.accuracy ?? 0) > 0);
      for (const c of mine) expect(c.zero_flag === "MODEL_FLOOR", m.id).toBe(allZero && beaten);
    }
  });

  it("flagged cells are left out of every mean and best, and counted", () => {
    for (const m of models) {
      const q = cells.filter((c) => c.model === m.id && !c.zero_flag && typeof c.accuracy === "number");
      expect(m.best_accuracy, m.id).toBe(q.length ? Math.max(...q.map((c) => c.accuracy as number)) : null);
      expect(m.zero_not_quotable).toBe(cells.filter((c) => c.model === m.id && c.zero_flag).length);
    }
    expect(matrix.counts.zero_not_quotable).toBe(cells.filter((c) => c.zero_flag).length);
  });

  it("only exact zeros are ever flagged", () => {
    for (const c of cells.filter((x) => x.zero_flag)) expect(c.accuracy).toBe(0);
  });
});
