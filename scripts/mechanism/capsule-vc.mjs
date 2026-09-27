#!/usr/bin/env node
// capsule-vc — a W3C Verifiable Credential (VCDM 2.0) VIEW of one signed measurement capsule.
//
// The capsule stays the source of truth. This transform reads a published capsule batch
// (capsules.jsonl.gz + record.json + record.signed.json + record.json.ots), checks everything it
// is about to restate, and emits a credential that carries:
//   credentialSubject.capsule   the capsule itself, as a JSON literal (@json), byte-for-byte the
//                               canonical JSON the batch holds, so capsule_id recomputes from it;
//   evidence[0]                 the RFC 6962 audit path from the capsule to the batch Merkle root,
//                               the board-signed payload that pins the batch record, its Ed25519
//                               signature and the did:web verification method that checks it;
//   relatedResource[]           SRI digests of the batch files, so each can be fetched and checked.
//
// THE VIEW IS UNSIGNED: it has no `proof`. The signing endpoint (POST /api/board-sign) signs a
// canonical JSON object of at most 3 KB and nothing else, so it cannot produce a Data Integrity
// proof (eddsa-jcs-2022 signs a hash pair) or an enveloping JWS/COSE (both sign an encoded byte
// string). The signature a relying party checks is the one on the batch, carried in evidence.
// A second signer was not added to make the credential look signed.
//
//   node scripts/mechanism/capsule-vc.mjs --batch self_parity --capsule <capsule_id>   write
//   node scripts/mechanism/capsule-vc.mjs --check                                     exit 1 if stale
import { createHash, createPublicKey, verify as edVerify } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const OUTPUT = "public/mechanism/vc.json";
export const ORIGIN = "https://councilof.ai";
export const CAPSULE_ROOT = "public/measurement-capsules/v0.2";
export const DID_DOC = "public/.well-known/did.json";
export const BOARD_KEY = "did:web:csoai.org#board-attestation-1";
export const VOCAB = "https://councilof.ai/mechanism/vocab#";
// The example the page links to. Chosen because it measures our own surface, not a third party's.
export const EXAMPLE = { batch: "self_parity", capsule_id: "5a3699653fc5966ec973837168e2607ab3c72192eda0cb81a90161cde22fb6bd" };

const fail = (m) => {
  throw new Error(`capsule-vc: ${m}`);
};
const sha256 = (b) => createHash("sha256").update(b).digest();
const hex = (b) => Buffer.from(b).toString("hex");
const sri = (b) => `sha256-${sha256(b).toString("base64")}`;

/** Keys sorted, no whitespace, UTF-8, non-ASCII literal: the capsule and signing canonical form. */
export function canon(v) {
  const rec = (x) => {
    if (Array.isArray(x)) return x.map(rec);
    if (x && typeof x === "object") {
      const o = {};
      for (const k of Object.keys(x).sort()) o[k] = rec(x[k]);
      return o;
    }
    return x;
  };
  return Buffer.from(JSON.stringify(rec(v)), "utf8");
}

export function capsuleIdOf(capsule) {
  const { capsule_id, ...rest } = capsule;
  return hex(sha256(canon(rest)));
}

// RFC 6962 section 2.1: leaf = H(0x00 || id), node = H(0x01 || l || r), split at the largest power
// of two below n. Leaves are the 32-byte capsule ids sorted ascending.
const leafHash = (id) => sha256(Buffer.concat([Buffer.from([0]), Buffer.from(id, "hex")]));
const nodeHash = (l, r) => sha256(Buffer.concat([Buffer.from([1]), l, r]));
const split = (n) => {
  let k = 1;
  while (k * 2 < n) k *= 2;
  return k;
};
function mth(ids) {
  if (ids.length === 1) return leafHash(ids[0]);
  const k = split(ids.length);
  return nodeHash(mth(ids.slice(0, k)), mth(ids.slice(k)));
}
export const merkleRoot = (ids) => (ids.length ? hex(mth([...ids].sort())) : hex(sha256(Buffer.alloc(0))));

/** Audit path for leaf m in the sorted list: [{side, hash}] from the leaf upward. */
export function auditPath(ids, id) {
  const sorted = [...ids].sort();
  const m = sorted.indexOf(id);
  if (m < 0) fail(`capsule ${id} is not a leaf of this batch`);
  const path = [];
  const walk = (lo, hi, i) => {
    const n = hi - lo;
    if (n === 1) return;
    const k = split(n);
    if (i < k) {
      walk(lo, lo + k, i);
      path.push({ side: "R", hash: hex(mth(sorted.slice(lo + k, hi))) });
    } else {
      walk(lo + k, hi, i - k);
      path.push({ side: "L", hash: hex(mth(sorted.slice(lo, lo + k))) });
    }
  };
  walk(0, sorted.length, m);
  return { leaf_index: m, tree_size: sorted.length, path };
}

export function rootFromPath(id, path) {
  let h = leafHash(id);
  for (const s of path) h = s.side === "R" ? nodeHash(h, Buffer.from(s.hash, "hex")) : nodeHash(Buffer.from(s.hash, "hex"), h);
  return hex(h);
}

export function boardKey(didDoc) {
  const vm = didDoc.verificationMethod.find((m) => m.id === BOARD_KEY) || fail(`${BOARD_KEY} not in the DID document`);
  if (!didDoc.assertionMethod.includes(BOARD_KEY)) fail(`${BOARD_KEY} is not an assertionMethod`);
  return createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: vm.publicKeyJwk.x }, format: "jwk" });
}

/**
 * files: { gz, record, signed, ots } as Buffers for one batch directory; didDoc: parsed did.json.
 * Returns the credential object. Throws if anything it would restate does not check.
 */
export function capsuleToVc({ batch, capsuleId, files, didDoc }) {
  const rec = JSON.parse(files.record.toString("utf8"));
  if (hex(sha256(files.gz)) !== rec.capsules_file.sha256) fail("capsules file sha256 differs from the record");
  const lines = gunzipSync(files.gz).toString("utf8").split("\n").filter((l) => l.trim());
  if (lines.length !== rec.n_capsules) fail(`${lines.length} capsules, record says ${rec.n_capsules}`);
  const ids = [];
  let line = null;
  for (const l of lines) {
    const c = JSON.parse(l);
    if (capsuleIdOf(c) !== c.capsule_id) fail(`capsule ${c.capsule_id} does not recompute`);
    if (canon(c).toString("utf8") !== l) fail(`capsule ${c.capsule_id} bytes are not canonical`);
    ids.push(c.capsule_id);
    if (c.capsule_id === capsuleId) line = l;
  }
  if (!line) fail(`capsule ${capsuleId} is not in ${batch}`);
  const capsule = JSON.parse(line);
  if (merkleRoot(ids) !== rec.merkle_root) fail("batch Merkle root does not recompute");
  const { leaf_index, tree_size, path } = auditPath(ids, capsuleId);
  if (rootFromPath(capsuleId, path) !== rec.merkle_root) fail("audit path does not reach the root");

  const signed = JSON.parse(files.signed.toString("utf8"));
  const p = signed.payload;
  if (p.artifact.sha256 !== hex(sha256(files.record))) fail("signed payload does not pin this record");
  if (p.merkle_root !== rec.merkle_root) fail("signed payload names another Merkle root");
  if (signed.signature.did !== BOARD_KEY) fail(`signature is by ${signed.signature.did}, expected ${BOARD_KEY}`);
  const msg = canon(p);
  if (hex(sha256(msg)) !== signed.signature.payload_sha256) fail("payload_sha256 does not match the payload");
  if (!edVerify(null, msg, boardKey(didDoc), Buffer.from(signed.signature.sig_ed25519, "hex")))
    fail("Ed25519 signature does not verify under the published board key");

  const base = `${ORIGIN}/${CAPSULE_ROOT.replace(/^public\//, "")}/${batch}`;
  return {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      {
        "@vocab": VOCAB,
        capsule: { "@id": `${VOCAB}capsule`, "@type": "@json" },
        auditPath: { "@id": `${VOCAB}auditPath`, "@type": "@json" },
        signedPayload: { "@id": `${VOCAB}signedPayload`, "@type": "@json" },
      },
    ],
    type: ["VerifiableCredential", "MeasurementCapsuleCredential"],
    issuer: { id: "did:web:csoai.org", name: "Council of AI (CSOAI Ltd)" },
    validFrom: capsule.observed_at,
    name: `Measurement capsule ${capsule.capsule_id.slice(0, 12)} (${capsule.kind})`,
    description:
      "An unsigned W3C Verifiable Credential view of one signed measurement capsule. It has no proof of its own: " +
      "the Ed25519 signature a verifier checks is the board signature on the capsule's batch, carried in evidence with " +
      "the audit path from this capsule to the batch Merkle root. The capsule is the source of truth. A measurement, " +
      "not a certification, endorsement or compliance statement.",
    credentialSubject: {
      type: "MeasurementCapsule",
      capsuleId: capsule.capsule_id,
      capsuleSchema: capsule.schema,
      kind: capsule.kind,
      subjectId: capsule.subject_id,
      measurementState: capsule.measurement_state,
      observedAt: capsule.observed_at,
      capsule,
    },
    evidence: [
      {
        id: `${base}/record.signed.json`,
        type: ["Evidence", "SignedCapsuleBatch"],
        batch,
        batchRecord: `${base}/record.json`,
        batchRecordSha256: hex(sha256(files.record)),
        merkleRule: rec.merkle,
        merkleRoot: rec.merkle_root,
        treeSize: tree_size,
        leafIndex: leaf_index,
        auditPath: path,
        signedPayload: p,
        signatureAlgorithm: "Ed25519",
        signatureValue: signed.signature.sig_ed25519,
        signedPayloadCanonicalisation: "JSON with object keys sorted, no insignificant whitespace, UTF-8",
        verificationMethod: BOARD_KEY,
        signedAt: signed.signature.signed_at,
        timestampProof: `${base}/record.json.ots`,
      },
    ],
    relatedResource: [
      { id: `${base}/record.json`, digestSRI: sri(files.record) },
      { id: `${base}/record.signed.json`, digestSRI: sri(files.signed) },
      { id: `${base}/${rec.capsules_file.path}`, digestSRI: sri(files.gz) },
      { id: `${base}/record.json.ots`, digestSRI: sri(files.ots) },
    ],
  };
}

export function readBatch(batch, root = ROOT) {
  const dir = join(root, CAPSULE_ROOT, batch);
  const rec = JSON.parse(readFileSync(join(dir, "record.json"), "utf8"));
  return {
    gz: readFileSync(join(dir, rec.capsules_file.path)),
    record: readFileSync(join(dir, "record.json")),
    signed: readFileSync(join(dir, "record.signed.json")),
    ots: readFileSync(join(dir, "record.json.ots")),
  };
}

export const serialise = (o) => `${JSON.stringify(o, null, 2)}\n`;

export function build(batch = EXAMPLE.batch, capsuleId = EXAMPLE.capsule_id, root = ROOT) {
  const didDoc = JSON.parse(readFileSync(join(root, DID_DOC), "utf8"));
  return serialise(capsuleToVc({ batch, capsuleId, files: readBatch(batch, root), didDoc }));
}

function main() {
  const arg = (k) => {
    const i = process.argv.indexOf(k);
    return i > 0 ? process.argv[i + 1] : undefined;
  };
  const out = build(arg("--batch") ?? EXAMPLE.batch, arg("--capsule") ?? EXAMPLE.capsule_id);
  const target = join(ROOT, OUTPUT);
  if (process.argv.includes("--check")) {
    let have = "";
    try {
      have = readFileSync(target, "utf8");
    } catch {}
    if (have !== out) {
      console.error(`${OUTPUT} is stale: run node scripts/mechanism/capsule-vc.mjs`);
      process.exit(1);
    }
    console.log(`${OUTPUT} is current`);
    return;
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, out);
  console.log(`wrote ${OUTPUT}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
