import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import { onRequestGet } from "./gspc";

type Payload = Record<string, unknown>;
type Attestation = { alg: string; sig: string; public_key_x: string };

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  const record = value as Record<string, unknown>;
  return (
    "{" +
    Object.keys(record)
      .sort()
      .map((key) => JSON.stringify(key) + ":" + canonical(record[key]))
      .join(",") +
    "}"
  );
}

const fromHex = (hex: string) =>
  Uint8Array.from(hex.match(/.{2}/g) ?? [], (part) =>
    Number.parseInt(part, 16),
  );

async function signingKey(): Promise<string> {
  const pair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
    "sign",
    "verify",
  ])) as CryptoKeyPair;
  return Buffer.from(
    await crypto.subtle.exportKey("pkcs8", pair.privateKey),
  ).toString("base64");
}
async function served(path: string): Promise<Payload> {
  (globalThis as unknown as { caches: unknown }).caches = {
    default: { match: async () => undefined, put: async () => undefined },
  };
  const response = await onRequestGet({
    request: new Request("https://councilof.ai/api/gspc" + path),
    env: { BOARD_SIGN_KEY_PKCS8_B64: await signingKey() },
    waitUntil: () => undefined,
  } as unknown as Parameters<typeof onRequestGet>[0]);
  return (await response.json()) as Payload;
}

async function verifies(body: Payload): Promise<boolean> {
  const { site_attestation, ...preimage } = body;
  const attestation = site_attestation as Attestation;
  const publicKey = await crypto.subtle.importKey(
    "raw",
    Buffer.from(attestation.public_key_x, "base64url"),
    { name: "Ed25519" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    "Ed25519",
    publicKey,
    fromHex(attestation.sig),
    new TextEncoder().encode(canonical(preimage)),
  );
}
describe("GET /api/gspc site_attestation exact-byte signature", () => {
  it("verifies the full board after anonymous JSON serialization", async () => {
    const body = await served("");
    expect(Array.isArray(body.axes)).toBe(true);
    expect((body.axes as unknown[]).length).toBeGreaterThan(10);
    expect(await verifies(body)).toBe(true);
  });

  it("verifies an axis-filtered board after JSON omits absent fields", async () => {
    const body = await served("?axis=governance");
    expect(body.axes).toHaveLength(1);
    expect((body.axes as Array<{ axis: string }>)[0]?.axis).toBe("governance");
    expect(body).not.toHaveProperty("measured_in_lane");
    expect(await verifies(body)).toBe(true);
  });
});
