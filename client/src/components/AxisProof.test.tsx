/**
 * AxisProof.test.tsx — the cohort behind a headline number is on the page.
 *
 * Until 2026-09-05 GET /api/gspc served `per_model` for jail — seven complete confusion
 * matrices — and nothing in client/ rendered it. A reader saw "leader accuracy 0.5915, TIE"
 * with no way to see who was compared or how close it was. WP-2 asks for cohort, and it was
 * being served and dropped.
 *
 * These tests use the real shape from runtime, including the parts that are easy to render
 * wrongly: per-model n varies (68/70/71) and one model scored tp=0/fp=0 — it detected nothing.
 * A component that hides an all-zero row, or that presents per-model n as a share of axis n,
 * passes a naive test and misleads a reader.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

/** Runtime shape, jail, read from GET /api/gspc?axis=jail on 2026-09-05. */
const JAIL = {
  axis: "jail",
  bench: "GoldBank-Detector",
  n: 71,
  accuracy: 0.5915,
  interval: [0.475, 0.698],
  separation: "TIE",
  status: "MEASURED",
  quotable_models: [
    "qwen2.5:0.5b-instruct",
    "council-safe",
    "qwen2.5:7b",
    "mistral:7b",
    "qwen2.5:1.5b",
    "qwen3:4b",
    "council-inhouse-ft",
  ],
  per_model: {
    "qwen3:4b": { n: 68, tp: 6, fp: 0, tn: 30, fn: 32, accuracy: 0.5294, quotable: true },
    "qwen2.5:7b": { n: 71, tp: 7, fp: 0, tn: 33, fn: 31, accuracy: 0.5634, quotable: true },
    "mistral:7b": { n: 71, tp: 9, fp: 3, tn: 30, fn: 29, accuracy: 0.5493, quotable: true },
    "council-safe": { n: 71, tp: 8, fp: 0, tn: 33, fn: 30, accuracy: 0.5775, quotable: true },
    // Detected nothing. Must still appear — an absent row reads as a better result.
    "council-inhouse-ft": { n: 71, tp: 0, fp: 0, tn: 33, fn: 38, accuracy: 0.4648, quotable: true },
    "qwen2.5:1.5b": { n: 70, tp: 7, fp: 2, tn: 31, fn: 30, accuracy: 0.5429, quotable: true },
    "qwen2.5:0.5b-instruct": { n: 71, tp: 9, fp: 0, tn: 33, fn: 29, accuracy: 0.5915, quotable: true },
  },
};

vi.mock("./board/useGspcBoard", () => ({
  useGspcBoard: () => ({ data: { axes: [JAIL] }, error: null, loading: false }),
}));

const { default: AxisProof } = await import("./AxisProof");

const html = () =>
  renderToStaticMarkup(<AxisProof axes={["jail"]} why="test" />);

describe("AxisProof renders the cohort behind the number", () => {
  it("names every model in the cohort", () => {
    const out = html();
    for (const model of Object.keys(JAIL.per_model)) {
      expect(out, `${model} missing from the rendered cohort`).toContain(model);
    }
  });

  it("shows the model that detected nothing rather than hiding it", () => {
    // tp=0 and fp=0. Dropping or blanking this row would make the cohort look better
    // than it is, which is the failure mode this whole component exists against.
    const out = html();
    expect(out).toContain("council-inhouse-ft");
    expect(out).toContain("0.4648");
  });

  it("is collapsed at rest so the page's first frame is unchanged", () => {
    const out = html();
    expect(out).toContain("<details");
    expect(out).not.toContain("<details open");
  });

  it("states that per-model n is not a share of axis n", () => {
    const out = html();
    // The one sentence that stops a reader summing 68+71+71+… and comparing it to 71.
    expect(out).toMatch(/not a share of the axis n/i);
  });

  it("the cohort table has an accessible name naming its axis", () => {
    // The outer table inherits a name from the section's aria-labelledby. The nested one had
    // none, so a screen reader announced "table" inside a disclosure with no clue which axis
    // it belonged to. sr-only is a real Tailwind utility here — verified present in the built
    // CSS with clip-path/absolute — so this costs nothing visually.
    const out = html();
    expect(out).toMatch(/<caption class="sr-only">/);
    expect(out).toMatch(/Per-model results for the jail axis/);
  });

  it("renders nothing extra for an axis with no cohort", async () => {
    vi.resetModules();
    vi.doMock("./board/useGspcBoard", () => ({
      useGspcBoard: () => ({
        data: { axes: [{ axis: "governance", bench: "GovBench", n: 237, status: "MEASURED" }] },
        error: null,
        loading: false,
      }),
    }));
    const { default: Fresh } = await import("./AxisProof");
    const out = renderToStaticMarkup(<Fresh axes={["governance"]} why="test" />);
    expect(out).toContain("governance");
    expect(out).not.toContain("<details");
  });
});
