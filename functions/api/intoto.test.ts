import { describe, expect, it } from "vitest";
import { measurementPredicate, toInTotoStatement, canon, IN_TOTO_STATEMENT_TYPE, MEASUREMENT_PREDICATE } from "./intoto";

describe("measurementPredicate — provenance that can be checked, or says it cannot", () => {
  // A real signed card fetched from the live site on 2026-09-04 carried accuracy 0.0968 and no
  // inputs_sha256, bank reference, item digest, grader or n. The figure could not be recomputed,
  // so believing it meant trusting our key — the definition of trust-as-a-service. These tests
  // pin that an attestation either names its inputs or admits it cannot be reproduced.
  const figure = { axis: "care-refusal-protect", accuracy: 0.0968 };
  const full = {
    bank_sha256: "a".repeat(64),
    items_sha256: "b".repeat(64),
    grader: "gspc-arith@0.4.1",
    n: 199,
    rerun: "python3 scripts/rerun.py --axis care-refusal-protect",
  };

  it("names every input when they are present", () => {
    const p = measurementPredicate(figure, full);
    expect(p.reproducible).toBe(true);
    expect(p.unreproducible).toEqual([]);
    expect((p.inputs as Record<string, unknown>).bank_sha256).toBe(full.bank_sha256);
  });

  it("declares what is missing rather than omitting it", () => {
    const p = measurementPredicate(figure, { grader: "gspc-arith@0.4.1" });
    expect(p.reproducible).toBe(false);
    expect(p.unreproducible).toEqual(["bank_sha256", "items_sha256", "n"]);
    // the absent inputs are still present as explicit nulls — a reader can see the shape
    expect(p.inputs).toHaveProperty("bank_sha256", null);
    expect(String(p.note)).toMatch(/cannot be recomputed/);
  });

  it("is honest about what the signature proves when inputs are absent", () => {
    const p = measurementPredicate(figure, {});
    expect(String(p.note)).toMatch(/attests only that we published this figure at this time/);
    expect(p.never).toContain("a claim that the signature makes the figure true");
  });

  // n: 0 is a real sample size to state, not a missing input. Falsy-checking it would report a
  // measured zero as absent, which is the same class of error as calling UNMEASURED a zero.
  it("treats n: 0 as stated, not missing", () => {
    expect(measurementPredicate(figure, { ...full, n: 0 }).unreproducible).toEqual([]);
  });

  it("rides inside a standard in-toto Statement", async () => {
    const st = await toInTotoStatement({ axis: "care", accuracy: 0.1 }, {
      subjectName: "card/abc",
      predicate: measurementPredicate(figure, full),
    });
    expect(st._type).toBe(IN_TOTO_STATEMENT_TYPE);
    expect(st.predicateType).toBe(MEASUREMENT_PREDICATE);
    expect((st.subject as { digest: { sha256: string } }[])[0].digest.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(canon(st)).toContain('"reproducible":true');
  });
});
