import { describe, expect, it } from "vitest";
import { canonicalBytes, signPayload, verifyLeaf, cardV0, PAYLOAD_CAP_BYTES } from "./cardSign";

const td = new TextDecoder();

describe("cardSign — one canonical rule, honest signatures", () => {
  it("canonical form = sorted keys, compact separators, ensure_ascii=false (matches publish_public_root.py)", () => {
    const bytes = canonicalBytes({ b: [1, { z: "é", a: null }], a: "x" });
    expect(td.decode(bytes)).toBe('{"a":"x","b":[1,{"a":null,"z":"é"}]}');
  });

  it("unsigned when no key: sig_ed25519 null + reason, sha still computed", async () => {
    const leaf = await signPayload({ status: "COMMISSIONED" }, undefined);
    expect(leaf.sig_ed25519).toBeNull();
    expect(leaf.did).toBeNull();
    expect(leaf.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(leaf.unsigned_reason).toMatch(/absent/);
  });

  it("signs with a PKCS8 Ed25519 key and a stranger verifies with the raw public key", async () => {
    const kp = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
    const pkcs8 = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.exportKey("pkcs8", kp.privateKey))));
    const raw = new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey));
    const pubHex = [...raw].map((b) => b.toString(16).padStart(2, "0")).join("");
    const payload = { status: "COMMISSIONED", subject: "gpt-4o", reserve: [] };
    const leaf = await signPayload(payload, pkcs8);
    expect(leaf.sig_ed25519).toMatch(/^[0-9a-f]{128}$/);
    expect(leaf.did).toBe("did:web:csoai.org#board-attestation-1");
    expect(await verifyLeaf(payload, leaf.sha256, leaf.sig_ed25519!, pubHex)).toEqual({ sha_ok: true, sig_ok: true });
    // Tamper → fails on the hash, and the signature no longer covers the bytes.
    expect(await verifyLeaf({ ...payload, subject: "other" }, leaf.sha256, leaf.sig_ed25519!, pubHex)).toEqual({ sha_ok: false, sig_ok: false });
  });

  it("refuses a payload over the 3KB cap", async () => {
    await expect(signPayload({ big: "x".repeat(PAYLOAD_CAP_BYTES) }, undefined)).rejects.toThrow(/exceeds/);
  });

  it("cardV0 envelope declares root_inclusion + sig_ed25519 in unmeasured[] when unsigned", async () => {
    const leaf = await signPayload({ a: 1 }, undefined);
    const card = cardV0({ surface: "ras.commission", subject: "s", as_of: "2026-09-02T00:00:00Z", source_urls: ["https://councilof.ai/x"], payload: { a: 1 }, leaf });
    expect(card.unmeasured).toEqual(["root_inclusion", "sig_ed25519"]);
    expect(card.schema).toBe("https://councilof.ai/schema/card-v0.json");
    expect(card).not.toHaveProperty("did");
  });
});
