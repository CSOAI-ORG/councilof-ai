// Tests for the CDP facilitator JWT minter. These pin the two facts that, if wrong, would show up
// only as an opaque `facilitator /verify HTTP 401` in production mid-payment:
//   1. the `uri` claim binds METHOD + host + path (so a /verify token cannot be replayed at /settle),
//   2. the module is inert without credentials — no auth header, no behaviour change, no charging.
// The signature itself is checked by verifying it with the matching public key, so a wrong PKCS#8
// wrapper or a seed/secret mix-up fails here rather than at the money path.

import { describe, it, expect } from "vitest";
import { webcrypto } from "node:crypto";
import { mintCdpJwt, maybeMintCdpJwt, isCdpFacilitator, seedFromCdpSecret } from "./_cdp_jwt";

if (!(globalThis as { crypto?: Crypto }).crypto) {
  (globalThis as { crypto?: Crypto }).crypto = webcrypto as unknown as Crypto;
}

function b64urlToBytes(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
const decodeSeg = (s: string) => JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));

/** A throwaway Ed25519 keypair in CDP's own export shape: base64(seed ‖ publicKey). */
async function fakeCdpKey() {
  const kp = (await webcrypto.subtle.generateKey({ name: "Ed25519" }, true, [
    "sign",
    "verify",
  ])) as CryptoKeyPair;
  const pkcs8 = new Uint8Array(await webcrypto.subtle.exportKey("pkcs8", kp.privateKey));
  const seed = pkcs8.slice(pkcs8.length - 32); // the seed is the trailing 32 bytes of the DER
  const pub = new Uint8Array(await webcrypto.subtle.exportKey("raw", kp.publicKey));
  const blob = new Uint8Array(64);
  blob.set(seed, 0);
  blob.set(pub, 32);
  let bin = "";
  for (const b of blob) bin += String.fromCharCode(b);
  return { secret: btoa(bin), publicKey: kp.publicKey };
}

describe("seedFromCdpSecret", () => {
  it("accepts both the 64-byte (seed‖public) and bare 32-byte exports", async () => {
    const { secret } = await fakeCdpKey();
    expect(seedFromCdpSecret(secret).length).toBe(32);
    const only32 = btoa(String.fromCharCode(...seedFromCdpSecret(secret)));
    expect(seedFromCdpSecret(only32).length).toBe(32);
  });

  it("refuses a wrong-length key loudly rather than minting a token that 401s later", () => {
    expect(() => seedFromCdpSecret(btoa("too-short"))).toThrow(/expected 32 or 64/);
  });
});

describe("mintCdpJwt", () => {
  it("produces a JWT whose signature verifies under the key's public half", async () => {
    const { secret, publicKey } = await fakeCdpKey();
    const jwt = await mintCdpJwt({
      keyId: "key-123",
      keySecret: secret,
      method: "post",
      host: "api.cdp.coinbase.com",
      path: "/platform/v2/x402/verify",
      nowSeconds: 1_700_000_000,
      nonce: "deadbeef",
    });
    const [h, p, s] = jwt.split(".");
    const ok = await webcrypto.subtle.verify(
      "Ed25519",
      publicKey,
      b64urlToBytes(s),
      new TextEncoder().encode(`${h}.${p}`),
    );
    expect(ok).toBe(true);

    expect(decodeSeg(h)).toEqual({ alg: "EdDSA", typ: "JWT", kid: "key-123", nonce: "deadbeef" });
    const claims = decodeSeg(p);
    // uri is the whole point: method is upper-cased and the path is bound to the token.
    expect(claims.uri).toBe("POST api.cdp.coinbase.com/platform/v2/x402/verify");
    expect(claims).toMatchObject({ sub: "key-123", iss: "cdp", aud: ["cdp_service"] });
    // CDP's documented default lifetime is 2 minutes; a longer-lived token is a liability.
    expect(claims.exp - claims.nbf).toBe(120);
  });

  it("binds /verify and /settle to different tokens", async () => {
    const { secret } = await fakeCdpKey();
    const args = { keyId: "k", keySecret: secret, method: "POST", host: "api.cdp.coinbase.com" };
    const v = await mintCdpJwt({ ...args, path: "/platform/v2/x402/verify" });
    const s = await mintCdpJwt({ ...args, path: "/platform/v2/x402/settle" });
    expect(decodeSeg(v.split(".")[1]).uri).toMatch(/\/verify$/);
    expect(decodeSeg(s.split(".")[1]).uri).toMatch(/\/settle$/);
  });
});

describe("isCdpFacilitator", () => {
  it("recognises CDP by host and nothing else", () => {
    expect(isCdpFacilitator("https://api.cdp.coinbase.com/platform/v2/x402")).toBe(true);
    expect(isCdpFacilitator("https://x402.org/facilitator")).toBe(false);
    // must not be fooled by a lookalike host that merely contains the string
    expect(isCdpFacilitator("https://api.cdp.coinbase.com.evil.test/x402")).toBe(false);
    expect(isCdpFacilitator("not a url")).toBe(false);
  });
});

describe("maybeMintCdpJwt — fail-closed, never throws into the payment path", () => {
  it("returns null for a non-CDP facilitator even with credentials present", async () => {
    const { secret } = await fakeCdpKey();
    const env = { CDP_API_KEY_ID: "k", CDP_API_KEY_SECRET: secret };
    expect(await maybeMintCdpJwt(env, "https://x402.org/facilitator", "POST", "/verify")).toBeNull();
  });

  it("returns null when credentials are absent — the rail is unchanged until provisioned", async () => {
    const url = "https://api.cdp.coinbase.com/platform/v2/x402";
    expect(await maybeMintCdpJwt({}, url, "POST", "/verify")).toBeNull();
    expect(await maybeMintCdpJwt({ CDP_API_KEY_ID: "k" }, url, "POST", "/verify")).toBeNull();
  });

  it("swallows a malformed secret instead of throwing a 500 mid-settlement", async () => {
    const env = { CDP_API_KEY_ID: "k", CDP_API_KEY_SECRET: "!!!not-base64!!!" };
    const url = "https://api.cdp.coinbase.com/platform/v2/x402";
    expect(await maybeMintCdpJwt(env, url, "POST", "/verify")).toBeNull();
  });

  it("mints for a real CDP url when credentials are present", async () => {
    const { secret } = await fakeCdpKey();
    const env = { CDP_API_KEY_ID: "k", CDP_API_KEY_SECRET: secret };
    const jwt = await maybeMintCdpJwt(
      env,
      "https://api.cdp.coinbase.com/platform/v2/x402",
      "POST",
      "/platform/v2/x402/settle",
    );
    expect(jwt).toBeTruthy();
    expect(decodeSeg((jwt as string).split(".")[1]).uri).toBe(
      "POST api.cdp.coinbase.com/platform/v2/x402/settle",
    );
  });
});
