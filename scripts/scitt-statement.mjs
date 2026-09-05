#!/usr/bin/env node
/**
 * scitt-statement — emit the SCITT SIGNED STATEMENT for public/root.json, unsigned.
 *
 * WHAT THIS IS NOT. It is not a receipt. A SCITT receipt is issued BY a transparency service
 * when it registers a statement; we neither run one nor are registered with one, so no receipt
 * exists and this script will not produce a thing shaped like one. /.well-known/scitt.json says
 * the same in its own words: "must not invent a measurement, evidence pack, signed statement,
 * transparency-service receipt, or registration", and its implementation_status is PLANNED.
 *
 * WHAT IT IS. The deterministic, verifiable half of the job that does not need a key: the exact
 * subject, the exact payload digest, and the exact protected-header map that a COSE_Sign1 signed
 * statement over root.json must carry (RFC 9943 SCITT architecture). Anyone holding the key can
 * sign these bytes; anyone at all can recompute the digest and check we described it honestly.
 *
 * The signature is null and stays null here. Signing with a key this process does not hold is
 * not something a measurement body does, and a "signature" field filled with anything else is
 * the overclaim the estate exists to refuse.
 *
 *   node scripts/scitt-statement.mjs              # print the statement
 *   node scripts/scitt-statement.mjs --check      # re-derive and confirm the committed copy
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");
const ROOT = join(REPO, "public/root.json");
const OUT = join(REPO, "public/interop/scitt-root-signed-statement.json");

const bytes = readFileSync(ROOT);                       // the artifact's bytes, exactly as served
const root = JSON.parse(bytes.toString("utf8"));
const sha256 = createHash("sha256").update(bytes).digest("hex");

if (!root.merkle_root || !root.as_of) {
  console.error("scitt-statement: root.json carries no merkle_root/as_of — refusing to describe a statement about it.");
  process.exit(1);
}

const statement = {
  schema: "csoai.scitt-signed-statement/0.1",
  what_this_is:
    "The unsigned construction of a SCITT signed statement over https://councilof.ai/root.json. It is NOT a receipt: a receipt is issued by a transparency service on registration, and this estate neither runs one nor is registered with one.",
  what_this_is_not: [
    "Not a SCITT receipt.",
    "Not a registration, and not evidence that any transparency service has seen this statement.",
    "Not a signature: signature is null because this process does not hold the signing key.",
    "Not a claim that the measurement inside root.json is correct — a signature is an integrity claim, not a truth claim.",
  ],
  subject: "https://councilof.ai/root.json",
  // RFC 9943 protected headers. alg is DECLARED, not asserted as used — nothing has signed yet.
  protected_header: {
    alg_intended: "EdDSA",
    "content-type": "application/json",
    cwt_iss_intended: "did:web:csoai.org",
    cwt_sub: "https://councilof.ai/root.json",
  },
  payload: {
    digest_alg: "sha-256",
    digest_hex: sha256,
    length_bytes: bytes.length,
    note: "Digest is over the exact committed bytes of public/root.json, not over a re-serialisation. Re-serialising JSON changes the bytes and therefore the digest.",
  },
  // Read from the artifact, never from the clock.
  artifact: {
    merkle_root: root.merkle_root,
    card_count: root.card_count ?? null,
    as_of: root.as_of,
    envelope_signature_state: root.sig_ed25519 ? "SIGNED" : "UNSIGNED",
  },
  scope: "A proof over these bytes covers these bytes. root.json commits to its own leaf list and nothing else: it does not anchor the signed-card index, and it does not anchor GSPC.",
  signature: null,
  registration: null,
  receipt: null,
  verify_yourself: [
    "curl -s https://councilof.ai/root.json | shasum -a 256    # must equal payload.digest_hex",
    "curl -s https://councilof.ai/interop/scitt-root-signed-statement.json | jq '{subject,payload,signature,receipt}'",
  ],
};

const text = JSON.stringify(statement, null, 2) + "\n";

if (CHECK) {
  if (!existsSync(OUT)) { console.error(`scitt-statement: ${OUT} is missing — run without --check.`); process.exit(1); }
  const have = readFileSync(OUT, "utf8");
  if (have !== text) {
    console.error("✖ scitt-statement: the committed statement no longer matches root.json.");
    console.error("   root.json has changed; regenerate:  node scripts/scitt-statement.mjs");
    process.exit(1);
  }
  console.log(`✓ scitt-statement: matches root.json (sha-256 ${sha256.slice(0, 16)}…, ${root.card_count} leaves, signature null)`);
} else {
  writeFileSync(OUT, text);
  console.log(`wrote ${OUT}`);
  console.log(`  subject   https://councilof.ai/root.json`);
  console.log(`  sha-256   ${sha256}`);
  console.log(`  leaves    ${root.card_count}   as_of ${root.as_of}`);
  console.log(`  signature null (no key here)   receipt null (no transparency service)`);
}
