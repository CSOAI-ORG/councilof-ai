import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import HomeGspcBoard, { BoardStrip, boardMeasuredRange, boardMeasurementBounds, separationLabel } from "./HomeGspcBoard";
import type { GspcAxis, GspcPayload } from "../board/useGspcBoard";
import { publicView, ROWS_AXES } from "../../../../functions/api/gspc";
import { AXES_A } from "../../../../functions/api/_gspc_axes_a";
import { AXES_B } from "../../../../functions/api/_gspc_axes_b";
import { AXES_C } from "../../../../functions/api/_gspc_axes_c";
import { AXES_FIN } from "../../../../functions/api/_gspc_axes_fin";
import { evaluateMeasurementFreshness, withMeasurementTime } from "../../../../functions/api/_gspc_measurement_time";

// The same public-view and timing producers used by GET /api/gspc; no network reads.
const produced = publicView([...AXES_A, ...AXES_B, ...AXES_C, ...AXES_FIN])
  .map(withMeasurementTime)
  .map((row) => ({ ...row }) satisfies GspcAxis);
const axis = (name: string) => produced.find((row) => row.axis === name)!;
const payload = (rows: GspcAxis[]): GspcPayload => ({
  axes: rows,
  totals: { axes: rows.length, measured_axes: rows.length, public_count: `${rows.length} axes · ${rows.length} measured` },
});
const render = (data: GspcPayload) => renderToStaticMarkup(<HomeGspcBoard data={data} hubData={null} />);
const dateTile = (html: string) => html.slice(html.indexOf('data-testid="gspc-last-measured"'), html.indexOf('data-testid="gspc-tiles-as-of"'));
afterEach(() => vi.restoreAllMocks());

describe("home board preserves public determination and measurement precision", () => {
  it("keeps actual cross-reality UNTESTED and exposes why its computed rows result is withheld", () => {
    const cross = axis("cross-reality");
    const record = ROWS_AXES["cross-reality"];
    expect(record.untested_reason_code).toBe("NO_SIGNED_CARD_FOR_AXIS");
    expect(record.test.verdict).toBe("TIE");
    expect(cross.separation).toBe(record.determination);
    expect(cross.separation).toBe("UNTESTED");
    expect(cross.separation_untested_reason).toBe(record.untested_reason);
    for (const initialView of ["list", "table"] as const) {
      const html = renderToStaticMarkup(<BoardStrip axes={[cross]} initialView={initialView} />);
      expect(html).toContain("UNTESTED · no public separation determination");
      expect(html).toContain(record.untested_reason);
      expect(html).toContain('data-axis-separation-reason="cross-reality"');
      expect(html).not.toContain("no separation test has run");
    }
  });

  it("does not infer that a test never ran when a public UNTESTED row lacks a reason", () => {
    const cross = { ...axis("cross-reality"), separation_untested_reason: undefined };
    expect(separationLabel(cross)).toBe("UNTESTED · no public separation determination");
  });

  it("keeps actual DAY and EXACT observations separate from the later swarm card-creation bound", () => {
    const governance = axis("governance"), jail = axis("jail"), swarm = axis("swarm");
    const day = governance.measurement_time, exact = jail.measurement_time, bound = swarm.measurement_time;
    if (day.state !== "DAY" || exact.state !== "EXACT" || bound.state !== "NOT_AFTER") throw new Error("Published timing contract changed");
    const rows = [governance, jail, swarm];
    const before = JSON.stringify(rows);
    const data = payload(rows);
    // Source prose may name a card date; it still cannot decide the observed-date range.
    data.measured_on = { date: `swarm card creation ${bound.not_after}` };
    const expectedNewest = exact.observed_at.slice(0, 10);
    expect(boardMeasuredRange(data, "model-comparison")).toEqual({ newest: expectedNewest, oldest: day.observed_on });
    expect(boardMeasurementBounds(data)).toEqual([{ axis: "swarm", notAfter: bound.not_after }]);
    const html = render(data), tile = dateTile(html);
    expect(tile).toContain("Latest dated model run");
    expect(tile).toContain(expectedNewest);
    expect(tile).not.toContain(bound.not_after.slice(0, 10));
    expect(html).toContain(bound.not_after);
    expect(html).toContain("measured no later than");
    expect(html).toContain("run date unknown.");
    expect(html).not.toContain(`Measured on ${bound.not_after.slice(0, 10)}`);
    expect(JSON.stringify(rows)).toBe(before);
  });

  it("keeps a bound-only board's run date unknown even when that bound is recent", () => {
    const swarm = axis("swarm");
    const mt = swarm.measurement_time;
    if (mt.state !== "NOT_AFTER") throw new Error("Published swarm bound changed");
    const now = Date.parse(mt.not_after) + 1000;
    vi.spyOn(Date, "now").mockReturnValue(now);
    expect(evaluateMeasurementFreshness(mt, new Date(now).toISOString(), 86400).state).toBe("UNCHECKABLE");
    const data = payload([swarm]);
    data.measured_on = { date: `swarm ${mt.not_after}` };
    expect(boardMeasuredRange(data)).toBeNull();
    const html = render(data), tile = dateTile(html);
    expect(tile).toContain("UNCHECKABLE");
    expect(tile).toContain("run date unavailable; only upper bounds are published");
    expect(tile).not.toContain(mt.not_after.slice(0, 10));
    expect(tile).not.toContain('data-testid="gspc-stale"');
    expect(html).toContain(mt.not_after);
    expect(html).toContain("An upper bound does not establish freshness.");
    expect(html).not.toContain("CURRENT");
  });

  it("uses the structured state instead of contradictory fields or unsigned date prose", () => {
    const swarm = axis("swarm"), governance = axis("governance");
    const bound = swarm.measurement_time, day = governance.measurement_time;
    if (bound.state !== "NOT_AFTER" || day.state !== "DAY") throw new Error("Published timing contract changed");
    const data = payload([{ ...swarm, measurement_time: { ...bound, observed_on: day.observed_on }, facts_as_of: day.observed_on }]);
    data.measured_on = { date: `observed ${day.observed_on}` };
    expect(boardMeasuredRange(data)).toBeNull();
    expect(boardMeasurementBounds(data)).toEqual([{ axis: "swarm", notAfter: bound.not_after }]);
  });
});
