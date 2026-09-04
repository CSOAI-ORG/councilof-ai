#!/usr/bin/env node
/* gspc-card-verifier 1.0.0 — single-file build. Apache-2.0. Copyright 2024-2026 CSOAI Ltd.
 *
 * GENERATED from src/. Do not edit: edit the source and run `npm run bundle`. The source,
 * the JSON Schemas and the failing-case tests live in the full package; this file is the
 * whole verifier so that checking a card needs no install and no network.
 *
 * Reads only local files. Never opens a socket. Exit codes:
 *   0 all VALID and complete · 1 any INVALID · 2 any UNCHECKABLE or usage error
 *   3 all cards valid but the set incomplete
 */
import { realpathSync as __realpathSync } from "node:fs";
import { fileURLToPath as __fileURLToPath } from "node:url";
/**
 * canonical.mjs — reproduce the exact preimage bytes a GSPC card was signed over.
 *
 * The rule the cards declare, in their own `preimage_rule` field, is CPython's:
 *
 *     json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True).encode('utf-8')
 *
 * That is NOT RFC 8785 (JCS). Two differences matter, and both are load-bearing:
 *
 *   1. CPython renders a float of integral value as "0.0". ECMAScript JSON.stringify,
 *      Go's encoding/json and JCS all render the same value as "0". A large share of the
 *      published cards contain such a value, so a naive JavaScript verifier computes
 *      different bytes and reports a FALSE FAILURE.
 *
 *   2. ensure_ascii=True escapes every code point outside 0x20..0x7e as \uXXXX, with
 *      surrogate pairs above the BMP, and uses the short forms \b \f \n \r \t.
 *
 * The cards cannot be re-canonicalised: every card id is the sha256 of these exact bytes,
 * so changing the rule would invalidate every id and break every citation to one. The quirk
 * is therefore handled here, once, in a file anyone can read.
 *
 * THE AMBIGUITY, AND WHY WE STOP INSTEAD OF GUESSING.
 * JavaScript cannot distinguish 0 from 0.0 at runtime; both are the same IEEE-754 double.
 * A JS verifier therefore cannot infer which fields were floats — that is a property of the
 * schema, not of the data. The profile declares them. For an integral number in a field the
 * profile does NOT classify, there is no correct answer, only a guess. We do not guess:
 * canonicalisation stops and reports OUT_OF_PROFILE_DOMAIN. A best-effort canonicalisation
 * of an out-of-domain preimage would turn "I do not know" into a verdict, which is the
 * failure mode this whole package exists to avoid.
 */

/** Thrown when the value cannot be canonicalised without guessing. Never caught internally. */
class OutOfProfileDomain extends Error {
  constructor(message, path) {
    super(`${message} (at ${path || "$"})`);
    this.name = "OutOfProfileDomain";
    this.code = "OUT_OF_PROFILE_DOMAIN";
    this.path = path || "$";
  }
}

/** Thrown when the value is not representable in JSON at all. */
class NotSerialisable extends Error {
  constructor(message, path) {
    super(`${message} (at ${path || "$"})`);
    this.name = "NotSerialisable";
    this.code = "MALFORMED_CARD";
    this.path = path || "$";
  }
}

/**
 * A number-classification profile. `floatFields` / `floatSuffixes` name the fields whose
 * values are floats in the declared schema; `intFields` / `intSuffixes` name those that are
 * integers. Anything else that arrives as an integral number is out of the declared domain.
 */
function classifyNumberField(profile, key) {
  if (key === null || key === undefined) return "unknown";
  const n = profile.numbers || {};
  if ((n.floatFields || []).includes(key)) return "float";
  if ((n.intFields || []).includes(key)) return "int";
  if ((n.floatSuffixes || []).some((s) => key.endsWith(s))) return "float";
  if ((n.intSuffixes || []).some((s) => key.endsWith(s))) return "int";
  return "unknown";
}

function canonicalNumber(value, key, path, profile) {
  if (!Number.isFinite(value))
    throw new NotSerialisable("non-finite number is not valid JSON", path);

  if (!Number.isInteger(value)) {
    // A non-integral double is unambiguous only while its shortest round-trip form is
    // plain decimal in BOTH runtimes. CPython repr() switches to exponent notation with a
    // two-digit exponent (1e-05); ECMAScript switches at a different threshold and pads
    // differently (1e-7). Rather than reimplement two float formatters and hope, we
    // declare the plain-decimal band as the profile's domain and stop outside it.
    const s = String(value);
    if (s.includes("e") || s.includes("E"))
      throw new OutOfProfileDomain(
        `float ${s} needs exponent notation, whose rendering differs between CPython and ECMAScript`,
        path,
      );
    return s;
  }

  // Integral value: 0 and 0.0 are the same double. Only the schema can say which it was.
  const kind = classifyNumberField(profile, key);
  if (kind === "float") return value.toFixed(1);
  if (kind === "int") {
    if (!Number.isSafeInteger(value))
      throw new OutOfProfileDomain(
        `integer ${value} exceeds the exactly-representable range, so the parsed value may already differ from the signed bytes`,
        path,
      );
    return String(value);
  }
  throw new OutOfProfileDomain(
    `integral number in field "${key}", which this profile does not classify as float or int; ` +
      `JavaScript cannot tell 0 from 0.0, so the preimage cannot be reproduced without guessing`,
    path,
  );
}

/**
 * JSON string escaping matching CPython json.dumps.
 *
 * `asciiOnly` selects the ensure_ascii setting the SIGNER used, and the two disagree the
 * moment a body carries one non-ASCII character. The mill signer uses ensure_ascii=False
 * (scripts/sign_financial_runs.py: canonical_bytes), so a profile that only implements
 * True would call a perfectly good card INVALID as soon as a model name or a framing
 * string contains an accent or an em dash. Every card published so far is pure ASCII, so
 * the two are byte-identical today — which is exactly why this was invisible.
 */
function canonicalString(s, asciiOnly = true) {
  let out = '"';
  for (const ch of s) {
    const c = ch.codePointAt(0);
    if (ch === '"') out += '\\"';
    else if (ch === "\\") out += "\\\\";
    else if (ch === "\b") out += "\\b";
    else if (ch === "\f") out += "\\f";
    else if (ch === "\n") out += "\\n";
    else if (ch === "\r") out += "\\r";
    else if (ch === "\t") out += "\\t";
    else if (c >= 0x20 && c <= 0x7e) out += ch;
    else if (!asciiOnly && c >= 0x20) out += ch;   // ensure_ascii=False: emit the character
    else if (c <= 0xffff) out += "\\u" + c.toString(16).padStart(4, "0");
    else {
      // Above the BMP CPython emits a surrogate pair, so we must too.
      const v = c - 0x10000;
      out += "\\u" + (0xd800 + (v >> 10)).toString(16).padStart(4, "0");
      out += "\\u" + (0xdc00 + (v & 0x3ff)).toString(16).padStart(4, "0");
    }
  }
  return out + '"';
}

/**
 * Canonicalise `value` to the CPython-compatible preimage string.
 * Throws OutOfProfileDomain or NotSerialisable rather than returning a best-effort result.
 */
function canonicalise(value, profile, key = null, path = "$") {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return canonicalNumber(value, key, path, profile);
  if (typeof value === "string") return canonicalString(value, profile?.ensureAscii !== false);
  if (Array.isArray(value))
    // CPython renders a list's items with no key context; the enclosing key is what the
    // profile classifies, so it is carried down deliberately.
    return "[" + value.map((v, i) => canonicalise(v, profile, key, `${path}[${i}]`)).join(",") + "]";
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return (
      "{" +
      keys
        .map((k) => canonicalString(k, profile?.ensureAscii !== false) + ":" + canonicalise(value[k], profile, k, `${path}.${k}`))
        .join(",") +
      "}"
    );
  }
  throw new NotSerialisable(`value of type ${typeof value} is not valid JSON`, path);
}

/** The preimage bytes. */
function preimageBytes(body, profile) {
  return new TextEncoder().encode(canonicalise(body, profile));
}

/**
 * verify.mjs — verify a GSPC measurement card offline.
 *
 * THREE STATES, NEVER TWO.
 *
 *   VALID        the path completed and the signature checks out.
 *   INVALID      the path completed and the card fails. A positive claim of failure.
 *   UNCHECKABLE  the path did NOT complete. Not a pass, not an accusation.
 *
 * The third state is the whole point. A verifier that collapses "I could not check this"
 * into either "fine" or "forged" is reporting a result it did not earn. Every early return
 * below is classified by whether the reasoning finished, not by whether it was convenient.
 *
 * NO NETWORK. Nothing in this file fetches anything. The pinned key, the schema profile and
 * the cards are all inputs. Evidence you hold must be checkable with nothing but the records
 * and a runtime — if verification needed a service to be up, the service could withdraw the
 * proof, and it would not be evidence.
 */


const STATES = Object.freeze({ VALID: "VALID", INVALID: "INVALID", UNCHECKABLE: "UNCHECKABLE" });

const HEX64 = /^[0-9a-f]{64}$/;
const HEX128 = /^[0-9a-f]{128}$/;

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const unhex = (s) => Uint8Array.from(s.match(/../g).map((b) => parseInt(b, 16)));

const valid = (extra) => ({ state: STATES.VALID, code: "OK", ...extra });
const invalid = (code, reason) => ({ state: STATES.INVALID, code, reason });
const uncheckable = (code, reason) => ({ state: STATES.UNCHECKABLE, code, reason });

/** Return a reason when an explicitly supplied convenience index cannot be compared safely. */
function indexShapeIssue(index) {
  if (!index || typeof index !== "object" || Array.isArray(index) || !Array.isArray(index.cards))
    return "the supplied index must be a JSON object with a `cards` array";
  const seen = new Set();
  for (let position = 0; position < index.cards.length; position++) {
    const entry = index.cards[position];
    if (!entry || typeof entry !== "object" || Array.isArray(entry) || !HEX64.test(entry.card))
      return `index.cards[${position}] must be an object with a 64-character lowercase hex card id`;
    if (seen.has(entry.card))
      return `index.cards[${position}] duplicates card id ${entry.card}`;
    seen.add(entry.card);
  }
  if (index.n_cards !== undefined && (!Number.isSafeInteger(index.n_cards) || index.n_cards < 0))
    return "index.n_cards must be a non-negative integer when present";
  if (index.head !== undefined && !HEX64.test(index.head))
    return "index.head must be a 64-character lowercase hex card id when present";
  if (index.kind !== "card_index")
    return "index.kind must be card_index";
  return null;
}

function malformedProfileReason(profile) {
  if (!HEX64.test(profile.pinnedPubkeyHex))
    return "pinnedPubkeyHex must be 64 lowercase hex characters";
  if (profile.alg !== "Ed25519")
    return "alg must be Ed25519; this verifier does not implement another signature algorithm";
  if (profile.ensureAscii !== undefined && typeof profile.ensureAscii !== "boolean")
    return "ensureAscii must be boolean when present";
  if (profile.pinnedKeyId !== undefined && (typeof profile.pinnedKeyId !== "string" || !profile.pinnedKeyId))
    return "pinnedKeyId must be a non-empty string when present";
  if (profile.pinnedKeys !== undefined) {
    if (!profile.pinnedKeys || typeof profile.pinnedKeys !== "object" || Array.isArray(profile.pinnedKeys))
      return "pinnedKeys must be an object when present";
    for (const [keyId, key] of Object.entries(profile.pinnedKeys))
      if (!keyId || typeof key !== "string" || !HEX64.test(key))
        return `pinnedKeys.${keyId || "(empty)"} must be 64 lowercase hex characters`;
    if (
      typeof profile.pinnedKeyId === "string"
      && Object.prototype.hasOwnProperty.call(profile.pinnedKeys, profile.pinnedKeyId)
      && profile.pinnedKeys[profile.pinnedKeyId] !== profile.pinnedPubkeyHex
    )
      return "pinnedKeyId resolves to a different key than pinnedPubkeyHex";
  }

  const stringArray = (value) => Array.isArray(value) && value.every((item) => typeof item === "string");
  for (const field of ["preimageRules", "bodyKinds", "genesisMarkers"])
    if (profile[field] !== undefined && !stringArray(profile[field]))
      return `${field} must be an array of strings`;

  const checkNumbers = (numbers, path) => {
    if (numbers === undefined) return null;
    if (!numbers || typeof numbers !== "object" || Array.isArray(numbers))
      return `${path} must be an object`;
    for (const field of ["floatFields", "intFields", "floatSuffixes", "intSuffixes"])
      if (numbers[field] !== undefined && !stringArray(numbers[field]))
        return `${path}.${field} must be an array of strings`;
    return null;
  };
  const numberIssue = checkNumbers(profile.numbers, "numbers");
  if (numberIssue) return numberIssue;

  if (profile.ruleProfiles !== undefined) {
    if (!profile.ruleProfiles || typeof profile.ruleProfiles !== "object" || Array.isArray(profile.ruleProfiles))
      return "ruleProfiles must be an object";
    for (const [rule, ruleProfile] of Object.entries(profile.ruleProfiles)) {
      if (!ruleProfile || typeof ruleProfile !== "object" || Array.isArray(ruleProfile))
        return `ruleProfiles.${rule} must be an object`;
      if (ruleProfile.ensureAscii !== undefined && typeof ruleProfile.ensureAscii !== "boolean")
        return `ruleProfiles.${rule}.ensureAscii must be boolean when present`;
      const issue = checkNumbers(ruleProfile.numbers, `ruleProfiles.${rule}.numbers`);
      if (issue) return issue;
    }
  }
  if (profile.explicitPubkeyOverride !== undefined && typeof profile.explicitPubkeyOverride !== "boolean")
    return "explicitPubkeyOverride must be boolean when present";
  return null;
}

/**
 * Verify one parsed card object against a profile.
 * @returns {Promise<{state:string, code:string, reason?:string, id?:string, axis?:string}>}
 */
async function verifyCard(card, profile) {
  if (!profile || typeof profile.pinnedPubkeyHex !== "string")
    return uncheckable("NO_PINNED_KEY", "no pinned public key was supplied; without a pin, a signature proves only that the file is self-consistent");
  const profileIssue = malformedProfileReason(profile);
  if (profileIssue) return uncheckable("MALFORMED_PROFILE", profileIssue);

  // ---- 1. Is this a card at all? Not completing this path is UNCHECKABLE, not a forgery.
  if (card === null || typeof card !== "object" || Array.isArray(card))
    return uncheckable("NOT_A_CARD", "input is not a JSON object");
  if (!("body" in card))
    return uncheckable("NOT_A_CARD", "no `body` field: this is not a measurement card");
  if (card.body === null || typeof card.body !== "object" || Array.isArray(card.body))
    return uncheckable("MALFORMED_CARD", "`body` is not a JSON object");

  // A card identifies its key one of two ways: an inline `pubkey`, or a `did` reference
  // resolved against the profile's pins. Requiring `pubkey` made every DID-keyed card —
  // which is every card currently published — read MALFORMED_CARD.
  const hasPubkey = Object.prototype.hasOwnProperty.call(card, "pubkey");
  const hasDid = Object.prototype.hasOwnProperty.call(card, "did");
  if (!hasPubkey && !hasDid)
    return uncheckable("MALFORMED_CARD", "card names no key: neither `pubkey` nor `did`");
  if (hasPubkey && (typeof card.pubkey !== "string" || !HEX64.test(card.pubkey)))
    return uncheckable("MALFORMED_CARD", "`pubkey` is present but is not 64 lowercase hex characters");
  if (hasDid && (typeof card.did !== "string" || !card.did))
    return uncheckable("MALFORMED_CARD", "`did` is present but is not a non-empty string");
  if (hasPubkey && hasDid)
    return uncheckable(
      "MALFORMED_CARD",
      "card names two key authorities (`pubkey` and `did`); the verifier will not guess which identity controls the signature",
    );

  for (const [field, re, what] of [
    ["id", HEX64, "64 lowercase hex characters"],
    ...(hasPubkey ? [["pubkey", HEX64, "64 lowercase hex characters"]] : []),
    ["signature", HEX128, "128 lowercase hex characters"],
  ]) {
    if (typeof card[field] !== "string")
      return uncheckable("MALFORMED_CARD", `missing or non-string \`${field}\``);
    if (!re.test(card[field]))
      return uncheckable("MALFORMED_CARD", `\`${field}\` is not ${what}`);
  }

  // ---- 2. Is the card inside the profile's declared domain?
  // A preimage outside the declared domain gets a distinct code and stops here. It is never
  // canonicalised on a best-effort basis: guessing would manufacture a verdict.
  if (card.alg !== undefined && card.alg !== profile.alg)
    return uncheckable("OUT_OF_PROFILE_DOMAIN", `card declares alg "${card.alg}"; this profile covers only "${profile.alg}"`);

  const rules = profile.preimageRules || [];
  if (card.preimage_rule !== undefined && !rules.includes(card.preimage_rule))
    return uncheckable("OUT_OF_PROFILE_DOMAIN", `card declares a preimage_rule this profile does not implement: ${JSON.stringify(card.preimage_rule)}`);

  const kinds = profile.bodyKinds || [];
  if (kinds.length && !kinds.includes(card.body.kind))
    return uncheckable("OUT_OF_PROFILE_DOMAIN", `body.kind ${JSON.stringify(card.body.kind ?? null)} is not one of ${kinds.join(", ")}`);

  // ---- 3. Pin the key BEFORE trusting anything the card says about itself.
  // A card carries its own pubkey. Verifying against THAT proves only self-consistency:
  // anyone can alter a body and sign it with a key generated a second ago. Mismatch here is
  // a completed judgement — the card is not from the pinned issuer — so it is INVALID.
  // The pin still comes from the profile — fetched out of band, never from the card and
  // never from the network at verification time. A DID-keyed card is pinned by matching its
  // key REFERENCE against the profile's pins; the key itself never travels with the card,
  // which is strictly stronger than trusting an inline pubkey we then have to ignore.
  let pinnedHex = profile.pinnedPubkeyHex;
  if (hasDid) {
    const pins = profile.pinnedKeys && typeof profile.pinnedKeys === "object" ? profile.pinnedKeys : {};
    const known = profile.explicitPubkeyOverride === true
      ? profile.pinnedPubkeyHex
      : Object.prototype.hasOwnProperty.call(pins, card.did)
        ? pins[card.did]
        : card.did === profile.pinnedKeyId
          ? profile.pinnedPubkeyHex
          : null;
    if (!known)
      return uncheckable("KEY_NOT_PINNED", `card is signed under ${card.did}, which this profile does not pin; supply a profile that pins it, or --did with that key document`);
    if (!HEX64.test(known))
      return uncheckable("MALFORMED_PROFILE", `the profile pins ${card.did} to something that is not 64 lowercase hex characters`);
    pinnedHex = known;
  } else if (card.pubkey !== profile.pinnedPubkeyHex) {
    return invalid("PUBKEY_NOT_PINNED", `signed by ${card.pubkey.slice(0, 16)}…, not the pinned key ${profile.pinnedPubkeyHex.slice(0, 16)}…`);
  }

  // ---- 4. Reproduce the signed bytes.
  // The number policy and the ensure_ascii setting belong to the RULE, not to the profile
  // as a whole. Two card generations are in the wild and they serialise differently: cards
  // declaring the CPython json.dumps literal commit to `0.0` for a whole accuracy, while
  // cards declaring "sha256(canonical body)" commit to `0`. A single global policy verifies
  // one generation and calls the other a forgery, which is how 14 genuine cards read
  // ID_MISMATCH. Dispatch on the rule the card itself declares; never guess across rules.
  const perRule = (profile.ruleProfiles || {})[card.preimage_rule ?? ""] || {};
  const effective = {
    ...profile,
    ...perRule,
    numbers: { ...(profile.numbers || {}), ...(perRule.numbers || {}) },
  };
  let preimage;
  try {
    preimage = preimageBytes(card.body, effective);
  } catch (e) {
    if (e instanceof OutOfProfileDomain) return uncheckable("OUT_OF_PROFILE_DOMAIN", e.message);
    if (e instanceof NotSerialisable) return uncheckable("MALFORMED_CARD", e.message);
    return uncheckable("MALFORMED_CARD", `cannot canonicalise: ${e.message}`);
  }

  // ---- 5. The id must be the hash of those bytes.
  const digest = hex(await crypto.subtle.digest("SHA-256", preimage));
  if (digest !== card.id)
    return invalid("ID_MISMATCH", `body hashes to ${digest.slice(0, 16)}…, but the card claims id ${card.id.slice(0, 16)}…`);

  // ---- 6. The signature must verify under the pinned key.
  let key;
  try {
    key = await crypto.subtle.importKey("raw", unhex(pinnedHex), "Ed25519", false, ["verify"]);
  } catch {
    return uncheckable("NO_ED25519_RUNTIME", "this runtime has no WebCrypto Ed25519 (Node 19+ required); the card was NOT checked");
  }
  let ok;
  try {
    ok = await crypto.subtle.verify("Ed25519", key, unhex(card.signature), preimage);
  } catch (e) {
    return uncheckable("NO_ED25519_RUNTIME", `Ed25519 verification could not run: ${e.message}`);
  }
  return ok
    ? valid({ id: card.id, axis: card.body.axis, model: card.body.model })
    : invalid("SIGNATURE_MISMATCH", "signature does not verify under the pinned key");
}

/**
 * Verify the card-shaped envelope around a chain manifest before trusting the manifest.
 *
 * Chain manifests use the same Ed25519 envelope as measurement cards, but their body has a
 * different kind and three integer fields. Keeping that schema extension here avoids either
 * weakening the measurement-card profile or asking callers to guess how the chain was signed.
 * A legacy raw manifest remains inspectable by `analyseChain`, but it is UNCHECKABLE as an
 * authenticated envelope and must never be reported as signed.
 */
async function verifyChainEnvelope(document, profile) {
  if (!profile || typeof profile.pinnedPubkeyHex !== "string")
    return uncheckable("NO_PINNED_KEY", "no pinned public key was supplied, so the chain envelope cannot be authenticated");
  const profileIssue = malformedProfileReason(profile);
  if (profileIssue) return uncheckable("MALFORMED_PROFILE", profileIssue);
  if (!document || typeof document !== "object" || Array.isArray(document))
    return uncheckable("CHAIN_MANIFEST_MALFORMED", "chain input is not a JSON object");

  if (!("body" in document)) {
    if (document.kind === "gspc.card-chain" && Array.isArray(document.links))
      return {
        ...uncheckable(
          "CHAIN_ENVELOPE_UNSIGNED",
          "the chain is a raw manifest with no signed envelope; its structure may be inspected, but its ordering is not authenticated",
        ),
        manifest: document,
      };
    return uncheckable("CHAIN_MANIFEST_MALFORMED", "chain input is neither a signed envelope nor a raw gspc.card-chain manifest");
  }

  // Unlike 22 retained legacy measurement cards, the chain-envelope schema has never had an
  // implicit-algorithm generation. It must name both decisions explicitly; otherwise a verifier
  // could validate bytes under whichever defaults happened to be installed locally.
  if (typeof document.alg !== "string" || !document.alg)
    return uncheckable("MALFORMED_CARD", "chain envelope has no explicit signature algorithm");
  if (typeof document.preimage_rule !== "string" || !document.preimage_rule)
    return uncheckable("MALFORMED_CARD", "chain envelope has no explicit preimage rule");

  if (!document.body || typeof document.body !== "object" || Array.isArray(document.body))
    return uncheckable("CHAIN_MANIFEST_MALFORMED", "chain envelope has no object body");
  if (document.body.kind !== "gspc.card-chain" || !Array.isArray(document.body.links))
    return uncheckable("CHAIN_MANIFEST_MALFORMED", "chain envelope body is not a gspc.card-chain manifest with a links array");

  const chainIntFields = ["bodies_published", "bodies_withheld", "length"];
  const declaredRule = document.preimage_rule ?? "";
  const declaredRuleProfile = (profile.ruleProfiles || {})[declaredRule] || {};
  const chainProfile = {
    ...profile,
    bodyKinds: ["gspc.card-chain"],
    numbers: {
      ...(profile.numbers || {}),
      intFields: [
        ...new Set([
          ...((profile.numbers && profile.numbers.intFields) || []),
          ...chainIntFields,
        ]),
      ],
    },
    // verifyCard applies a rule-specific number profile after the base profile. Extend the
    // declared rule too, otherwise a canonical-rule chain would lose the fields above and be
    // reported OUT_OF_PROFILE_DOMAIN before its id or signature could be checked.
    ruleProfiles: {
      ...(profile.ruleProfiles || {}),
      [declaredRule]: {
        ...declaredRuleProfile,
        numbers: {
          ...(declaredRuleProfile.numbers || {}),
          intFields: [
            ...new Set([
              ...((declaredRuleProfile.numbers && declaredRuleProfile.numbers.intFields) || []),
              ...chainIntFields,
            ]),
          ],
        },
      },
    },
  };
  const result = await verifyCard(document, chainProfile);
  if (result.state !== STATES.VALID) return { ...result, manifest: document.body };

  // A profile may pin several role keys (board, root, card, and so on). That does not grant
  // every role authority to publish the card chain. Do this only after verifyCard has validated
  // the identity fields and signature, so malformed dual/present fields retain their correct
  // UNCHECKABLE classification rather than being mistaken for a role mismatch.
  if (typeof document.did === "string") {
    const didPin = profile.explicitPubkeyOverride === true
      ? profile.pinnedPubkeyHex
      : Object.prototype.hasOwnProperty.call(profile.pinnedKeys || {}, document.did)
        ? profile.pinnedKeys[document.did]
        : document.did === profile.pinnedKeyId
          ? profile.pinnedPubkeyHex
          : null;
    if (didPin !== profile.pinnedPubkeyHex)
      return {
        ...invalid(
          "CHAIN_KEY_NOT_PRIMARY",
          `chain envelope resolves ${document.did} to a pinned role key that is not the profile's primary card-attestation key`,
        ),
        manifest: document.body,
      };
  }
  return { ...result, manifest: document.body };
}

/**
 * Set-level checks. Per-card validity says nothing about COMPLETENESS: a signature cannot
 * prove that nothing was withheld. What can be checked offline is linkage — each body names
 * its predecessor — and agreement between the index and the cards on disk.
 *
 * Note the index itself is NOT signed. Omitting an entry from it breaks no signature. The
 * `prev` chain is the only structural defence against a silently truncated set, which is
 * exactly why it is checked here and reported separately from card validity.
 */
function analyseSet(cards, index, profile, chain = null) {
  const byId = new Map();
  for (const c of cards) if (c && typeof c.id === "string") byId.set(c.id, c);

  const genesis = new Set(profile.genesisMarkers || []);
  const findings = [];

  const prevs = new Set();
  for (const c of byId.values()) {
    const p = c.body && c.body.prev;
    if (typeof p === "string") prevs.add(p);
  }

  // A chain manifest, when supplied, declares the positions that exist. A prev pointing at a
  // declared position is then accounted for, not dangling — the card is simply one we do not
  // hold. Without a manifest there is no way to tell those two cases apart, which is exactly
  // why the manifest is worth publishing.
  const declaredPositions = new Set(
    chain && Array.isArray(chain.links) ? chain.links.map((l) => l && l.id).filter(Boolean) : [],
  );

  const danglingPrev = [];
  for (const [id, c] of byId) {
    const p = c.body && c.body.prev;
    if (typeof p !== "string") { findings.push({ code: "CHAIN_NO_PREV", detail: `card ${id.slice(0, 16)}… has no prev` }); continue; }
    if (!byId.has(p) && !genesis.has(p) && !declaredPositions.has(p)) danglingPrev.push({ card: id, prev: p });
  }
  const tips = [...byId.keys()].filter((id) => !prevs.has(id));

  for (const d of danglingPrev)
    findings.push({
      code: "CHAIN_INCOMPLETE",
      detail: `card ${d.card.slice(0, 16)}… names predecessor ${d.prev.slice(0, 16)}…, which is not in this set and is not a declared genesis marker`,
    });
  // More than one tip means the cards you hold are several disjoint runs. With a manifest
  // that is expected — the runs are separated by positions whose bodies are withheld — so it
  // is reported as an observation there, and as a fork only when nothing explains it.
  if (tips.length > 1 && declaredPositions.size === 0)
    findings.push({ code: "CHAIN_FORKED", detail: `${tips.length} chain tips: ${tips.map((t) => t.slice(0, 16) + "…").join(", ")}` });

  const indexSupplied = index !== null && index !== undefined;
  const indexIssue = indexSupplied ? indexShapeIssue(index) : null;
  if (indexIssue) {
    findings.push({ code: "INDEX_MALFORMED", detail: indexIssue });
  } else if (indexSupplied) {
    const entries = index.cards;
    const declared = new Set(entries.map((e) => e && e.card).filter((x) => typeof x === "string"));
    for (const id of declared)
      if (!byId.has(id)) findings.push({ code: "INDEX_ENTRY_MISSING", detail: `index lists ${id.slice(0, 16)}…, which is not present` });
    for (const id of byId.keys())
      if (!declared.has(id)) findings.push({ code: "CARD_NOT_INDEXED", detail: `card ${id.slice(0, 16)}… is not listed in the index` });
    if (typeof index.n_cards === "number" && index.n_cards !== entries.length)
      findings.push({ code: "INDEX_COUNT_MISMATCH", detail: `index declares n_cards=${index.n_cards} but lists ${entries.length}` });
    if (typeof index.head === "string" && !byId.has(index.head))
      findings.push({ code: "INDEX_HEAD_MISSING", detail: `index declares head ${index.head.slice(0, 16)}…, which is not among the cards` });
    findings.push({ code: "INDEX_UNSIGNED", detail: "the index carries no signature of its own; it is a convenience listing, not evidence" });
  }

  return {
    nCards: byId.size,
    tips,
    danglingPrev,
    chainComplete: danglingPrev.length === 0,
    findings,
  };
}


/**
 * Walk a published chain manifest and say precisely what it does and does not attest.
 *
 * A manifest lists every position, including ones whose body is withheld, so that a withheld
 * card is a visible tombstone rather than an absence indistinguishable from a card that never
 * existed. That is a real improvement over publishing a subset, and it is worth being exact
 * about how far it goes.
 *
 * WHAT IS CRYPTOGRAPHICALLY ATTESTED. A published card's `prev` sits INSIDE the signed body.
 * So when a published card names a predecessor, that predecessor's id and position are
 * committed to by a signature, whether or not its body is published.
 *
 * WHAT IS NOT. The manifest file itself carries no signature. A withheld position that no
 * published body names is therefore an assertion in an unsigned file and nothing more: its
 * existence, its contents and its place in the order all rest on trust. In a RUN of
 * consecutive withheld positions only the one adjoining a published successor is attested;
 * the rest of the run is not. Nor can a withheld position's signature be checked at all —
 * Ed25519 signs the message, and the message is the body you were not given.
 *
 * This function counts both kinds separately, because reporting "the chain is complete" while
 * a fifth of its tombstones are unattested would be a claim the evidence does not support.
 */
function analyseChain(cards, chain, profile, options = {}) {
  const findings = [];
  if (!chain || !Array.isArray(chain.links))
    return { ok: false, findings: [{ code: "CHAIN_MANIFEST_MALFORMED", detail: "no `links` array" }] };

  const manifestSigned = options.manifestSigned === true;

  if (manifestSigned) {
    if (!HEX64.test(chain.head))
      findings.push({ code: "CHAIN_TOPOLOGY_MALFORMED", detail: "a signed manifest head must be a 64-character lowercase hex card id" });
    if (typeof chain.genesis_prev !== "string" || !chain.genesis_prev)
      findings.push({ code: "CHAIN_TOPOLOGY_MALFORMED", detail: "a signed manifest genesis_prev must be a non-empty string" });
  }

  const links = new Map();
  for (const l of chain.links) {
    if (!l || typeof l.id !== "string") { findings.push({ code: "CHAIN_MANIFEST_MALFORMED", detail: "a link has no id" }); continue; }
    if (manifestSigned && !HEX64.test(l.id))
      findings.push({ code: "CHAIN_TOPOLOGY_MALFORMED", detail: `signed manifest link id ${JSON.stringify(l.id)} is not a 64-character lowercase hex card id` });
    if (manifestSigned && (typeof l.prev !== "string" || !l.prev))
      findings.push({ code: "CHAIN_TOPOLOGY_MALFORMED", detail: `${l.id.slice(0, 16)}… has a non-string or empty prev` });
    if (manifestSigned && l.alg !== "Ed25519")
      findings.push({ code: "CHAIN_LINK_METADATA_MALFORMED", detail: `${l.id.slice(0, 16)}… does not declare alg Ed25519` });
    if (manifestSigned && (typeof l.sig !== "string" || !HEX128.test(l.sig)))
      findings.push({ code: "CHAIN_LINK_METADATA_MALFORMED", detail: `${l.id.slice(0, 16)}… has no 128-character lowercase hex Ed25519 signature` });
    if (manifestSigned && (typeof l.pubkey !== "string" || !HEX64.test(l.pubkey)))
      findings.push({ code: "CHAIN_LINK_METADATA_MALFORMED", detail: `${l.id.slice(0, 16)}… has no 64-character lowercase hex Ed25519 public key` });
    else if (manifestSigned && l.pubkey !== profile.pinnedPubkeyHex)
      findings.push({ code: "CHAIN_LINK_KEY_NOT_PINNED", detail: `${l.id.slice(0, 16)}… names a link key that is not the profile's primary card-attestation key` });
    if (links.has(l.id)) findings.push({ code: "CHAIN_DUPLICATE_POSITION", detail: `${l.id.slice(0, 16)}… appears more than once` });
    links.set(l.id, l);
  }

  // Walk prev from the declared head. Every position must be reached exactly once.
  const profileGenesis = Array.isArray(profile?.genesisMarkers) ? profile.genesisMarkers : [];
  // A signed envelope commits to one declared terminus; accepting any profile marker instead
  // lets the signed header disagree with its own walk. Legacy raw manifests retain the profile
  // fallback because they predate the envelope schema and are already classified UNCHECKABLE.
  const genesis = manifestSigned
    ? new Set(typeof chain.genesis_prev === "string" && chain.genesis_prev ? [chain.genesis_prev] : [])
    : new Set([chain.genesis_prev, ...profileGenesis].filter((value) => typeof value === "string" && value));
  const walked = [];
  const visited = new Set();
  let cur = chain.head;
  let broke = null;
  while (typeof cur === "string" && links.has(cur)) {
    if (visited.has(cur)) { broke = `cycle at ${cur.slice(0, 16)}…`; break; }
    visited.add(cur); walked.push(cur);
    cur = links.get(cur).prev;
  }
  const reachesGenesis = genesis.has(cur);
  if (!reachesGenesis && !broke)
    broke = `walk stopped at ${String(cur).slice(0, 40)}, which is neither a position nor a declared genesis marker`;
  if (broke) findings.push({ code: "CHAIN_WALK_BROKEN", detail: broke });

  for (const id of links.keys())
    if (!visited.has(id))
      findings.push({ code: "CHAIN_ORPHAN_LINK", detail: `${id.slice(0, 16)}… is listed but not reachable from head` });

  const safeCount = (value) => Number.isSafeInteger(value) && value >= 0;
  if (manifestSigned && !safeCount(chain.length))
    findings.push({ code: "CHAIN_LENGTH_MALFORMED", detail: "a signed manifest must declare a non-negative integer length" });
  else if (typeof chain.length === "number" && chain.length !== links.size)
    findings.push({ code: "CHAIN_LENGTH_MISMATCH", detail: `manifest declares length ${chain.length} but lists ${links.size}` });

  const declaredPublished = [...links.values()].filter((l) => l.body_published === true);
  const declaredWithheld = [...links.values()].filter((l) => l.body_published === false);
  const malformedPublishState = [...links.values()].filter((l) => typeof l.body_published !== "boolean");
  if (malformedPublishState.length)
    findings.push({
      code: "CHAIN_PUBLISH_STATE_MALFORMED",
      detail: `${malformedPublishState.length} position(s) do not declare body_published as true or false`,
    });

  for (const [field, observed] of [
    ["bodies_published", declaredPublished.length],
    ["bodies_withheld", declaredWithheld.length],
  ]) {
    if (manifestSigned && !safeCount(chain[field]))
      findings.push({ code: "CHAIN_PUBLISH_COUNT_MALFORMED", detail: `a signed manifest must declare ${field} as a non-negative integer` });
    else if (safeCount(chain[field]) && chain[field] !== observed)
      findings.push({ code: "CHAIN_PUBLISH_COUNT_MISMATCH", detail: `manifest declares ${field}=${chain[field]} but its link flags establish ${observed}` });
  }
  if (safeCount(chain.bodies_published) && safeCount(chain.bodies_withheld)) {
    const total = chain.bodies_published + chain.bodies_withheld;
    if (total !== links.size)
      findings.push({ code: "CHAIN_PUBLISH_COUNT_MISMATCH", detail: `manifest publication counts total ${total} but it lists ${links.size} positions` });
    if (safeCount(chain.length) && total !== chain.length)
      findings.push({ code: "CHAIN_PUBLISH_COUNT_MISMATCH", detail: `manifest publication counts total ${total} but declares length ${chain.length}` });
  }

  // Cross-check the bodies actually held against the positions.
  const byId = new Map();
  for (const c of cards) if (c && typeof c.id === "string") byId.set(c.id, c);

  let held = 0, declaredPublishedMissing = 0;
  for (const [id, l] of links) {
    if (byId.has(id)) {
      held++;
      const heldCard = byId.get(id);
      if (typeof l.prev === "string" && heldCard.body?.prev !== l.prev)
        findings.push({ code: "CHAIN_PREV_DIFFERS", detail: `${id.slice(0, 16)}…: the manifest names predecessor ${l.prev.slice(0, 16)}…, but the signed card body names ${String(heldCard.body?.prev).slice(0, 16)}…` });
      if (heldCard.signature !== l.sig)
        findings.push({ code: "CHAIN_SIG_DIFFERS", detail: `${id.slice(0, 16)}…: the manifest's signature is not the one in the card file` });
      const heldKey = typeof heldCard.pubkey === "string"
        ? heldCard.pubkey
        : typeof heldCard.did === "string" && profile?.explicitPubkeyOverride === true
          ? profile.pinnedPubkeyHex
          : typeof heldCard.did === "string" && Object.prototype.hasOwnProperty.call(profile?.pinnedKeys || {}, heldCard.did)
            ? profile.pinnedKeys[heldCard.did]
            : typeof heldCard.did === "string" && heldCard.did === profile?.pinnedKeyId
              ? profile.pinnedPubkeyHex
              : null;
      if (heldKey !== l.pubkey)
        findings.push({ code: "CHAIN_KEY_DIFFERS", detail: `${id.slice(0, 16)}…: the manifest's pubkey is not the one in the card file` });
    } else if (l.body_published === true) {
      declaredPublishedMissing++;
    }
  }
  if (declaredPublishedMissing)
    findings.push({ code: "BODY_NOT_HELD", detail: `${declaredPublishedMissing} position(s) declare a published body you did not supply — your local set is a subset, which is fine, but it is not the whole set` });

  for (const id of byId.keys())
    if (!links.has(id))
      findings.push({ code: "CARD_NOT_IN_CHAIN", detail: `you hold card ${id.slice(0, 16)}…, which the manifest does not list as a position` });

  // The distinction that matters: which withheld positions a SIGNATURE commits to.
  const signedPrevs = new Set();
  for (const c of byId.values()) if (c.body && typeof c.body.prev === "string") signedPrevs.add(c.body.prev);

  // `body_published` records what was true when the envelope was signed. A body may be
  // released later without rewriting that historical statement. Count current availability
  // from the bodies the caller actually supplied, and publish both numbers explicitly.
  const declaredWithheldNowHeld = declaredWithheld.filter((l) => byId.has(l.id));
  const withheld = declaredWithheld.filter((l) => !byId.has(l.id));
  const attested = withheld.filter((l) => signedPrevs.has(l.id));
  const asserted = withheld.filter((l) => !signedPrevs.has(l.id));

  if (withheld.length)
    findings.push({
      code: "WITHHELD_BODY",
      detail: `${withheld.length} position(s) publish no body, so their signatures cannot be checked: Ed25519 signs the message, and the message is the body you were not given`,
    });
  if (asserted.length && !manifestSigned)
    findings.push({
      code: "WITHHELD_UNATTESTED",
      detail:
        `${asserted.length} of those ${withheld.length} are named by no signed body you hold. The manifest is unsigned, so their ` +
        `existence, contents and place in the order rest on trust alone` +
        (attested.length ? `; the other ${attested.length} is named inside a signed body's prev and is attested` : ""),
    });
  if (asserted.length && manifestSigned)
    findings.push({
      code: "WITHHELD_ENVELOPE_ONLY",
      detail:
        `${asserted.length} of those ${withheld.length} are named by no signed body you hold. They are bound by the verified manifest envelope, ` +
        `but not independently referenced by a published card's signed prev`,
    });

  findings.push(manifestSigned
    ? { code: "CHAIN_SIGNED", detail: "the manifest envelope verified under the pinned key; this authenticates the published ordering, not the correctness or exhaustiveness of the measurements" }
    : { code: "CHAIN_UNSIGNED", detail: "the manifest carries no signature of its own; it is anchored only where a signed body's prev names a position" });

  const informational = new Set(["CHAIN_SIGNED", "CHAIN_UNSIGNED", "WITHHELD_ENVELOPE_ONLY"]);
  const blockingFindings = findings.filter((finding) => !informational.has(finding.code));

  return {
    // `ok` is part of the exported library contract. It must agree with the CLI's structural
    // gate, not merely say that the head walk happened to terminate at genesis.
    ok: blockingFindings.length === 0,
    declaredLength: chain.length ?? null,
    positions: links.size,
    walkLength: walked.length,
    reachesGenesis,
    manifestSigned,
    bodiesDeclaredPublished: declaredPublished.length,
    bodiesDeclaredWithheld: declaredWithheld.length,
    bodiesDeclaredWithheldNowHeld: declaredWithheldNowHeld.length,
    bodiesHeld: held,
    bodiesMissingLocally: links.size - held,
    withheld: {
      total: withheld.length,
      declaredAtSigning: declaredWithheld.length,
      releasedAndHeldSince: declaredWithheldNowHeld.length,
      attestedBySignedPrev: attested.length,
      envelopeOnly: manifestSigned ? asserted.length : 0,
      assertedOnly: manifestSigned ? 0 : asserted.length,
    },
    blockingFindings,
    findings,
  };
}

/**
 * did.mjs — take a raw Ed25519 public key out of a DID document.
 *
 * Deliberately takes a PARSED DOCUMENT, not a URL. Fetching happens once, out of band, under
 * your control; the key you pin is then a file you hold. If verification fetched the key each
 * time, whoever serves the document could change what your verifier believes — and evidence
 * that a publisher can retune after the fact is not evidence.
 */
function pubkeyFromDidDocument(doc, keyId) {
  const methods = doc && doc.verificationMethod;
  if (!Array.isArray(methods)) throw new Error("DID document has no verificationMethod array");
  const m = methods.find(
    (v) => v && typeof v.id === "string" && (keyId ? v.id === keyId || v.id.endsWith(keyId) : true),
  );
  if (!m) throw new Error(`no verificationMethod matching ${keyId}`);
  const jwk = m.publicKeyJwk;
  if (!jwk || jwk.kty !== "OKP" || jwk.crv !== "Ed25519" || typeof jwk.x !== "string")
    throw new Error("verificationMethod is not an Ed25519 OKP JWK");
  const b64 = jwk.x.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4)), (c) => c.charCodeAt(0));
  if (bytes.length !== 32) throw new Error(`expected a 32-byte Ed25519 key, got ${bytes.length}`);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}


/** The bundled verification profile. Override with --profile / --pubkey / --did-document. */
const BUNDLED_PROFILE = {
  "$comment": "The verification profile: everything a verifier must be TOLD, in one file, so it can be swapped for your own without editing code. Pass a different one with --profile.",
  "id": "csoai-gspc-1",
  "description": "Council of AI GSPC measurement cards. Pins every published did:web:csoai.org key; cards name theirs by `did`.",
  "alg": "Ed25519",
  "pinnedPubkeyHex": "d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38",
  "pinnedKeyId": "did:web:csoai.org#card-attestation-1",
  "pinnedKeySource": "https://csoai.org/.well-known/did.json \u2014 fetch ONCE, out of band, and keep a copy. It is not fetched at verification time.",
  "preimageRules": [
    "json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True).encode('utf-8')",
    "sha256(canonical body)"
  ],
  "bodyKinds": [
    "gspc.measurement-card"
  ],
  "genesisMarkers": [
    "GSPC-CARD-FACTORY-GENESIS"
  ],
  "numbers": {
    "$comment": "JavaScript cannot tell 0 from 0.0. These lists are how the schema tells it. An integral number in an unlisted field is OUT_OF_PROFILE_DOMAIN, not a guess.",
    "floatFields": [
      "accuracy",
      "ci_high",
      "ci_low",
      "f1",
      "precision",
      "recall"
    ],
    "floatSuffixes": [
      "_ci_low",
      "_ci_high",
      "_accuracy"
    ],
    "intFields": [
      "n",
      "n_items",
      "n_cards",
      "n_cells",
      "count"
    ],
    "intSuffixes": [
      "_count",
      "_n"
    ],
    "$comment_accuracy": "`accuracy` is listed under intFields, which classifies INTEGRAL values only \u2014 a non-integral value like 0.8333 never reaches that branch. It means: when accuracy is whole, the signer wrote it WITHOUT a decimal point. Measured across the 102 published cards: 88 carry a decimal point, 9 carry bare `0`, 5 carry bare `1`, and the signer never emits 0.0 or 1.0. Listing it as a float made this verifier render 0.0 and call those 14 genuine cards ID_MISMATCH. The signed bytes are the authority."
  },
  "pinnedKeys": {
    "did:web:csoai.org#site-release-1": "d3783d97e75534654401555642b254f5a2ed9184cddee011779d8fec312afbc8",
    "did:web:csoai.org#estate-chain-1": "33472e026871db20cdbd99e76c47532ebfcf84b37abed5b260dae3589df5696d",
    "did:web:csoai.org#board-attestation-1": "9367cf59be9cb72bbc9796adf056201ec1c58adfeaa13f83b2c5b754d6c20170",
    "did:web:csoai.org#card-attestation-1": "d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38",
    "did:web:csoai.org#gspc-board-22axis-2026": "d573a7219c0d645091e9f640cb5bbfe71429d43ac168568665a7a260d01e0d2c"
  },
  "ensureAscii": true,
  "$comment_ensureAscii": "The mill signer canonicalises with ensure_ascii=False (scripts/sign_financial_runs.py). Declaring True was byte-identical for every ASCII card published so far and would have failed the first card carrying an accent.",
  "ruleProfiles": {
    "sha256(canonical body)": {
      "$comment": "Mill cards (did-keyed, signed by scripts/sign_financial_runs.py canonical_bytes). Measured across the 102 published: 88 accuracies carry a decimal point, 9 are bare `0`, 5 are bare `1` \u2014 this generation never writes 0.0 or 1.0. It also canonicalises with ensure_ascii=False, unlike the legacy rule.",
      "ensureAscii": false,
      "numbers": {
        "floatFields": [
          "ci_high",
          "ci_low",
          "f1",
          "precision",
          "recall"
        ],
        "intFields": [
          "accuracy",
          "count",
          "n",
          "n_cards",
          "n_cells",
          "n_items"
        ]
      }
    }
  }
};
function defaultProfile() { return JSON.parse(JSON.stringify(BUNDLED_PROFILE)); }
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

async function __cliMain() {
/**
 * gspc-verify — offline verifier for GSPC measurement cards.
 *
 * This command NEVER opens a network connection. Everything it needs is a file you already
 * have: the cards, the index, the profile carrying the pinned key. Fetch those once, however
 * you like; verification afterwards works on a plane, in an air-gapped room, or in five years
 * when councilof.ai no longer resolves. Evidence that needs a live service to be checkable is
 * not evidence — the service could withdraw it.
 *
 * EXIT CODES (a positive result is never returned on a path that did not complete)
 *   0  every card VALID, and the set is self-consistent and complete
 *   1  at least one card INVALID
 *   2  at least one card UNCHECKABLE, or the command could not run
 *   3  every card VALID, but the SET is incomplete or disagrees with its index
 */


const USAGE = `gspc-verify — verify GSPC measurement cards offline

  gspc-verify <card.json | directory> ...

Options
  --index <file>          also check the card index against the cards you hold
  --chain <file>          verify a signed chain envelope, then walk its manifest body;
                          a legacy unsigned manifest is UNCHECKABLE, never trusted
  --profile <file>        verification profile to use (default: the bundled CSOAI profile)
  --pubkey <hex>          pin this raw Ed25519 public key instead of the profile's
  --did-document <file>   pin the key found in a LOCAL DID document
  --key-id <id>           which verificationMethod to take (default: #card-attestation-1)
  --json                  machine-readable results on stdout
  --quiet                 print only the summary line
  -h, --help              this text

Exit: 0 all valid and complete · 1 any INVALID · 2 any UNCHECKABLE or usage error
      3 all cards valid but the set is incomplete
`;

function die(msg) {
  process.stderr.write(`gspc-verify: ${msg}\n`);
  process.exit(2);
}

function parseArgs(argv) {
  const o = { paths: [], json: false, quiet: false, keyId: "#card-attestation-1" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const need = () => argv[++i] ?? die(`${a} needs a value`);
    if (a === "-h" || a === "--help") { process.stdout.write(USAGE); process.exit(0); }
    else if (a === "--json") o.json = true;
    else if (a === "--quiet") o.quiet = true;
    else if (a === "--index") o.index = need();
    else if (a === "--chain") o.chain = need();
    else if (a === "--profile") o.profile = need();
    else if (a === "--pubkey") o.pubkey = need();
    else if (a === "--did-document") o.did = need();
    else if (a === "--key-id") o.keyId = need();
    else if (a.startsWith("-")) die(`unknown option ${a}`);
    else o.paths.push(a);
  }
  return o;
}

function collect(paths) {
  const files = [];
  for (const p of paths) {
    let st;
    try { st = statSync(p); } catch { die(`cannot read ${p}`); }
    if (st.isDirectory()) {
      // Braces are load-bearing: without them the `else` binds to the inner `if` and every
      // single-file invocation silently collects nothing. That bug shipped once and was
      // caught only because a test asserted the exit code AND the reason for it.
      for (const f of readdirSync(p).sort())
        if (extname(f) === ".json") files.push(join(p, f));
    } else {
      files.push(p);
    }
  }
  return files;
}

const opts = parseArgs(process.argv.slice(2));
if (!opts.paths.length) { process.stderr.write(USAGE); process.exit(2); }

let profile;
try {
  profile = opts.profile ? JSON.parse(readFileSync(opts.profile, "utf8")) : defaultProfile();
} catch (e) { die(`cannot load profile: ${e.message}`); }
if (!profile || typeof profile !== "object" || Array.isArray(profile))
  die("profile must be a JSON object");

if (opts.did) {
  try {
    const didDocument = JSON.parse(readFileSync(opts.did, "utf8"));
    const pinnedPubkeyHex = pubkeyFromDidDocument(didDocument, opts.keyId);
    const selected = didDocument.verificationMethod.find(
      (method) => method && typeof method.id === "string" &&
        (method.id === opts.keyId || method.id.endsWith(opts.keyId)),
    );
    profile.pinnedPubkeyHex = pinnedPubkeyHex;
    profile.pinnedKeyId = selected.id;
    profile.pinnedKeys = { [selected.id]: pinnedPubkeyHex };
    delete profile.explicitPubkeyOverride;
  } catch (e) { die(`cannot take a key from ${opts.did}: ${e.message}`); }
}
if (opts.pubkey) {
  if (!/^[0-9a-f]{64}$/.test(opts.pubkey)) die("--pubkey must be 64 lowercase hex characters");
  profile.pinnedPubkeyHex = opts.pubkey;
  profile.pinnedKeyId = "(supplied on the command line)";
  profile.pinnedKeys = {};
  profile.explicitPubkeyOverride = true;
}

const files = collect(opts.paths);
if (!files.length) die("no .json files found in the given paths");

const results = [];
const cards = [];
for (const f of files) {
  let card;
  try {
    card = JSON.parse(readFileSync(f, "utf8"));
  } catch (e) {
    // Unparseable input is UNCHECKABLE. It is not a forgery claim: we never got far enough.
    results.push({ file: f, state: "UNCHECKABLE", code: "UNREADABLE", reason: `not parseable JSON: ${e.message}` });
    continue;
  }
  const r = await verifyCard(card, profile);
  if (r.state === "VALID") cards.push(card);
  results.push({ file: f, ...r });
}

let chainDocument = null;
let chainEnvelope = null;
let chain = null;
if (opts.chain) {
  try { chainDocument = JSON.parse(readFileSync(opts.chain, "utf8")); } catch (e) { die(`cannot read chain manifest: ${e.message}`); }
  chainEnvelope = await verifyChainEnvelope(chainDocument, profile);
  // A legacy raw manifest may still be inspected after it has been explicitly classified as
  // unsigned. A malformed or invalid signed envelope is not walked: doing so would turn
  // unauthenticated bytes into structural findings that look authoritative.
  if (chainEnvelope.state === "VALID" || chainEnvelope.code === "CHAIN_ENVELOPE_UNSIGNED")
    chain = chainEnvelope.manifest;
}

let set = null;
if (opts.index) {
  let index;
  try { index = JSON.parse(readFileSync(opts.index, "utf8")); } catch (e) { die(`cannot read index: ${e.message}`); }
  const indexIssue = indexShapeIssue(index);
  if (indexIssue) die(indexIssue);
  set = analyseSet(cards, index, profile, chain);
} else if (files.length > 1 || chain) {
  set = analyseSet(cards, null, profile, chain);
}

const chainReport = chain
  ? analyseChain(cards, chain, profile, { manifestSigned: chainEnvelope?.state === "VALID" })
  : null;

const tally = { VALID: 0, INVALID: 0, UNCHECKABLE: 0 };
for (const r of results) tally[r.state]++;

// These findings describe provenance limits without making the local set incomplete. A
// BODY_NOT_HELD finding is deliberately NOT informational: exit 3 means the caller's set is
// incomplete, not that the publisher's evidence is invalid.
const INFORMATIONAL = new Set(["INDEX_UNSIGNED", "CHAIN_UNSIGNED", "CHAIN_SIGNED", "WITHHELD_ENVELOPE_ONLY"]);
const allFindings = [...(set ? set.findings : []), ...(chainReport ? chainReport.findings : [])];
const blockingSetFindings = allFindings.filter((f) => !INFORMATIONAL.has(f.code));

if (opts.json) {
  process.stdout.write(JSON.stringify({
    profile: { id: profile.id, pinnedPubkeyHex: profile.pinnedPubkeyHex, pinnedKeyId: profile.pinnedKeyId },
    tally, results, set, chainEnvelope, chain: chainReport,
  }, null, 2) + "\n");
} else {
  if (!opts.quiet) {
    process.stdout.write(`pinned key ${profile.pinnedPubkeyHex}  (${profile.pinnedKeyId})\n`);
    for (const r of results)
      if (r.state !== "VALID")
        process.stdout.write(`  ${r.state.padEnd(11)} ${r.code.padEnd(22)} ${r.file}\n                          ${r.reason}\n`);
  }
  process.stdout.write(`VALID ${tally.VALID} · INVALID ${tally.INVALID} · UNCHECKABLE ${tally.UNCHECKABLE}\n`);
  if (chainEnvelope) {
    process.stdout.write(
      `chain envelope: ${chainEnvelope.state} ${chainEnvelope.code}` +
        (chainEnvelope.reason ? ` — ${chainEnvelope.reason}` : "") + "\n",
    );
  }
  if (chainReport) {
    const c = chainReport;
    process.stdout.write(
      `manifest: ${c.positions} positions, walk ${c.walkLength}${c.reachesGenesis ? " to genesis" : " DID NOT REACH GENESIS"}; ` +
        `${c.bodiesHeld}/${c.positions} bodies held; ` +
        `${c.bodiesDeclaredWithheld} declared withheld at signing, ${c.bodiesDeclaredWithheldNowHeld} now held; ` +
        `${c.withheld.total} still unavailable (${c.withheld.attestedBySignedPrev} attested by a signed prev, ` +
        `${c.withheld.envelopeOnly} envelope-only, ${c.withheld.assertedOnly} unsigned assertion only)\n`,
    );
  }
  if (set)
    process.stdout.write(`held cards: ${set.nCards}, ${set.tips.length} run(s), local links ${set.chainComplete ? "all resolve" : "INCOMPLETE"}\n`);
  // Findings are grouped and capped. A verifier that buries its one interesting finding under
  // 288 identical lines has technically reported it and practically hidden it. Nothing is
  // dropped: --json always carries every finding.
  {
    const byCode = new Map();
    for (const f of allFindings) (byCode.get(f.code) ?? byCode.set(f.code, []).get(f.code)).push(f.detail);
    for (const [code, details] of byCode) {
      for (const d of details.slice(0, 5)) process.stdout.write(`  ${code.padEnd(22)} ${d}\n`);
      if (details.length > 5)
        process.stdout.write(`  ${code.padEnd(22)} … and ${details.length - 5} more (use --json for all)\n`);
    }
  }
}

if (tally.INVALID || chainEnvelope?.state === "INVALID") process.exit(1);
if (tally.UNCHECKABLE || chainEnvelope?.state === "UNCHECKABLE") process.exit(2);
if (blockingSetFindings.length) process.exit(3);
process.exit(0);

}

/* Dual-mode: a library when imported, a CLI when executed. Running this file directly behaves
 * exactly as before; importing it now yields the verification surface and runs nothing. */
export { verifyCard, verifyChainEnvelope, analyseSet, analyseChain, STATES, canonicalise, canonicalString, preimageBytes,
         OutOfProfileDomain, NotSerialisable, pubkeyFromDidDocument, defaultProfile };

const __isDirect = (() => {
  try {
    return Boolean(process.argv[1]) &&
      __realpathSync(process.argv[1]) === __realpathSync(__fileURLToPath(import.meta.url));
  }
  catch { return false; }
})();
if (__isDirect) __cliMain();
