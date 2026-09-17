import { describe, it, expect } from "vitest";
import { readDenominator, denominatorSentence } from "./denominator";
// The build-time index reader. Two runtimes read the same rule (node build script /
// Pages function + browser), so the rule is written twice; this test is why that is safe.
import { denominatorFields } from "../../scripts/surface/build-pod-cards-index.mjs";

const cases: Array<[string, unknown]> = [
  ["the real governance card: 235 graded, 2 parse errors excluded",
    { n: 235, compute_evidence: { parse_errors_excluded: 2, transport_errors_excluded: 0 } }],
  ["nothing excluded", { n: 237, compute_evidence: { parse_errors_excluded: 0, transport_errors_excluded: 0 } }],
  ["both kinds excluded", { n: 30, compute_evidence: { parse_errors_excluded: 4, transport_errors_excluded: 2 } }],
  ["the real qwen3:4b card: transport count only, no parse count",
    { n: 237, compute_evidence: { transport_errors_excluded: 0 } }],
  ["a hub card: no compute_evidence at all", { n: 30, route: "hf-router" }],
  // What harness/gspc-top100/mill_hub_queue.py stages from 2026-09-17: the hub-router
  // producer now counts its own exclusions in the pod path's vocabulary, so a NEW hub
  // card reads PUBLISHED here. Already-signed hub cards keep their bytes and stay ABSENT.
  ["a hub card produced after the exclusions fix",
    { n: 30, route: "hf-router", compute_evidence: { parse_errors_excluded: 4, transport_errors_excluded: 0 } }],
  ["no n", { compute_evidence: { parse_errors_excluded: 1, transport_errors_excluded: 0 } }],
  ["a float where an integer belongs", { n: 30, compute_evidence: { parse_errors_excluded: 1.5, transport_errors_excluded: 0 } }],
  ["not an object", null],
];

describe("the denominator rule is one rule, not two", () => {
  for (const [name, body] of cases) {
    it(name, () => expect(readDenominator(body)).toEqual(denominatorFields(body)));
  }
});

describe("readDenominator never turns an absent count into zero", () => {
  it("carries the exclusions and derives attempted", () => {
    expect(readDenominator({ n: 235, compute_evidence: { parse_errors_excluded: 2, transport_errors_excluded: 0 } }))
      .toEqual({ n: 235, graded_n: 235, parse_errors_excluded: 2, transport_errors_excluded: 0, attempted: 237, exclusions_state: "EXCLUSIONS_PUBLISHED" });
  });
  it("an absent count is null, and attempted stays unknown", () => {
    const d = readDenominator({ n: 30, route: "hf-router" });
    expect(d.parse_errors_excluded).toBeNull();
    expect(d.transport_errors_excluded).toBeNull();
    expect(d.attempted).toBeNull();
    expect(d.graded_n).toBeNull();
    expect(d.exclusions_state).toBe("EXCLUSIONS_ABSENT");
    expect(d.n).toBe(30);
  });
});

describe("denominatorSentence says the denominator out loud", () => {
  const say = (b: unknown) => denominatorSentence(readDenominator(b));
  it("names the excluded attempts beside the graded count", () => {
    expect(say({ n: 235, compute_evidence: { parse_errors_excluded: 2, transport_errors_excluded: 0 } }))
      .toBe("235 graded, 2 excluded (parse errors) — 237 attempted. The score's denominator is the graded count, not the attempts.");
  });
  it("says so plainly when nothing was excluded", () => {
    expect(say({ n: 237, compute_evidence: { parse_errors_excluded: 0, transport_errors_excluded: 0 } }))
      .toBe("237 graded of 237 attempted — no attempts excluded.");
  });
  it("reports both kinds when both happened", () => {
    expect(say({ n: 30, compute_evidence: { parse_errors_excluded: 4, transport_errors_excluded: 2 } }))
      .toBe("30 graded, 4 excluded (parse errors), 2 excluded (transport errors) — 36 attempted. The score's denominator is the graded count, not the attempts.");
  });
  it("calls an absent count unknown, not zero", () => {
    expect(say({ n: 30 })).toMatch(/unknown, not zero/);
  });
  it("says nothing at all when there is no n to talk about", () => {
    expect(say({ compute_evidence: { parse_errors_excluded: 1, transport_errors_excluded: 0 } })).toBeNull();
  });
});
