import { describe, it, expect } from "vitest";
import { onRequestPost, onRequestGet, sealArtifact, artifactSigner } from "./sign";

async function testKey() {
  const kp = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const der = new Uint8Array(await crypto.subtle.exportKey("pkcs8", kp.privateKey));
  return { b64: btoa(String.fromCharCode(...der)), pub: kp.publicKey };
}
const post = (body: unknown, env = {}) =>
  onRequestPost({ request: new Request("https://x/api/sign", { method: "POST", body: JSON.stringify(body) }), env });

describe("/api/sign", () => {
  it("fails closed with 503 when no key is provisioned", async () => {
    const r = await post({ message: "hi" });
    expect(r.status).toBe(503);
    expect((await r.json()).error).toBe("SIGNER_UNAVAILABLE");
  });
  it("GET documents the door and certifies nothing", async () => {
    expect((await onRequestGet().json()).certifies).toBe("nothing");
  });
  it("seals an envelope (never the raw bytes) and the signature verifies", async () => {
    const k = await testKey();
    const r = await post({ message: "hello" }, { ARTIFACT_SIGN_KEY_PKCS8_B64: k.b64 });
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.envelope.profile).toBe("csoai.artifact-seal/0.1");
    expect(j.canonical).not.toBe("hello");
    const sig = Uint8Array.from(j.signature.match(/../g).map((h: string) => parseInt(h, 16)));
    const ok = await crypto.subtle.verify({ name: "Ed25519" }, k.pub, sig, new TextEncoder().encode(j.canonical));
    expect(ok).toBe(true);
    expect(JSON.stringify(j)).not.toContain(k.b64);
  });
  it("rejects empty input", async () => {
    const k = await testKey();
    const s = await artifactSigner(k.b64);
    if ("unavailable" in s) throw new Error(s.unavailable);
    expect("error" in (await sealArtifact({}, s))).toBe(true);
  });
});
