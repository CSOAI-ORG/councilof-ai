import { describe, expect, it, vi } from "vitest";
import {
  MAX_REPORT_RECEIPT_BYTES,
  canonicalReportJson,
  onRequestPost,
} from "./report";

type ReportEnvelope = {
  schema: string;
  status: string;
  report_id: string;
  received_at: string;
  record_digest: string;
  stored: boolean;
  stored_reason?: string;
  fallback?: string;
  writes_board: boolean;
  model_training: boolean;
  external_witness_upload: boolean;
  measurement_state: string;
  anchoring: { state: string; automatic: boolean };
  triage: { state: string; separate: boolean };
  independent_measurement: { state: string; separate: boolean };
  meaning: string;
  kind: string;
  proof: {
    alg: string;
    kid: string;
    public_key_jwk: JsonWebKey | null;
    sha256: string;
    sig: string;
  };
};

const fromHex = (value: string) =>
  Uint8Array.from(value.match(/.{2}/g) || [], (part) =>
    Number.parseInt(part, 16),
  );

function request(body: unknown): Request {
  return new Request("https://councilof.ai/api/report", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function testSigningKey(): Promise<string> {
  const pair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
    "sign",
    "verify",
  ])) as CryptoKeyPair;
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", pair.privateKey);
  return Buffer.from(pkcs8).toString("base64");
}

async function digestHex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Buffer.from(digest).toString("hex");
}

describe("POST /api/report governed intake receipt", () => {
  it("stores the full record but returns a compact signed digest-only receipt", async () => {
    const privateMarker = "PRIVATE-DESCRIPTION-MUST-NOT-ECHO";
    const privateSystem = "PRIVATE-SYSTEM-MUST-NOT-ECHO";
    const privateLocation = "PRIVATE-LOCATION-MUST-NOT-ECHO";
    const put = vi.fn(async () => undefined);
    const response = await onRequestPost({
      request: request({
        incident_type: "Privacy / data",
        severity: "Critical",
        system: privateSystem,
        location: privateLocation,
        description: `${privateMarker}:${"x".repeat(12_000)}`,
      }),
      env: {
        LEADS: { put } as unknown as KVNamespace,
        ASSESS_SIGNING_KEY_PKCS8_B64: await testSigningKey(),
      },
    } as never);
    const envelope = (await response.json()) as ReportEnvelope;
    const encoded = JSON.stringify(envelope);

    expect(response.status).toBe(200);
    expect(new TextEncoder().encode(encoded).byteLength).toBeLessThanOrEqual(
      MAX_REPORT_RECEIPT_BYTES,
    );
    expect(envelope).toMatchObject({
      schema: "csoai.incident-intake-receipt/0.1",
      status: "REPORTED",
      stored: true,
      writes_board: false,
      model_training: false,
      external_witness_upload: false,
      measurement_state: "UNMEASURED",
      anchoring: { state: "NOT_REQUESTED", automatic: false },
      triage: { state: "NOT_STARTED", separate: true },
      independent_measurement: { state: "UNMEASURED", separate: true },
      proof: { alg: "Ed25519" },
    });
    expect(envelope.record_digest).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(encoded).not.toContain(privateMarker);
    expect(encoded).not.toContain(privateSystem);
    expect(encoded).not.toContain(privateLocation);
    expect(encoded).not.toContain("record_canonical");

    expect(put).toHaveBeenCalledOnce();
    const stored = JSON.parse(String(put.mock.calls[0]?.[1])) as {
      description: string;
      system: string;
      location: string;
      record_digest: string;
    };
    expect(stored.description).toHaveLength(8000);
    expect(stored.description).toContain(privateMarker);
    expect(stored.system).toBe(privateSystem);
    expect(stored.location).toBe(privateLocation);
    expect(stored.record_digest).toBe(envelope.record_digest);

    const { proof, ...receipt } = envelope;
    expect(proof.public_key_jwk).not.toBeNull();
    expect(proof.sha256).toBe(await digestHex(canonicalReportJson(receipt)));
    const publicKey = await crypto.subtle.importKey(
      "jwk",
      proof.public_key_jwk as JsonWebKey,
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    expect(
      await crypto.subtle.verify(
        "Ed25519",
        publicKey,
        fromHex(proof.sig),
        new TextEncoder().encode(canonicalReportJson(receipt)),
      ),
    ).toBe(true);
  });

  it("returns an honest UNSIGNED, stored:false fallback without automatic actions", async () => {
    const response = await onRequestPost({
      request: request({
        description: "A system exposed private customer data.",
      }),
      env: {},
    } as never);
    const envelope = (await response.json()) as ReportEnvelope;

    expect(response.status).toBe(200);
    expect(envelope).toMatchObject({
      status: "REPORTED",
      stored: false,
      stored_reason: "no datastore bound on this deployment",
      writes_board: false,
      model_training: false,
      external_witness_upload: false,
      measurement_state: "UNMEASURED",
      anchoring: { state: "NOT_REQUESTED", automatic: false },
      proof: {
        alg: "UNSIGNED",
        kid: "",
        public_key_jwk: null,
        sig: "",
      },
    });
    expect(envelope.fallback).toContain("report text is not contained");
    expect(
      new TextEncoder().encode(JSON.stringify(envelope)).byteLength,
    ).toBeLessThanOrEqual(MAX_REPORT_RECEIPT_BYTES);
  });

  it("reports a failed KV write as stored:false instead of claiming persistence", async () => {
    const response = await onRequestPost({
      request: request({ description: "A sufficiently specific incident." }),
      env: {
        LEADS: {
          put: vi.fn(async () => {
            throw new Error("private infrastructure detail");
          }),
        } as unknown as KVNamespace,
      },
    } as never);
    const envelope = (await response.json()) as ReportEnvelope;
    expect(envelope.stored).toBe(false);
    expect(envelope.stored_reason).toBe(
      "datastore write failed on this deployment",
    );
    expect(JSON.stringify(envelope)).not.toContain(
      "private infrastructure detail",
    );
  });

  it("rejects an empty report instead of issuing a receipt", async () => {
    const response = await onRequestPost({
      request: request({ description: "   " }),
      env: {},
    } as never);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "description is required",
    });
  });
});
