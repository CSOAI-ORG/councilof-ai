/**
 * What to do about a verdict — the end-user half of verification.
 *
 * A verifier that says INVALID and stops has told the truth and left the person holding it with
 * nowhere to go. This maps each real verdict code to the next action, and it is deliberate about
 * a distinction an "auto-fixer" would erase:
 *
 *   SELF        the holder can fix this themselves; the fault is in how they built or fetched it
 *   NOT_YOURS   there is no fix you should make. The bytes disagree with their own signature, which
 *               is evidence about the card, not a defect to smooth over. Editing it destroys the
 *               finding. Take it back to the issuer.
 *   ISSUER      the issuer must act; nothing the holder does is legitimate
 *   INFORMATIONAL  nothing is wrong
 *
 * Nothing here rewrites a card. Advice only, because a tool that silently repaired a signature
 * mismatch would be manufacturing exactly the evidence this estate exists to catch.
 */

export const FIXABLE_BY = Object.freeze({
  SELF: "SELF", NOT_YOURS: "NOT_YOURS", ISSUER: "ISSUER", INFORMATIONAL: "INFORMATIONAL",
});

const R = {
  // ---- card-level ----
  OK: { by: FIXABLE_BY.INFORMATIONAL, says: "The signature verifies over these bytes.",
        next: ["Nothing to do. Note that a valid signature says nothing about whether the signing key is still valid — revocation is a property of the present."] },

  ID_MISMATCH: { by: FIXABLE_BY.NOT_YOURS,
    says: "The body does not hash to the id the card claims. Something changed after it was signed.",
    next: ["Do NOT edit the card to make the hash agree — that destroys the only evidence that it changed.",
           "Re-fetch from the issuer's published URL and compare. A transport or copy-paste change (line endings, re-indented JSON, a stripped BOM) is the usual innocent cause.",
           "If the re-fetched copy verifies, your copy was altered in transit. If it does not, the issuer has a problem and should be told."] },

  SIGNATURE_MISMATCH: { by: FIXABLE_BY.NOT_YOURS,
    says: "The bytes are intact but the signature does not verify under the pinned key.",
    next: ["Check you pinned the right key: a card signed under a rotated key fails this way and is not forged.",
           "Resolve the issuer's DID document and confirm which key was current when the card was signed.",
           "Do not substitute a key that makes it pass. If no published key verifies it, that is the finding."] },

  KEY_NOT_PINNED: { by: FIXABLE_BY.SELF,
    says: "The card names a key your profile does not pin, so the check never ran.",
    next: ["Add the key to your profile only after resolving it from the issuer's did.json yourself.",
           "This is UNCHECKABLE, not INVALID — you have learned nothing about the card yet."] },
  PUBKEY_NOT_PINNED: { by: FIXABLE_BY.SELF,
    says: "The embedded public key is not the one your profile pins.",
    next: ["A card may carry its own key; that key still has to be the one you trust.",
           "Resolve the issuer's DID document and pin from there, never from the card itself."] },
  NO_PINNED_KEY: { by: FIXABLE_BY.SELF,
    says: "Your profile pins no key at all, so nothing could be checked.",
    next: ["Fetch the issuer's did.json and pin the verification method you intend to trust."] },

  OUT_OF_PROFILE_DOMAIN: { by: FIXABLE_BY.SELF,
    says: "A value falls outside the profile's declared domain, so the preimage could not be built.",
    next: ["This is a limit of your profile, not proof the card is bad — it returns UNCHECKABLE by design.",
           "Check number classification: a field the issuer canonicalises as an integer and you treat as a float produces different bytes and a false mismatch."] },

  MALFORMED_CARD: { by: FIXABLE_BY.SELF, says: "The input is not a well-formed card.",
    next: ["Confirm you passed the card object itself, not a wrapper containing it.", "Check it is JSON and not, for example, an HTML error page returned by a proxy."] },
  NOT_A_CARD: { by: FIXABLE_BY.SELF, says: "The input has no card shape at all.",
    next: ["Fetch the card URL directly and confirm the content-type is JSON."] },
  MALFORMED_PROFILE: { by: FIXABLE_BY.SELF, says: "The profile is malformed, so no check could run.",
    next: ["Validate the profile against the published schema before verifying anything with it."] },

  // ---- set and chain level ----
  WITHHELD_BODY: { by: FIXABLE_BY.INFORMATIONAL,
    says: "The body is deliberately withheld; the commitment is still checkable.",
    next: ["Withheld is a stated position, not a gap. Verify the commitment and cite it as withheld."] },
  WITHHELD_UNATTESTED: { by: FIXABLE_BY.ISSUER,
    says: "A body is withheld without an attestation covering the withholding.",
    next: ["Ask the issuer for the attestation. Withholding without one is not a verifiable position."] },
  WITHHELD_ENVELOPE_ONLY: { by: FIXABLE_BY.INFORMATIONAL,
    says: "The verified manifest envelope binds this position, but no published card you hold independently names it as a predecessor.",
    next: ["Describe it as envelope-attested, not independently reproduced or verified."] },
  BODY_NOT_HELD: { by: FIXABLE_BY.SELF, says: "The set does not contain the body this entry commits to.",
    next: ["Fetch the missing body before drawing any conclusion about the set."] },

  CHAIN_NO_PREV: { by: FIXABLE_BY.ISSUER, says: "A card names no predecessor and is not a declared genesis.",
    next: ["Only the issuer can say whether this is a genesis card or a break."] },
  CHAIN_INCOMPLETE: { by: FIXABLE_BY.SELF, says: "A named predecessor is absent from the set you hold.",
    next: ["You may simply be holding a slice. Fetch the full index before calling it broken."] },
  CHAIN_FORKED: { by: FIXABLE_BY.ISSUER, says: "More than one chain tip — the chain has forked.",
    next: ["A fork is a finding about the issuer's publishing, not something a holder repairs.", "Record both tips; do not pick one."] },
  CHAIN_WALK_BROKEN: { by: FIXABLE_BY.ISSUER, says: "The walk from head does not reach every listed link.",
    next: ["Report the break with the first unreachable id."] },
  CHAIN_TOPOLOGY_MALFORMED: { by: FIXABLE_BY.ISSUER, says: "A signed manifest has an invalid head, predecessor or declared genesis shape.",
    next: ["Preserve the signed record and ask the issuer for a superseding manifest with string topology fields and an exact declared terminus."] },
  CHAIN_LINK_METADATA_MALFORMED: { by: FIXABLE_BY.ISSUER, says: "A signed manifest position has missing or malformed signature metadata.",
    next: ["Preserve the signed record and ask the issuer for a superseding manifest in which every link declares Ed25519, a 64-hex public key and a 128-hex signature."] },
  CHAIN_LINK_KEY_NOT_PINNED: { by: FIXABLE_BY.ISSUER, says: "A signed manifest position names a key other than the profile's primary card-attestation key.",
    next: ["Do not broaden the trust profile to make it pass. Ask the issuer to explain the key transition or publish a correctly scoped replacement."] },
  CHAIN_KEY_NOT_PRIMARY: { by: FIXABLE_BY.ISSUER, says: "The chain envelope was signed by a pinned role key that is not authorised as the primary card-chain key.",
    next: ["Keep role keys separate. Require a replacement envelope under the profile's primary card-attestation key."] },
  CHAIN_LENGTH_MALFORMED: { by: FIXABLE_BY.ISSUER, says: "A signed manifest has no usable position count.",
    next: ["Publish a replacement manifest with a non-negative integer length, preserving the contradictory record for audit."] },
  CHAIN_PUBLISH_STATE_MALFORMED: { by: FIXABLE_BY.ISSUER, says: "A manifest position does not say whether its body was published.",
    next: ["Publish a replacement in which every body_published value is exactly true or false."] },
  CHAIN_PUBLISH_COUNT_MALFORMED: { by: FIXABLE_BY.ISSUER, says: "A signed manifest has no usable published or withheld count.",
    next: ["Publish non-negative integer counts and ensure they reconcile with every link flag."] },
  CHAIN_PUBLISH_COUNT_MISMATCH: { by: FIXABLE_BY.ISSUER, says: "The manifest's publication totals contradict its own position flags or length.",
    next: ["Preserve the signed contradiction and ask the issuer for a superseding manifest; do not repair signed evidence in place."] },
  CHAIN_PREV_DIFFERS: { by: FIXABLE_BY.ISSUER, says: "The manifest ordering contradicts the predecessor inside a signed card body.",
    next: ["Preserve both records and report the contradiction. Do not choose or rewrite an order on the issuer's behalf."] },
  CHAIN_KEY_DIFFERS: { by: FIXABLE_BY.ISSUER, says: "A manifest link's public key contradicts the held card at that position.",
    next: ["Preserve both signed records and report the contradiction; do not substitute either key."] },
  CHAIN_UNSIGNED: { by: FIXABLE_BY.ISSUER, says: "The chain manifest carries no signature of its own.",
    next: ["Treat it as a convenience listing, not evidence, and cite the cards rather than the manifest."] },
  CHAIN_ENVELOPE_UNSIGNED: { by: FIXABLE_BY.ISSUER, says: "The chain is a raw manifest, not a signed envelope.",
    next: ["Ask the issuer for a signed chain envelope before relying on its ordering or completeness claim."] },
  CHAIN_MANIFEST_MALFORMED: { by: FIXABLE_BY.SELF, says: "The chain input has no supported manifest shape.",
    next: ["Confirm you supplied the chain JSON itself and that its signed envelope contains a gspc.card-chain body with a links array."] },
  CHAIN_SIGNED: { by: FIXABLE_BY.INFORMATIONAL, says: "The chain manifest envelope verifies under the pinned key.",
    next: ["This authenticates the issuer's ordering; it does not prove the measurements are correct or that no alternative set was withheld."] },
  INDEX_UNSIGNED: { by: FIXABLE_BY.ISSUER, says: "The index carries no signature of its own.",
    next: ["Same rule: an unsigned index is a listing, not evidence. Cite the cards."] },
  INDEX_MALFORMED: { by: FIXABLE_BY.SELF, says: "The supplied index is not a supported card-index object.",
    next: ["Confirm the JSON root is an object and its cards field is an array before comparing it with the held set."] },
  INDEX_COUNT_MISMATCH: { by: FIXABLE_BY.ISSUER, says: "The index's declared count disagrees with what it lists.",
    next: ["Report it. A count that disagrees with the list is a publishing fault, and either number could be the wrong one."] },
};

const GENERIC = {
  INVALID: { by: FIXABLE_BY.NOT_YOURS, says: "The card disagrees with its own signature.",
    next: ["Re-fetch from the issuer and compare before concluding anything. Do not edit the card."] },
  UNCHECKABLE: { by: FIXABLE_BY.SELF, says: "The check did not complete, so nothing has been established either way.",
    next: ["Resolve what was missing — usually a key or a profile — and run it again.",
           "Do not record this as a failure. UNCHECKABLE and INVALID are different facts."] },
  VALID: R.OK,
};

/**
 * @param verdict {state, code?, reason?} from verifyCard, or a findings entry {code, detail}
 * @returns advice, never a mutation
 */
export function adviseOn(verdict) {
  if (!verdict || typeof verdict !== "object") {
    return { known: false, fixableBy: FIXABLE_BY.SELF, says: "No verdict supplied.", next: ["Run a verification first."] };
  }
  // A code that is PRESENT but unmapped must not fall through to generic state advice: that
  // dresses an unknown failure up as an understood one. Only a verdict carrying no code at all
  // falls back to the state-level entry.
  const entry = verdict.code ? R[verdict.code] : GENERIC[verdict.state];
  if (!entry) {
    // An unmapped code must not be dressed up as understood.
    return { known: false, code: verdict.code ?? null, state: verdict.state ?? null,
      fixableBy: FIXABLE_BY.SELF,
      says: `No repair guidance is published for code ${verdict.code ?? "(none)"}.`,
      next: ["Report the code so guidance can be written. Guessing at a fix is worse than saying there is none."],
      reason: verdict.reason ?? verdict.detail ?? null };
  }
  return { known: true, code: verdict.code ?? null, state: verdict.state ?? null,
    fixableBy: entry.by, says: entry.says, next: [...entry.next],
    reason: verdict.reason ?? verdict.detail ?? null,
    editingIsWrong: entry.by === FIXABLE_BY.NOT_YOURS };
}

/** Advice for a whole analyseSet/analyseChain findings array. */
export function adviseOnFindings(findings) {
  const list = Array.isArray(findings) ? findings : [];
  const out = list.map((f) => adviseOn(f));
  return {
    total: out.length,
    unmapped: out.filter((a) => !a.known).length,
    byOwner: out.reduce((a, x) => ((a[x.fixableBy] = (a[x.fixableBy] || 0) + 1), a), {}),
    advice: out,
  };
}
