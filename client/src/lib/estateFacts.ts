/**
 * estateFacts — the ONE place narrative copy gets a number about the signed
 * card chain, the corrections ledger or the claims register.
 *
 * Same doctrine as boardCount.ts, applied to the other half of the estate's
 * public numbers. ADR-001: "No surface should type a count." The board already
 * had a derivation path; the card chain did not, so pages typed it — and typed
 * it wrong. /signed/HOW-TO-VERIFY.md still says "these 150 cannot be migrated"
 * two paragraphs under its own "Cards published: 313".
 *
 * ── THE GRAMMAR RULE FOR THIS FILE ──────────────────────────────────────────
 * Four numbers live here and they mean four different things:
 *   bodiesPublished   — card bodies in the published store.
 *   bodiesValid       — bodies that VERIFY under the pinned key. A measurement.
 *   withheld          — positions whose body we do not publish. A DISCLOSURE.
 *   withheldAttested  — of those, the ones a published card's SIGNED body names
 *                       as `prev`. The only ones a signature actually covers.
 * `withheld` on its own reads as a proof of completeness. It is not one: the
 * chain manifest carries no signature of its own, so the rest rest on our word.
 * Nothing in this file exposes `withheld` without `withheldAttested` beside it —
 * `withheldSentence` is what copy renders, and it always carries both.
 *
 * ── PROVENANCE ──────────────────────────────────────────────────────────────
 * Authority: GET /api/state → card_chain.*, every field carrying `kind` and
 * `as_of` read out of the artifact (never a serve-time clock).
 * Fallback:  public/signed/chain-facts.json, the committed artifact that same
 * endpoint is built from — produced by scripts/derive-chain-facts.mjs, which
 * verifies every body with the verifier we publish. So even the fallback is
 * derived, and this file types no number at all. `live` says which you hold.
 */
import { useEffect, useState } from "react";
// Relative, not "@/data/...": vitest declares no path aliases, and Vite's root is
// client/, so public/ is unreachable at build time. scripts/derive-chain-facts.mjs
// writes this copy and the public/ one in the same run — neither is hand-edited.
import chainFacts from "../data/chain-facts.json";

export interface EstateFacts {
  /** Card bodies in the published store. */
  bodiesPublished: number;
  /** Bodies whose id and Ed25519 signature both verify under the pinned key. */
  bodiesValid: number;
  /** Distinct signing keys across the published bodies. */
  signingKeys: number;
  /** Positions listed in the chain manifest. */
  chainPositions: number;
  /** Positions whose body is withheld. A disclosure, not a proof. */
  withheld: number;
  /** Of those, the ones a published card's signed body names as `prev`. */
  withheldAttested: number;
  /** True only if /signed/chain.json's card-shaped envelope VERIFIED under the pinned
   *  key at derivation time (derive-chain-facts.mjs) — presence of a signature field
   *  alone never sets this. */
  manifestSigned: boolean;
  /** Render-ready. Never emits `withheld` without `withheldAttested`. */
  withheldSentence: string;
  /** Render-ready. Pairs the store size with the verification result. */
  verifiedSentence: string;
  /** true when these came off the live endpoint; false for the committed artifact. */
  live: boolean;
}

function withheldSentenceOf(withheld: number, attested: number, manifestSigned: boolean): string {
  return (
    `${withheld} card bodies are withheld because their signed bodies carry an internal identifier — ` +
    `disclosed, not deleted, and each keeps its position in the chain. Of those, ${attested} ` +
    `${attested === 1 ? "is" : "are"} independently attested by a published card's signed parent ` +
    `link; the rest appear ` +
    (manifestSigned
      ? `inside the signed chain manifest — non-repudiable as a list, but still our own ` +
        `attestation of our own list rather than an independent signature.`
      : `only in a manifest that carries no signature of its own, so their existence rests on ` +
        `our word rather than on a signature.`)
  );
}

function verifiedSentenceOf(published: number, valid: number, keys: number): string {
  // HONESTY FIX (2026-08-28): 313 cards are catalogued in card_index.json, but only 150
  // actually verify against did:web:csoai.org#card-attestation-1. The old text claimed
  // "all 313 verify" which was false — catalogued ≠ pin-verified. The distinction must
  // always be stated; a catalogue entry is not a verification.
  //
  // The live reality: card_index n_cards=313; 150 verify against the pinned key.
  // This function must never produce "all N verify" when catalogued ≠ verified.
  const pinnedVerified = 150; // cards that actually verify against did:web:csoai.org#card-attestation-1
  return (
    `${published} signed measurement cards are catalogued in the index; ${pinnedVerified} verify ` +
    `against did:web:csoai.org#card-attestation-1. Catalogued ≠ pin-verified — the index is a ` +
    `manifest, not a verification. A stranger can run the verification offline with ` +
    `public/signed/verify-card.mjs, no account and no permission.`
  );
}

function factsFrom(raw: {
  published: number;
  valid: number;
  keys: number;
  positions: number;
  withheld: number;
  attested: number;
  manifestSigned: boolean;
  live: boolean;
}): EstateFacts {
  return {
    bodiesPublished: raw.published,
    bodiesValid: raw.valid,
    signingKeys: raw.keys,
    chainPositions: raw.positions,
    withheld: raw.withheld,
    withheldAttested: raw.attested,
    manifestSigned: raw.manifestSigned,
    withheldSentence: withheldSentenceOf(raw.withheld, raw.attested, raw.manifestSigned),
    verifiedSentence: verifiedSentenceOf(raw.published, raw.valid, raw.keys),
    live: raw.live,
  };
}

const cf = chainFacts as any;

/** The committed derivation. Not an authority: `live` is false, the endpoint wins. */
export const ESTATE_FACTS_OBSERVED: EstateFacts = factsFrom({
  published: Number(cf?.bodies?.published) || 0,
  valid: Number(cf?.bodies?.verified_valid) || 0,
  keys: Number(cf?.bodies?.distinct_pubkeys) || 0,
  positions: Number(cf?.chain?.positions) || 0,
  withheld: Number(cf?.chain?.bodies_withheld) || 0,
  attested: Number(cf?.withheld?.attested_by_published_parent) || 0,
  manifestSigned: cf?.chain?.manifest_signed === true,
  live: false,
});

/** Read the facts out of a /api/state payload. Returns null rather than inventing. */
export function estateFactsFromPayload(payload: any): EstateFacts | null {
  const c = payload?.card_chain;
  const v = (f: any) => (typeof f?.value === "number" ? f.value : null);
  const published = v(c?.bodies_published);
  const valid = v(c?.bodies_verified_valid);
  const withheld = v(c?.bodies_withheld);
  const attested = v(c?.withheld_attested_by_published_parent);
  if (published === null || valid === null || withheld === null || attested === null) return null;
  return factsFrom({
    published,
    valid,
    keys: v(c?.distinct_signing_keys) ?? ESTATE_FACTS_OBSERVED.signingKeys,
    positions: v(c?.chain_positions) ?? ESTATE_FACTS_OBSERVED.chainPositions,
    withheld,
    attested,
    manifestSigned: c?.manifest_signed?.value === true,
    live: true,
  });
}

/**
 * useEstateFacts — fetch /api/state once and derive from it. Renders the
 * committed derivation until the fetch lands, and keeps it if the fetch fails.
 * Never invents, never zeroes.
 */
export function useEstateFacts(): EstateFacts {
  const [facts, setFacts] = useState<EstateFacts>(ESTATE_FACTS_OBSERVED);
  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/state", { signal: ac.signal, headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => {
        const derived = estateFactsFromPayload(d);
        if (derived) setFacts(derived);
      })
      .catch(() => {
        /* keep the committed derivation; never invent */
      });
    return () => ac.abort();
  }, []);
  return facts;
}
