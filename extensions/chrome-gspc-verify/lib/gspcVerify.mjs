/**
 * gspcVerify.mjs — the extension's verify path. THREE outcomes, never two.
 *
 *   VALID        the check ran to completion and passed
 *   INVALID      the check ran to completion and FAILED — with the reason
 *   UNCHECKABLE  the check could not be completed — NOT the same claim as forged
 *
 * Nothing here is a new verifier. The signature rule is the repo's ONE shared
 * implementation (functions/_lib/cardVerify.ts, transpiled into ./cardVerify.mjs by
 * scripts/build.mjs). This file only:
 *   1. resolves the pinned key for cards that name a DID instead of carrying a pubkey
 *      (the mill cards under /interop/mill-cards-signed/ are signed under
 *      did:web:csoai.org#board-attestation-1 and carry `did`, not `pubkey`);
 *   2. collapses the shared verdict's check list into the three states;
 *   3. asks GET /api/proof?sha= whether the id is a leaf of the last published root,
 *      and recomputes the returned merkle path locally against /root.json.
 *
 * The signature verdict needs NO network: the trust anchors are pinned in the shared
 * module's source. Only the inclusion row talks to councilof.ai, and when it cannot,
 * it says UNCHECKABLE rather than pretending either way.
 */
import { verifyCard, detectFamily, PINNED_ANCHORS, CARD_ATTESTATION_KID } from "./cardVerify.mjs";

export const ORIGIN = "https://councilof.ai";
export const STATES = Object.freeze({ VALID: "VALID", INVALID: "INVALID", UNCHECKABLE: "UNCHECKABLE" });

const HEX64 = /^[0-9a-f]{64}$/;

/**
 * Reasons that mean "the path did not complete" — never rendered as a failure.
 * key_malformed / signature_malformed are here on purpose: a signature that cannot be
 * DECODED was never compared with the bytes, so nothing was found to be false. The
 * offline package (packages/gspc-card-verifier) makes the same call (MALFORMED_CARD ->
 * UNCHECKABLE); the shared site verifier records them as failed checks, and this
 * collapse reconciles the two by reading the code, not the ok flag.
 */
const UNCHECKABLE_CODES = new Set([
  "unrecognised_family",
  "preimage_uncomputable",
  "ed25519_unsupported",
  "key_malformed",
  "signature_malformed",
]);

/** Pinned anchor for a DID verification-method id, or null. Pinned in source — no fetch. */
export function anchorForDid(did) {
  if (typeof did !== "string") return null;
  const hit = PINNED_ANCHORS.find((a) => a.id === did || a.id.endsWith(did.replace(/^#?/, "#")));
  return hit ?? null;
}

const isObj = (v) => !!v && typeof v === "object" && !Array.isArray(v);

/** True when any string in the value falls outside printable ASCII. */
function hasNonAscii(v) {
  if (typeof v === "string") return /[^\x20-\x7e]/.test(v);
  if (Array.isArray(v)) return v.some(hasNonAscii);
  if (isObj(v)) return Object.entries(v).some(([k, x]) => hasNonAscii(k) || hasNonAscii(x));
  return false;
}

/**
 * Normalise a pasted object so the shared verifier can see it.
 *   - a public-root card wrapper `{ card: {...}, proof: [...] }` is unwrapped;
 *   - a DID-anchored measurement card (mill card: `did`, no `pubkey`) has its pubkey
 *     resolved from the PINNED anchor table, and the resolution is reported.
 * Returns { rec, notes[], pinnedBy } — never throws.
 */
export function prepare(input) {
  const notes = [];
  let rec = input;
  if (isObj(rec) && isObj(rec.card) && Array.isArray(rec.proof)) {
    notes.push("Unwrapped a public-root card wrapper ({card, proof}); the inner card is what was checked.");
    rec = rec.card;
  }
  let pinnedBy = null;
  // The published rule for a measurement card is hex: 64-hex id, 64-hex pubkey, 128-hex
  // signature (HOW-TO-VERIFY.md). A field that is not even that shape was never compared
  // with anything, so it is UNCHECKABLE — the same call the offline package makes
  // (MALFORMED_CARD), and distinct from a well-formed signature that fails (INVALID).
  if (isObj(rec) && isObj(rec.body) && typeof rec.id === "string" && typeof rec.signature === "string") {
    const shape = [
      ["id", rec.id, /^[0-9a-f]{64}$/],
      ["signature", rec.signature, /^[0-9a-f]{128}$/],
      ...(typeof rec.pubkey === "string" ? [["pubkey", rec.pubkey, /^[0-9a-f]{64}$/]] : []),
    ];
    for (const [name, value, re] of shape) {
      if (!re.test(value)) {
        return { rec, notes, pinnedBy: null, early: { state: STATES.UNCHECKABLE, reason: `\`${name}\` is not the published shape (${re.source}); the card is malformed and nothing was compared. This is not a finding of forgery.` } };
      }
    }
  }
  if (isObj(rec) && isObj(rec.body) && typeof rec.id === "string" && typeof rec.signature === "string" && typeof rec.pubkey !== "string" && typeof rec.did === "string") {
    const anchor = anchorForDid(rec.did);
    if (!anchor) {
      return {
        rec,
        notes,
        pinnedBy: null,
        early: {
          state: STATES.UNCHECKABLE,
          reason: `The card names ${rec.did}, which is not among the keys pinned in this verifier (published at did:web:csoai.org). No key was fetched — "unknown DID" is not evidence about the card.`,
        },
      };
    }
    if (hasNonAscii(rec.body)) {
      return {
        rec,
        notes,
        pinnedBy: anchor.id,
        early: {
          state: STATES.UNCHECKABLE,
          reason: "This DID-anchored card body contains non-ASCII text. Its preimage rule is CPython json.dumps with ensure_ascii=False, which this verifier implements only for the ASCII subset; it stops rather than guess the bytes.",
        },
      };
    }
    rec = { ...rec, pubkey: anchor.hex };
    pinnedBy = anchor.id;
    notes.push(`The card carries no pubkey; it names ${anchor.id}. That key was taken from the anchor set PINNED in this verifier's source, not fetched.`);
    if (anchor.id !== CARD_ATTESTATION_KID) {
      notes.push(`Note: this is not the card-attestation key. Cards under /interop/mill-cards-signed/ are signed under ${anchor.id} by design (scripts/sign_mill_cards.py).`);
    }
  }
  return { rec, notes, pinnedBy };
}

/**
 * Collapse the shared verdict into one of three states with one reason.
 * `wrongAnchorTolerated` — when the key was resolved from a DID we already know it is
 * a different published anchor; the shared module's "wrong_anchor_for_family" is then a
 * labelled note, not a failure, because that family is signed that way on purpose.
 */
export function collapse(verdict, { pinnedBy = null } = {}) {
  const codes = new Set(verdict.reasons || []);
  const checks = verdict.checks || [];
  const find = (code) => checks.find((c) => c.code === code);

  if (verdict.family === "unknown") {
    return { state: STATES.UNCHECKABLE, reason: find("unrecognised_family")?.detail ?? "Not a shape this verifier recognises. Nothing was checked." };
  }
  if (pinnedBy && pinnedBy !== CARD_ATTESTATION_KID) codes.delete("wrong_anchor_for_family");

  const unsigned = find("unsigned");
  if (unsigned) {
    return { state: STATES.UNCHECKABLE, reason: "The record carries no signature. The hash was recomputed, but there is nothing to verify it against." };
  }
  for (const c of codes) {
    if (UNCHECKABLE_CODES.has(c)) {
      return { state: STATES.UNCHECKABLE, reason: find(c)?.detail ?? c };
    }
  }
  if (codes.size === 0) {
    const sig = find("signature_valid");
    return { state: STATES.VALID, reason: sig?.detail ?? "id reproduces and the signature verifies under a pinned published key." };
  }
  // A completed, failed check. Report the FIRST failure in check order, never merged.
  const firstFail = checks.find((c) => c.ok === false && codes.has(c.code)) ?? checks.find((c) => c.ok === false);
  return { state: STATES.INVALID, reason: firstFail?.detail ?? [...codes].join(", ") };
}

/** Parse pasted text; a parse failure is UNCHECKABLE (nothing was checked), not INVALID. */
export function parseInput(text) {
  try {
    return { value: JSON.parse(text) };
  } catch (e) {
    return { error: `Not valid JSON — nothing was checked. (${e.message})` };
  }
}

/**
 * Verify one pasted record OFFLINE. Returns
 *   { state, reason, family, id, axis, model, pinnedBy, notes[], checks[] }
 */
export async function verifyOffline(input) {
  const prepared = prepare(input);
  if (prepared.early) {
    return { ...prepared.early, family: detectFamily(prepared.rec), id: prepared.rec?.id ?? null, axis: prepared.rec?.body?.axis ?? null, model: prepared.rec?.body?.model ?? null, pinnedBy: prepared.pinnedBy, notes: prepared.notes, checks: [] };
  }
  const verdict = await verifyCard(prepared.rec, []); // [] = no live did.json cross-check; the pinned set decides
  const three = collapse(verdict, { pinnedBy: prepared.pinnedBy });
  const body = isObj(prepared.rec) && isObj(prepared.rec.body) ? prepared.rec.body : {};
  return {
    ...three,
    family: verdict.family,
    id: verdict.id,
    axis: typeof body.axis === "string" ? body.axis : null,
    model: typeof body.model === "string" ? body.model : null,
    bodyStatus: typeof body.status === "string" ? body.status : null,
    // Name the pinned key only when the card's key actually matched a pinned anchor;
    // an untrusted signer must not be captioned with the key it failed to match.
    pinnedBy: prepared.pinnedBy ?? ((verdict.checks || []).some((c) => c.code === "anchor_match") ? CARD_ATTESTATION_KID : null),
    notes: prepared.notes,
    checks: verdict.checks,
  };
}

/* ------------------------------------------------------------------ merkle */

const hexToBytes = (h) => Uint8Array.from(h.match(/.{2}/g), (x) => parseInt(x, 16));
const bytesToHex = (b) => [...b].map((x) => x.toString(16).padStart(2, "0")).join("");

/**
 * Recompute a root from (leaf, index, proof) with the rule in scripts/publish_public_root.py:
 * pair = sha256(left || right); an odd tail pairs with itself. Returns the hex root.
 */
export async function merkleRootFromProof(leafHex, index, proof) {
  let node = hexToBytes(leafHex);
  let i = index;
  for (const sibHex of proof) {
    const sib = hexToBytes(sibHex);
    const pair = i % 2 === 0 ? new Uint8Array([...node, ...sib]) : new Uint8Array([...sib, ...node]);
    node = new Uint8Array(await crypto.subtle.digest("SHA-256", pair));
    i = Math.floor(i / 2);
  }
  return bytesToHex(node);
}

/**
 * Ask whether `sha` is a leaf of the last published root. Three states, mirroring the
 * MCP `verify_inclusion` tool: an inclusion is VALID, a not_found is INVALID ("not a
 * leaf"), anything else is UNCHECKABLE. When the server returns a proof, the merkle path
 * is recomputed locally and must reproduce the root it names — a proof that does not
 * is INVALID even though the server said "inclusion".
 *
 * `fetchJson(url)` is injected so the popup and the content script can route it
 * through the background worker. It must resolve to { status, body } and never throw.
 */
export async function checkInclusion(sha, fetchJson) {
  if (typeof sha !== "string" || !HEX64.test(sha)) {
    return { state: STATES.UNCHECKABLE, reason: "No 64-hex id to look up." };
  }
  const url = `${ORIGIN}/api/proof?sha=${sha}`;
  let res;
  try {
    res = await fetchJson(url);
  } catch (e) {
    return { state: STATES.UNCHECKABLE, reason: `GET /api/proof could not be reached: ${e?.message ?? e}.`, url };
  }
  const d = res?.body;
  if (!d || typeof d !== "object") {
    return { state: STATES.UNCHECKABLE, reason: `GET /api/proof returned HTTP ${res?.status ?? "?"} with no JSON body.`, url };
  }
  if (d.kind === "inclusion" && Array.isArray(d.proof) && typeof d.merkle_root === "string" && Number.isInteger(d.index)) {
    const recomputed = await merkleRootFromProof(sha, d.index, d.proof);
    if (recomputed !== d.merkle_root) {
      return { state: STATES.INVALID, reason: `The server returned a proof, but recomputing it locally gives ${recomputed.slice(0, 16)}…, not the root it names (${d.merkle_root.slice(0, 16)}…).`, url, merkle_root: d.merkle_root, as_of: d.as_of ?? null };
    }
    return { state: STATES.VALID, reason: `Leaf ${d.index} of the root published ${d.as_of ?? "(as_of absent)"}; the ${d.proof.length}-step path recomputes to ${d.merkle_root.slice(0, 16)}… locally.`, url, merkle_root: d.merkle_root, as_of: d.as_of ?? null, index: d.index };
  }
  if (d.error === "not_found") {
    return { state: STATES.INVALID, reason: `Not a leaf of the last published root${d.as_of ? ` (${d.as_of})` : ""}. ${d.reason ?? ""} That root binds the public-root card set, not every signed measurement card; a measurement card is anchored by its pinned signing key above.`.trim(), url, merkle_root: d.merkle_root ?? null, as_of: d.as_of ?? null };
  }
  return { state: STATES.UNCHECKABLE, reason: `Unexpected /api/proof body (HTTP ${res.status}): ${d.reason ?? d.error ?? "no reason given"}.`, url };
}

/** Which sha to look up for inclusion: the verified id, or a public-root wrapper's card.sha256. */
export function inclusionSha(input, verified) {
  if (verified?.id && HEX64.test(verified.id)) return verified.id;
  if (isObj(input)) {
    if (isObj(input.card) && typeof input.card.sha256 === "string") return input.card.sha256;
    if (typeof input.sha256 === "string") return input.sha256;
  }
  return null;
}
