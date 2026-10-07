// The W3C VC view of a signed capsule: committed example == transform output, every restated fact
// re-checks independently of the transform, and the view says it is unsigned (no proof).
import { describe, expect, it } from "vitest";
import { createHash, createPublicKey, verify } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
// @ts-expect-error: plain ESM script, no type declarations
import { build, capsuleToVc, capsuleIdForSubject, readBatch, auditPath, rootFromPath, merkleRoot, OUTPUT, EXAMPLE, BOARD_KEY } from "./capsule-vc.mjs";
import { merkle, rootFromProof, capsuleVersion } from "../../functions/_lib/measurementCapsule";

const ROOT = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(ROOT, p));
const vc = JSON.parse(read(OUTPUT).toString("utf8"));
const did = JSON.parse(read("public/.well-known/did.json").toString("utf8"));
const H = (b: Buffer) => createHash("sha256").update(b).digest();
const canon = (v: unknown): Buffer => {
  const r = (x: unknown): unknown =>
    Array.isArray(x)
      ? x.map(r)
      : x && typeof x === "object"
        ? Object.fromEntries(Object.keys(x as object).sort().map((k) => [k, r((x as Record<string, unknown>)[k])]))
        : x;
  return Buffer.from(JSON.stringify(r(v)));
};

describe("capsule -> W3C VC view", () => {
  it("the committed example is exactly the transform's output", () => {
    expect(read(OUTPUT).toString("utf8")).toBe(build(EXAMPLE.batch, undefined, ROOT));
  });

  it("is VCDM 2.0 shaped and says it is an unsigned view", () => {
    expect(vc["@context"][0]).toBe("https://www.w3.org/ns/credentials/v2");
    expect(vc.type).toContain("VerifiableCredential");
    expect(vc.issuer.id).toBe("did:web:csoai.org");
    expect(vc.validFrom).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);
    expect(vc).not.toHaveProperty("proof");
    expect(vc.description).toMatch(/unsigned/i);
    expect(vc.description).not.toMatch(/\bcertif(y|ied)\b/i);
  });

  it("the capsule literal recomputes its id and is the batch's bytes", () => {
    const cap = vc.credentialSubject.capsule;
    const { capsule_id, ...rest } = cap;
    expect(H(canon(rest)).toString("hex")).toBe(capsule_id);
    const lines = gunzipSync(read(`public/measurement-capsules/v0.2/${EXAMPLE.batch}/capsules.jsonl.gz`)).toString("utf8").split("\n");
    expect(lines).toContain(canon(cap).toString("utf8"));
  });

  it("the audit path agrees with the site's own verifier (functions/_lib/measurementCapsule.ts)", async () => {
    const ev = vc.evidence[0];
    const leaves = JSON.parse(read(`public/measurement-capsules/v0.2/${EXAMPLE.batch}/leaves.json`).toString("utf8")).leaves;
    const site = await merkle("0.2", leaves, vc.credentialSubject.capsuleId);
    expect(site.root).toBe(ev.merkleRoot);
    expect(site.index).toBe(ev.leafIndex);
    expect(site.path).toEqual(ev.auditPath);
    expect(await rootFromProof("0.2", vc.credentialSubject.capsuleId, ev.auditPath)).toBe(ev.merkleRoot);
    expect(rootFromPath(vc.credentialSubject.capsuleId, ev.auditPath)).toBe(ev.merkleRoot);
    expect(merkleRoot(leaves)).toBe(ev.merkleRoot);
    for (const n of [1, 2, 3, 5, 8, 13]) {
      const ids = leaves.slice(0, n);
      for (const id of ids) expect(rootFromPath(id, auditPath(ids, id).path)).toBe(merkleRoot(ids));
    }
  });

  it("the carried signature verifies under the DID document's board key and pins the record", () => {
    const ev = vc.evidence[0];
    expect(ev.verificationMethod).toBe(BOARD_KEY);
    const x = did.verificationMethod.find((m: { id: string }) => m.id === BOARD_KEY).publicKeyJwk.x;
    const key = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x }, format: "jwk" });
    expect(verify(null, canon(ev.signedPayload), key, Buffer.from(ev.signatureValue, "hex"))).toBe(true);
    const tampered = { ...ev.signedPayload, merkle_root: "0".repeat(64) };
    expect(verify(null, canon(tampered), key, Buffer.from(ev.signatureValue, "hex"))).toBe(false);
    expect(H(read(`public/measurement-capsules/v0.2/${EXAMPLE.batch}/record.json`)).toString("hex")).toBe(ev.signedPayload.artifact.sha256);
    expect(ev.signedPayload.merkle_root).toBe(ev.merkleRoot);
  });

  it("relatedResource digests match the files", () => {
    for (const r of vc.relatedResource) {
      const p = `public${new URL(r.id).pathname}`;
      expect(`sha256-${H(read(p)).toString("base64")}`, p).toBe(r.digestSRI);
    }
  });

  it("refuses a capsule that is not in the batch, and a record the signature does not pin", () => {
    const files = readBatch(EXAMPLE.batch, ROOT);
    expect(() => capsuleToVc({ batch: EXAMPLE.batch, capsuleId: "f".repeat(64), files, didDoc: did })).toThrow(/not in/);
    const rec = JSON.parse(files.record.toString("utf8"));
    rec.as_of = "2000-01-01T00:00:00Z";
    expect(() =>
      // EXAMPLE names a subject, not a capsule id, since the producer began selecting the example by
      // subject (a re-run re-mints capsule ids). Resolve the real id, so the only fault is the record.
      capsuleToVc({ batch: EXAMPLE.batch, capsuleId: capsuleIdForSubject(files, EXAMPLE.subject_id), files: { ...files, record: Buffer.from(JSON.stringify(rec)) }, didDoc: did }),
    ).toThrow(/does not pin/);
  });

  it("the site verifier reads a capsule 0.3 under the 0.2 rules (same id, JCS and Merkle rules)", () => {
    expect(capsuleVersion("csoai.measurement-capsule/0.2")).toBe("0.2");
    expect(capsuleVersion("csoai.measurement-capsule/0.3")).toBe("0.2");
    expect(capsuleVersion("csoai.measurement-capsule/0.4")).toBeNull();
  });
});
