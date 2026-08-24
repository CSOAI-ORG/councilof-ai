import { describe, expect, it } from "vitest";
import { hashOutcomeBody, OUTCOME_KIND, verifyOutcome, type TrainingOutcome } from "./trainingOutcome";
import { TRAINING_GRAMMAR } from "@/data/liveTraining";

describe("training-outcome records", () => {
  it("never uses certificate grammar", () => {
    expect(TRAINING_GRAMMAR.product).toBe("verified training-outcome record");
    expect(TRAINING_GRAMMAR.banned).toContain("certificate");
  });

  it("hash-verifies a well-formed UNSIGNED card", async () => {
    const body = {
      kind: OUTCOME_KIND,
      grammar: TRAINING_GRAMMAR.product,
      id: "tor_test",
      issuedAt: "2026-08-24T00:00:00.000Z",
      lane: "art4-office" as const,
      world: "dublin-office" as const,
      industry: "Every EU AI provider & deployer",
      changeCardId: "cc_omnibus_art4",
      frozenRef: "sha256:demo",
      beats: [{ beatId: "vendor-pdf", choiceId: "document-and-drill", correct: true }],
      correctCount: 1,
      total: 1,
      prevHead: null,
    };
    const contentHash = await hashOutcomeBody(body);
    const row: TrainingOutcome = {
      ...body,
      contentHash,
      signature: { status: "UNSIGNED", note: "test" },
    };
    const v = await verifyOutcome(row);
    expect(v.ok).toBe(true);
  });

  it("fails if the body is tampered", async () => {
    const body = {
      kind: OUTCOME_KIND,
      grammar: TRAINING_GRAMMAR.product,
      id: "tor_test2",
      issuedAt: "2026-08-24T00:00:00.000Z",
      lane: "art4-office" as const,
      world: "council-city" as const,
      industry: "x",
      changeCardId: "cc",
      frozenRef: "sha256:demo",
      beats: [{ beatId: "a", choiceId: "b", correct: false }],
      correctCount: 0,
      total: 1,
      prevHead: null,
    };
    const contentHash = await hashOutcomeBody(body);
    const row: TrainingOutcome = {
      ...body,
      correctCount: 99,
      contentHash,
      signature: { status: "UNSIGNED", note: "test" },
    };
    const v = await verifyOutcome(row);
    expect(v.ok).toBe(false);
  });
});
