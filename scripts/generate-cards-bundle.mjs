#!/usr/bin/env node
/**
 * generate-cards-bundle.mjs — build ONE aggregate of every public-root card body.
 *
 * WHY THIS EXISTS (P0 fix, 2026-09-01):
 *   /api/xrpl and /api/proof?bundle=1 used to fetch /root.json and then ONE more
 *   fetch() per card listed on the root (one per sha in card_sha256[]). root.json
 *   now carries 50 hashes, so those handlers issued 1 + 50 = 51 subrequests — over
 *   Cloudflare Pages Functions' hard cap of 50 subrequests per invocation — and the
 *   whole invocation threw, surfacing as an uncaught HTTP 500 on a live endpoint.
 *   /api/proof?bundle=1 was worse: it fetched /proofs/<h> AND fell back to /cards/<h>
 *   per hash, up to 2 per card, ~101 subrequests.
 *
 *   The fan-out is O(card_count). This file removes it: the handlers now read every
 *   card body (and its inclusion proof) from ONE static asset — /cards-bundle.json —
 *   so they cost O(1) subrequests regardless of how many cards the root grows to.
 *
 * WHAT IT WRITES (csoai.cards-bundle/0.2 since 22 Nov 2026; layout in cards-bundle-shards.mjs):
 *   public/cards-bundle.json — { schema, as_of, merkle_root, card_count, root_card_count,
 *   generated_by, note, cards_scope: "root", shards: { files: [...] }, cards }. `cards` is
 *   keyed by the SAME full 64-hex sha the root lists in card_sha256[] and holds exactly the
 *   wrappers on the current root, so a single lookup still resolves any hash on the root.
 *   card_count still counts EVERY wrapper under public/cards/.
 *   public/cards-bundle/<c>.json — 16 shards. Shard c holds every wrapper under
 *   public/cards/ whose sha256 starts with hex character c, the root's included. Together
 *   they are the whole corpus the 0.1 file carried (a subset would 404 a leaf, so the
 *   readers check each shard's card_count, as_of and merkle_root against the index).
 *   public/card-feed-index.json — the complete root-ordered metadata projection for
 *   /feed. Its tier comes from published card/proof metadata, not mirror availability.
 *
 * CONSISTENCY:
 *   Wired into `build:client` BEFORE `vite build`, so it reads the public/cards/ and
 *   public/root.json committed for THIS build and ships an aggregate consistent with
 *   the root served alongside it. The publisher (scripts/publish_public_root.py) writes
 *   cards + root; the next build regenerates this bundle from them. Re-running on an
 *   unchanged corpus writes identical bytes (keys are sorted).
 *
 *   This is a transport optimisation, NOT a new measurement surface: it copies bytes
 *   that already exist under /cards/ and /proofs/. It signs nothing and asserts nothing.
 *
 * Run: node scripts/generate-cards-bundle.mjs   (wired into `npm run build:client`)
 *      node scripts/generate-cards-bundle.mjs --feed-index-only
 *      node scripts/generate-cards-bundle.mjs --check-feed-index   (read-only parity)
 *      node scripts/generate-cards-bundle.mjs --check-bundle       (read-only parity: index + shards)
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildCardFeedIndex } from "./card-feed-index.mjs";
import { buildBundleFiles } from "./cards-bundle-shards.mjs";
import { PAGES_FILE_BYTES_CAP, PAGES_FILE_BYTES_WARN } from "./pages-limits.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CARDS_DIR = join(ROOT, "public", "cards");
const ROOT_JSON = join(ROOT, "public", "root.json");
const PUBLIC = join(ROOT, "public");
const OUT = join(PUBLIC, "cards-bundle.json");
const SHARD_DIR = join(PUBLIC, "cards-bundle");
const FEED_OUT = join(ROOT, "public", "card-feed-index.json");
const args = process.argv.slice(2);
if (args.length > 1 || args.some(arg => !["--feed-index-only", "--check-feed-index", "--check-bundle"].includes(arg))) {
  console.error("Usage: node scripts/generate-cards-bundle.mjs [--feed-index-only | --check-feed-index | --check-bundle]");
  process.exit(2);
}
const checkFeed = args.includes("--check-feed-index");
const feedOnly = args.includes("--feed-index-only");
const checkBundle = args.includes("--check-bundle");

const HEX64 = /^[0-9a-f]{64}$/;

let root = {};
try {
  root = JSON.parse(readFileSync(ROOT_JSON, "utf8"));
} catch {
  console.error("[cards-bundle] ERROR: public/root.json unreadable — refusing to write derived outputs.");
  process.exit(1);
}

const cards = {};
let read = 0;
let skipped = 0;
if (existsSync(CARDS_DIR)) {
  for (const f of readdirSync(CARDS_DIR)) {
    if (!f.endsWith(".json")) continue;
    let wrapped;
    try {
      wrapped = JSON.parse(readFileSync(join(CARDS_DIR, f), "utf8"));
    } catch {
      skipped++;
      continue;
    }
    // A wrapper is { card: {...sha256...}, proof: [...] }. Key by the card's OWN full
    // sha256 (the exact value the root lists), never by the truncated filename — a
    // stranger fetches the bundle and indexes it by the hash on the root.
    const sha = wrapped && wrapped.card && wrapped.card.sha256;
    if (typeof sha !== "string" || !HEX64.test(sha)) {
      skipped++;
      continue;
    }
    cards[sha] = { card: wrapped.card, proof: Array.isArray(wrapped.proof) ? wrapped.proof : [] };
    read++;
  }
}

// Fail loud rather than ship an empty bundle that would 404 every card and turn the
// 500 into a silent-but-wrong 404. If there are genuinely no cards, that is a corpus
// fault the build must surface.
if (read === 0) {
  console.error("[cards-bundle] ERROR: no card wrappers found under public/cards/ — refusing to write an empty bundle.");
  process.exit(1);
}

// Cross-check: every hash the root lists must resolve in the bundle, or the handlers
// would still see a gap. Report it; do not silently ship a partial aggregate.
const rootHashes = Array.isArray(root.card_sha256) ? root.card_sha256 : [];
const missing = rootHashes.filter((h) => !(h in cards));
if (missing.length) {
  console.error(
    `[cards-bundle] ERROR: ${missing.length} of ${rootHashes.length} root card_sha256 hashes have no wrapper under public/cards/. ` +
      `The bundle would 404 those leaves. First missing: ${missing.slice(0, 3).join(", ")}`,
  );
  process.exit(1);
}

// Validate the complete root before either output is written. Projection has no
// clock, network, signatures, card payloads or extra historical leaves.
let feedBytes;
try {
  feedBytes = JSON.stringify(buildCardFeedIndex(root, cards)) + "\n";
} catch (error) {
  console.error(`[cards-bundle] ERROR: ${error.message}`);
  process.exit(1);
}
if (checkFeed) {
  if (!existsSync(FEED_OUT) || readFileSync(FEED_OUT, "utf8") !== feedBytes) {
    console.error("[card-feed-index] STALE or missing: regenerate with --feed-index-only");
    process.exit(1);
  }
  console.log(`[card-feed-index] CHECK OK: ${rootHashes.length} complete root entries`);
  process.exit(0);
}
if (feedOnly) {
  writeFileSync(FEED_OUT, feedBytes);
  console.log(`[card-feed-index] ${rootHashes.length} complete root entries -> public/card-feed-index.json`);
  process.exit(0);
}

// THE SPLIT (22 Nov 2026). Until then this wrote ONE file with every wrapper, minified since
// 7 Nov (#4009) to buy room: 26,098,183 bytes -> 19,501,504. #4009 said so itself: "not a fix for
// unbounded growth ... shard it". By 22 Nov the file was 24,635,449 of Cloudflare Pages' 26,214,400
// bytes per file and grew ~265 KB per root publish, a few days from freezing the root again the
// way #3710 did (1-7 Nov). buildBundleFiles keeps /cards-bundle.json at the same URL with the same
// top-level fields, holding the root's wrappers, and partitions every wrapper into 16 shards by the
// first hex character of its sha256. Each shard starts near 1.5 MiB, about 6% of the cap.
//
// Keys are sorted inside every file, so output is byte-stable on an unchanged corpus. Minified on
// purpose: nothing reads the whitespace, and every consumer parses the JSON.
const built = buildBundleFiles({ root, cards });
const outputs = [
  { file: OUT, rel: "public/cards-bundle.json", text: built.index.text, bytes: built.index.bytes },
  ...built.shards.map((s) => ({ file: join(SHARD_DIR, `${s.prefix}.json`), rel: `public${s.path}`, text: s.text, bytes: s.bytes })),
];

// A file over the cap would only fail later, at the size guard or at the deploy, with less context.
// Refuse here and name the remedy. Above 80% of the cap, say so while there is still room.
const tooBig = outputs.filter((o) => o.bytes > PAGES_FILE_BYTES_CAP);
if (tooBig.length) {
  for (const o of tooBig) console.error(`[cards-bundle] ERROR: ${o.rel} would be ${o.bytes} bytes, over the Pages per-file cap of ${PAGES_FILE_BYTES_CAP}.`);
  console.error("[cards-bundle] Widen the shard key in scripts/cards-bundle-shards.mjs (and keep the 17-fetch read within the subrequest cap) before publishing more cards.");
  process.exit(1);
}
for (const o of outputs.filter((x) => x.bytes > PAGES_FILE_BYTES_WARN)) {
  console.warn(`[cards-bundle] WARNING: ${o.rel} is ${o.bytes} bytes, ${(100 * o.bytes / PAGES_FILE_BYTES_CAP).toFixed(1)}% of the Pages per-file cap. Plan a wider shard key now.`);
}

const expectedShardNames = new Set(built.shards.map((s) => `${s.prefix}.json`));
const strayShards = () => (existsSync(SHARD_DIR) ? readdirSync(SHARD_DIR).filter((f) => !expectedShardNames.has(f)) : []);

if (checkBundle) {
  // Read-only parity for the committed bytes: every output must equal a fresh build, and the shard
  // folder must hold nothing else (a stray shard would be served beside the real ones).
  const stale = outputs.filter((o) => !existsSync(o.file) || readFileSync(o.file, "utf8") !== o.text).map((o) => o.rel);
  const stray = strayShards().map((f) => `public/cards-bundle/${f}`);
  if (stale.length || stray.length) {
    for (const r of stale) console.error(`[cards-bundle] STALE or missing: ${r}`);
    for (const r of stray) console.error(`[cards-bundle] UNEXPECTED file in the shard folder: ${r}`);
    console.error("[cards-bundle] regenerate with: node scripts/generate-cards-bundle.mjs");
    process.exit(1);
  }
  const largest = outputs.reduce((a, b) => (b.bytes > a.bytes ? b : a));
  console.log(`[cards-bundle] CHECK OK: index + ${built.shards.length} shards, ${read} cards; largest ${largest.rel} ${largest.bytes} bytes (${(100 * largest.bytes / PAGES_FILE_BYTES_CAP).toFixed(1)}% of the cap)`);
  process.exit(0);
}

mkdirSync(SHARD_DIR, { recursive: true });
for (const f of strayShards()) rmSync(join(SHARD_DIR, f), { force: true, recursive: true });
for (const o of outputs) writeFileSync(o.file, o.text);
writeFileSync(FEED_OUT, feedBytes);
const largest = outputs.reduce((a, b) => (b.bytes > a.bytes ? b : a));
console.log(
  `[cards-bundle] ${read} cards -> public/cards-bundle.json (${rootHashes.length} on root, all resolved; ` +
    `${skipped} non-card/unreadable files skipped) + ${built.shards.length} shards under public/cards-bundle/; ` +
    `largest file ${largest.rel} ${largest.bytes} bytes (${(100 * largest.bytes / PAGES_FILE_BYTES_CAP).toFixed(1)}% of the cap)`,
);
console.log(`[card-feed-index] ${rootHashes.length} complete root entries -> public/card-feed-index.json`);
