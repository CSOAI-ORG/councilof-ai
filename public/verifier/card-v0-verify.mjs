#!/usr/bin/env node
/* card-v0-verify — check a signed card-v0 (for example the receipt a paid x402 door returns) offline.
 * Apache-2.0. Copyright 2024-2026 CSOAI Ltd. Zero dependencies, Node 20+. Never opens a socket.
 *
 *   curl -s https://csoai.org/.well-known/did.json -o did.json      # fetch the key document once
 *   node card-v0-verify.mjs receipt.json did.json
 *
 * The rule is the one functions/_lib/cardSign.ts signs with:
 *   bytes      = UTF-8 JSON of card.payload, keys sorted recursively, compact separators, non-ASCII kept
 *   sha256     = SHA-256(bytes)                     must equal card.sha256
 *   sig_ed25519 = Ed25519(bytes), hex               checked against the publicKeyJwk.x of the
 *                                                   verificationMethod whose id equals card.did
 *
 * WHAT A VALID RESULT COVERS. The signature covers the payload only. Envelope fields outside the
 * payload (subject, source_urls, tags, unmeasured) are not signed by this rule, so treat them as
 * unsigned context. A VALID card says who signed those payload bytes, not that the read is correct,
 * and not that money moved: check payload.settle.transaction against Base yourself.
 *
 * Accepts the card itself or a paid response body of the form { card: {...} }.
 * A card carrying `digest_covers` uses the later whole-card rule and is reported UNCHECKABLE here.
 *
 * Exit: 0 VALID · 1 INVALID · 2 UNCHECKABLE (unsigned, unknown key, wrong rule, or bad input)
 */
import { readFileSync } from "node:fs";
import { createHash, createPublicKey, verify } from "node:crypto";

function out(state, detail) {
  process.stdout.write(`${state}  ${detail}\n`);
  process.exit(state === "VALID" ? 0 : state === "INVALID" ? 1 : 2);
}

const [cardFile, didFile] = process.argv.slice(2);
if (!cardFile || !didFile) out("UNCHECKABLE", "usage: node card-v0-verify.mjs <card.json> <did.json>");

let raw, did;
try {
  raw = JSON.parse(readFileSync(cardFile, "utf8"));
  did = JSON.parse(readFileSync(didFile, "utf8"));
} catch (e) {
  out("UNCHECKABLE", `cannot read input: ${e.message}`);
}
const card = raw && typeof raw.card === "object" && raw.card ? raw.card : raw;

if (!card || typeof card.payload !== "object" || card.payload === null) out("UNCHECKABLE", "no payload object");
if ("digest_covers" in card) out("UNCHECKABLE", "card declares digest_covers (whole-card rule); this checker implements the payload rule only");
if (!card.sig_ed25519) out("UNCHECKABLE", "card is unsigned (sig_ed25519 is null); see card.unmeasured");
if (typeof card.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(card.sha256)) out("UNCHECKABLE", "sha256 missing or not 64 hex");
if (typeof card.sig_ed25519 !== "string" || !/^[0-9a-f]{128}$/.test(card.sig_ed25519)) out("UNCHECKABLE", "sig_ed25519 is not 128 hex");

const vm = Array.isArray(did?.verificationMethod) ? did.verificationMethod.find((m) => m.id === card.did) : undefined;
if (!vm || typeof vm.publicKeyJwk?.x !== "string") out("UNCHECKABLE", `key ${card.did} not found in the DID document`);

const sortKeys = (v) =>
  Array.isArray(v)
    ? v.map(sortKeys)
    : v && typeof v === "object"
      ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])]))
      : v;
const bytes = Buffer.from(JSON.stringify(sortKeys(card.payload)), "utf8");

const shaOk = createHash("sha256").update(bytes).digest("hex") === card.sha256;
let sigOk = false;
try {
  const key = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: vm.publicKeyJwk.x }, format: "jwk" });
  sigOk = verify(null, bytes, key, Buffer.from(card.sig_ed25519, "hex"));
} catch (e) {
  out("UNCHECKABLE", `key could not be used: ${e.message}`);
}

if (shaOk && sigOk) out("VALID", `payload signed by ${card.did} · sha256 ${card.sha256.slice(0, 16)}…`);
out("INVALID", `sha256 ${shaOk ? "matches" : "does not match"} · signature ${sigOk ? "verifies" : "does not verify"} under ${card.did}`);
