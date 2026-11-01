import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import HomeGspcBoard from "./HomeGspcBoard";
import type { GspcPayload } from "../board/useGspcBoard";

// Isolate board presentation from unrelated catalogue and regulatory lookups.
vi.mock("../board/runEvidence", () => ({ axisRunEvidence: () => null }));
vi.mock("../../lib/axisRegulation", () => ({ axisMeta: () => ({}) }));
vi.mock("@/components/ModelCountKey", () => ({ default: () => null }));

const previous: GspcPayload = {
  totals: { public_count: "1 axis · 1 measured", axes: 1, measured_axes: 1 },
  measured_on: { date: "2026-08-19" },
  axes: [{ axis: "governance", status: "MEASURED", kind: "model-comparison", n: 30, separation: "TIE", measurement_time: { observed_on: "2026-08-19" } }],
};

describe("board refresh presentation", () => {
  it("shows a failed refresh beside retained rows and the original measurement date", () => {
    const html = renderToStaticMarkup(<HomeGspcBoard data={previous} error="offline" hubData={null} />);
    expect(html).toContain("The latest board refresh failed.");
    expect(html).toContain("Showing the last successful read with its original measurement dates.");
    expect(html).toContain("1 axis · 1 measured");
    expect(html).toContain('data-axis-row="governance"');
    expect(html).toContain("2026-08-19");
    expect(html).not.toContain("Board is unreachable right now. Empty stays empty.");
    expect(html).not.toContain("UNCHECKABLE — the board was not read on this load");
  });

  it("keeps a first-read failure empty and explicit", () => {
    const html = renderToStaticMarkup(<HomeGspcBoard data={null} error="offline" hubData={null} />);
    expect(html).toContain("Board is unreachable right now. Empty stays empty.");
    expect(html).toContain("UNCHECKABLE — the board was not read on this load");
    expect(html).not.toContain('data-axis-row="');
    expect(html).not.toContain("Showing the last successful read");
  });
});
