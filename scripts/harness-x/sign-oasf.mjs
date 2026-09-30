#!/usr/bin/env node
/**
 * sign-oasf — a detached Ed25519 attestation over our OASF records (Harness X target `agntcy-oasf`).
 *
 *   node scripts/harness-x/sign-oasf.mjs --emit-payload <file>             write the attestation to sign
 *   node scripts/harness-x/sign-oasf.mjs --token-file <f>                   POST it to /api/board-sign (pod caller token)
 *   node scripts/harness-x/sign-oasf.mjs --payload <f> --signature <f>      adopt a signer response made elsewhere
 *   node scripts/harness-x/sign-oasf.mjs --verify                           check public/oasf/attestation.json (exit 1 if not VALID)
 *
 * The attestation carries, per record, sha256(RFC 8785 JCS(record)). POST /api/board-sign caps a payload at 3072 bytes,
 * so the records themselves are never sent. The signer's preimage rule (sorted keys, JSON.stringify) and JCS give the
 * same bytes for this value space; attestationPreimage() refuses if they ever differ. Key: did:web:csoai.org#board-attestation-1.
 * This is OUR signature over OUR records. ADS's sigstore signature is made by the identity that pushes, at push time.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { jcs, sha256Hex, attestationPreimage, verifyRaw, BOARD_DID, BOARD_KEY_HEX } from "../rulings/ruling-lib.mjs";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const RECORDS = ["public/oasf/ai.councilof.gspc.oasf.json", "public/oasf/ai.councilof.measurement-agent.oasf.json"];
export const OUT = "public/oasf/attestation.json";
export const SCHEMA = "csoai.oasf-record-attestation/0.1";
const SIGN_URL = "https://councilof.ai/api/board-sign";

export function recordDigest(rel, repo = REPO) {
  const rec = JSON.parse(readFileSync(join(repo, rel), "utf8"));
  return { path: rel, name: rec.name, version: rec.version, record_sha256: sha256Hex(jcs(rec)) };
}

export function buildAttestation(signedAt, repo = REPO) {
  const dist = JSON.parse(readFileSync(join(repo, "council-os/distribution.json"), "utf8"));
  return {
    schema: SCHEMA,
    key: BOARD_DID,
    signed_at: signedAt,
    digest_rule: "sha256 of the RFC 8785 (JCS) bytes of the record as served",
    doctrine_sha256: dist.doctrine.sha256,
    records: RECORDS.map((p) => recordDigest(p, repo)),
    statement: "Council of AI published these OASF records. Measurement, not certification.",
  };
}

/** VALID only if the signature verifies AND every digest still describes the record on disk. */
export function verifyAttestation(repo = REPO, keyHex = BOARD_KEY_HEX) {
  if (!existsSync(join(repo, OUT))) return { state: "UNSIGNED", detail: `${OUT} missing` };
  const doc = JSON.parse(readFileSync(join(repo, OUT), "utf8"));
  const pre = attestationPreimage(doc.payload);
  if (!verifyRaw(pre, doc.sig_ed25519, keyHex)) return { state: "INVALID", detail: "Ed25519 does not verify under " + BOARD_DID };
  if (doc.payload?.schema !== SCHEMA) return { state: "INVALID", detail: "wrong schema" };
  const stale = RECORDS.filter((p) => {
    const want = recordDigest(p, repo);
    const got = (doc.payload.records || []).find((r) => r.path === p);
    return !got || got.record_sha256 !== want.record_sha256 || got.version !== want.version;
  });
  if (stale.length) return { state: "STALE", detail: `re-sign: digest differs for ${stale.join(", ")}` };
  return { state: "VALID", detail: `${RECORDS.length} records, signed_at ${doc.payload.signed_at}` };
}

async function main(argv) {
  const arg = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
  if (argv.includes("--verify")) {
    const v = verifyAttestation();
    console.log(`${v.state}: ${v.detail}`);
    return v.state === "VALID" ? 0 : 1;
  }
  const payloadFile = arg("--payload");
  const att = payloadFile ? JSON.parse(readFileSync(payloadFile, "utf8")) : buildAttestation(new Date().toISOString().replace(/\.\d+Z$/, "Z"));
  const pre = attestationPreimage(att);
  if (pre.length > 3072) throw new Error(`attestation is ${pre.length} bytes; the signer caps at 3072`);
  const emit = arg("--emit-payload");
  if (emit) { writeFileSync(emit, JSON.stringify(att) + "\n"); console.log(`wrote ${emit}; POST {"payload": <it>} to ${SIGN_URL}`); return 0; }
  let resp;
  if (arg("--signature")) {
    if (!payloadFile) throw new Error("--signature needs the --payload that was signed");
    resp = JSON.parse(readFileSync(arg("--signature"), "utf8"));
  } else if (arg("--token-file")) {
    const token = readFileSync(arg("--token-file"), "utf8").trim();
    const r = await fetch(SIGN_URL, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ payload: att }) });
    resp = await r.json();
  } else { console.error("need --emit-payload, --token-file, --payload+--signature or --verify"); return 2; }
  if (!resp.sig_ed25519) { console.error(`signer refused: ${JSON.stringify(resp)}`); return 1; }
  if (resp.payload_sha256 !== sha256Hex(pre)) throw new Error(`preimage disagreement: signer ${resp.payload_sha256} vs ${sha256Hex(pre)}`);
  if (!verifyRaw(pre, resp.sig_ed25519, BOARD_KEY_HEX)) throw new Error("signature does not verify under the pinned board key");
  writeFileSync(join(REPO, OUT), JSON.stringify({ payload: att, sig_ed25519: resp.sig_ed25519, payload_sha256: resp.payload_sha256, key: BOARD_DID, signer_auth: resp.signer_auth ?? null }, null, 2) + "\n");
  const v = verifyAttestation();
  console.log(`wrote ${OUT}: ${v.state} (${v.detail})`);
  return v.state === "VALID" ? 0 : 1;
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2)).then((c) => process.exit(c), (e) => { console.error(e.message); process.exit(1); });
