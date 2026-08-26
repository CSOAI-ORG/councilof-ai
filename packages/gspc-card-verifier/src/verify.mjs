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

/**
 * Verify one parsed card object against a profile.
 * @returns {Promise<{state:string, code:string, reason?:string, id?:string, axis?:string}>}
 */
export async function verifyCard(card, profile) {
  if (!profile || typeof profile.pinnedPubkeyHex !== "string")
    return uncheckable("NO_PINNED_KEY", "no pinned public key was supplied; without a pin, a signature proves only that the file is self-consistent");

  // ---- 1. Is this a card at all? Not completing this path is UNCHECKABLE, not a forgery.
  if (card === null || typeof card !== "object" || Array.isArray(card))
    return uncheckable("NOT_A_CARD", "input is not a JSON object");
  if (!("body" in card))
    return uncheckable("NOT_A_CARD", "no `body` field: this is not a measurement card");
  if (card.body === null || typeof card.body !== "object" || Array.isArray(card.body))
    return uncheckable("MALFORMED_CARD", "`body` is not a JSON object");

  for (const [field, re, what] of [
    ["id", HEX64, "64 lowercase hex characters"],
    ["pubkey", HEX64, "64 lowercase hex characters"],
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
  if (card.pubkey !== profile.pinnedPubkeyHex)
    return invalid("PUBKEY_NOT_PINNED", `signed by ${card.pubkey.slice(0, 16)}…, not the pinned key ${profile.pinnedPubkeyHex.slice(0, 16)}…`);

  // ---- 4. Reproduce the signed bytes.
  let preimage;
  try {
    preimage = preimageBytes(card.body, profile);
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
    key = await crypto.subtle.importKey("raw", unhex(card.pubkey), "Ed25519", false, ["verify"]);
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
 * Set-level checks. Per-card validity says nothing about COMPLETENESS: a signature cannot
 * prove that nothing was withheld. What can be checked offline is linkage — each body names
 * its predecessor — and agreement between the index and the cards on disk.
 *
 * Note the index itself is NOT signed. Omitting an entry from it breaks no signature. The
 * `prev` chain is the only structural defence against a silently truncated set, which is
 * exactly why it is checked here and reported separately from card validity.
 */
export function analyseSet(cards, index, profile) {
  const byId = new Map();
  for (const c of cards) if (c && typeof c.id === "string") byId.set(c.id, c);

  const genesis = new Set(profile.genesisMarkers || []);
  const findings = [];

  const prevs = new Set();
  for (const c of byId.values()) {
    const p = c.body && c.body.prev;
    if (typeof p === "string") prevs.add(p);
  }

  const danglingPrev = [];
  for (const [id, c] of byId) {
    const p = c.body && c.body.prev;
    if (typeof p !== "string") { findings.push({ code: "CHAIN_NO_PREV", detail: `card ${id.slice(0, 16)}… has no prev` }); continue; }
    if (!byId.has(p) && !genesis.has(p)) danglingPrev.push({ card: id, prev: p });
  }
  const tips = [...byId.keys()].filter((id) => !prevs.has(id));

  for (const d of danglingPrev)
    findings.push({
      code: "CHAIN_INCOMPLETE",
      detail: `card ${d.card.slice(0, 16)}… names predecessor ${d.prev.slice(0, 16)}…, which is not in this set and is not a declared genesis marker`,
    });
  if (tips.length > 1)
    findings.push({ code: "CHAIN_FORKED", detail: `${tips.length} chain tips: ${tips.map((t) => t.slice(0, 16) + "…").join(", ")}` });

  if (index && typeof index === "object") {
    const entries = Array.isArray(index.cards) ? index.cards : [];
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
