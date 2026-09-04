import { describe, expect, it, vi } from "vitest";
import { signCandidateObservation } from "../../client/src/lib/candidateEvidence";
import {
  MAX_INTAKE_RECEIPT_BYTES,
  canonicalIntakeJson,
  onRequestPost,
  verifyCandidateForIntake,
} from "./evidence-intake";

async function candidate() {
  return signCandidateObservation(
    {
      surface: "GSPC Quests",
      activity: "safety quest",
      sourcePath: "/gspc-quests.html",
      axis: "safety",
      metric: "macro-F1",
      score: 0.8,
      n: 40,
      correct: 32,
      answered: 40,
      unparsed: 0,
      completed: true,
      instrumentKey: "defbench",
      instrumentId: "csoai/gspc-defbench#quest:defbench",
      instrumentVersion: "gspc-quest-pack/2026-09-04",
      instrumentDigest: "a".repeat(64),
    },
    { now: "2026-09-04T08:00:00.000Z" },
  );
}

function request(
  receipt: unknown,
  consent: Record<string, unknown> = {
    network_submission: true,
    purpose: "independent-measurement-intake",
    model_training: false,
    public_release: false,
  },
  origin?: string,
): Request {
  return new Request("https://councilof.ai/api/evidence-intake", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(origin ? { origin } : {}),
    },
    body: JSON.stringify({
      schema: "csoai.evidence-intake-request/0.1",
      candidate: receipt,
      consent,
    }),
  });
}

async function testSigningKey(): Promise<string> {
  const pair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
    "sign",
    "verify",
  ])) as CryptoKeyPair;
  return Buffer.from(
    await crypto.subtle.exportKey("pkcs8", pair.privateKey),
  ).toString("base64");
}

describe("POST /api/evidence-intake", () => {
  it("verifies and durably stores an explicitly submitted candidate without promotion", async () => {
    const receipt = await candidate();
    const put = vi.fn(async () => undefined);
    const response = await onRequestPost({
      request: request(receipt),
      env: {
        LEADS: { put } as unknown as KVNamespace,
        ASSESS_SIGNING_KEY_PKCS8_B64: await testSigningKey(),
      },
    } as never);
    const body = (await response.json()) as Record<string, any>;

    expect(response.status).toBe(202);
    expect(body).toMatchObject({
      schema: "csoai.measurement-intake-receipt/0.1",
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
      proof: { alg: "Ed25519" },
    });
    expect(
      new TextEncoder().encode(JSON.stringify(body)).byteLength,
    ).toBeLessThanOrEqual(MAX_INTAKE_RECEIPT_BYTES);
    expect(put).toHaveBeenCalledOnce();
    expect(String(put.mock.calls[0]?.[0])).toBe(
      `evidence-candidate:${receipt.proof.sha256}`,
    );
    const stored = JSON.parse(String(put.mock.calls[0]?.[1]));
    expect(stored).toMatchObject({
      state: "AWAITING_OPERATOR_REVIEW",
      measurement_state: "UNMEASURED",
      model_training: false,
      public_release: false,
      candidate: receipt,
    });

    const { proof, ...unsigned } = body;
    const key = await crypto.subtle.importKey(
      "jwk",
      proof.public_key_jwk,
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    expect(
      await crypto.subtle.verify(
        "Ed25519",
        key,
        Uint8Array.from(proof.sig.match(/.{2}/g), (part: string) =>
          Number.parseInt(part, 16),
        ),
        new TextEncoder().encode(canonicalIntakeJson(unsigned)),
      ),
    ).toBe(true);
  });

  it("returns verified-not-stored when no durable binding exists", async () => {
    const response = await onRequestPost({
      request: request(await candidate()),
      env: {},
    } as never);
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      candidate_signature_verified: true,
      stored: false,
      state: "VERIFIED_NOT_STORED",
      measurement_state: "UNMEASURED",
      model_training: false,
      proof: { alg: "UNSIGNED" },
    });
  });

  it("rejects tampering before storage", async () => {
    const receipt = await candidate();
    receipt.result.payload.score = 1;
    const put = vi.fn(async () => undefined);
    expect(await verifyCandidateForIntake(receipt)).toMatchObject({
      ok: false,
    });
    const response = await onRequestPost({
      request: request(receipt),
      env: { LEADS: { put } as unknown as KVNamespace },
    } as never);
    expect(response.status).toBe(400);
    expect(put).not.toHaveBeenCalled();
  });

  it("requires separate submission consent and refuses training or public release", async () => {
    const receipt = await candidate();
    for (const consent of [
      {
        network_submission: false,
        purpose: "independent-measurement-intake",
        model_training: false,
        public_release: false,
      },
      {
        network_submission: true,
        purpose: "independent-measurement-intake",
        model_training: true,
        public_release: false,
      },
      {
        network_submission: true,
        purpose: "independent-measurement-intake",
        model_training: false,
        public_release: true,
      },
    ]) {
      const response = await onRequestPost({
        request: request(receipt, consent),
        env: {},
      } as never);
      expect(response.status).toBe(400);
    }
  });

  it("rejects cross-origin writes", async () => {
    const response = await onRequestPost({
      request: request(await candidate(), undefined, "https://outside.example"),
      env: {},
    } as never);
    expect(response.status).toBe(403);
  });
});
