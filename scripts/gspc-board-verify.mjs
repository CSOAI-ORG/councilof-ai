#!/usr/bin/env node
/**
 * gspc-board-verify.mjs — verify a signed GSPC board snapshot. OFFLINE. NO TRUST.
 *
 * This is the stranger's script. It deliberately uses NOTHING but the Node standard
 * library: no estate package, no network call, no shared secret, no knowledge that
 * the signature was produced by the MPC signing protocol rather than an ordinary key.
 * An MPC-produced Ed25519 signature is a stock RFC 8032 Ed25519 signature, so a stock
 * verifier is the right verifier. (Custody note, C-2026-0925-01: the 2026-09-02 freeze key's
 * three shares sit on one host, one failure domain; the split was never performed.)
 *
 *   node scripts/gspc-board-verify.mjs public/signed/gspc-board.signed.json
 *   node scripts/gspc-board-verify.mjs public/signed/gspc-board.2026-09-25.signed.json --did did.json
 *
 * TWO SHAPES, TWO KEYS — never confused:
 *   custody_attestation  the 2026-09-02 freeze, MPC custody key #gspc-board-22axis-2026, signature
 *                        over the whole canonical body.
 *   board_attestation    dated freezes from 2026-09-25 (scripts/gspc-board-attest.mjs), single
 *                        key #board-attestation-1 via POST /api/board-sign. The signature covers a
 *                        compact payload (3 KB signer cap) that pins the body by
 *                        snapshot_content_id = sha256(canonical(file minus board_attestation)).
 * --did <did.json> (optional) anchors the key: the file's public key must equal that DID
 * method's publicKeyJwk.x. Without it the key is taken from the file, which never vouches
 * for itself — say so when you quote the result.
 *
 * Exit 0 = VERIFIED. Exit 1 = failed. Nothing else is printed as success.
 *
 * WHAT THIS PROVES: that these exact bytes were signed by the holder of the stated
 * public key, and have not changed since.
 * WHAT IT DOES NOT PROVE: that any number inside is correct. A signature attests
 * integrity, never truth. The board's own status fields say which axes carry a
 * measurement; a signature over an UNMEASURED axis does not make it measured.
 *
 * To anchor the key rather than trusting the file, compare public_key_hex against
 * the same key id published independently in /.well-known/did.json. The payload
 * never vouches for its own key.
 */
import { readFileSync } from "node:fs";
import { createHash, verify as nodeVerify, createPublicKey } from "node:crypto";

const argv = process.argv.slice(2);
const didIdx = argv.indexOf("--did");
const didPath = didIdx >= 0 ? argv[didIdx + 1] : null;
const path = argv.find((a, i) => !a.startsWith("--") && !(didIdx >= 0 && i === didIdx + 1));
if (!path) {
  console.error("usage: gspc-board-verify.mjs <signed-board.json> [--did did.json]");
  process.exit(2);
}

const doc = JSON.parse(readFileSync(path, "utf8"));
const att = doc.custody_attestation;
if (!att && !doc.board_attestation) {
  console.error("FAILED: no custody_attestation or board_attestation field — nothing to verify");
  process.exit(1);
}
if (att && doc.board_attestation) {
  console.error("FAILED: both custody_attestation and board_attestation present — ambiguous, refusing");
  process.exit(1);
}

const canonical = (o) => {
  if (o === null || typeof o !== "object") return JSON.stringify(o);
  if (Array.isArray(o)) return "[" + o.map(canonical).join(",") + "]";
  return (
    "{" +
    Object.keys(o)
      .sort()
      .map((k) => JSON.stringify(k) + ":" + canonical(o[k]))
      .join(",") +
    "}"
  );
};

const spkiOf = (hex) => {
  const raw = Buffer.from(hex, "hex");
  if (raw.length !== 32) {
    console.error(`FAILED: public key is ${raw.length} bytes, expected 32`);
    process.exit(1);
  }
  return createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), raw]), format: "der", type: "spki" });
};
const anchorKey = (hex, fragment) => {
  if (!didPath) return "NOT ANCHORED (key read from the file; pass --did did.json to anchor it)";
  const did = JSON.parse(readFileSync(didPath, "utf8"));
  const vm = (did.verificationMethod ?? []).find((m) => String(m.id).endsWith(fragment));
  if (!vm) {
    console.error(`FAILED: ${fragment} is not in ${didPath}`);
    process.exit(1);
  }
  const x = Buffer.from(vm.publicKeyJwk.x, "base64url").toString("hex");
  if (x !== hex) {
    console.error(`FAILED: file key ${hex} is not the DID key ${x} for ${fragment}`);
    process.exit(1);
  }
  return `ANCHORED to ${vm.id} in ${didPath}`;
};

if (doc.board_attestation) {
  const ba = doc.board_attestation;
  const p = ba.payload ?? {};
  const s = ba.signature ?? {};
  const body = { ...doc };
  delete body.board_attestation;
  const bodyId = createHash("sha256").update(Buffer.from(canonical(body), "utf8")).digest("hex");
  if (bodyId !== p.snapshot_content_id) {
    console.error("FAILED: snapshot_content_id does not match the body bytes");
    console.error(`  stated   : ${p.snapshot_content_id}`);
    console.error(`  computed : ${bodyId}`);
    process.exit(1);
  }
  const t0 = doc.totals ?? {};
  const pt = p.totals ?? {};
  for (const k of ["axes", "measured_axes", "unmeasured_axes", "public_count"]) {
    if (pt[k] !== t0[k]) {
      console.error(`FAILED: signed payload totals.${k} (${pt[k]}) differs from body totals.${k} (${t0[k]})`);
      process.exit(1);
    }
  }
  const payloadBytes = Buffer.from(canonical(p), "utf8");
  const payloadSha = createHash("sha256").update(payloadBytes).digest("hex");
  if (payloadSha !== s.payload_sha256) {
    console.error(`FAILED: sha256(canonical(payload)) ${payloadSha} != signature.payload_sha256 ${s.payload_sha256}`);
    process.exit(1);
  }
  const anchored = anchorKey(s.public_key_hex, "#board-attestation-1");
  if (!nodeVerify(null, payloadBytes, spkiOf(s.public_key_hex), Buffer.from(s.sig_ed25519 || "", "hex"))) {
    console.error("FAILED: Ed25519 signature does not verify over canonical(payload)");
    process.exit(1);
  }
  console.log("VERIFIED");
  console.log(`  file       : ${path}`);
  console.log(`  signer     : ${p.signer} (${anchored})`);
  console.log(`  custody    : ${p.custody}`);
  console.log(`  public key : ${s.public_key_hex}`);
  console.log(`  snapshot id: ${bodyId}`);
  console.log(`  frozen_at  : ${p.frozen_at} from ${p.source_commit}`);
  console.log(`  supersedes : ${p.supersedes?.file ?? "—"}`);
  console.log("");
  console.log(`  board says : ${t0.public_count}`);
  console.log(`               ${t0.axes} axes · ${t0.measured_axes} measured · ${t0.unmeasured_axes} declared slots with no run`);
  console.log("");
  console.log("  A signature attests ORIGIN and INTEGRITY, not truth.");
  process.exit(0);
}

const body = { ...doc };
delete body.custody_attestation;
const signedBytes = Buffer.from(canonical(body), "utf8");

// 1. content_id must match the bytes, or the document has been edited.
const digest = createHash("sha256").update(signedBytes).digest("hex");
if (digest !== att.content_id) {
  console.error("FAILED: content_id does not match the payload bytes");
  console.error(`  stated   : ${att.content_id}`);
  console.error(`  computed : ${digest}`);
  process.exit(1);
}

// 2. Stock Ed25519 verification. Wrap the raw 32-byte public key in the 12-byte
//    SPKI prefix for Ed25519 so Node's standard verifier accepts it.
const raw = Buffer.from(att.public_key_hex, "hex");
if (raw.length !== 32) {
  console.error(`FAILED: public key is ${raw.length} bytes, expected 32`);
  process.exit(1);
}
const spki = Buffer.concat([
  Buffer.from("302a300506032b6570032100", "hex"),
  raw,
]);
const key = createPublicKey({ key: spki, format: "der", type: "spki" });

const ok = nodeVerify(null, signedBytes, key, Buffer.from(att.sig_b64, "base64"));
if (!ok) {
  console.error("FAILED: Ed25519 signature does not verify over these bytes");
  process.exit(1);
}

const t = doc.totals ?? {};
const anchoredLegacy = anchorKey(att.public_key_hex, "#" + String(att.signer || "").split("#").pop());
console.log("VERIFIED");
console.log(`  file       : ${path}`);
console.log(`  signer     : ${att.signer} (${anchoredLegacy})`);
console.log(`  custody    : ${att.custody} (${att.parties} parties) — the file's own claim, signed in`);
console.log("               2026-09-02; for what that custody actually is, read the status file beside it");
console.log(`  public key : ${att.public_key_hex}`);
console.log(`  content_id : ${digest}`);
console.log(`  measured_on: ${doc.measured_on?.date ?? "—"}`);
console.log("");
console.log(`  board says : ${t.public_count}`);
console.log(`               ${t.axes} axes · ${t.measured_axes} measured · ${t.unmeasured_axes} declared slots with no run`);
console.log("");
console.log("  A signature attests INTEGRITY, not truth. Per-axis `status` is the claim;");
console.log("  an UNMEASURED axis stays unmeasured no matter who signed the file.");
