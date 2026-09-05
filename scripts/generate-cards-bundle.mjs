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
 * WHAT IT WRITES:
 *   public/cards-bundle.json — { schema, as_of, merkle_root, card_count, generated_by,
 *   note, cards: { "<full-sha256>": { card, proof } } }, keyed by the SAME full 64-hex
 *   sha the root lists in card_sha256[]. Every wrapper under public/cards/ is included
 *   (a superset of the root is harmless; a subset would 404 a leaf), so a single
 *   lookup resolves any hash on the current root.
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
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CARDS_DIR = join(ROOT, "public", "cards");
const ROOT_JSON = join(ROOT, "public", "root.json");
const OUT = join(ROOT, "public", "cards-bundle.json");

const HEX64 = /^[0-9a-f]{64}$/;

let root = {};
try {
  root = JSON.parse(readFileSync(ROOT_JSON, "utf8"));
} catch {
  console.warn("[cards-bundle] public/root.json unreadable — bundle will carry no merkle_root/as_of");
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

// Sorted keys → byte-stable output on an unchanged corpus.
const orderedCards = {};
for (const k of Object.keys(cards).sort()) orderedCards[k] = cards[k];

const bundle = {
  schema: "csoai.cards-bundle/0.1",
  as_of: root.as_of || null,
  merkle_root: root.merkle_root || null,
  card_count: read,
  root_card_count: rootHashes.length,
  generated_by: "scripts/generate-cards-bundle.mjs",
  note:
    "Build-time aggregate of every public/cards/*.json wrapper (card + inclusion proof), keyed by full " +
    "sha256. Exists so /api/xrpl and /api/proof read all card bodies in ONE subrequest instead of one " +
    "fetch per card (Cloudflare Pages Functions cap: 50 subrequests/invocation). Copies bytes that already " +
    "exist under /cards/ and /proofs/; signs nothing, measures nothing. Regenerated in build:client, so it " +
    "is consistent with the root.json shipped in the same build.",
  cards: orderedCards,
};

writeFileSync(OUT, JSON.stringify(bundle, null, 2) + "\n");
console.log(
  `[cards-bundle] ${read} cards -> public/cards-bundle.json ` +
    `(${rootHashes.length} on root, all resolved; ${skipped} non-card/unreadable files skipped)`,
);
