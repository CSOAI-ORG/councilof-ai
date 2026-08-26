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
 *
 * THIS FILE IS ALSO THE SITE'S VERIFIER. The "Verify a single record" box on /gspc-verify
 * imports `verifyCard` from here rather than carrying a second copy of the rules, so the
 * bytes a reader's browser checks are the bytes this CLI checks. Two consequences:
 *   - importing this module must have NO side effects outside the CLI block at the bottom,
 *     which is why that block is guarded on `process` existing at all; and
 *   - `node:fs` is imported only inside that block, so a browser bundle ends up carrying an
 *     inert stub for it. That is expected: the branch is unreachable without `process`.
 */

const ORIGIN = "https://councilof.ai";

// The pinned key. A card carries its own `pubkey`, and verifying against THAT proves only
// that the file is self-consistent — anyone can alter a body and sign it with a key they
// just generated. Authenticity requires pinning to the key published in our DID document:
//   did:web:csoai.org#card-attestation-1
export const PINNED_PUBKEY_HEX =
  "d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38";

// Fields whose values are floats in our schema. See "THE HONEST LIMIT" above.
const FLOAT_FIELDS = new Set(["accuracy", "ci_low", "ci_high", "recall", "precision", "f1"]);

/** Canonicalise exactly as CPython json.dumps(sort_keys=True, separators=(',',':')) does. */
export function canonical(value, key = null) {
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

/** Shape a card must have before any of the three checks below can even be attempted. */
export function isSignedCard(card) {
  return (
    !!card &&
    typeof card === "object" &&
    !!card.body &&
    typeof card.body === "object" &&
    typeof card.id === "string" &&
    typeof card.pubkey === "string" &&
    typeof card.signature === "string"
  );
}

/**
 * Three outcomes, never two: VALID, INVALID (with the reason), or UNCHECKABLE.
 * A verifier that cannot complete its path must say so rather than returning false —
 * "I could not check" is not the same claim as "this is forged".
 *
 * Alongside the single verdict, `checks` reports each of the three steps separately —
 * pinned key, id-over-body, signature — as true / false / null, where null means the
 * step was never reached. A UI that shows a reader three lines needs that breakdown,
 * and deriving it from the prose in `reason` would be a second, driftable implementation.
 */
export async function verifyCard(card) {
  // A step that is never reached is null, never false: not-checked is not a failure.
  const checks = { pinned_key: null, id: null, signature: null };

  if (!card || typeof card !== "object" || !card.body)
    return { state: "UNCHECKABLE", reason: "not a card: no body", checks };
  if (!card.pubkey || !card.signature || !card.id)
    return { state: "UNCHECKABLE", reason: "missing pubkey, signature or id", checks };

  checks.pinned_key = card.pubkey === PINNED_PUBKEY_HEX;
  if (!checks.pinned_key)
    return {
      state: "INVALID",
      reason: "pubkey is not the published card-attestation key",
      checks,
    };

  let preimage;
  try {
    preimage = new TextEncoder().encode(canonical(card.body));
  } catch (e) {
    return { state: "UNCHECKABLE", reason: `cannot canonicalise: ${e.message}`, checks };
  }

  const digest = hex(await crypto.subtle.digest("SHA-256", preimage));
  checks.id = digest === card.id;
  if (!checks.id)
    return {
      state: "INVALID",
      reason: `id mismatch: body hashes to ${digest.slice(0, 16)}…`,
      computed_id: digest,
      checks,
    };

  let key;
  try {
    key = await crypto.subtle.importKey("raw", unhex(card.pubkey), "Ed25519", false, ["verify"]);
  } catch {
    return {
      state: "UNCHECKABLE",
      reason: "this runtime has no Ed25519 (needs Node 19+)",
      computed_id: digest,
      checks,
    };
  }
  checks.signature = await crypto.subtle.verify("Ed25519", key, unhex(card.signature), preimage);
  return checks.signature
    ? { state: "VALID", id: card.id, axis: card.body.axis, computed_id: digest, checks }
    : {
        state: "INVALID",
        reason: "signature does not verify under the pinned key",
        computed_id: digest,
        checks,
      };
}

// ---------------------------------------------------------------- CLI
// Kept inside a function, and started rather than awaited, so this module has no top-level
// await — a browser bundle that imports `verifyCard` should not become an async module for
// the sake of a branch that only ever runs under Node.
async function cli() {
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

if (
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  import.meta.url === `file://${process.argv[1]}`
) {
  cli().catch((e) => {
    // A verifier that cannot run must say why and exit non-zero — never exit 0 in silence.
    console.error(`could not run: ${e?.message ?? e}`);
    process.exit(1);
  });
}
