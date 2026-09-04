import { describe, expect, it } from "vitest";
import {
  EVIDENCE_ADMISSION_STAGES,
  EVIDENCE_CANDIDATE_INTAKE,
  EVIDENCE_INTAKES,
  EVIDENCE_WITNESS_RULE,
} from "./evidenceLifecycle";

describe("evidence lifecycle vocabulary", () => {
  it("keeps game observations and incident reports as distinct intake states", () => {
    expect(EVIDENCE_INTAKES.map((intake) => intake.state)).toEqual([
      "OBSERVATION",
      "REPORTED",
    ]);
    expect(EVIDENCE_INTAKES[0].detail).toMatch(
      /explicitly creates a candidate/i,
    );
    expect(EVIDENCE_INTAKES[1].detail).toMatch(/needs triage/i);
  });

  it("treats evidence intake as a reviewed candidate write, never a worker receipt", () => {
    expect(EVIDENCE_CANDIDATE_INTAKE).toMatchObject({
      method: "POST",
      endpoint: "/api/evidence-intake",
      effect: "REVIEWED_WRITE",
      state_on_accept: "CANDIDATE_FINDING",
      requires_explicit_opt_in: true,
      writes_board: false,
      model_training: false,
      public_release: false,
      execution_proof: false,
      worker_started: false,
    });
  });

  it("requires reproduction and admission before signing and publication", () => {
    expect(EVIDENCE_ADMISSION_STAGES.map((stage) => stage.state)).toEqual([
      "CANDIDATE_FINDING",
      "REPRODUCED",
      "MEASURED",
      "SIGNED",
      "ROOT_INCLUDED",
    ]);
    expect(
      EVIDENCE_ADMISSION_STAGES.filter(
        (stage) => stage.public_board === "PUBLISHED",
      ).map((stage) => stage.state),
    ).toEqual(["ROOT_INCLUDED"]);
    expect(EVIDENCE_ADMISSION_STAGES[3].gate).toMatch(/never promotes/i);
  });

  it("keeps external witnessing separate from truth and measurement", () => {
    expect(EVIDENCE_WITNESS_RULE).toMatchObject({
      separate: true,
      automatic: false,
      proves_claim: false,
    });
  });
});
