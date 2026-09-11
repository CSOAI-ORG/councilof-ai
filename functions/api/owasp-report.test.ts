import { describe, expect, it } from "vitest";
import { onRequestGet } from "./owasp-report";
import mapping from "../../public/interop/owasp-llm-mapping.json";
import { AXES_A } from "./_gspc_axes_a";
import { AXES_B } from "./_gspc_axes_b";
import { AXES_FIN } from "./_gspc_axes_fin";

const AXES = [...AXES_A, ...AXES_B, ...AXES_FIN];

const get = async () => {
  const res = await onRequestGet({} as never);
  expect(res.status).toBe(200);
  return JSON.parse(await res.text());
};

describe("GET /api/owasp-report", () => {
  it("covers exactly the 10 OWASP LLM categories from the mapping file", async () => {
    const body = await get();
    expect(body.schema).toBe("csoai.owasp-report/0.1");
    expect(body.writes_board).toBe(false);
    expect(body.categories).toHaveLength(mapping.categories.length);
    expect(body.counts.categories).toBe(mapping.categories.length);
  });

  it("derives coverage from the live axis modules — never typed", async () => {
    const body = await get();
    const derivedCovered = body.categories.filter((c: { axes: { status: string }[] }) =>
      c.axes.some((a) => a.status === "MEASURED"),
    ).length;
    expect(body.counts.covered_by_live_instrument).toBe(derivedCovered);
    expect(body.counts.covered_by_live_instrument + body.counts.uncovered).toBe(body.counts.categories);
  });

  it("every mapped axis slug resolves against the 22-axis board", async () => {
    const body = await get();
    expect(body.counts.unresolvable_axes).toBe(0);
    for (const c of body.categories) {
      for (const a of c.axes) {
        expect(AXES.map((x) => x.axis)).toContain(a.axis);
      }
    }
  });

  it("carries the honesty grammar — no fused grade, no compliance claim", async () => {
    const body = await get();
    expect(body.honesty).toContain("No fused grade");
    expect(JSON.stringify(body)).not.toContain("compliant");
  });
});
