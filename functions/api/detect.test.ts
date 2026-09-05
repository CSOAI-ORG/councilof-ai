import { describe, expect, it } from "vitest";
import { onRequestPost as detect } from "./detect";

/* Regression for the 2026-09-04 forgery. Before the fix, a manifest signed with a
 * freshly generated key and an attacker-chosen `signer` string returned
 * PASS/c2pa.signature_valid, metadata_layer:"verified", and echoed the claimed signer
 * as attribution — then wrapped the whole thing in a DSSE receipt signed with the real
 * board key. Integrity is not identity. */

const ORIGIN = "https://councilof.ai";
const canon = (v: unknown): string =>
  v === null || typeof v !== "object" ? JSON.stringify(v)
  : Array.isArray(v) ? "[" + v.map(canon).join(",") + "]"
  : "{" + Object.keys(v as object).sort()
      .map((k) => JSON.stringify(k) + ":" + canon((v as Record<string, unknown>)[k])).join(",") + "}";
const b64u = (b: Uint8Array) =>
  btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const hex = (b: Uint8Array) => Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");

async function forgedManifest(signer: string) {
  const kp = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey));
  const claim = {
    title: "not ours",
    assertions: [{ label: "c2pa.actions", data: { digitalSourceType: "http://cv.iptc.org/newscodes/digitalsourcetype/digitalCapture" } }],
  };
  const sig = new Uint8Array(
    await crypto.subtle.sign("Ed25519", kp.privateKey, new TextEncoder().encode(canon(claim))),
  );
  return { claim, signature: { sig: hex(sig), public_key_x: b64u(raw), signer } };
}

const post = (manifest: unknown) =>
  detect({
    request: new Request(ORIGIN + "/api/detect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ manifest }),
    }),
    env: {},
    params: {},
  } as never);

describe("/api/detect — a self-embedded key never establishes identity", () => {
  it("does not report a forged manifest as verified", async () => {
    const body = await (await post(await forgedManifest("did:web:bbc.co.uk#newsroom-1"))).json() as Record<string, any>;

    expect(body.verdict).toBe("UNVERIFIABLE");
    expect(body.detected.metadata_layer).toBe("integrity_only");
    expect(body.manifest_signer_resolved).toBe(false);

    const codes = body.findings.map((f: any) => f.code);
    expect(codes).toContain("c2pa.signature_unanchored");
    expect(codes).not.toContain("c2pa.signature_valid");
    expect(body.findings.find((f: any) => f.code === "c2pa.signature_unanchored").status).not.toBe("PASS");
  });

  it("still calls a tampered claim INVALID, not merely unanchored", async () => {
    const m = await forgedManifest("did:web:example.org#k1");
    (m.claim as Record<string, unknown>).title = "mutated after signing";
    const body = await (await post(m)).json() as Record<string, any>;

    const codes = body.findings.map((f: any) => f.code);
    expect(codes).toContain("c2pa.signature_invalid");
    expect(codes).not.toContain("c2pa.signature_unanchored");
  });

  it("calls a malformed key UNCHECKABLE, not a forgery", async () => {
    const m = await forgedManifest("did:web:example.org#k1");
    m.signature.public_key_x = "!!!not-base64url!!!";
    const body = await (await post(m)).json() as Record<string, any>;

    const codes = body.findings.map((f: any) => f.code);
    expect(codes).toContain("c2pa.signature_uncheckable");
    expect(codes).not.toContain("c2pa.signature_invalid");
  });
});
