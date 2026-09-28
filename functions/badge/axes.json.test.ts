import { describe, expect, it } from "vitest";
import { onRequestGet } from "./axes.json";
import { AXES_A } from "../api/_gspc_axes_a";
import { AXES_B } from "../api/_gspc_axes_b";
import { AXES_FIN } from "../api/_gspc_axes_fin";
import { AXES_C } from "../api/_gspc_axes_c";

const badge = async () => {
  const r = (await (onRequestGet as unknown as (c: unknown) => Promise<Response>)({
    request: new Request("https://councilof.ai/badge/axes.json"),
    env: {},
  })) as Response;
  return { status: r.status, body: (await r.json()) as Record<string, unknown> };
};

describe("/badge/axes.json — a badge that cannot drift from the board", () => {
  // This replaced a hand-maintained static file that was serving "15 of 22" live on
  // 2026-09-05 while the board reported 22 slots · 22 measured. A badge is among the
  // most-copied claims we publish — it lands in READMEs we do not control — and nothing
  // regenerated it, so nothing could keep it current.
  it("counts the same axis set /api/gspc counts, derived not typed", async () => {
    const axes = [...AXES_A, ...AXES_B, ...AXES_C, ...AXES_FIN];
    const measured = axes.filter((a) => a.status === "MEASURED").length;
    const { status, body } = await badge();
    expect(status).toBe(200);
    expect(body.message).toBe(`${measured} of ${axes.length}`);
  });

  it("never repeats a superseded figure, and its figure is the axis arrays' figure", async () => {
    const axes = [...AXES_A, ...AXES_B, ...AXES_C, ...AXES_FIN];
    const total = axes.length;
    const measured = axes.filter((a) => a.status === "MEASURED").length;
    const { body } = await badge();
    // Derived, never typed: this file once asserted "22 of 23" (ADR-002 declared slot,
    // 2026-09-16) and went red the day slot 23 was measured (2026-09-22). A badge test
    // that types a count is the same defect as the badge that typed one.
    expect(body.message).toMatch(/^\d+ of \d+$/);
    expect(body.message).toBe(`${measured} of ${total}`);
    expect(measured).toBeLessThanOrEqual(total);
    // the stale figure this file exists to kill must never reappear
    expect(body.message).not.toBe("15 of 22");
  });

  it("goes amber on its own if a slot ever ships without a run behind it", async () => {
    const axes = [...AXES_A, ...AXES_B, ...AXES_C, ...AXES_FIN];
    const allMeasured = axes.every((a) => a.status === "MEASURED");
    const unmeasured = axes.filter((a) => a.status !== "MEASURED").map((a) => a.axis);
    const { body } = await badge();
    // The colour is a function of the arrays and nothing else. Between 2026-09-16 (ADR-002
    // declared effect-binding with no run) and 2026-09-22 (its server probe signed, n=261)
    // this was observed amber; since then it is observed green. Neither state is typed here:
    // whichever the arrays say, the badge must agree, and the set of unmeasured slots must
    // be exactly the set that drives the colour.
    expect(body.color).toBe(allMeasured ? "brightgreen" : "orange");
    expect(unmeasured.length === 0).toBe(allMeasured);
  });

  it("claims a count and never a grade", async () => {
    const { body } = await badge();
    expect(String(body.label)).toMatch(/axes measured/i);
    expect(JSON.stringify(body)).not.toMatch(/certif|grade|rank|score/i);
  });
});
