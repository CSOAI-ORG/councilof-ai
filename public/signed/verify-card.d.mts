/**
 * Types for verify-card.mjs — the published card verifier.
 *
 * These exist so the site's own /gspc-verify box can import the published verifier
 * under TypeScript instead of carrying a second copy of the rules. They are shipped
 * alongside it for anyone else building on the same module; they add no behaviour.
 */

/** true / false / null, where null means the step was never reached. */
export type CardCheck = boolean | null;

export interface CardVerdict {
  state: "VALID" | "INVALID" | "UNCHECKABLE";
  /** Present on every non-VALID verdict. */
  reason?: string;
  /** The card's own id, echoed on a VALID verdict. */
  id?: string;
  axis?: string;
  /** What the body actually hashes to — set once canonicalisation succeeded. */
  computed_id?: string;
  checks: { pinned_key: CardCheck; id: CardCheck; signature: CardCheck };
}

/** did:web:csoai.org#card-attestation-1, as hex. Every published card carries this. */
export declare const PINNED_PUBKEY_HEX: string;

/** CPython json.dumps(sort_keys=True, separators=(',',':'), ensure_ascii=True) equivalent. */
export declare function canonical(value: unknown, key?: string | null): string;

/** Shape check only — says nothing about whether the card verifies. */
export declare function isSignedCard(card: unknown): boolean;

export declare function verifyCard(card: unknown): Promise<CardVerdict>;
