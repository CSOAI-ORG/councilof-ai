import { describe, expect, it } from "vitest";
import {
  EVIDENCE_FOUNDATIONS_BOUNDARY,
  EVIDENCE_FOUNDATIONS_LESSONS,
  EVIDENCE_FOUNDATIONS_SCHEMA,
  validateEvidenceFoundations,
} from "./evidence-foundations";

describe("Evidence Foundations curriculum contract", () => {
  it("has exactly six bounded lessons with one correct choice each", () => {
    expect(EVIDENCE_FOUNDATIONS_SCHEMA).toBe("csoai.evidence-foundations/0.1");
    expect(validateEvidenceFoundations()).toBe(true);
    expect(EVIDENCE_FOUNDATIONS_LESSONS).toHaveLength(6);
    expect(new Set(EVIDENCE_FOUNDATIONS_LESSONS.map((row) => row.id)).size).toBe(6);
    for (const row of EVIDENCE_FOUNDATIONS_LESSONS) {
      expect(row.choices.filter((choice) => choice.correct)).toHaveLength(1);
      expect(row.transferPrompt.length).toBeGreaterThan(20);
    }
  });

  it("never grants evidence, measurement, certification, compliance, training or promotion", () => {
    expect(EVIDENCE_FOUNDATIONS_BOUNDARY).toMatchObject({
      publicName: "Evidence Foundations",
      product: "Council Learning",
      practiceOnly: true,
      sessionOnly: true,
      createsEvidence: false,
      createsMeasurement: false,
      createsCertificate: false,
      createsComplianceStatus: false,
      modelTraining: false,
      automaticSubmission: false,
      automaticPromotion: false,
    });
  });

  it("teaches the intended six independent concepts", () => {
    expect(EVIDENCE_FOUNDATIONS_LESSONS.map((row) => row.id)).toEqual([
      "source-identity",
      "signature-limits",
      "missing-evidence",
      "material-change",
      "abstention",
      "correction-maintenance",
    ]);
  });

  it("contains no public backend codename", () => {
    const publicText = JSON.stringify(EVIDENCE_FOUNDATIONS_LESSONS) + JSON.stringify(EVIDENCE_FOUNDATIONS_BOUNDARY);
    expect(publicText.toLowerCase()).not.toContain("laputa");
  });
});
