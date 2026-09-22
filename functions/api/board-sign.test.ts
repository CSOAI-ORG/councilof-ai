// The two caller paths of /api/board-sign, exercised against a throwaway Ed25519 key so the
// test proves (a) a pod token signs, (b) a wrong token does not, (c) a JWT-shaped bearer is
// never tried against the pod token, (d) the THIN firewall still refuses, and (e) what came
// back verifies under the matching public key over the canonical preimage — so the test can
// fail if the signature, the digest or the auth split is wrong.
import { describe, expect, it } from "vitest";
import { onRequestPost } from "./board-sign";
import { canonicalBytes } from "../_lib/cardSign";

const b64 = (u: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(u)));
const hexToBytes = (h: string) => Uint8Array.from(h.match(/.{2}/g)!.map((x) => parseInt(x, 16)));

async function keypair() {
  const kp = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", kp.privateKey);
  return { pub: kp.publicKey, pkcs8b64: b64(pkcs8) };
}

const POD = "pod-token-for-tests-0123456789abcdefghijklmnopqrstuvwxyz";

function call(env: Record<string, string>, bearer: string | null, body: unknown) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (bearer !== null) headers.authorization = `Bearer ${bearer}`;
  const request = new Request("https://councilof.ai/api/board-sign", { method: "POST", headers, body: JSON.stringify(body) });
  return (onRequestPost as unknown as (ctx: { request: Request; env: Record<string, string> }) => Promise<Response>)({ request, env });
}

describe("/api/board-sign caller paths", () => {
  it("signs for the pod token and the signature verifies over the canonical preimage", async () => {
    const { pub, pkcs8b64 } = await keypair();
    const payload = { schema: "csoai.test/0", n: 261, z: "last", a: { y: 1, x: 2 } };
    const r = await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, BOARD_SIGN_POD_TOKEN: POD }, POD, { payload });
    expect(r.status).toBe(200);
    const j = (await r.json()) as { sig_ed25519: string; payload_sha256: string; signer_auth: string; did: string };
    expect(j.signer_auth).toBe("pod-token");
    expect(j.did).toBe("did:web:csoai.org#board-attestation-1");
    const bytes = canonicalBytes(payload);
    const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map((b) => b.toString(16).padStart(2, "0")).join("");
    expect(j.payload_sha256).toBe(digest);
    expect(await crypto.subtle.verify({ name: "Ed25519" }, pub, hexToBytes(j.sig_ed25519), bytes)).toBe(true);
    // control: the same signature must NOT verify over a different preimage
    expect(await crypto.subtle.verify({ name: "Ed25519" }, pub, hexToBytes(j.sig_ed25519), canonicalBytes({ ...payload, n: 262 }))).toBe(false);
  });

  it("rejects a wrong pod token, an absent bearer, and an unset pod secret", async () => {
    const { pkcs8b64 } = await keypair();
    expect((await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, BOARD_SIGN_POD_TOKEN: POD }, POD + "x", { payload: { a: 1 } })).status).toBe(401);
    expect((await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, BOARD_SIGN_POD_TOKEN: POD }, null, { payload: { a: 1 } })).status).toBe(401);
    expect((await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64 }, POD, { payload: { a: 1 } })).status).toBe(401);
    expect((await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, BOARD_SIGN_POD_TOKEN: "short" }, "short", { payload: { a: 1 } })).status).toBe(401);
  });

  it("routes a JWT-shaped bearer to OIDC only, even when it equals the pod token", async () => {
    const { pkcs8b64 } = await keypair();
    const jwtShaped = "aaaa.bbbb.cccc";
    const r = await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, BOARD_SIGN_POD_TOKEN: jwtShaped }, jwtShaped, { payload: { a: 1 } });
    expect(r.status).toBe(401);
    expect(((await r.json()) as { reason: string }).reason).toBe("OIDC rejected");
  });

  it("still refuses a never-sign label on the pod path", async () => {
    const { pkcs8b64 } = await keypair();
    const r = await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, BOARD_SIGN_POD_TOKEN: POD }, POD, { payload: { label: "THIN" } });
    expect(r.status).toBe(422);
  });
});
