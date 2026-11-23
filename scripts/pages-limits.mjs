/**
 * pages-limits.mjs — Cloudflare Pages' hard deployment limits, pinned in ONE place.
 *
 * WHY (22 Nov 2026): public/cards-bundle.json reached 24,635,449 of 26,214,400 bytes and grew
 * ~265 KB with every public-root publish. Past the per-file cap, scripts/pages-size-guard.mjs fails
 * every root candidate and no new card lands; that happened from 1 to 7 Nov (#3710 failed on
 * "cards-bundle.json — 25.2 MiB"). The guard knew the cap but said nothing until it was crossed.
 * The bundle is now split into shards (scripts/cards-bundle-shards.mjs), and the producer and the
 * guard read the same numbers from here, so neither can drift from the other.
 *
 * These are platform facts, not tuning knobs. scripts/pages-size-guard.test.ts pins them: raising
 * the cap here would not raise it at Cloudflare, it would only move the failure to the deploy.
 */

/** 25 MiB. Pages rejects any single file larger than this. A file of exactly this size is accepted. */
export const PAGES_FILE_BYTES_CAP = 26_214_400;

/** 20 MiB, 80% of the cap. A file above this is named in the build log while there is still room. */
export const PAGES_FILE_BYTES_WARN = 20_971_520;

/** Pages accepts at most this many files in one deployment. */
export const PAGES_FILE_COUNT_CAP = 20_000;

/** Print the file-count headroom loudly once fewer than 1,000 files are left. */
export const PAGES_FILE_COUNT_WARN = 19_000;
