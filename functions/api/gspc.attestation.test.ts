import { beforeAll, describe, expect, it } from "vitest";
import { onRequestGet } from "./gspc";

type Board = Record<string, unknown> & {
  site_attestation?: { sig?: string; public_key_x?: string; signer?: string; alg?: string };
};

const canonical = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
};

async function serve(url: string, key: CryptoKey, pkcs8: ArrayBuffer): Promise<Board> {
  (globalThis as unknown as { caches: unknown }).caches = {
    default: { match: async () => undefined, put: async () => undefined },
  };
  const bytes = new Uint8Array(pkcs8);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const res = await onRequestGet({
    request: new Request(url),
    env: { BOARD_SIGN_KEY_PKCS8_B64: btoa(binary) },
    waitUntil: () => undefined,
  } as unknown as Parameters<typeof onRequestGet>[0]);
  expect(res.status).toBe(200);
  const body = (await res.json()) as Board;
  const attestation = body.site_attestation;
  expect(attestation?.alg).toBe("Ed25519");
  expect(attestation?.public_key_x).toBeDefined();
  expect(attestation?.signer).toBe("did:web:csoai.org#board-attestation-1");
  expect(attestation?.sig).toBeDefined();
  delete body.site_attestation;
  const valid = await crypto.subtle.verify(
    { name: "Ed25519" },
    key,
    Uint8Array.from(attestation!.sig!.match(/../g)!, (byte) => Number.parseInt(byte, 16)),
    new TextEncoder().encode(canonical(body)),
  );
  expect(valid).toBe(true);
  return body;
}

describe("GET /api/gspc site attestation", () => {
  let publicKey: CryptoKey;
  let privatePkcs8: ArrayBuffer;

  beforeAll(async () => {
    const pair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
    publicKey = pair.publicKey;
    privatePkcs8 = await crypto.subtle.exportKey("pkcs8", pair.privateKey);
  });

  it("verifies the full board snapshot", async () => {
    const body = await serve("https://councilof.ai/api/gspc", publicKey, privatePkcs8);
    expect(body).toHaveProperty("measured_in_lane");
  });

  it("verifies an axis-filtered snapshot after JSON serialisation", async () => {
    const body = await serve("https://councilof.ai/api/gspc?axis=affect", publicKey, privatePkcs8);
    expect(body).not.toHaveProperty("measured_in_lane");
    expect((body.axes as unknown[]).length).toBe(1);
  });
});
