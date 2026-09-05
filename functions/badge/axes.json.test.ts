import { describe, expect, it } from "vitest";
import { onRequestGet } from "./axes.json";
import { AXES_A } from "../api/_gspc_axes_a";
import { AXES_B } from "../api/_gspc_axes_b";
import { AXES_FIN } from "../api/_gspc_axes_fin";

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
    const axes = [...AXES_A, ...AXES_B, ...AXES_FIN];
    const measured = axes.filter((a) => a.status === "MEASURED").length;
    const { status, body } = await badge();
    expect(status).toBe(200);
    expect(body.message).toBe(`${measured} of ${axes.length}`);
  });

  it("says 22 of 22 today, which is what the live board says", async () => {
    const { body } = await badge();
    expect(body.message).toBe("22 of 22");
    // and the stale figure this file exists to kill must never reappear
    expect(body.message).not.toBe("15 of 22");
  });

  it("goes amber on its own if a slot ever ships without a run behind it", async () => {
    const axes = [...AXES_A, ...AXES_B, ...AXES_FIN];
    const allMeasured = axes.every((a) => a.status === "MEASURED");
    const { body } = await badge();
    expect(body.color).toBe(allMeasured ? "brightgreen" : "orange");
  });

  it("claims a count and never a grade", async () => {
    const { body } = await badge();
    expect(String(body.label)).toMatch(/axes measured/i);
    expect(JSON.stringify(body)).not.toMatch(/certif|grade|rank|score/i);
  });
});
