// A partial read must never be published as a population total.
//
// On 2026-09-05 this endpoint served `{measured: 647, unmeasured: 35, cells: 682}`
// while two of its four indexes were answering nothing. Both dark indexes held
// ONLY UNMEASURED rows (INDEX-safety 11, INDEX-art5-affect 24), so the true
// published population was 717 cells / 647 MEASURED / 70 UNMEASURED. The endpoint
// halved the unmeasured count — the error ran in the flattering direction, which
// is the one direction a measurement body may never round.
//
// A subtotal presented as a total is an invented number. These tests hold the
// line: when an index is unread the totals are withheld, not estimated.

import { afterEach, describe, expect, it, vi } from "vitest";

import { onRequestGet } from "./hub-cards";

const HUB =
  "https://huggingface.co/datasets/csoai/gspc-hub-cards/resolve/main/mill-cards";

const row = (model: string, axis: string, status: string) =>
  JSON.stringify({ model, axis, status, accuracy: 0.5, n: 30, signed: true });

// The real shape as of 2026-09-05: INDEX carries the MEASURED mass, the three
// satellite indexes carry UNMEASURED rows only.
const FILES: Record<string, string> = {
  INDEX: [row("a/one", "governance", "MEASURED"), row("a/two", "care", "MEASURED")].join("\n"),
  "INDEX-safety": [row("a/three", "safety", "UNMEASURED")].join("\n"),
  "INDEX-art5-affect": [row("a/four", "affect", "UNMEASURED")].join("\n"),
  "INDEX-empty3": [row("a/five", "openness", "UNMEASURED")].join("\n"),
};

/** Serve every index, except those named in `broken`, which answer `status`. */
const installFetch = (broken: string[] = [], status = 500) => {
  const calls: string[] = [];
  const mocked = vi.fn(async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    calls.push(url);
    const name = url.slice(HUB.length + 1).replace(/\.jsonl$/, "");
    if (broken.includes(name)) return new Response("upstream said no", { status });
    return new Response(FILES[name] ?? "", { status: 200 });
  });
  vi.stubGlobal("fetch", mocked);
  return calls;
};

const invoke = async () => {
  const res = await onRequestGet({} as never);
  return { res, body: (await res.json()) as Record<string, never> };
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("/api/hub-cards", () => {
  it("publishes totals only when every index answered", async () => {
    installFetch([]);
    const { res, body } = await invoke();
    const counts = body.counts as unknown as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(counts.complete).toBe(true);
    expect(counts.cells).toBe(5);
    expect(counts.measured).toBe(2);
    expect(counts.unmeasured).toBe(3);
    expect(counts.indexes_unread).toEqual([]);
  });

  // THE DEFECT. Without the patch this returns unmeasured: 1 — a number, and the
  // wrong one, because the two indexes holding the other UNMEASURED rows are dark.
  it("withholds every total when an index did not answer", async () => {
    installFetch(["INDEX-safety", "INDEX-art5-affect"]);
    const { body } = await invoke();
    const counts = body.counts as unknown as Record<string, unknown>;

    expect(counts.complete).toBe(false);
    // A subtotal is not a total. Nothing quotable may survive a partial read.
    expect(counts.cells).toBeNull();
    expect(counts.measured).toBeNull();
    expect(counts.unmeasured).toBeNull();
    // What it did see is still available — under a name that cannot be misread.
    expect(counts.read_so_far).toMatchObject({ measured: 2, unmeasured: 1, cells: 3 });
  });

  it("names each unread index and why, so absence is never reported as zero", async () => {
    installFetch(["INDEX-safety"], 429);
    const { body } = await invoke();
    const counts = body.counts as unknown as Record<string, unknown>;

    expect(counts.indexes_unread).toEqual([{ index: "INDEX-safety.jsonl", reason: "http 429" }]);
    expect(body.honesty as unknown as Record<string, string>).toMatchObject({
      unreachable_is_not_empty: expect.stringContaining("INDEX-safety.jsonl"),
    });
  });

  // An index that answers 200 with no rows has been READ. Counting it as unread
  // means a legitimately empty file permanently suppresses the totals.
  it("treats a reachable but empty index as read, not as missing", async () => {
    const calls = installFetch([]);
    FILES["INDEX-empty3"] = "";
    try {
      const { body } = await invoke();
      const counts = body.counts as unknown as Record<string, unknown>;
      expect(counts.complete).toBe(true);
      expect(counts.indexes_unread).toEqual([]);
      expect(counts.cells).toBe(4);
      expect(calls.length).toBeGreaterThan(0);
    } finally {
      FILES["INDEX-empty3"] = row("a/five", "openness", "UNMEASURED");
    }
  });

  // A failure cached by `cacheEverything` keeps an index dark for the whole TTL.
  // One retry outside the cache is what turns a transient throttle back into data.
  it("retries a failed index once outside the cache before calling it unread", async () => {
    let safetyAttempts = 0;
    const mocked = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const name = url.slice(HUB.length + 1).replace(/\.jsonl$/, "");
      if (name === "INDEX-safety") {
        safetyAttempts++;
        // First attempt fails; the retry must not carry the caching directive.
        if (safetyAttempts === 1) return new Response("throttled", { status: 429 });
        expect((init as { cf?: { cacheEverything?: boolean } } | undefined)?.cf?.cacheEverything)
          .not.toBe(true);
        return new Response(FILES[name], { status: 200 });
      }
      return new Response(FILES[name] ?? "", { status: 200 });
    });
    vi.stubGlobal("fetch", mocked);

    const { body } = await invoke();
    const counts = body.counts as unknown as Record<string, unknown>;

    expect(safetyAttempts).toBe(2);
    expect(counts.complete).toBe(true);
    expect(counts.unmeasured).toBe(3);
  });

  it("still refuses everything when no index answers", async () => {
    installFetch(["INDEX", "INDEX-safety", "INDEX-art5-affect", "INDEX-empty3"]);
    const { res, body } = await invoke();
    const counts = body.counts as unknown as Record<string, unknown>;

    expect(res.status).toBe(503);
    expect(counts.complete).toBe(false);
    expect(counts.cells).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// A card the ledger has replaced is not the live card.
//
// On 2026-09-05 this endpoint served 826 cells for 753 distinct (model, axis)
// pairs and reported 70 UNMEASURED. Every one of those 70 was a card
// SUPERSEDED.jsonl had already replaced — each had a MEASURED replacement in
// INDEX.jsonl for the same pair — so the live unmeasured count was ZERO. Only
// INDEX.jsonl is ever rebuilt; the three satellite indexes were written once and
// still list the pre-#1155 bodies. Passing a status through verbatim is only
// honest when it is the LIVE card's status.
// ---------------------------------------------------------------------------

const LEDGER = "https://councilof.ai/interop/mill-cards-signed/SUPERSEDED.jsonl";

const carded = (model: string, axis: string, status: string, sha: string) =>
  JSON.stringify({ model, axis, status, accuracy: 0.5, n: 30, signed: true, card_sha256: sha });

/** INDEX carries the live MEASURED card; a satellite still lists the superseded one. */
const STALE: Record<string, string> = {
  INDEX: carded("a/one", "safety", "MEASURED", "newsha"),
  "INDEX-safety": carded("a/one", "safety", "UNMEASURED", "oldsha"),
  "INDEX-art5-affect": "",
  "INDEX-empty3": "",
};

const installStale = (ledgerBody: string | null) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url === LEDGER) {
        return ledgerBody === null
          ? new Response("no", { status: 500 })
          : new Response(ledgerBody, { status: 200 });
      }
      const name = url.slice(HUB.length + 1).replace(/\.jsonl$/, "");
      return new Response(STALE[name] ?? "", { status: 200 });
    }),
  );
};

describe("/api/hub-cards — the live card, not every card ever signed", () => {
  it("drops a card the ledger has replaced and keeps its replacement's status", async () => {
    installStale(JSON.stringify({ superseded_id: "oldsha", by_id: "newsha" }));
    const { body } = await invoke();
    const counts = body.counts as unknown as Record<string, unknown>;
    // Without the ledger read this is {cells: 2, measured: 1, unmeasured: 1}.
    expect(counts.cells).toBe(1);
    expect(counts.measured).toBe(1);
    expect(counts.unmeasured).toBe(0);
    expect(counts.superseded_excluded).toBe(1);
    expect(counts.rows_served_by_indexes).toBe(2);
  });

  it("collapses a duplicate pair so one (model, axis) is one cell", async () => {
    // Nothing superseded: the two rows are both live, and they are the same pair.
    installStale("");
    const { body } = await invoke();
    const counts = body.counts as unknown as Record<string, unknown>;
    expect(counts.rows_served_by_indexes).toBe(2);
    expect(counts.cells).toBe(1);
    expect(counts.duplicates_collapsed).toBe(1);
  });

  it("an unreadable ledger is UNCHECKABLE, never an empty ledger", async () => {
    installStale(null);
    const { body } = await invoke();
    const counts = body.counts as unknown as Record<string, unknown>;
    const honesty = body.honesty as unknown as Record<string, string>;
    // null, not 0 — "I could not check" is not "nothing was superseded".
    expect(counts.superseded_excluded).toBeNull();
    expect(honesty.superseded_ledger).toMatch(/UNREADABLE/);
    expect(honesty.superseded_ledger).toMatch(/UPPER BOUND/);
  });
});

// ---------------------------------------------------------------------------
// The population is what the dataset publishes, not what this file remembers.
//
// `indexes_total: 4` was a literal. Reporting it beside `complete: true` claimed
// completeness over a list the CODE chose: a fifth published index would have been
// invisible while the endpoint still said "All published indexes were read."
// ---------------------------------------------------------------------------

const TREE = "https://huggingface.co/api/datasets/csoai/gspc-hub-cards/tree/main/mill-cards";

/** Serve a dataset listing (or fail it) plus one row per named index. */
const installDiscovery = (names: string[] | null) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url === TREE) {
        return names === null
          ? new Response("nope", { status: 503 })
          : new Response(
              JSON.stringify(names.map((n) => ({ type: "file", path: `mill-cards/${n}.jsonl` }))),
              { status: 200 },
            );
      }
      if (url.endsWith("SUPERSEDED.jsonl")) return new Response("", { status: 200 });
      const name = url.slice(HUB.length + 1).replace(/\.jsonl$/, "");
      return new Response(row(`m/${name}`, "governance", "MEASURED"), { status: 200 });
    }),
  );
};

describe("/api/hub-cards — the index list is discovered, not remembered", () => {
  it("reads a fifth index the code never knew about", async () => {
    installDiscovery(["INDEX", "INDEX-safety", "INDEX-art5-affect", "INDEX-empty3", "INDEX-brand-new"]);
    const { body } = await invoke();
    const counts = body.counts as unknown as Record<string, unknown>;
    expect(counts.indexes_total).toBe(5);
    expect(counts.indexes_discovered).toBe(true);
    expect(counts.cells).toBe(5); // one row per index, all distinct pairs
  });

  it("falls back to the known four when the listing fails, and says so", async () => {
    installDiscovery(null);
    const { body } = await invoke();
    const counts = body.counts as unknown as Record<string, unknown>;
    const honesty = body.honesty as unknown as Record<string, string>;
    expect(counts.indexes_total).toBe(4);
    expect(counts.indexes_discovered).toBe(false);
    expect(honesty.index_list_is).toMatch(/UNCHECKABLE/);
    // The census stays on the air: a listing hiccup did not touch the indexes.
    expect(counts.cells).toBe(4);
    expect(counts.complete).toBe(true);
  });

  it("an EMPTY listing is not a population of zero", async () => {
    installDiscovery([]);
    const { body } = await invoke();
    const counts = body.counts as unknown as Record<string, unknown>;
    // Trusting an empty listing would publish cells: 0 as a fact about the estate.
    expect(counts.indexes_discovered).toBe(false);
    expect(counts.indexes_total).toBe(4);
    expect(counts.cells).toBe(4);
  });
});
