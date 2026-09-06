import { describe, it, expect } from "vitest";
import { handle, resolveKidFromDid, extractJws, sniffKind, DID_DOC_URL } from "./verify";
import { b64url, b64urlDecode, jcs, signJws } from "../_x402_jws";
import { receiptPayload } from "../_x402_receipt";
import { offerPayload } from "../_x402_offer";

const TEST_PKCS8 = "MC4CAQAwBQYDK2VwBCIEIAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8g";
const TEST_PUB_X = "ebVWLo_mVPlAeLES6KmLp5AfhTrmlb7X4OORC60ElmQ";
const KID = "did:web:csoai.org#board-attestation-1";
const RESOURCE = "https://councilof.ai/api/request-attestation";
const PAYER = "0x4dB7AAFbe797a39Cd6Cc4E7aa64d970F7F6E02B7";
const ISSUED = 1757145575;

/** A DID document shaped exactly like the one served at csoai.org, with the TEST key in the slot. */
const didDoc = async () => ({
  verificationMethod: [
    { id: "did:web:csoai.org#site-release-1", publicKeyJwk: { kty: "OKP", crv: "Ed25519", x: "03g9l-dVNGVEAVVWQrJU9aLtkYTN3uARd52P7DEq-8g" } },
    { id: KID, publicKeyJwk: { kty: "OKP", crv: "Ed25519", x: TEST_PUB_X } },
  ],
});

const post = (body: unknown) =>
  new Request("https://councilof.ai/api/receipts/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const goodReceipt = () =>
  signJws(receiptPayload({ network: "base", resourceUrl: RESOURCE, payer: PAYER, issuedAt: ISSUED }), TEST_PKCS8, KID);

describe("resolveKidFromDid — authorization, kept apart from cryptography (spec §4.5.1)", () => {
  it("returns the key for a kid listed in the document, for a host it governs", async () => {
    const key = await resolveKidFromDid(KID, RESOURCE, didDoc);
    expect(key).toEqual(b64urlDecode(TEST_PUB_X));
  });
  it("declines to answer for a host this document does not speak for", async () => {
    const out: { reason?: string } = {};
    expect(await resolveKidFromDid(KID, "https://api.example.com/x", didDoc, out)).toBeNull();
    expect(out.reason).toMatch(/not a host this DID document speaks for/);
  });
  it("says the key is not listed, rather than failing the signature", async () => {
    const out: { reason?: string } = {};
    expect(await resolveKidFromDid("did:web:csoai.org#nope", RESOURCE, didDoc, out)).toBeNull();
    expect(out.reason).toMatch(/is not listed in verificationMethod/);
  });
  it("distinguishes an unreadable document from an unlisted key", async () => {
    const out: { reason?: string } = {};
    expect(await resolveKidFromDid(KID, RESOURCE, async () => null, out)).toBeNull();
    expect(out.reason).toMatch(/could not read .*did\.json/);
    expect(out.reason).toMatch(/either way/);
  });
});

describe("extractJws / sniffKind", () => {
  it("accepts a bare compact string and the wire object alike", () => {
    expect(extractJws({ receipt: "a.b.c" }).jws).toBe("a.b.c");
    expect(extractJws({ receipt: { format: "jws", signature: "a.b.c" } }).jws).toBe("a.b.c");
  });
  it("REFUSES a jws artefact that also carries a payload — §3.1.1 says it MUST be omitted", () => {
    const r = extractJws({ receipt: { format: "jws", signature: "a.b.c", payload: { version: 1 } } });
    expect(r.jws).toBeNull();
    expect(r.reason).toMatch(/without a payload/);
  });
  it("reads the artefact kind from the payload, not from the caller's label", () => {
    expect(sniffKind({ payer: "0x1", issuedAt: 1 })).toBe("receipt");
    expect(sniffKind({ amount: "1", scheme: "exact" })).toBe("offer");
    expect(sniffKind({ hello: "world" })).toBeNull();
  });
});

describe("POST /api/receipts/verify", () => {
  it("VALID for a receipt this estate signed", async () => {
    const res = await handle(post({ receipt: await goodReceipt() }), didDoc, ISSUED + 5);
    const b = (await res.json()) as Record<string, unknown>;
    expect(b.verdict).toBe("VALID");
    expect(b.kind).toBe("receipt");
    expect(b.signature_valid).toBe(true);
    expect(b.signer_authorised).toBe(true);
    expect(b.kid).toBe(KID);
  });

  it("VALID for a signed offer too — the same door, both artefacts", async () => {
    const jws = await signJws(
      offerPayload(RESOURCE, { scheme: "exact", network: "base", asset: "0xA", payTo: "0xB", amount: "20000" }, ISSUED)!,
      TEST_PKCS8,
      KID,
    );
    const b = (await (await handle(post({ offer: jws }), didDoc, ISSUED + 5)).json()) as Record<string, unknown>;
    expect(b.verdict).toBe("VALID");
    expect(b.kind).toBe("offer");
  });

  it("INVALID with signature_valid false when a byte of the payload moved", async () => {
    const parts = (await goodReceipt()).split(".");
    const p = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[1]!)));
    p.payer = "0x0000000000000000000000000000000000000001";
    const forged = `${parts[0]}.${b64url(jcs(p))}.${parts[2]}`;
    const b = (await (await handle(post({ receipt: forged }), didDoc, ISSUED + 5)).json()) as Record<string, unknown>;
    expect(b.verdict).toBe("INVALID");
    expect(b.signature_valid).toBe(false);
    expect(b.signer_authorised).toBe(true);
    expect(b.reason).toMatch(/signature does not verify/);
  });

  it("THE §4.5.1 CASE: a perfectly valid signature from a self-minted key is INVALID on AUTHORIZATION", async () => {
    const attacker = "MC4CAQAwBQYDK2VwBCIEIP8AAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0e";
    const jws = await signJws(
      receiptPayload({ network: "base", resourceUrl: RESOURCE, payer: PAYER, issuedAt: ISSUED }),
      attacker,
      "did:web:evil.example#k1",
    );
    const b = (await (await handle(post({ receipt: jws }), didDoc, ISSUED + 5)).json()) as Record<string, unknown>;
    expect(b.verdict).toBe("INVALID");
    expect(b.signer_authorised).toBe(false);
    // and it must NOT say the signature was bad — it was not.
    expect(b.reason).not.toMatch(/signature does not verify/);
    expect(b.reason).toMatch(/is not listed in verificationMethod/);
  });

  it("declines a receipt for someone else's domain rather than adjudicating it", async () => {
    const jws = await signJws(
      receiptPayload({ network: "base", resourceUrl: "https://api.example.com/premium", payer: PAYER, issuedAt: ISSUED }),
      TEST_PKCS8,
      KID,
    );
    const b = (await (await handle(post({ receipt: jws }), didDoc, ISSUED + 5)).json()) as Record<string, unknown>;
    expect(b.verdict).toBe("INVALID");
    expect(b.reason).toMatch(/not a host this DID document speaks for/);
  });

  it("names the DID document it read, so the caller can repeat the check", async () => {
    const b = (await (await handle(post({ receipt: await goodReceipt() }), didDoc, ISSUED + 5)).json()) as Record<string, unknown>;
    expect(b.did_document).toBe(DID_DOC_URL);
    expect(String(b.recompute)).toMatch(/verify_receipt\.py/);
  });

  it("400s on junk with a reason instead of a stack trace", async () => {
    const res = await handle(
      new Request("https://councilof.ai/api/receipts/verify", { method: "POST", body: "not json" }),
      didDoc,
    );
    expect(res.status).toBe(400);
    expect(((await res.json()) as { reason: string }).reason).toBe("body is not JSON");
  });

  it("400s with the spec's own wording when the string is not a JWS", async () => {
    const res = await handle(post({ receipt: "nope" }), didDoc);
    expect(((await res.json()) as { reason: string }).reason).toBe("jws is not three dot-separated parts");
  });
});
