import { describe, expect, it } from "vitest";
import { formatAxisHit } from "./_chatAxis";

describe("named-axis chat formatting", () => {
  it("keeps a measured fleet row measured when its public leader was excluded", () => {
    const answer = formatAxisHit({
      axis: "governance",
      bench: "GovBench",
      kind: "model-comparison",
      status: "MEASURED",
      n: 237,
      fleet_mean: 0.49,
      public_leader_state: "EXCLUDED_OWN_MODEL",
    });
    expect(answer).toContain("**MEASURED** at n=237");
    expect(answer).toContain("EXCLUDED_OWN_MODEL");
    expect(answer).toContain("fleet mean is **0.490**");
    expect(answer).not.toMatch(/NaN|UNMEASURED/);
  });

  it("describes deterministic facts without inventing an accuracy", () => {
    const answer = formatAxisHit({
      axis: "reserve-attestation",
      bench: "issuer-facts",
      kind: "deterministic-facts",
      status: "MEASURED",
      n: 6,
      n_unit: "instruments",
      evidence_url: "/signed/reserve.json",
    });
    expect(answer).toContain("n=6 instruments");
    expect(answer).toContain("no model accuracy, leader, or separation claim");
    expect(answer).not.toMatch(/NaN|Accuracy \*\*/);
  });

  it("prints published model-comparison numbers when they exist", () => {
    const answer = formatAxisHit({
      axis: "safety",
      bench: "SafetyBench",
      kind: "model-comparison",
      status: "MEASURED",
      n: 100,
      accuracy: 0.75,
      macro_f1: 0.71,
      unparsed_rate: 0.02,
      interval: [0.65, 0.82],
    });
    expect(answer).toContain("Accuracy **0.750**");
    expect(answer).toContain("[0.650, 0.820]");
    expect(answer).toContain("Macro F1 0.710");
  });
});
