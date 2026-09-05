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

import { preimageBytes, OutOfProfileDomain, NotSerialisable } from "./canonical.mjs";

export const STATES = Object.freeze({ VALID: "VALID", INVALID: "INVALID", UNCHECKABLE: "UNCHECKABLE" });

const HEX64 = /^[0-9a-f]{64}$/;
const HEX128 = /^[0-9a-f]{128}$/;

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const unhex = (s) => Uint8Array.from(s.match(/../g).map((b) => parseInt(b, 16)));

const valid = (extra) => ({ state: STATES.VALID, code: "OK", ...extra });
const invalid = (code, reason) => ({ state: STATES.INVALID, code, reason });
const uncheckable = (code, reason) => ({ state: STATES.UNCHECKABLE, code, reason });

/** Return a reason when an explicitly supplied convenience index cannot be compared safely. */
export function indexShapeIssue(index) {
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
export async function verifyCard(card, profile) {
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
export async function verifyChainEnvelope(document, profile) {
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
export function analyseSet(cards, index, profile, chain = null) {
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
export function analyseChain(cards, chain, profile, options = {}) {
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
