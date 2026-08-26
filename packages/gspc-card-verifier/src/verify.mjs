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
export function analyseChain(cards, chain, profile) {
  const findings = [];
  if (!chain || !Array.isArray(chain.links))
    return { ok: false, findings: [{ code: "CHAIN_MANIFEST_MALFORMED", detail: "no `links` array" }] };

  const links = new Map();
  for (const l of chain.links) {
    if (!l || typeof l.id !== "string") { findings.push({ code: "CHAIN_MANIFEST_MALFORMED", detail: "a link has no id" }); continue; }
    if (links.has(l.id)) findings.push({ code: "CHAIN_DUPLICATE_POSITION", detail: `${l.id.slice(0, 16)}… appears more than once` });
    links.set(l.id, l);
  }

  // Walk prev from the declared head. Every position must be reached exactly once.
  const genesis = new Set([chain.genesis_prev, ...(profile.genesisMarkers || [])].filter(Boolean));
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

  if (typeof chain.length === "number" && chain.length !== links.size)
    findings.push({ code: "CHAIN_LENGTH_MISMATCH", detail: `manifest declares length ${chain.length} but lists ${links.size}` });

  // Cross-check the bodies actually held against the positions.
  const byId = new Map();
  for (const c of cards) if (c && typeof c.id === "string") byId.set(c.id, c);

  let held = 0, missingLocally = 0;
  for (const [id, l] of links) {
    if (l.body_published) {
      if (byId.has(id)) {
        held++;
        if (typeof l.sig === "string" && byId.get(id).signature !== l.sig)
          findings.push({ code: "CHAIN_SIG_DIFFERS", detail: `${id.slice(0, 16)}…: the manifest's signature is not the one in the card file` });
        if (typeof l.pubkey === "string" && byId.get(id).pubkey !== l.pubkey)
          findings.push({ code: "CHAIN_SIG_DIFFERS", detail: `${id.slice(0, 16)}…: the manifest's pubkey is not the one in the card file` });
      } else {
        missingLocally++;
      }
    }
  }
  if (missingLocally)
    findings.push({ code: "BODY_NOT_HELD", detail: `${missingLocally} position(s) declare a published body you did not supply — your local set is a subset, which is fine, but it is not the whole set` });

  for (const id of byId.keys())
    if (!links.has(id))
      findings.push({ code: "CARD_NOT_IN_CHAIN", detail: `you hold card ${id.slice(0, 16)}…, which the manifest does not list as a position` });

  // The distinction that matters: which withheld positions a SIGNATURE commits to.
  const signedPrevs = new Set();
  for (const c of byId.values()) if (c.body && typeof c.body.prev === "string") signedPrevs.add(c.body.prev);

  const withheld = [...links.values()].filter((l) => !l.body_published);
  const attested = withheld.filter((l) => signedPrevs.has(l.id));
  const asserted = withheld.filter((l) => !signedPrevs.has(l.id));

  if (withheld.length)
    findings.push({
      code: "WITHHELD_BODY",
      detail: `${withheld.length} position(s) publish no body, so their signatures cannot be checked: Ed25519 signs the message, and the message is the body you were not given`,
    });
  if (asserted.length)
    findings.push({
      code: "WITHHELD_UNATTESTED",
      detail:
        `${asserted.length} of those ${withheld.length} are named by no signed body you hold. The manifest is unsigned, so their ` +
        `existence, contents and place in the order rest on trust alone` +
        (attested.length ? `; the other ${attested.length} is named inside a signed body's prev and is attested` : ""),
    });

  findings.push({ code: "CHAIN_UNSIGNED", detail: "the manifest carries no signature of its own; it is anchored only where a signed body's prev names a position" });

  return {
    ok: !broke,
    declaredLength: chain.length ?? null,
    positions: links.size,
    walkLength: walked.length,
    reachesGenesis,
    bodiesDeclaredPublished: [...links.values()].filter((l) => l.body_published).length,
    bodiesHeld: held,
    bodiesMissingLocally: missingLocally,
    withheld: { total: withheld.length, attestedBySignedPrev: attested.length, assertedOnly: asserted.length },
    findings,
  };
}
