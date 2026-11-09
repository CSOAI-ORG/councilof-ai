/**
 * Shared sha parsing for the /cards/ surface.
 *
 * The canonical card URL is /cards/<sha16>.json — the first 16 hex of the leaf's
 * sha256, which is also the filename the HF mirror stores. root.json publishes
 * FULL 64-hex digests, so a client that builds a URL from the root's own bytes
 * (the natural thing to do — the digest is all the root carries) asked for
 * /cards/<sha64>.json and got a 404 from the mirror, while the same leaf at
 * <sha16>.json resolved. The bytes were fine; the URL grammar had two forms and
 * only one was served.
 *
 * This module is the ONE place that decodes that grammar, so the route and the
 * tests cannot drift apart.
 */

const HEX_RE = /^[0-9a-f]+$/;

export const CANONICAL_SHA_LEN = 16;

export interface NormalizedCard {
  /** The 16-hex filename form the mirror stores, without the .json suffix. */
  sha16: string;
  /** True when the caller asked with the full 64-hex digest and we shortened it. */
  shortened: boolean;
}

/**
 * Decode a /cards/<sha>.json pathname segment into the canonical 16-hex form.
 * Returns null for anything that is not 16- or 64-hex (with or without .json),
 * so the route can fall through to the raw redirect for unknown shapes.
 */
export function normalizeCardSha(segment: string): NormalizedCard | null {
  const raw = segment.toLowerCase().replace(/\.json$/, "");
  if (raw.length === CANONICAL_SHA_LEN && HEX_RE.test(raw)) {
    return { sha16: raw, shortened: false };
  }
  if (raw.length === 64 && HEX_RE.test(raw)) {
    // Full digest: the canonical file is the digest's own first 16 hex.
    return { sha16: raw.slice(0, CANONICAL_SHA_LEN), shortened: true };
  }
  return null;
}
