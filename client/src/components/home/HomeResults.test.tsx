import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { describe, expect, it } from "vitest";
import HomeResults from "./HomeResults";
import type { GspcPayload } from "../board/useGspcBoard";

const data: GspcPayload = {
  totals: {
    public_count: "4 axes · 3 measured (fixture)",
    comparison_axes: 2,
    separated_leads: 0,
    ties: 1,
    untested_separations: 1,
  },
  measured_on: { date: "fixture runs 2026-01-02" },
  axes: [
    {
      axis: "safety",
      kind: "model-comparison",
      status: "MEASURED",
      accuracy: 0.5,
      n: 40,
      separation: "TIE",
    },
  ],
};
const render = (payload: GspcPayload | null, error: string | null = null) =>
  renderToStaticMarkup(
    <Router ssrPath="/">
      <HomeResults data={payload} error={error} />
    </Router>,
  );

describe("homepage result evidence boundary", () => {
  it("keeps its only count beside separation, date and shared source", () => {
    const html = render(data);
    expect(html.match(/4 axes · 3 measured \(fixture\)/g)).toHaveLength(1);
    for (const part of [
      "0 of 2",
      "1 TIE",
      "1 UNTESTED",
      "fixture runs 2026-01-02",
      'href="/api/gspc"',
    ])
      expect(html).toContain(part);
    expect(html).toContain("Open on Hugging Face");
    expect(html.match(/<iframe\b/g)).toHaveLength(1);
    expect(html).toContain('src="https://csoai-gspc-board.static.hf.space/index.html"');
  });
  it("does not invent a zero or show unqualified totals on a partial separation read", () => {
    const html = render({
      ...data,
      totals: { ...data.totals, untested_separations: undefined },
    });
    expect(html).not.toContain("4 axes · 3 measured");
    expect(html).not.toContain("living-board-strip");
    expect(html).toContain('href="/api/gspc"');
  });
  it("does not present retained data as a current read after a refresh failure", () => {
    const html = render(data, "Refresh failed");
    expect(html).toContain("could not be refreshed");
    expect(html).not.toContain("4 axes · 3 measured");
    expect(html).not.toContain("50.0%");
  });
});
