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
  it("covers exactly the 10 OWASP categories", async () => {
    const body = await get();
    expect(body.schema).toBe("csoai.owasp-report/0.2");
    expect(body.writes_board).toBe(false);
    expect(body.categories).toHaveLength(10);
    expect(body.counts.categories).toBe(10);
  });

  it("derives coverage from the live board, never typed", async () => {
    const body = await get();
    const derivedCovered = body.categories.filter(
      (c) => c.axes.length > 0 && c.axes.some((a) => a.status === "MEASURED"),
    ).length;
    expect(body.counts.covered_by_live_instrument).toBe(derivedCovered);
    expect(body.counts.covered_by_live_instrument).toBeGreaterThanOrEqual(0);
  });

  it("every mapped axis slug resolves to a real board axis", async () => {
    const body = await get();
    expect(body.counts.unresolvable_axes).toBe(0);
    for (const c of body.categories) {
      for (const a of c.axes) {
        expect(AXES.map((x) => x.axis)).toContain(a.axis);
      }
    }
  });

  it("unmapped categories are first-class: visible, reasoned, never fudged", async () => {
    const body = await get();
    const unmapped = body.categories.filter((c) => c.coverage === "unmapped");
    expect(unmapped.length).toBe(body.counts.unmapped);
    // v0.2: the review-rejected joins stay unmapped — the gap is the report
    expect(body.counts.unmapped).toBe(9);
    expect(body.counts.covered_by_live_instrument).toBeLessThanOrEqual(1);
    for (const c of unmapped) {
      expect(c.axes).toHaveLength(0);
      expect(typeof c.unmapped_reason).toBe("string");
    }
    const llm10 = body.categories.find((c) => c.id === "LLM10");
    expect(llm10.coverage).toBe("unmapped");
    expect(llm10.axes.map((a) => a.axis)).not.toContain("reserve-attestation");
  });

  it("the one surviving join is LLM01 → jail with the relation caveat", async () => {
    const body = await get();
    const llm01 = body.categories.find((c) => c.id === "LLM01");
    expect(llm01.axes.map((a) => a.axis)).toEqual(["jail"]);
    expect(llm01.relation_note).toContain("Overlap");
  });

  it("carries the honesty grammar and the v0.1 rejection history", async () => {
    const body = await get();
    expect(body.honesty).toContain("not a test we ran");
    expect(body.mapping_history).toContain("rejected");
    expect(JSON.stringify(body)).not.toContain("pass");
  });
});
