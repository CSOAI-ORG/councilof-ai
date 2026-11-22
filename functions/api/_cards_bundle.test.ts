// readCardsBundle reads the split bundle as one corpus and never returns a silent subset.
// The fixtures are written by the real producer's layout code (scripts/cards-bundle-shards.mjs).
import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildBundleFiles } from "../../scripts/cards-bundle-shards.mjs";
import { readCardsBundle, SHARD_CONCURRENCY } from "./_cards_bundle";

const ORIGIN = "https://councilof.ai";
const sha = (n: number) => createHash("sha256").update(`loader-${n}`).digest("hex");
afterEach(() => vi.unstubAllGlobals());

function corpus(n = 48) {
  const cards: Record<string, { card: Record<string, unknown>; proof: string[] }> = {};
  for (let i = 0; i < n; i++) {
    const h = sha(i);
    cards[h] = { card: { sha256: h, surface: i % 4 ? "public.notice" : "xrpl.asset.state", as_of: "2026-11-20T00:00:00Z", sig_ed25519: i % 5 ? "aa" : null }, proof: [] };
  }
  const keys = Object.keys(cards);
  const root = { as_of: "2026-11-21T23:11:50Z", merkle_root: sha(999), card_sha256: keys.slice(0, 10) };
  return { root, cards };
}
const sorted = <T>(o: Record<string, T>) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));

/** Serve the split layout; `edit` may rewrite or drop any served path. */
function serveSplit(edit: (path: string, text: string) => string | null = (_p, t) => t) {
  const { root, cards } = corpus();
  const built = buildBundleFiles({ root, cards });
  const files: Record<string, string> = { [built.index.path]: built.index.text };
  for (const s of built.shards) files[s.path] = s.text;
  const reads: string[] = [];
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    reads.push(url.pathname);
    const text = url.pathname in files ? edit(url.pathname, files[url.pathname]) : null;
    return text === null ? new Response("missing", { status: 404 }) : new Response(text, { headers: { "content-type": "application/json" } });
  }));
  return { reads, cards, built };
}

describe("readCardsBundle — the split layout (csoai.cards-bundle/0.2)", () => {
  it("reads the index and every listed shard, 17 fetches, and returns the whole corpus in sha256 order", async () => {
    const { reads, cards } = serveSplit();
    const r = await readCardsBundle(ORIGIN);
    expect(r.ok).toBe(true);
    expect(r.layout).toBe("sharded");
    expect(r.cards_object).toBe(true);
    expect(r.shards_read).toBe(16);
    expect(reads).toEqual(["/cards-bundle.json", ..."0123456789abcdef".split("").map((c) => `/cards-bundle/${c}.json`)]);
    expect(Object.keys(r.cards)).toEqual(Object.keys(sorted(cards)));
    expect(r.cards).toEqual(sorted(cards));
    expect(r.source).toBe(`${ORIGIN}/cards-bundle.json`);
    expect([r.as_of, r.merkle_root]).toEqual(["2026-11-21T23:11:50Z", sha(999)]);
  });

  it("keep drops what the caller does not need, and the order is still sha256 order", async () => {
    const { cards } = serveSplit();
    const r = await readCardsBundle(ORIGIN, { keep: (_s, w) => w.card?.surface === "xrpl.asset.state" });
    const want = Object.keys(sorted(cards)).filter((k) => cards[k].card.surface === "xrpl.asset.state");
    expect(Object.keys(r.cards)).toEqual(want);
  });

  it("never holds more than SHARD_CONCURRENCY shard reads in flight", async () => {
    const { built } = serveSplit();
    const files: Record<string, string> = { [built.index.path]: built.index.text };
    for (const s of built.shards) files[s.path] = s.text;
    let inFlight = 0;
    let peak = 0;
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const path = new URL(String(input)).pathname;
      const shard = path !== "/cards-bundle.json";
      if (shard) peak = Math.max(peak, ++inFlight);
      await new Promise((res) => setTimeout(res, 2));
      if (shard) inFlight--;
      return new Response(files[path]);
    }));
    const r = await readCardsBundle(ORIGIN);
    expect(r.ok).toBe(true);
    expect(peak).toBeGreaterThan(1);
    expect(peak).toBeLessThanOrEqual(SHARD_CONCURRENCY);
  });

  it.each([
    ["a shard is missing", (p: string, t: string) => (p === "/cards-bundle/7.json" ? null : t), /^shard \/cards-bundle\/7\.json HTTP 404$/],
    ["a shard is from another build (as_of)", (p: string, t: string) => (p === "/cards-bundle/a.json" ? t.replace("2026-11-21T23:11:50Z", "2026-11-20T00:00:00Z") : t), /\(as_of\)$/],
    ["a shard lost a wrapper (card_count)", (p: string, t: string) => {
      if (p !== "/cards-bundle/5.json") return t;
      const s = JSON.parse(t);
      delete s.cards[Object.keys(s.cards)[0]];
      return JSON.stringify(s);
    }, /\(card_count\)$/],
    ["a shard holds a key outside its prefix", (p: string, t: string) => {
      if (p !== "/cards-bundle/0.json") return t;
      const s = JSON.parse(t);
      const k = Object.keys(s.cards)[0];
      s.cards["f" + k.slice(1)] = s.cards[k];
      delete s.cards[k];
      return JSON.stringify(s);
    }, /a key outside its prefix\)$/],
    ["a shard names another prefix", (p: string, t: string) => (p === "/cards-bundle/c.json" ? t.replace('"prefix":"c"', '"prefix":"d"') : t), /\(prefix\)$/],
    ["the index lists no shards", (p: string, t: string) => {
      if (p !== "/cards-bundle.json") return t;
      const s = JSON.parse(t);
      delete s.shards;
      return JSON.stringify(s);
    }, /^the split index lists no shards$/],
    ["the shard counts do not add up to card_count", (p: string, t: string) => {
      if (p !== "/cards-bundle.json") return t;
      const s = JSON.parse(t);
      s.card_count += 1;
      return JSON.stringify(s);
    }, /but the index says card_count/],
  ])("fails closed, with no cards at all, when %s", async (_name, edit, reason) => {
    serveSplit(edit);
    const r = await readCardsBundle(ORIGIN);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(reason);
    expect(r.cards).toEqual({});
    expect([r.as_of, r.merkle_root]).toEqual([null, null]);
  });

  it("a shard whose bytes are not JSON throws, as the index always did: an exception is never an answer", async () => {
    serveSplit((p, t) => (p === "/cards-bundle/3.json" ? "{" : t));
    await expect(readCardsBundle(ORIGIN)).rejects.toThrow();
  });

  it("a shard read that throws propagates, and an abandoned in-flight read raises no unhandled rejection", async () => {
    const { built } = serveSplit();
    const files: Record<string, string> = { [built.index.path]: built.index.text };
    for (const s of built.shards) files[s.path] = s.text;
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const path = new URL(String(input)).pathname;
      if (path === "/cards-bundle/0.json") return new Response("gone", { status: 404 });
      if (path === "/cards-bundle/2.json") throw new Error("network unavailable");
      return new Response(files[path]);
    }));
    // Shard 0 fails first (a result); shard 2's throw happens while nobody awaits it any more.
    const r = await readCardsBundle(ORIGIN);
    expect(r).toMatchObject({ ok: false, reason: "shard /cards-bundle/0.json HTTP 404" });
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const path = new URL(String(input)).pathname;
      if (path === "/cards-bundle/0.json") throw new Error("network unavailable");
      return new Response(files[path]);
    }));
    await expect(readCardsBundle(ORIGIN)).rejects.toThrow("network unavailable");
  });

  it("the index's own root-scope cards are never mistaken for the corpus", async () => {
    // Even if every shard vanished, the index's `cards` (the root only) must not be returned.
    serveSplit((p, t) => (p === "/cards-bundle.json" ? t : null));
    const r = await readCardsBundle(ORIGIN);
    expect(r.ok).toBe(false);
    expect(r.failed).toBe(`${ORIGIN}/cards-bundle/0.json`);
  });
});

describe("readCardsBundle — the whole 0.1 file", () => {
  it("is still read as it was: one fetch, every wrapper", async () => {
    const { cards } = corpus(6);
    const reads: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      reads.push(String(input));
      return Response.json({ schema: "csoai.cards-bundle/0.1", as_of: "a", merkle_root: "m", cards });
    }));
    const r = await readCardsBundle(ORIGIN);
    expect(reads).toEqual([`${ORIGIN}/cards-bundle.json`]);
    expect(r).toMatchObject({ ok: true, layout: "whole", cards_object: true, as_of: "a", merkle_root: "m", shards_read: 0 });
    expect(r.cards).toEqual(cards);
  });

  it("a body without a cards object is passed on as such; an HTTP failure is not ok; a throw propagates", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ as_of: "a", merkle_root: "m" })));
    expect(await readCardsBundle(ORIGIN)).toMatchObject({ ok: true, cards_object: false, cards: {}, as_of: "a" });
    vi.stubGlobal("fetch", vi.fn(async () => Response.json([])));
    expect(await readCardsBundle(ORIGIN)).toMatchObject({ ok: true, layout: "whole", cards_object: false, cards: {} });
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(null)));
    await expect(readCardsBundle(ORIGIN)).rejects.toThrow(/JSON null/);
    vi.stubGlobal("fetch", vi.fn(async () => new Response("down", { status: 503 })));
    expect(await readCardsBundle(ORIGIN)).toMatchObject({ ok: false, status: 503, reason: "HTTP 503", failed: `${ORIGIN}/cards-bundle.json` });
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    await expect(readCardsBundle(ORIGIN)).rejects.toThrow("offline");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{", { status: 200 })));
    await expect(readCardsBundle(ORIGIN)).rejects.toThrow();
  });
});
