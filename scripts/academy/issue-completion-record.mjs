#!/usr/bin/env node
/**
 * issue-completion-record — the FREE issuer for csoai.completion-record/0.1.
 *
 * A record is issued only when the subject REPRODUCED a published measurement: the sha256 of
 * their result equals the sha256 of the published result. The issuer refuses otherwise; it never
 * edits input to make a record possible. No payment, no account, no email: the subject is a
 * pseudonym (HMAC of a handle under a pepper that is never written) or a did:key they hold.
 *
 * Signers
 *   --signer test-ephemeral   Generates an Ed25519 key IN MEMORY, signs, and drops it. The issuer
 *                             is that key's did:key. Requires --test. The record says TEST in its
 *                             name and csoaiRecord.test, and uses a test-N status list. For trying
 *                             the pipeline end to end; nothing it produces may be published.
 *   --signer board            HELD. Production records are meant to be signed under did:web:csoai.org.
 *                             /api/board-sign signs canonical JSON objects (<= 3 KB) only, and a
 *                             Data Integrity proof needs a signature over 64 raw bytes, so there is
 *                             no conforming production path yet. Refuses with the reason.
 *
 *   node scripts/academy/issue-completion-record.mjs --test --signer test-ephemeral \
 *     --subject-handle TEST-LEARNER --measurement-ref https://councilof.ai/api/state#/card_chain/bodies_verified_valid \
 *     --published-sha256 <hex> --reproduced-sha256 <hex> --method "<how>" --narrative "<what>" \
 *     --reproduced-at 2026-09-28T14:00:00Z --status-index 0 [--revoke-in-list 0] --out <dir>
 *
 * Writes <out>/record.json and <out>/status-list.json, and prints only ids and hashes.
 */
import { generateKeyPairSync, randomBytes, randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  addProof, buildRecord, buildStatusListCredential, didKeyFromRaw, ed25519Signer, jcs, pseudonym,
  rawPublicKey, sha256Hex, STATUS_BASE,
} from "./completion-record-lib.mjs";

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 && i + 1 < argv.length ? argv[i + 1] : d; };
const die = (msg, code = 1) => { console.error(`issue-completion-record: ${msg}`); process.exit(code); };
const nowZ = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

const signerName = opt("signer", "");
const test = flag("test");
if (signerName === "board") {
  die("HELD — no conforming production signer. /api/board-sign signs canonical JSON objects (<=3 KB); " +
      "eddsa-jcs-2022 needs an Ed25519 signature over the 64-byte hashData. Owner decision needed: a raw-bytes " +
      "mode on the board signer, or a separate academy issuing key published in did:web:csoai.org.", 3);
}
if (signerName !== "test-ephemeral") die("--signer test-ephemeral (or board, which is HELD) is required", 2);
if (!test) die("--signer test-ephemeral only issues TEST records; pass --test", 2);

const out = opt("out");
if (!out) die("--out <dir> is required", 2);
if (/(^|\/)public(\/|$)/.test(resolve(out))) die("REFUSED: a TEST record may not be written under a public/ tree", 2);

let subjectId = opt("subject-did");
if (!subjectId) {
  const handle = opt("subject-handle");
  if (!handle) die("--subject-handle or --subject-did is required", 2);
  // TEST: a fresh random pepper, never stored — the pseudonym cannot be linked back to the handle.
  subjectId = pseudonym(handle, randomBytes(32));
}

const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const issuerId = didKeyFromRaw(rawPublicKey(publicKey));
const vm = `${issuerId}#${issuerId.slice("did:key:".length)}`;
const created = nowZ();
const statusIndex = Number(opt("status-index", "0"));
if (!Number.isSafeInteger(statusIndex) || statusIndex < 0) die("--status-index must be a non-negative integer", 2);

let unsigned;
try {
  unsigned = buildRecord({
    id: `urn:uuid:${randomUUID()}`,
    issuerId,
    validFrom: created,
    subjectId,
    measurementRef: opt("measurement-ref"),
    publishedResultSha256: opt("published-sha256"),
    reproducedResultSha256: opt("reproduced-sha256"),
    reproductionMethod: opt("method", ""),
    narrative: opt("narrative", ""),
    reproducedAt: opt("reproduced-at", created),
    statusIndex,
    statusList: 0,
    test: true,
  });
} catch (e) {
  die(String(e.message || e), 1);
}
if (!unsigned.evidence[0].reproductionMethod || !unsigned.evidence[0].narrative) die("--method and --narrative are required", 2);

const signer = ed25519Signer(privateKey);
const record = addProof(unsigned, { verificationMethod: vm, created, signer });
const revoked = (opt("revoke-in-list", "") || "").split(",").filter(Boolean).map(Number);
const statusList = addProof(
  buildStatusListCredential({ url: unsigned.credentialStatus.statusListCredential, issuerId, validFrom: created, revoked }),
  { verificationMethod: vm, created, signer },
);

mkdirSync(out, { recursive: true });
const recBytes = JSON.stringify(record, null, 2) + "\n";
const slBytes = JSON.stringify(statusList, null, 2) + "\n";
writeFileSync(join(out, "record.json"), recBytes);
writeFileSync(join(out, "status-list.json"), slBytes);
console.log(JSON.stringify({
  test: true,
  published: false,
  record: join(out, "record.json"),
  record_id: record.id,
  record_sha256: sha256Hex(recBytes),
  record_jcs_sha256: sha256Hex(jcs(record)),
  issuer: issuerId,
  subject: subjectId,
  status_list: unsigned.credentialStatus.statusListCredential.replace(STATUS_BASE, "academy/status/"),
  status_index: statusIndex,
  revoked_in_list: revoked,
  note: "Ephemeral TEST key: generated in memory and discarded when this process exits.",
}, null, 1));
