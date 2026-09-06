import { describe, expect, it, vi } from "vitest";
import { canonical, issueToken, verifyToken } from "./_authCrypto";
import { onRequest } from "./auth/[[path]]";

async function signingKey(): Promise<string> {
  const pair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
    "sign",
    "verify",
  ])) as CryptoKeyPair;
  return Buffer.from(
    await crypto.subtle.exportKey("pkcs8", pair.privateKey),
  ).toString("base64");
}

async function signedClaims(
  keyBase64: string,
  claims: Record<string, unknown>,
): Promise<string> {
  const der = Uint8Array.from(atob(keyBase64), (character) =>
    character.charCodeAt(0),
  );
  const key = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "Ed25519" },
    false,
    ["sign"],
  );
  const payload = canonical(claims);
  const signature = new Uint8Array(
    await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(payload)),
  );
  const sig = btoa(String.fromCharCode(...signature));
  return btoa(JSON.stringify({ payload, sig }));
}

describe("Council OS auth tokens", () => {
  it("never issues or accepts an unsigned session", async () => {
    expect(
      await issueToken({}, { email: "person@example.test", name: "Person" }),
    ).toBeNull();

    const forged = btoa(
      JSON.stringify({
        alg: "UNSIGNED",
        sig: "",
        payload: JSON.stringify({
          schema: "csoai.auth-token/0.1",
          iss: "https://councilof.ai",
          aud: "council-os",
          sub: "attacker@example.test",
          name: "Attacker",
          iat: Date.now(),
          exp: Date.now() + 60_000,
        }),
      }),
    );
    expect(await verifyToken({}, forged)).toBeNull();
    expect(
      await verifyToken(
        { ASSESS_SIGNING_KEY_PKCS8_B64: await signingKey() },
        forged,
      ),
    ).toBeNull();
  });

  it("round-trips only a scoped Ed25519-signed session", async () => {
    const env = { ASSESS_SIGNING_KEY_PKCS8_B64: await signingKey() };
    const token = await issueToken(env, {
      email: "person@example.test",
      name: "Person",
    });
    expect(token).toBeTypeOf("string");
    expect(await verifyToken(env, token!)).toEqual({
      sub: "person@example.test",
      name: "Person",
    });

    const envelope = JSON.parse(atob(token!));
    envelope.payload = envelope.payload.replace(
      "person@example.test",
      "attacker@example.test",
    );
    expect(await verifyToken(env, btoa(JSON.stringify(envelope)))).toBeNull();
  });

  it("rejects signed sessions outside the schema, issuer, audience, or time bounds", async () => {
    const keyBase64 = await signingKey();
    const env = { ASSESS_SIGNING_KEY_PKCS8_B64: keyBase64 };
    const now = Date.now();
    const valid = {
      schema: "csoai.auth-token/0.1",
      iss: "https://councilof.ai",
      aud: "council-os",
      sub: "person@example.test",
      name: "Person",
      iat: now,
      exp: now + 60_000,
    };
    const invalidClaims = [
      { ...valid, schema: "attacker.auth-token/0.1" },
      { ...valid, iss: "https://attacker.example" },
      { ...valid, aud: "attacker-service" },
      { ...valid, iat: now - 120_000, exp: now - 1 },
      { ...valid, iat: now + 120_000, exp: now + 180_000 },
      { ...valid, exp: now + 30 * 86_400_000 + 1 },
    ];

    for (const claims of invalidClaims) {
      expect(
        await verifyToken(env, await signedClaims(keyBase64, claims)),
      ).toBeNull();
    }
  });

  it("refuses the fixed demo account unless DEMO_LOGIN_ENABLED is set", async () => {
    const response = await onRequest({
      params: { path: ["login"] },
      env: { ASSESS_SIGNING_KEY_PKCS8_B64: await signingKey() },
      request: new Request("https://councilof.ai/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "demo@csoai.com", password: "demo123" }),
      }),
    } as never);
    expect(response.status).toBe(401);
  });

  it("fails login closed when the session signing key is unavailable", async () => {
    const response = await onRequest({
      params: { path: ["login"] },
      env: { DEMO_LOGIN_ENABLED: "1" },
      request: new Request("https://councilof.ai/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "demo@csoai.com", password: "demo123" }),
      }),
    } as never);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "authentication signing is unavailable; no session was issued",
    });
  });

  it("does not create an account when no signed session can be issued", async () => {
    const get = vi.fn(async () => null);
    const put = vi.fn(async () => undefined);
    const response = await onRequest({
      params: { path: ["register"] },
      env: { SOV_ARENA_STATE: { get, put } },
      request: new Request("https://councilof.ai/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "person@example.test",
          password: "strong-password",
        }),
      }),
    } as never);
    expect(response.status).toBe(503);
    expect(get).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });
});
