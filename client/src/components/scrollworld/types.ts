/**
 * scrollworld — the shared scroll-world section vocabulary.
 *
 * Extracted verbatim from client/src/components/home/StoryWorld.tsx so the homepage
 * and the deck pages run ONE implementation. StoryWorld keeps only what is unique to
 * the homepage (its locked H1 hero reel, its persona chips, its two infographics);
 * every section renderer, motion helper and bullet style now lives here.
 *
 * Doctrine that the copy in every consumer must hold to:
 *   measurement, not certification · cite live totals.public_count from /api/gspc
 *   (as of 2026-08-26, after the ADR-001 sweep: "22 axis · 15 measured") ·
 *   jail (slot 14) is MEASURED with separation TIE · the anchor is Ed25519 +
 *   SHA-256 hash-chain against did:web:csoai.org (no time-stamping authority) ·
 *   nothing "expires" — when the law moves we re-measure and issue a delta card ·
 *   the 33-agent council is a DESIGNED structure, never a fault-tolerance guarantee.
 *
 *   THE COUNT, precisely: 22 is a count of AXES ON THE BOARD (14 GSPC + 8
 *   financial/domain, ADR-001). 15 of them carry a measurement; 7 are declared
 *   slots with no run behind them. Never write "22 measured axis" — that claims
 *   seven measurements that do not exist. Quote totals.public_count, which carries
 *   both numbers, or quote the smaller one. This line previously read "do not
 *   invent 22 axis — quotable board = 14", which was correct while the financial
 *   axes were ruled in but absent from the signed payload; the sweep of 2026-08-26
 *   wired them in and re-signed, so the board now substantiates 22.
 */

export type Point = { tag: "pain" | "benefit" | "usp"; text: string };

export type Slide = {
  kicker: string;
  title?: string;
  body: string;
  points?: Point[];
  href?: string;
  cta?: string;
  video?: { src: string; poster: string; title: string };
  /** full-bleed background image → makes the section a heavy cinematic band */
  bg?: { src: string; alt: string };
  /** a clear, in-flow image shown in a light section's media column */
  image?: { src: string; alt: string };
  /** infographic index for light sections that have no media (consumer-supplied) */
  figure?: number;
};
