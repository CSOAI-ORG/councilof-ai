import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { describe, expect, it } from "vitest";
import { FreshnessLine } from "./LivingBoard";

/** The live /api/gspc shape of 20 Nov 2026, reduced to the four axes that decide the line. */
const board = {
  axes: [
    { axis: "governance", kind: "model-comparison", measurement_time: { state: "DAY", precision: "day", observed_on: "2026-08-12" } },
    { axis: "jail", kind: "model-comparison", measurement_time: { state: "EXACT", precision: "instant", observed_at: "2026-08-18T03:22:16Z" } },
    { axis: "swarm", kind: "model-comparison", measurement_time: { state: "NOT_AFTER", precision: "instant-upper-bound", not_after: "2026-08-19T09:24:39.162060+00:00" } },
    { axis: "harness-fidelity", kind: "measured-subject", measurement_time: { state: "EXACT", precision: "instant", observed_at: "2026-11-02T04:20:54.265Z" } },
  ],
};

describe("FreshnessLine", () => {
  it("prints the observed range and states an upper bound as a bound, never as a measurement date", () => {
    const html = renderToStaticMarkup(
      <Router ssrPath="/board">
        <FreshnessLine board={board} fleet={null} cards={null} root={null} />
      </Router>,
    );
    expect(html).toContain("between <strong>12 Aug 2026</strong> and <strong>18 Aug 2026</strong>");
    expect(html).not.toContain("and <strong>19 Aug 2026</strong>");
    expect(html).toContain("swarm dated only by an upper bound: not after <strong>19 Aug 2026</strong>");
    expect(html).toContain("newest measurement on the board <strong>2 Nov 2026</strong>");
  });
});
