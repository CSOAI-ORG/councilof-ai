/**
 * signedRunVerify.test.ts — /api/verify reads csoai.signed-run/0.1 records with the signer's rule.
 * Uses signed records already committed under public/ and the real pinned board key; no fixture key.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isSignedRun, verifySignedRunDoc } from "./signedRunVerify";
import { onRequestPost } from "../api/verify";

const real = () =>
  JSON.parse(readFileSync(new URL("../../public/claims/claimreg-ondo-chainlink-2026-09-22-rev2.signed.json", import.meta.url), "utf8"));

const post = async (body: unknown) =>
  (await (onRequestPost as any)({
    request: new Request("https://councilof.ai/api/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
  })).json();

describe("csoai.signed-run/0.1 at /api/verify", () => {
  it("a published signed record is VALID under the pinned board key", async () => {
    const doc = real();
    expect(isSignedRun(doc)).toBe(true);
    const r = await verifySignedRunDoc(doc);
    expect(r.state).toBe("VALID");
    expect(r.did).toBe("did:web:csoai.org#board-attestation-1");
    expect(r.artifact?.sha256).toBe(doc.payload.artifact.sha256);
    const b = await post(doc);
    expect(b.state).toBe("VALID");
    expect(b.family).toBe("csoai.signed-run");
    expect(b.not_a_certification).toBe(true);
  });

  it("an edited payload is INVALID with the reason named", async () => {
    const doc = real();
    doc.payload.registry_id = `${doc.payload.registry_id}-edited`;
    const r = await verifySignedRunDoc(doc);
    expect(r.state).toBe("INVALID");
    expect(r.reasons).toEqual(["payload_digest_mismatch"]);
  });

  it("a recomputed digest cannot rescue an edit: the signature fails", async () => {
    const doc = real();
    doc.payload.registry_id = `${doc.payload.registry_id}-edited`;
    const { jsCanonical, sha256hex } = await import("./cardVerify");
    doc.signature.payload_sha256 = await sha256hex(new TextEncoder().encode(jsCanonical(doc.payload)));
    expect((await verifySignedRunDoc(doc)).reasons).toEqual(["signature_invalid"]);
  });

  it("an unpinned key is UNCHECKABLE, never INVALID", async () => {
    const doc = real();
    doc.signature.did = "did:web:example.org#k";
    const r = await verifySignedRunDoc(doc);
    expect(r.state).toBe("UNCHECKABLE");
    expect(r.reasons).toEqual(["key_not_pinned"]);
  });
});
