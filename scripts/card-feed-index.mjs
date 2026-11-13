import { createHash } from "node:crypto";

export const CARD_FEED_SCHEMA = "csoai.card-feed-index/1";
export const CARD_FEED_TIER_BASIS = "published-metadata";
const HEX64 = /^[0-9a-f]{64}$/;

/**
 * Derive the complete, ordered public-root feed from already published wrappers.
 * This is metadata projection, not a mirror probe or cryptographic verifier.
 * The root publisher writes the same proof array to each card wrapper and its
 * /proofs file. Explicit product proof, or a nonempty published proof array,
 * retains the healthy-corpus tier rule; a delivery failure no longer means free.
 */
export function buildCardFeedIndex(root, cards) {
  const shas = root?.card_sha256;
  if (!Array.isArray(shas) || shas.length === 0 ||
      shas.some(sha => typeof sha !== "string" || !HEX64.test(sha)) ||
      new Set(shas).size !== shas.length || root.card_count !== shas.length) {
    throw new Error("card feed: root needs unique SHA-256 leaves and an equal card_count");
  }
  const text = (value, fallback, field, sha) => {
    if (value === null || value === undefined) return fallback;
    if (typeof value !== "string") throw new Error(`card feed: ${sha} has non-string ${field}`);
    return value;
  };
  const entries = shas.map(sha => {
    const wrapped = cards?.[sha];
    const card = wrapped?.card;
    if (!card || typeof card !== "object" || Array.isArray(card) || card.sha256 !== sha) {
      throw new Error(`card feed: root leaf ${sha} has no matching card wrapper`);
    }
    const hasPublishedProof = Array.isArray(wrapped.proof) && wrapped.proof.length > 0;
    return {
      sha256: sha,
      surface: text(card.surface, "unknown", "surface", sha),
      subject: text(card.subject, "", "subject", sha),
      as_of: text(card.as_of, "", "as_of", sha),
      tier: card.product?.tier === "proof" || hasPublishedProof ? "proof" : "free",
    };
  });
  return {
    schema: CARD_FEED_SCHEMA,
    root_digest: createHash("sha256").update(JSON.stringify(root)).digest("hex"),
    root_card_count: shas.length,
    tier_basis: CARD_FEED_TIER_BASIS,
    entries,
  };
}
