// readCardsBundle — every card wrapper the build shipped, read through /cards-bundle.json.
//
// WHY (22 Nov 2026). /cards-bundle.json used to hold every public/cards/*.json wrapper in ONE file.
// It reached 24,635,449 of Cloudflare Pages' 26,214,400 bytes per file, growing ~265 KB per root
// publish, so scripts/generate-cards-bundle.mjs now splits it (layout: scripts/cards-bundle-shards.mjs):
//
//   /cards-bundle.json        csoai.cards-bundle/0.2: `cards` holds only the wrappers on the current
//                             root (cards_scope "root"); shards.files lists the 16 shards.
//   /cards-bundle/<c>.json    every wrapper whose sha256 starts with hex character c.
//
// A reader that looks up hashes on the current root (/api/xrpl, /api/proof) still reads `cards` from
// the index in ONE fetch and does not need this module. A reader that needs EVERY wrapper (the
// evidence bundle, the receipts batch, the rwa fallback) calls readCardsBundle: the index plus each
// listed shard, 17 fetches for 16 shards, a fixed number however large the corpus grows (the Pages
// Functions cap is 50 subrequests per invocation).
//
// FAIL CLOSED, NEVER A SILENT SUBSET. A shard that is missing, or disagrees with its index (prefix,
// as_of, merkle_root, card_count, or a key outside its prefix) fails the whole read: half a corpus
// reported as the whole is the wrong answer this file exists to prevent. An HTTP failure comes back
// as ok:false; a fetch that throws, or bytes that are not JSON, THROW, for a shard exactly as for the
// index, which is what the single-file readers did (evidence-bundle.procurement.test.ts pins that an
// exception is never turned into a no-cards answer). A whole 0.1 file (no shards) is still read as it
// was, so a fixture or an older deploy keeps working.
//
// Memory: shards are fetched at most SHARD_CONCURRENCY at a time and merged in index order, and a
// `keep` predicate drops what the caller does not need as each shard arrives, so the raw text of the
// whole corpus is never held at once. Merging in index order keeps the merged object in sha256 order,
// the order the 0.1 file had, so callers that iterate it see the same sequence.

export type BundleCard = {
  sha256?: string;
  surface?: string;
  subject?: string;
  as_of?: string;
  sig_ed25519?: string | null;
  tags?: string[];
  did?: string;
  unmeasured?: string[];
  payload?: Record<string, unknown>;
  [k: string]: unknown;
};
export type BundleWrapper = { card?: BundleCard; proof?: unknown[] };

export type CardsBundleRead = {
  /** false: the index or a listed shard could not be read, or a shard disagrees with the index. */
  ok: boolean;
  /** Why ok is false, e.g. "HTTP 503" for the index, "shard /cards-bundle/7.json HTTP 404" for a shard. */
  reason: string | null;
  /** HTTP status of the read that failed; null when it was not an HTTP failure. */
  status: number | null;
  /** The index URL. */
  source: string;
  /** URL of the read that failed, or null. */
  failed: string | null;
  as_of: string | null;
  merkle_root: string | null;
  layout: "whole" | "sharded" | null;
  /** The corpus arrived as a cards object: the index's own (whole), or every shard's (sharded). */
  cards_object: boolean;
  /** Every kept wrapper, keyed by full sha256, in sha256 order. */
  cards: Record<string, BundleWrapper>;
  shards_read: number;
};

export const CARDS_BUNDLE_PATH = "/cards-bundle.json";
export const SHARD_CONCURRENCY = 4;
const SHARD_PATH = /^\/cards-bundle\/[0-9a-f]+\.json$/;
const HEX_PREFIX = /^[0-9a-f]+$/;

type Keep = (sha: string, w: BundleWrapper) => boolean;
type ShardEntry = { prefix: string; path: string; card_count: number };
type Got = { ok: true; body: unknown } | { ok: false; status: number; reason: string };

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

// A non-2xx answer is a result; a fetch that throws or a body that is not JSON throws to the caller.
async function getJson(url: string): Promise<Got> {
  const res = await fetch(url);
  if (!res.ok) return { ok: false, status: res.status, reason: `HTTP ${res.status}` };
  return { ok: true, body: await res.json() };
}

function shardEntries(index: Record<string, unknown>): ShardEntry[] | string {
  const shards = index.shards;
  const files = isObject(shards) ? shards.files : undefined;
  if (!Array.isArray(files) || files.length === 0) return "the split index lists no shards";
  const out: ShardEntry[] = [];
  for (const f of files) {
    if (!isObject(f) || typeof f.prefix !== "string" || !HEX_PREFIX.test(f.prefix) || typeof f.path !== "string" ||
        !SHARD_PATH.test(f.path) || typeof f.card_count !== "number" || !Number.isInteger(f.card_count) || f.card_count < 0) {
      return `malformed shard entry ${JSON.stringify(f).slice(0, 120)}`;
    }
    out.push({ prefix: f.prefix, path: f.path, card_count: f.card_count });
  }
  // The shards must partition the key space: no prefix may be a prefix of another.
  for (const a of out) for (const b of out) {
    if (a !== b && b.prefix.startsWith(a.prefix)) return `shard prefixes overlap (${a.prefix}, ${b.prefix})`;
  }
  const total = out.reduce((n, f) => n + f.card_count, 0);
  if (typeof index.card_count === "number" && total !== index.card_count) {
    return `the shards list ${total} wrappers but the index says card_count ${index.card_count}`;
  }
  return out;
}

function keepAll(target: Record<string, BundleWrapper>, cards: Record<string, unknown>, keep?: Keep): void {
  for (const [sha, w] of Object.entries(cards)) {
    const wrapper = w as BundleWrapper;
    if (!keep || keep(sha, wrapper)) target[sha] = wrapper;
  }
}

/**
 * Read every wrapper from /cards-bundle.json on `origin`, whole (0.1) or split (0.2).
 * `keep` (optional) decides, per wrapper, what the caller holds on to.
 */
export async function readCardsBundle(origin: string, opts: { keep?: Keep } = {}): Promise<CardsBundleRead> {
  const source = new URL(CARDS_BUNDLE_PATH, origin).toString();
  const fail = (reason: string, status: number | null, failed: string, shards_read = 0): CardsBundleRead => ({
    ok: false, reason, status, source, failed, as_of: null, merkle_root: null, layout: null, cards_object: false, cards: {}, shards_read,
  });

  const got = await getJson(source);
  if (!got.ok) return fail(got.reason, got.status, source);
  // A JSON null is neither a corpus nor an absence. The single-file readers threw on it (they read
  // `cards` of null), and the paid-delivery harness pins that an evidence purchase rejects before any
  // payment step on it ("null response body"), so it still throws here.
  if (got.body === null) throw new TypeError("the cards bundle body is JSON null");
  // Other JSON that is not an object carries no cards object; it is passed on as such, like the 0.1 read.
  const index: Record<string, unknown> = isObject(got.body) ? got.body : {};
  const as_of = typeof index.as_of === "string" ? index.as_of : null;
  const merkle_root = typeof index.merkle_root === "string" ? index.merkle_root : null;
  const split = index.schema === "csoai.cards-bundle/0.2" || index.cards_scope === "root" || index.shards !== undefined;

  if (!split) {
    // The whole 0.1 file: `cards` is every wrapper. A body without a cards object is passed on as
    // such (cards_object false), so each caller keeps its own rule for what that establishes.
    const cards: Record<string, BundleWrapper> = {};
    const cards_object = isObject(index.cards);
    if (cards_object) keepAll(cards, index.cards as Record<string, unknown>, opts.keep);
    return { ok: true, reason: null, status: null, source, failed: null, as_of, merkle_root, layout: "whole", cards_object, cards, shards_read: 0 };
  }

  // The split index's own `cards` is the root only, so it is never used as the corpus here.
  const entries = shardEntries(index);
  if (typeof entries === "string") return fail(entries, null, source);

  const cards: Record<string, BundleWrapper> = {};
  const pending: (Promise<Got> | null)[] = [];
  let next = 0;
  const launch = () => {
    if (next < entries.length) {
      const i = next++;
      const read = getJson(new URL(entries[i].path, origin).toString());
      // A read this loop stops waiting for (an earlier shard failed) must not surface as an
      // unhandled rejection; the read it does wait for still throws to the caller below.
      read.catch(() => undefined);
      pending[i] = read;
    }
  };
  for (let k = 0; k < Math.min(SHARD_CONCURRENCY, entries.length); k++) launch();
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const url = new URL(entry.path, origin).toString();
    const r = await (pending[i] as Promise<Got>);
    pending[i] = null;
    if (!r.ok) return fail(`shard ${entry.path} ${r.reason}`, r.status, url, i);
    const shard = r.body;
    const shardCards = isObject(shard) && isObject(shard.cards) ? (shard.cards as Record<string, unknown>) : null;
    if (!isObject(shard) || !shardCards) return fail(`shard ${entry.path} carries no cards object`, null, url, i);
    const keys = Object.keys(shardCards);
    const mismatch =
      shard.prefix !== entry.prefix ? "prefix" :
      shard.as_of !== index.as_of ? "as_of" :
      shard.merkle_root !== index.merkle_root ? "merkle_root" :
      keys.length !== entry.card_count ? "card_count" :
      keys.some((k) => !k.startsWith(entry.prefix)) ? "a key outside its prefix" : null;
    if (mismatch) return fail(`shard ${entry.path} does not match the index (${mismatch})`, null, url, i);
    keepAll(cards, shardCards, opts.keep);
    launch();
  }
  return { ok: true, reason: null, status: null, source, failed: null, as_of, merkle_root, layout: "sharded", cards_object: true, cards, shards_read: entries.length };
}
