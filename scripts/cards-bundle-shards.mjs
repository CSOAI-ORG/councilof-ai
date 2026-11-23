/**
 * cards-bundle-shards.mjs — the layout of /cards-bundle.json and its shards, in one place.
 *
 * WHY (22 Nov 2026): the bundle was ONE file holding every public/cards/*.json wrapper. It was
 * 24,635,449 bytes against Cloudflare Pages' 26,214,400-byte per-file cap and grew ~265 KB per
 * root publish, so it had days left. scripts/generate-cards-bundle.mjs now writes:
 *
 *   public/cards-bundle.json          csoai.cards-bundle/0.2. Same URL and same top-level fields
 *                                     (as_of, merkle_root, card_count, root_card_count). `cards`
 *                                     now holds ONLY the wrappers whose sha256 root.json lists
 *                                     (cards_scope "root"), so a lookup by a root hash is still one
 *                                     fetch. `shards.files` lists every shard with its card_count,
 *                                     byte length and sha256.
 *   public/cards-bundle/<c>.json      csoai.cards-bundle-shard/0.1, one per hex character c: every
 *                                     wrapper on disk whose sha256 starts with c (the root's too).
 *
 * The 16 shards partition the corpus: each wrapper is in exactly one. A reader that needs every
 * wrapper reads the index and the 16 shards, 17 fetches, still a fixed number however large the
 * corpus grows (the Pages Functions cap is 50 subrequests per invocation).
 *
 * This copies bytes that already exist under /cards/ and /proofs/. It signs nothing and asserts
 * nothing. A card object is copied as parsed; JSON.stringify writes the same value, so no signed
 * card byte changes (signatures cover the canonical card, not this file's whitespace).
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const INDEX_SCHEMA = "csoai.cards-bundle/0.2";
export const SHARD_SCHEMA = "csoai.cards-bundle-shard/0.1";
export const INDEX_PATH = "/cards-bundle.json";
/** One shard per first hex character of the card's full sha256. */
export const SHARD_PREFIXES = Object.freeze("0123456789abcdef".split(""));
export const SHARD_KEY = "first hex character of the card's sha256";
export const shardPath = (prefix) => `/cards-bundle/${prefix}.json`;

const HEX64 = /^[0-9a-f]{64}$/;
const SHARD_PATH = /^\/cards-bundle\/[0-9a-f]+\.json$/;

const sha256hex = (text) => createHash("sha256").update(text, "utf8").digest("hex");
const sortedObject = (obj, keys) => {
  const out = {};
  for (const k of [...keys].sort()) out[k] = obj[k];
  return out;
};

const INDEX_NOTE =
  "Build-time aggregate of every public/cards/*.json wrapper (card + inclusion proof), keyed by full sha256. " +
  "Since csoai.cards-bundle/0.2 it is split so that no file nears Cloudflare Pages' 25 MiB per-file cap. " +
  "`cards` here holds only the wrappers whose sha256 root.json lists (cards_scope \"root\"), so a reader that " +
  "looks up a hash on the current root (/api/xrpl, /api/proof) needs ONE fetch. Every wrapper on disk, the " +
  "root's included, sits in exactly one shard: the shard named by the first hex character of its sha256 " +
  "(shards.files[].path). A reader that needs every wrapper reads this file and all listed shards and checks " +
  "each shard's card_count, as_of and merkle_root against this index. Copies bytes that already exist under " +
  "/cards/ and /proofs/; signs nothing, measures nothing. Regenerated in build:client, so it is consistent " +
  "with the root.json shipped in the same build.";

/**
 * Build the index and the 16 shards from the root and every wrapper on disk.
 * `cards` maps full sha256 -> { card, proof }. Every hash on the root must be present (the
 * generator refuses before calling this). Returns exact file texts, so a caller can size, write
 * or compare them.
 */
export function buildBundleFiles({ root, cards, generatedBy = "scripts/generate-cards-bundle.mjs" }) {
  const rootHashes = Array.isArray(root.card_sha256) ? root.card_sha256 : [];
  const as_of = root.as_of || null;
  const merkle_root = root.merkle_root || null;
  const all = Object.keys(cards);
  for (const sha of all) {
    if (!HEX64.test(sha)) throw new Error(`not a full lowercase sha256 key: ${sha}`);
  }
  const shards = SHARD_PREFIXES.map((prefix) => {
    const keys = all.filter((sha) => sha.startsWith(prefix));
    const body = {
      schema: SHARD_SCHEMA,
      prefix,
      key: SHARD_KEY,
      index: INDEX_PATH,
      as_of,
      merkle_root,
      card_count: keys.length,
      generated_by: generatedBy,
      cards: sortedObject(cards, keys),
    };
    const text = JSON.stringify(body) + "\n";
    return { prefix, path: shardPath(prefix), text, card_count: keys.length, bytes: Buffer.byteLength(text, "utf8"), sha256: sha256hex(text) };
  });
  const rootSet = new Set(rootHashes);
  const rootKeys = all.filter((sha) => rootSet.has(sha));
  const index = {
    schema: INDEX_SCHEMA,
    as_of,
    merkle_root,
    card_count: all.length,
    root_card_count: rootHashes.length,
    generated_by: generatedBy,
    note: INDEX_NOTE,
    cards_scope: "root",
    shards: {
      key: SHARD_KEY,
      count: shards.length,
      files: shards.map(({ prefix, path, card_count, bytes, sha256 }) => ({ prefix, path, card_count, bytes, sha256 })),
    },
    cards: sortedObject(cards, rootKeys),
  };
  const text = JSON.stringify(index) + "\n";
  return { index: { path: INDEX_PATH, text, bytes: Buffer.byteLength(text, "utf8") }, shards };
}

/** True when a parsed /cards-bundle.json is the split layout (0.2), whose `cards` is the root only. */
export function isShardedIndex(index) {
  return !!index && typeof index === "object" && (index.schema === INDEX_SCHEMA || index.cards_scope === "root" || index.shards !== undefined);
}

/**
 * Read every wrapper from a /cards-bundle.json on disk, whole (0.1) or split (0.2). For the split
 * layout each shard is read from beside the index (index dir + shard path) and must agree with the
 * index: bytes, sha256, card_count, prefix, as_of and merkle_root. Any disagreement throws: a reader
 * that silently used a partial corpus would report a subset as the whole.
 * Returns the index with `cards` replaced by every wrapper, in sha256 order.
 */
export function readCardsBundleFile(indexFile) {
  const index = JSON.parse(readFileSync(indexFile, "utf8"));
  if (!isShardedIndex(index)) return index;
  const files = index?.shards?.files;
  if (!Array.isArray(files) || files.length === 0) throw new Error(`${indexFile}: split index lists no shards`);
  const base = dirname(indexFile);
  const cards = {};
  let total = 0;
  for (const f of files) {
    if (!f || typeof f.prefix !== "string" || typeof f.path !== "string" || !SHARD_PATH.test(f.path)) {
      throw new Error(`${indexFile}: malformed shard entry ${JSON.stringify(f)}`);
    }
    const file = join(base, f.path.replace(/^\//, ""));
    const text = readFileSync(file, "utf8");
    if (Buffer.byteLength(text, "utf8") !== f.bytes || sha256hex(text) !== f.sha256) {
      throw new Error(`${file}: bytes do not match the index (stale shard?) — regenerate with node scripts/generate-cards-bundle.mjs`);
    }
    const shard = JSON.parse(text);
    const keys = shard && shard.cards && typeof shard.cards === "object" && !Array.isArray(shard.cards) ? Object.keys(shard.cards) : null;
    if (!keys || shard.prefix !== f.prefix || shard.as_of !== index.as_of || shard.merkle_root !== index.merkle_root ||
        keys.length !== f.card_count || keys.some((k) => !k.startsWith(f.prefix))) {
      throw new Error(`${file}: shard disagrees with ${indexFile} (prefix, as_of, merkle_root or card_count)`);
    }
    for (const k of keys) cards[k] = shard.cards[k];
    total += keys.length;
  }
  if (typeof index.card_count === "number" && total !== index.card_count) {
    throw new Error(`${indexFile}: shards hold ${total} wrappers but the index says card_count ${index.card_count}`);
  }
  return { ...index, cards };
}
