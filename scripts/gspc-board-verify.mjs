#!/usr/bin/env node
/**
 * gspc-board-verify.mjs — verify a signed GSPC board snapshot. OFFLINE. NO TRUST.
 *
 * This is the stranger's script. It deliberately uses NOTHING but the Node standard
 * library: no estate package, no network call, no shared secret, no knowledge that
 * the signature was produced by a 3-party MPC custody rather than an ordinary key.
 * A threshold Ed25519 signature is a stock RFC 8032 Ed25519 signature, so a stock
 * verifier is the right verifier.
 *
 *   node scripts/gspc-board-verify.mjs public/signed/gspc-board.signed.json
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

const path = process.argv[2];
if (!path) {
  console.error("usage: gspc-board-verify.mjs <signed-board.json>");
  process.exit(2);
}

const doc = JSON.parse(readFileSync(path, "utf8"));
const att = doc.custody_attestation;
if (!att) {
  console.error("FAILED: no custody_attestation field — nothing to verify");
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
console.log("VERIFIED");
console.log(`  file       : ${path}`);
console.log(`  signer     : ${att.signer}`);
console.log(`  custody    : ${att.custody} (${att.parties} parties)`);
console.log(`  public key : ${att.public_key_hex}`);
console.log(`  content_id : ${digest}`);
console.log(`  measured_on: ${doc.measured_on?.date ?? "—"}`);
console.log("");
console.log(`  board says : ${t.public_count}`);
console.log(`               ${t.axes} axes · ${t.measured_axes} measured · ${t.unmeasured_axes} declared slots with no run`);
console.log("");
console.log("  A signature attests INTEGRITY, not truth. Per-axis `status` is the claim;");
console.log("  an UNMEASURED axis stays unmeasured no matter who signed the file.");
