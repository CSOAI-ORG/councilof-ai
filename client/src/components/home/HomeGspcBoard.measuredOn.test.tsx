/**
 * HomeGspcBoard.measuredOn.test.tsx — when the board was measured, and with what.
 *
 * WP-2 asks the board to show source, observation date, instrument, cohort, sample size,
 * ties and unavailable states. Measured 2026-09-05, it showed all of those EXCEPT the
 * observation date and the instrument — both of which GET /api/gspc has been serving under
 * `measured_on` all along:
 *
 *   measured_on.date     "behavioural axes 2026-08-12 · jail 2026-08-18 · financial-fact …"
 *   measured_on.model    the 19-model fleet description
 *   measured_on.grading  how the answers were graded
 *
 * A reader saw "22 axes measured" with no way to learn the numbers were three weeks old, or
 * which fleet produced them. That is the same failure as the cohort and the Hub cells:
 * served, and never rendered.
 *
 * THE SHAPE MATTERS. `measured_on.date` is deliberately prose, because the axes were not all
 * measured on one day. Parsing it into a single timestamp, or picking the first date out of
 * it, would state an observation the endpoint never made. These tests pin it as passed
 * through verbatim.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

/** Runtime shape, read from GET /api/gspc on 2026-09-05. */
const BOARD = {
  totals: { public_count: "22 axis · 22 measured", lid: "22 axes measured · 14 model fleets · 3 public leader scores · 8 fact runs · TIE is TIE · not a certificate." },
  measured_on: {
    model: "The 14 behavioural (model-comparison) axes: 19-model fleet (8 tuned council specialists + 6 base models + frontier).",
    endpoint: "/api/gspc",
    date: "behavioural axes 2026-08-12 · jail 2026-08-18 · financial-fact axes 2026-08-26",
    grading: "Deterministic scoring. No model sits in the verdict path.",
  },
  axes: [
    { axis: "governance", bench: "GovBench", n: 237, status: "MEASURED", family: "gspc", kind: "model-comparison" },
  ],
};

vi.mock("../board/useGspcBoard", () => ({
  useGspcBoard: () => ({ data: BOARD, error: null, loading: false }),
}));

const { default: HomeGspcBoard } = await import("./HomeGspcBoard");
const html = () => renderToStaticMarkup(<HomeGspcBoard />);

describe("the board says when it was measured and with what", () => {
  it("renders the observation date verbatim", () => {
    expect(html()).toContain("behavioural axes 2026-08-12");
  });

  it("keeps the multi-date prose intact rather than flattening it to one date", () => {
    // The axes were measured on different days. A single timestamp would be an
    // observation the endpoint never made.
    const out = html();
    expect(out).toContain("jail 2026-08-18");
    expect(out).toContain("financial-fact axes 2026-08-26");
  });

  it("names the instrument and the grading beside the figures", () => {
    const out = html();
    expect(out).toContain("19-model fleet");
    expect(out).toMatch(/No model sits in the verdict path/);
  });

  it("labels each line so a reader knows which is the date", () => {
    const out = html();
    expect(out).toContain("Observed");
    expect(out).toContain("Instrument");
  });

  it("renders nothing at all when the API stops serving measured_on", async () => {
    // Absence must be silence, not an empty label or an invented date.
    vi.resetModules();
    vi.doMock("../board/useGspcBoard", () => ({
      useGspcBoard: () => ({
        data: { totals: BOARD.totals, axes: BOARD.axes },
        error: null,
        loading: false,
      }),
    }));
    const { default: Fresh } = await import("./HomeGspcBoard");
    const out = renderToStaticMarkup(<Fresh />);
    expect(out).not.toContain("Observed");
    expect(out).not.toContain("Instrument");
  });
});
