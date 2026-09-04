import { describe, expect, it } from "vitest";
import {
  MAX_CANDIDATE_BYTES,
  candidateReceiptBytes,
  canonicalJson,
  normalizeCandidateObservation,
  signCandidateObservation,
  submitCandidateForMeasurement,
  verifyCandidateReceipt,
} from "./candidateEvidence";

describe("candidate evidence", () => {
  it("normalizes only the small declared observation vocabulary", () => {
    expect(
      normalizeCandidateObservation({
        surface: "  GSPC   Quests ",
        activity: "axis quest",
        sourcePath: "/gspc-quests.html",
        axis: "safety",
        score: 0.75,
        n: 40,
        instrumentKey: "defbench",
        instrumentId: "csoai/gspc-defbench#quest:defbench",
        instrumentVersion: "gspc-quest-pack/2026-09-04",
        instrumentDigest: "a".repeat(64),
        secret: "must be discarded",
      }),
    ).toEqual({
      surface: "GSPC Quests",
      activity: "axis quest",
      sourcePath: "/gspc-quests.html",
      axis: "safety",
      score: 0.75,
      n: 40,
      instrumentKey: "defbench",
      instrumentId: "csoai/gspc-defbench#quest:defbench",
      instrumentVersion: "gspc-quest-pack/2026-09-04",
      instrumentDigest: "a".repeat(64),
      completed: false,
    });
    expect(
      normalizeCandidateObservation({
        surface: "quest",
        activity: "result",
        sourcePath: "https://outside.example/result",
      }),
    ).toBeNull();
  });

  it("canonicalizes object keys recursively", () => {
    expect(canonicalJson({ z: 1, a: { y: 2, b: 3 } })).toBe(
      '{"a":{"b":3,"y":2},"z":1}',
    );
  });

  it("creates a verifiable candidate below the 3KB cap", async () => {
    const receipt = await signCandidateObservation(
      {
        surface: "GSPC Quests",
        activity: "axis quest",
        sourcePath: "/gspc-quests.html",
        axis: "safety",
        metric: "macro-F1",
        score: 0.75,
        n: 40,
        correct: 30,
        answered: 40,
        unparsed: 0,
        completed: true,
        instrumentKey: "defbench",
        instrumentId: "csoai/gspc-defbench#quest:defbench",
        instrumentVersion: "gspc-quest-pack/2026-09-04",
        instrumentDigest: "a".repeat(64),
      },
      {
        now: "2026-09-04T06:00:00.000Z",
      },
    );
    expect(receipt.schema).toBe("csoai.evidence-observation/0.1");
    expect(receipt.result.status).toBe("CANDIDATE_FINDING");
    expect(receipt.subject.digest).toBe(receipt.instrument.digest);
    expect(receipt.consent.model_training).toBe(false);
    expect(receipt.proof.kid).not.toContain(receipt.proof.sha256);
    expect(candidateReceiptBytes(receipt)).toBeLessThanOrEqual(
      MAX_CANDIDATE_BYTES,
    );
    expect(await verifyCandidateReceipt(receipt)).toBe(true);

    const relabelled = structuredClone(receipt);
    relabelled.result.status = "MEASURED" as "CANDIDATE_FINDING";
    expect(await verifyCandidateReceipt(relabelled)).toBe(false);

    const redirected = structuredClone(receipt);
    redirected.admission.next = "SIGNED" as "REPRODUCED";
    expect(await verifyCandidateReceipt(redirected)).toBe(false);

    const changedPayload = structuredClone(receipt);
    changedPayload.result.payload.score = 1;
    expect(await verifyCandidateReceipt(changedPayload)).toBe(false);

    const changedSubject = structuredClone(receipt);
    changedSubject.subject.digest = "b".repeat(64);
    expect(await verifyCandidateReceipt(changedSubject)).toBe(false);
  });

  it("keeps a worst-case normalized candidate below the public 3KB cap", async () => {
    const receipt = await signCandidateObservation({
      surface: "GSPC Quests ".repeat(10),
      activity: "governance co-op quest ".repeat(10),
      sourcePath: "/gspc-quests.html",
      axis: "governance",
      mode: "one-device-co-op",
      metric: "macro-F1",
      score: 0.533333,
      n: 30,
      correct: 16,
      answered: 29,
      unparsed: 1,
      completed: true,
      instrumentKey: "govbench",
      instrumentId: "csoai/gspc-govbench#quest:govbench",
      instrumentVersion: "gspc-quest-pack/2026-09-04",
      instrumentDigest: "b".repeat(64),
      limitations: Array.from({ length: 8 }, (_, index) =>
        `declared limitation ${index} `.repeat(20),
      ),
    });
    expect(candidateReceiptBytes(receipt)).toBeLessThanOrEqual(
      MAX_CANDIDATE_BYTES,
    );
    expect(await verifyCandidateReceipt(receipt)).toBe(true);
  });

  it("submits only an explicit non-training intake request", async () => {
    const receipt = await signCandidateObservation({
      surface: "GSPC Quests",
      activity: "axis quest",
      sourcePath: "/gspc-quests.html",
      axis: "safety",
      score: 0.75,
      n: 40,
      completed: true,
      instrumentKey: "defbench",
      instrumentId: "csoai/gspc-defbench#quest:defbench",
      instrumentVersion: "gspc-quest-pack/2026-09-04",
      instrumentDigest: "c".repeat(64),
    });
    let sent: Record<string, unknown> | null = null;
    const responseBody = {
      schema: "csoai.measurement-intake-receipt/0.1",
      intake_id: "CI-test",
      candidate_sha256: `sha256:${receipt.proof.sha256}`,
      candidate_signature_verified: true,
      stored: true,
      state: "AWAITING_OPERATOR_REVIEW",
      queued: false,
      worker_bound: false,
      measurement_state: "UNMEASURED",
      writes_board: false,
      model_training: false,
      public_release: false,
      witness_requested: false,
      meaning: "Stored for review only.",
      proof: { alg: "UNSIGNED", sha256: "d".repeat(64), sig: "" },
    };
    const fetchImpl = (async (_input, init) => {
      sent = JSON.parse(String(init?.body));
      return Response.json(responseBody, { status: 202 });
    }) as typeof fetch;

    const intake = await submitCandidateForMeasurement(receipt, fetchImpl);
    expect(intake.state).toBe("AWAITING_OPERATOR_REVIEW");
    expect(sent).toMatchObject({
      schema: "csoai.evidence-intake-request/0.1",
      consent: {
        network_submission: true,
        purpose: "independent-measurement-intake",
        model_training: false,
        public_release: false,
      },
    });
  });

  it("refuses to submit a locally tampered receipt", async () => {
    const receipt = await signCandidateObservation({
      surface: "GSPC Quests",
      activity: "axis quest",
      sourcePath: "/gspc-quests.html",
      score: 0.5,
      instrumentKey: "govbench",
      instrumentId: "csoai/gspc-govbench#quest:govbench",
      instrumentVersion: "gspc-quest-pack/2026-09-04",
      instrumentDigest: "d".repeat(64),
    });
    receipt.result.payload.score = 1;
    let called = false;
    const fetchImpl = (async () => {
      called = true;
      return Response.json({});
    }) as typeof fetch;
    await expect(
      submitCandidateForMeasurement(receipt, fetchImpl),
    ).rejects.toThrow("no longer verifies");
    expect(called).toBe(false);
  });
});
