import { describe, expect, it } from "vitest";
import { webcrypto } from "node:crypto";
import { canonicalJcs, verifyBoardStamp } from "./verifyBoardStamp";

const subtle = webcrypto.subtle as unknown as SubtleCrypto;
const b64u = (b: ArrayBuffer) => Buffer.from(b).toString("base64url");
const hex = (b: ArrayBuffer) => Buffer.from(b).toString("hex");

async function fixture() {
  const kp = (await subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const x = b64u(await subtle.exportKey("raw", kp.publicKey));
  const preimage = { schema: "csoai.gspc-living/0.2", gold_run: "2026-08-18T03:22:16Z", axes: [{ axis: "safety", accuracy: 0.9444, n: 36 }, { axis: "é", accuracy: 1 }] };
  const sig = hex(await subtle.sign({ name: "Ed25519" }, kp.privateKey, new TextEncoder().encode(canonicalJcs(preimage))));
  const did = { verificationMethod: [{ id: "did:web:csoai.org#board-attestation-1", publicKeyJwk: { x } }] };
  return { preimage, sig, x, did };
}

describe("verifyBoardStamp", () => {
  it("canonicalises as the stamp's sig_input says: sorted keys, no whitespace, literal non-ASCII, 1 not 1.0", () => {
    expect(canonicalJcs({ b: 1.0, a: ["é", null, true] })).toBe('{"a":["é",null,true],"b":1}');
  });

  it("is VALID for a stamp signed over its preimage under the DID key", async () => {
    const f = await fixture();
    const r = await verifyBoardStamp({ preimage: f.preimage, signature: f.sig, public_key_x: f.x, signer: "did:web:csoai.org#board-attestation-1" }, f.did, subtle);
    expect(r.state).toBe("VALID");
  });

  it("is INVALID when one byte of the preimage changes", async () => {
    const f = await fixture();
    const r = await verifyBoardStamp({ preimage: { ...f.preimage, gold_run: "2026-08-19T03:22:16Z" }, signature: f.sig, public_key_x: f.x }, f.did, subtle);
    expect(r.state).toBe("INVALID");
  });

  it("is INVALID when the stamp names a key the DID document does not", async () => {
    const f = await fixture();
    const g = await fixture();
    const r = await verifyBoardStamp({ preimage: f.preimage, signature: f.sig, public_key_x: g.x }, f.did, subtle);
    expect(r).toMatchObject({ state: "INVALID" });
  });

  it("is UNCHECKABLE, never INVALID, when the check cannot run", async () => {
    const f = await fixture();
    expect((await verifyBoardStamp({ preimage: f.preimage, signature: f.sig }, { verificationMethod: [] }, subtle)).state).toBe("UNCHECKABLE");
    expect((await verifyBoardStamp({ preimage: f.preimage, signature: f.sig }, f.did, null)).state).toBe("UNCHECKABLE");
    expect((await verifyBoardStamp({ signature: f.sig }, f.did, subtle)).state).toBe("UNCHECKABLE");
  });
});
