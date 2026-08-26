#!/usr/bin/env node
/**
 * verify-card.mjs — verify a Council of AI measurement card from JavaScript.
 *
 * WHY THIS FILE EXISTS. The preimage our cards are signed over was produced by CPython's
 * json.dumps, which renders a float of integral value as "0.0". ECMAScript's JSON.stringify,
 * Go's encoding/json and RFC 8785 (JCS) all render the same value as "0". A large share of
 * our cards contain such a value, so a NAIVE JavaScript verifier computes different bytes and
 * reports a FALSE FAILURE on roughly a third of the set.
 *
 * We cannot re-canonicalise: every card id is the sha256 of these exact bytes, so changing
 * them would invalidate every id and break every citation. So the quirk is handled here,
 * once, in a file anyone can read — rather than left for each implementer to rediscover.
 *
 * THE HONEST LIMIT. JavaScript cannot distinguish 0 from 0.0 at runtime; both are the same
 * IEEE-754 double. So this verifier cannot infer which fields are floats — it is told, by
 * FLOAT_FIELDS below, which is a property of our schema and not of the data. A future card
 * format should use JCS so this note becomes unnecessary. These cards cannot migrate.
 *
 *   node verify-card.mjs <card.json> [more.json ...]
 *   node verify-card.mjs --all            # fetch and verify every published card
 *
 * Requires Node 19+ (for the built-in WebCrypto Ed25519). No dependencies.
 */

const ORIGIN = "https://councilof.ai";

// The pinned key. A card carries its own `pubkey`, and verifying against THAT proves only
// that the file is self-consistent — anyone can alter a body and sign it with a key they
// just generated. Authenticity requires pinning to the key published in our DID document:
//   did:web:csoai.org#card-attestation-1
const PINNED_PUBKEY_HEX =
  "d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38";

// Fields whose values are floats in our schema. See "THE HONEST LIMIT" above.
const FLOAT_FIELDS = new Set(["accuracy", "ci_low", "ci_high", "recall", "precision", "f1"]);

/** Canonicalise exactly as CPython json.dumps(sort_keys=True, separators=(',',':')) does. */
function canonical(value, key = null) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`non-finite number at ${key}`);
    // A float of integral value renders with a trailing ".0" in CPython.
    if (Number.isInteger(value) && FLOAT_FIELDS.has(key)) return value.toFixed(1);
    return String(value);
  }
  if (typeof value === "string") return jsonString(value);
  if (Array.isArray(value)) return "[" + value.map((v) => canonical(v, key)).join(",") + "]";
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return "{" + keys.map((k) => jsonString(k) + ":" + canonical(value[k], k)).join(",") + "}";
  }
  throw new Error(`unserialisable value at ${key}`);
}

/** JSON string escaping with ensure_ascii=True — non-ASCII becomes \\uXXXX, as CPython does. */
function jsonString(s) {
  let out = '"';
  for (const ch of s) {
    const c = ch.codePointAt(0);
    if (ch === '"') out += '\\"';
    else if (ch === "\\") out += "\\\\";
    // CPython's ESCAPE_DCT maps 0x08 and 0x0c to the SHORT forms \b and \f, not to
    //  / . Omitting these two lines produced a wrong preimage for any body
    // containing them. No published card does, so the bug was latent -- found 2026-08-26.
    else if (ch === "\b") out += "\\b";
    else if (ch === "\f") out += "\\f";
    else if (ch === "\n") out += "\\n";
    else if (ch === "\r") out += "\\r";
    else if (ch === "\t") out += "\\t";
    else if (c < 0x20) out += "\\u" + c.toString(16).padStart(4, "0");
    else if (c < 0x7f) out += ch;
    else if (c <= 0xffff) out += "\\u" + c.toString(16).padStart(4, "0");
    else {
      // Astral plane: CPython emits a surrogate pair, so we must too.
      const v = c - 0x10000;
      out += "\\u" + (0xd800 + (v >> 10)).toString(16).padStart(4, "0");
      out += "\\u" + (0xdc00 + (v & 0x3ff)).toString(16).padStart(4, "0");
    }
  }
  return out + '"';
}

const hex = (buf) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const unhex = (s) => Uint8Array.from(s.match(/../g).map((b) => parseInt(b, 16)));

/**
 * Three outcomes, never two: VALID, INVALID (with the reason), or UNCHECKABLE.
 * A verifier that cannot complete its path must say so rather than returning false —
 * "I could not check" is not the same claim as "this is forged".
 */
export async function verifyCard(card) {
  if (!card || typeof card !== "object" || !card.body)
    return { state: "UNCHECKABLE", reason: "not a card: no body" };
  if (!card.pubkey || !card.signature || !card.id)
    return { state: "UNCHECKABLE", reason: "missing pubkey, signature or id" };

  if (card.pubkey !== PINNED_PUBKEY_HEX)
    return { state: "INVALID", reason: "pubkey is not the published card-attestation key" };

  let preimage;
  try {
    preimage = new TextEncoder().encode(canonical(card.body));
  } catch (e) {
    return { state: "UNCHECKABLE", reason: `cannot canonicalise: ${e.message}` };
  }

  const digest = hex(await crypto.subtle.digest("SHA-256", preimage));
  if (digest !== card.id)
    return { state: "INVALID", reason: `id mismatch: body hashes to ${digest.slice(0, 16)}…` };

  let key;
  try {
    key = await crypto.subtle.importKey("raw", unhex(card.pubkey), "Ed25519", false, ["verify"]);
  } catch {
    return { state: "UNCHECKABLE", reason: "this runtime has no Ed25519 (needs Node 19+)" };
  }
  const ok = await crypto.subtle.verify("Ed25519", key, unhex(card.signature), preimage);
  return ok
    ? { state: "VALID", id: card.id, axis: card.body.axis }
    : { state: "INVALID", reason: "signature does not verify under the pinned key" };
}

// ---------------------------------------------------------------- CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const cards = [];
  if (args[0] === "--all") {
    const idx = await (await fetch(`${ORIGIN}/signed/card_index.json`)).json();
    const rows = idx.cards || idx.entries || idx;
    process.stderr.write(`fetching ${rows.length} cards…\n`);
    for (const r of rows)
      cards.push(await (await fetch(`${ORIGIN}/signed/cards/${r.card}.json`)).json());
  } else if (args.length) {
    const { readFileSync } = await import("node:fs");
    for (const f of args) cards.push(JSON.parse(readFileSync(f, "utf8")));
  } else {
    console.error("usage: node verify-card.mjs <card.json ...> | --all");
    process.exit(2);
  }

  const tally = { VALID: 0, INVALID: 0, UNCHECKABLE: 0 };
  for (const c of cards) {
    const r = await verifyCard(c);
    tally[r.state]++;
    if (r.state !== "VALID") console.error(`  ${r.state}  ${c?.id?.slice(0, 16) ?? "?"}  ${r.reason}`);
  }
  console.log(`VALID ${tally.VALID} · INVALID ${tally.INVALID} · UNCHECKABLE ${tally.UNCHECKABLE}`);
  process.exit(tally.INVALID || tally.UNCHECKABLE ? 1 : 0);
}
