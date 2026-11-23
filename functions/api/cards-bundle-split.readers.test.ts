// Every reader of /cards-bundle.json answers the SAME bytes from the split layout (index + 16
// shards, csoai.cards-bundle/0.2) as from the single 0.1 file it replaced, and fails closed when a
// shard is missing. The split fixture is written by the producer's own layout code.
import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildBundleFiles } from "../../scripts/cards-bundle-shards.mjs";
import { onRequestGet as evidenceBundle } from "./evidence-bundle";
import { onRequestGet as receiptsBatch } from "./receipts/batch";
import { onRequestGet as rwaEvidence } from "./rwa/evidence";
import { onRequestGet as xrpl } from "./xrpl";
import { onRequestGet as proof } from "./proof";

const ORIGIN = "https://councilof.ai";
const AS_OF = "2026-11-21T23:11:50Z";
const H = (s: string) => createHash("sha256").update(s).digest("hex");
const MERKLE = H("root");
afterEach(() => vi.unstubAllGlobals());

type Wrapper = { card: Record<string, unknown>; proof: string[] };

function corpus() {
  const cards: Record<string, Wrapper> = {};
  const onRoot: string[] = [];
  const add = (key: string, card: Record<string, unknown>, root: boolean) => {
    const sha = H(key);
    cards[sha] = { card: { sha256: sha, did: "did:web:csoai.org#board-attestation-1", sig_ed25519: "ab".repeat(64), unmeasured: [], ...card }, proof: [H(`${key}-sib`)] };
    if (root) onRoot.push(sha);
  };
  // The locked 16 xrpl.asset.state leaves on the root, and 5 older ones that only the shards hold.
  for (let i = 0; i < 16; i++) add(`xrpl-${i}`, { surface: "xrpl.asset.state", subject: `XRPL TK${i}`, as_of: `2026-11-${String(1 + i).padStart(2, "0")}T00:00:00Z`, payload: { symbol: `TK${i}`, issuer: `Issuer ${i}`, issuer_address: `r${"x".repeat(24)}${String(i).padStart(9, "0")}`, kind: "distributed" } }, true);
  for (let i = 0; i < 5; i++) add(`xrpl-old-${i}`, { surface: "xrpl.asset.state", subject: `XRPL OLD${i}`, as_of: `2026-10-${String(10 + i)}T00:00:00Z`, payload: { symbol: `OLD${i}`, issuer: `Old issuer ${i}` } }, false);
  // Article 50 / 53 relevant notices: some on the root, most only in the shards.
  for (let i = 0; i < 30; i++) add(`notice-${i}`, { surface: "public.notice", subject: i % 2 ? `provider model card change ${i}` : `c2pa provenance marking ${i}`, tags: i % 3 ? ["gpai", "provider-diff"] : ["art50"], as_of: `2026-11-${String(1 + (i % 21)).padStart(2, "0")}T12:00:00Z` }, i < 6);
  // Unsigned and malformed leaves the readers must keep ignoring.
  for (let i = 0; i < 4; i++) add(`unsigned-${i}`, { surface: "public.notice", subject: `provenance unsigned ${i}`, sig_ed25519: null, as_of: "2026-11-05T00:00:00Z" }, false);
  add("no-as-of", { surface: "broken" }, false);
  const root = { as_of: AS_OF, merkle_root: MERKLE, card_count: onRoot.length, card_sha256: onRoot };
  return { cards, root };
}

const { cards, root } = corpus();
const sortedCards = Object.fromEntries(Object.keys(cards).sort().map((k) => [k, cards[k]]));
const WHOLE: Record<string, string> = {
  "/cards-bundle.json": JSON.stringify({ schema: "csoai.cards-bundle/0.1", as_of: AS_OF, merkle_root: MERKLE, card_count: Object.keys(cards).length, root_card_count: root.card_sha256.length, cards: sortedCards }),
};
const built = buildBundleFiles({ root, cards });
const SPLIT: Record<string, string> = { "/cards-bundle.json": built.index.text };
for (const s of built.shards) SPLIT[s.path] = s.text;
const COMMON: Record<string, string> = {
  "/root.json": JSON.stringify(root),
  "/receipts/root-history.json": JSON.stringify({ roots: [{ as_of: AS_OF, merkle_root: MERKLE, card_count: root.card_count, card_sha256: root.card_sha256, sig_ed25519: "rs", did_intended: "did:web:csoai.org#board-attestation-1", commit: null }] }),
};

function serve(layout: Record<string, string>, drop: string | null = null) {
  const reads: string[] = [];
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    reads.push(url.pathname);
    if (url.origin === ORIGIN && url.pathname !== drop) {
      const text = layout[url.pathname] ?? COMMON[url.pathname];
      if (text !== undefined) return new Response(text, { headers: { "content-type": "application/json" } });
    }
    // /api/xrpl is down on purpose, so /api/rwa/evidence takes its bundle fallback;
    // /proofs and /cards (HF redirects) are absent, so /api/proof takes its bundle fallback.
    return new Response("not here", { status: url.pathname === "/api/xrpl" ? 503 : 404 });
  }));
  return reads;
}
const ctx = (path: string) => ({ request: new Request(ORIGIN + path), env: {}, params: {} }) as never;

const READERS: [string, string, (c: never) => Promise<Response>][] = [
  ["evidence-bundle preview, article-50", "/api/evidence-bundle?obligation=article-50", evidenceBundle as never],
  ["evidence-bundle preview, article-53 with a subject", "/api/evidence-bundle?obligation=article-53&subject=provider", evidenceBundle as never],
  ["evidence-bundle procurement view", "/api/evidence-bundle?obligation=article-53&format=procurement", evidenceBundle as never],
  ["receipts batch preview, whole window", "/api/receipts/batch?from=2026-10-01T00:00:00Z&to=2026-11-30T00:00:00Z&preview=1", receiptsBatch as never],
  ["receipts batch preview, narrow window", "/api/receipts/batch?from=2026-11-03T00:00:00Z&to=2026-11-04T23:59:59Z&preview=1", receiptsBatch as never],
  ["rwa evidence, reader down, bundle fallback", "/api/rwa/evidence?asset=NOPE&preview=1", rwaEvidence as never],
  ["xrpl reader", "/api/xrpl", xrpl as never],
  ["proof, one free inclusion via the bundle fallback", `/api/proof?sha=${root.card_sha256[3]}`, proof as never],
];

describe("every /cards-bundle.json reader answers the same from the split layout", () => {
  it.each(READERS)("%s", async (_name, path, handler) => {
    serve(WHOLE);
    const before = await handler(ctx(path));
    const beforeText = await before.text();
    const splitReads = serve(SPLIT);
    const after = await handler(ctx(path));
    const afterText = await after.text();
    expect(after.status).toBe(before.status);
    expect(afterText).toBe(beforeText);
    // The readers that need every wrapper read all 16 shards; the root readers read the index only.
    const shardReads = splitReads.filter((p) => p.startsWith("/cards-bundle/")).length;
    expect(shardReads).toBe(/\/api\/(xrpl|proof)/.test(path) ? 0 : 16);
  });

  it("the fixtures really exercise the history: the fallback lists symbols that only the shards hold", async () => {
    serve(SPLIT);
    const r = await rwaEvidence(ctx("/api/rwa/evidence?asset=NOPE&preview=1") as never);
    const body = await r.json();
    expect(r.status).toBe(404);
    expect(body.known_symbols).toEqual(expect.arrayContaining(["TK0", "TK15", "OLD0", "OLD4"]));
    const ev = await (evidenceBundle as never as (c: never) => Promise<Response>)(ctx("/api/evidence-bundle?obligation=article-50"));
    const preview = await ev.json();
    // 30 relevance-tested notices, only 6 on the root: the count must come from the shards.
    expect(preview.corpus.signed_cards_total).toBe(Object.values(cards).filter((w) => w.card.sha256 && w.card.sig_ed25519).length);
    expect(preview.corpus.read_from).toBe(`${ORIGIN}/cards-bundle.json`);
  });

  it("the xrpl and proof readers answer from the index alone: it holds every wrapper on the root", async () => {
    serve(SPLIT);
    const x = await xrpl(ctx("/api/xrpl") as never);
    expect(x.status).toBe(200);
    expect((await x.json()).n).toBe(16);
  });
});

describe("a missing shard fails closed: no reader reports half the corpus as the whole", () => {
  it("evidence-bundle answers UNCHECKABLE, never an empty or partial selection", async () => {
    serve(SPLIT, "/cards-bundle/7.json");
    const r = await (evidenceBundle as never as (c: never) => Promise<Response>)(ctx("/api/evidence-bundle?obligation=article-50"));
    const body = await r.json();
    expect(r.status).toBe(503);
    expect(body.status).toBe("UNCHECKABLE");
    expect(body.relevant_signed_cards).toBeNull();
    expect(body.corpus.read_from).toBe(`${ORIGIN}/cards-bundle/7.json shard /cards-bundle/7.json HTTP 404`);
  });

  it("receipts batch answers 404 naming the shard, before any batch is assembled", async () => {
    serve(SPLIT, "/cards-bundle/7.json");
    const r = await (receiptsBatch as never as (c: never) => Promise<Response>)(ctx("/api/receipts/batch?from=2026-10-01T00:00:00Z&to=2026-11-30T00:00:00Z&preview=1"));
    const body = await r.json();
    expect(r.status).toBe(404);
    expect(body.reason).toBe("static /cards-bundle.json shard /cards-bundle/7.json HTTP 404");
    expect(body.unmeasured).toEqual(["cards-bundle.json"]);
  });

  it("the rwa fallback answers nothing rather than a partial symbol list", async () => {
    serve(SPLIT, "/cards-bundle/7.json");
    const r = await (rwaEvidence as never as (c: never) => Promise<Response>)(ctx("/api/rwa/evidence?asset=NOPE&preview=1"));
    const body = await r.json();
    expect(body.known_symbols ?? []).toEqual([]);
  });
});
