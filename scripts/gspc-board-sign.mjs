#!/usr/bin/env node
/**
 * gspc-board-sign.mjs — sign the swept board snapshot through the MPC signing custody.
 *
 * KEY CUSTODY / ANVIL BOUNDARY
 * This signs with a key created new inside the 3-party MPC custody by a distributed
 * key generation that never assembled a private scalar. It is NOT the estate signing
 * key. Nothing here reads, copies, moves or derives from the estate key.
 *
 * WHAT IS SIGNED
 * The canonical form of the snapshot: recursively key-sorted JSON with no
 * whitespace, with the `custody_attestation` field removed. That is the same
 * canonicalisation /api/gspc's own site_attestation uses, so the two attestations
 * are over comparable bytes and neither vouches for its own key.
 *
 * The signature is a stock 64-byte Ed25519 signature over those bytes. A verifier
 * needs no knowledge that MPC produced it — see scripts/gspc-board-verify.mjs, which
 * is written to run with no estate code present.
 *
 *   node scripts/gspc-board-sign.mjs <snapshot.json> <out.signed.json>
 *
 * Requires an SSH tunnel to the custody host's loopback service (the service refuses
 * to bind anything but loopback), and CUSTODY_TOKEN in the environment.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error("usage: gspc-board-sign.mjs <snapshot.json> <out.signed.json>");
  process.exit(2);
}

const ENDPOINT = process.env.CUSTODY_ENDPOINT || "http://127.0.0.1:8731";
const KEY_ID = process.env.CUSTODY_KEY_ID || "gspc-board-22axis-2026";
const TOKEN = process.env.CUSTODY_TOKEN;
if (!TOKEN) {
  console.error("gspc-board-sign: CUSTODY_TOKEN is not set — refusing to continue.");
  process.exit(2);
}

// Recursively sorted keys, no whitespace. Identical to the canonical() in
// functions/api/gspc.ts, so a stranger reproduces it from the published payload.
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

const body = JSON.parse(readFileSync(inPath, "utf8"));
delete body.custody_attestation; // never sign over a previous attestation

const signedBytes = Buffer.from(canonical(body), "utf8");
const contentId = createHash("sha256").update(signedBytes).digest("hex");

const res = await fetch(`${ENDPOINT}/sign`, {
  method: "POST",
  headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
  body: JSON.stringify({ key_id: KEY_ID, payload_b64: signedBytes.toString("base64") }),
});
if (!res.ok) {
  console.error(`gspc-board-sign: custody refused (HTTP ${res.status}): ${await res.text()}`);
  process.exit(1);
}
const r = await res.json();

body.custody_attestation = {
  attests:
    "integrity of this board snapshot as produced by GET /api/gspc on the stated date. " +
    "NOT a re-measurement, and NOT a claim about any axis's status beyond what the payload states.",
  signer: `did:web:csoai.org#${KEY_ID}`,
  custody: "3-party MPC (Coinbase cb-mpc, Ed25519 additive), owner's own Oracle tenancy",
  custody_note:
    "The signing key does not exist as a whole number anywhere: it exists only as 3 shares, " +
    "and producing this signature required all 3 to run the protocol together. Withholding one " +
    "share makes signing fail. This key was generated new inside the custody and is NOT the " +
    "estate signing key.",
  parties: r.parties,
  alg: "Ed25519",
  keyid: r.keyid,
  public_key_hex: r.public_key_hex,
  content_id: contentId,
  sig_b64: r.signature_b64,
  sig_input:
    "canonical JSON (recursively sorted keys, no whitespace) of this payload with the " +
    "custody_attestation field removed; content_id is sha256 of exactly those bytes",
  verify: "node scripts/gspc-board-verify.mjs <this file>  — needs no estate code, see the script header",
};

writeFileSync(outPath, JSON.stringify(body, null, 1) + "\n");
console.log(`gspc-board-sign -> ${outPath}`);
console.log(`  key_id     : ${KEY_ID}  (parties: ${r.parties})`);
console.log(`  public key : ${r.public_key_hex}`);
console.log(`  content_id : ${contentId}`);
console.log(`  signature  : ${r.signature_b64}`);
