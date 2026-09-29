import { generateKeyPairSync, randomBytes, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  addProof, b58decode, b58encode, buildRecord, buildStatusListCredential, didKeyFromRaw, ed25519Signer, jcs,
  publicKeyFromRaw, pseudonym, rawFromDidKey, rawPublicKey, statusBit, verifyProof,
} from "./completion-record-lib.mjs";

const REPO = resolve(__dirname, "../..");
const H = "a".repeat(64);
const base = (issuerId, over = {}) => ({
  id: `urn:uuid:${randomUUID()}`,
  issuerId,
  validFrom: "2026-09-28T14:00:00Z",
  subjectId: pseudonym("TEST-LEARNER", randomBytes(32)),
  measurementRef: "https://councilof.ai/api/state#/card_chain/bodies_verified_valid",
  publishedResultSha256: H,
  reproducedResultSha256: H,
  reproductionMethod: "unit test",
  narrative: "unit test",
  reproducedAt: "2026-09-28T14:00:00Z",
  statusIndex: 3,
  statusList: 0,
  test: true,
  ...over,
});
const keypair = () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const did = didKeyFromRaw(rawPublicKey(publicKey));
  return { publicKey, privateKey, did, vm: `${did}#${did.slice(8)}` };
};

describe("csoai.completion-record/0.1 issuer primitives", () => {
  it("JCS sorts keys and refuses floats", () => {
    expect(jcs({ b: 1, a: [true, null, "x"] })).toBe('{"a":[true,null,"x"],"b":1}');
    expect(() => jcs({ accuracy: 0.5 })).toThrow(/non-integer/);
  });

  it("base58 and did:key round-trip", () => {
    const bytes = Buffer.from([0, 0, 1, 2, 255]);
    expect(Buffer.compare(b58decode(b58encode(bytes)), bytes)).toBe(0);
    const k = keypair();
    expect(k.did).toMatch(/^did:key:z6Mk[1-9A-HJ-NP-Za-km-z]{44}$/);
    expect(Buffer.compare(rawFromDidKey(k.did), rawPublicKey(k.publicKey))).toBe(0);
  });

  it("signs and verifies; any edit breaks the proof", () => {
    const k = keypair();
    const rec = addProof(buildRecord(base(k.did)), { verificationMethod: k.vm, created: "2026-09-28T14:00:00Z", signer: ed25519Signer(k.privateKey) });
    const pub = publicKeyFromRaw(rawFromDidKey(k.did));
    expect(verifyProof(rec, pub)).toBe(true);
    const t = structuredClone(rec);
    t.evidence[0].reproducedResultSha256 = "b".repeat(64);
    expect(verifyProof(t, pub)).toBe(false);
  });

  it("refuses to issue when the reproduction does not match", () => {
    expect(() => buildRecord(base("did:key:x", { reproducedResultSha256: "b".repeat(64) }))).toThrow(/REFUSED/);
  });

  it("refuses an identifying subject", () => {
    expect(() => buildRecord(base("did:key:x", { subjectId: "learner@example.com" }))).toThrow(/never a name or an email/);
  });

  it("a TEST record says TEST and points at a test status list", () => {
    const r = buildRecord(base("did:key:x"));
    expect(r.name.startsWith("TEST ")).toBe(true);
    expect(r.csoaiRecord.test).toBe(true);
    expect(r.credentialStatus.statusListCredential).toMatch(/\/academy\/status\/test-0\.json$/);
    expect(JSON.stringify(r)).not.toMatch(/certificate/i);
  });

  it("status list: 131,072 entries, MSB-first, revocation bit readable", () => {
    const k = keypair();
    const sl = buildStatusListCredential({ url: "https://councilof.ai/academy/status/test-0.json", issuerId: k.did, validFrom: "2026-09-28T14:00:00Z", revoked: [3] });
    expect(statusBit(sl.credentialSubject.encodedList, 3)).toBe(1);
    expect(statusBit(sl.credentialSubject.encodedList, 2)).toBe(0);
    expect(statusBit(sl.credentialSubject.encodedList, 131071)).toBe(0);
  });

  it("the Python verifier accepts what this issuer signs (interop)", () => {
    const probe = spawnSync("python3", ["-c", "import cryptography, jsonschema"], { encoding: "utf8" });
    if (probe.status !== 0) return; // runner without python deps: covered by tools/verify/test_completion_record.py
    const k = keypair();
    const signer = ed25519Signer(k.privateKey);
    const rec = addProof(buildRecord(base(k.did)), { verificationMethod: k.vm, created: "2026-09-28T14:00:00Z", signer });
    const sl = addProof(buildStatusListCredential({ url: rec.credentialStatus.statusListCredential, issuerId: k.did, validFrom: "2026-09-28T14:00:00Z" }),
      { verificationMethod: k.vm, created: "2026-09-28T14:00:00Z", signer });
    const dir = mkdtempSync(join(tmpdir(), "cr-"));
    writeFileSync(join(dir, "r.json"), JSON.stringify(rec));
    writeFileSync(join(dir, "s.json"), JSON.stringify(sl));
    const run = (extra) => spawnSync("python3", [join(REPO, "tools/verify/completion_record_verify.py"), join(dir, "r.json"), "--status-list", join(dir, "s.json"), "--json", ...extra], { encoding: "utf8" });
    const ok = run(["--allow-test", "--tamper-control"]);
    expect(ok.status, ok.stdout + ok.stderr).toBe(0);
    const rep = JSON.parse(ok.stdout);
    expect(rep.proof.state).toBe("VALID");
    expect(rep.shape.state).toBe("VALID");
    expect(rep.status.state).toBe("NOT_REVOKED");
    expect(rep.tamper_control.state).toBe("DETECTED");
    expect(run([]).status).toBe(3); // TEST without --allow-test is never a clean pass
  });
});
