/**
 * The two return paths, tested for the properties that actually matter.
 *
 * The feed already existed and was good; what was broken was that nothing could find it. So the
 * assertions here are about IDENTITY and DISCOVERABILITY, not about feed content:
 *   · /feed.xml and /rss.xml must be byte-identical to /api/feed.xml — one canonical feed with
 *     conventional aliases, never a second engine that could drift from it.
 *   · the badge page must carry its snippets in the RESPONSE BODY, because the React page at
 *     /badge renders 57KB of shell with no snippet in the served HTML, which is invisible to a
 *     crawler and uncopyable by a reader.
 *   · no surface here may offer a "certified" badge.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet as canonicalFeed } from "./api/feed.xml";
import { onRequestGet as aliasFeed } from "./feed.xml";
import { onRequestGet as canonicalCorrections } from "./feeds/corrections.xml";
import { onRequestGet as aliasCorrections } from "./corrections.xml";
import { onRequestGet as aliasRss } from "./rss.xml";
import { onRequestGet as aliasAtom } from "./atom.xml";
import { onRequestGet as badgeMd } from "./badge.md";

const ctx = { request: new Request("https://councilof.ai/feed.xml") } as never;
const offlineFeedSources = () =>
  vi.stubGlobal("fetch", async () => new Response("not found", { status: 404 }));
afterEach(() => vi.unstubAllGlobals());

describe("/feed.xml, /rss.xml, and /atom.xml — aliases, not a second engine", () => {
  it("all conventional aliases are the very same handler as the canonical feed", () => {
    // Identity, not equality: a copied implementation could pass a content check and still drift.
    expect(aliasFeed).toBe(canonicalFeed);
    expect(aliasRss).toBe(canonicalFeed);
    expect(aliasAtom).toBe(canonicalFeed);
  });

  it("the aliases serve byte-identical RSS to the canonical route", async () => {
    offlineFeedSources();
    const [a, b, c] = await Promise.all([
      (await aliasFeed(ctx)).text(),
      (await canonicalFeed(ctx)).text(),
      (await aliasAtom(ctx)).text(),
    ]);
    expect(a).toBe(b);
    expect(c).toBe(b);
    expect(a).toMatch(/^<\?xml version="1\.0"/);
    expect(a).toContain("<rss");
    expect(a).toContain("<item>");
  });

  it("serves an RSS content type", async () => {
    offlineFeedSources();
    const res = await aliasFeed(ctx);
    expect(res.headers.get("content-type") ?? "").toMatch(/xml/i);
  });
});

describe("/corrections.xml — conventional alias of the derived corrections feed", () => {
  it("returns byte-identical XML and headers", async () => {
    const [canonical, alias] = await Promise.all([
      canonicalCorrections({} as never),
      aliasCorrections({} as never),
    ]);
    expect(alias.status).toBe(canonical.status);
    expect(alias.headers.get("content-type")).toBe(canonical.headers.get("content-type"));
    expect(await alias.text()).toBe(await canonical.text());
  });
});

describe("/badge.md — the snippets are in the body, which is the whole point", () => {
  it("carries paste-ready markdown in the response body", async () => {
    const body = await (await badgeMd()).text();
    // The exact thing /badge fails to do: ship a copyable snippet in the served bytes.
    expect(body).toContain("![GSPC](https://councilof.ai/api/badge)");
    expect(body).toContain("?axis=governance");
    expect(body).toContain("```markdown");
  });

  it("hard-codes no board count, so a pasted badge cannot drift into a false claim", async () => {
    const body = await (await badgeMd()).text();
    // A digit-pair like "22 axis" or "n=237" frozen into the page is the failure mode.
    expect(body).not.toMatch(/\b\d+\s+axis\s+·\s+\d+\s+measured\b/);
    expect(body).not.toMatch(/\bn=\d+/);
  });

  it("offers no certified badge, and says unmeasured renders as unmeasured", async () => {
    const body = await (await badgeMd()).text();
    expect(body.toLowerCase()).not.toMatch(/\bcertified badge\b|\bapproved badge\b/);
    expect(body).toMatch(/no "certified" badge/i);
    expect(body).toMatch(/unmeasured/);
  });

  it("is served as markdown, not as an HTML shell", async () => {
    const res = await badgeMd();
    expect(res.headers.get("content-type") ?? "").toMatch(/text\/markdown/);
  });
});

describe("every axis on the board points at its published bank", () => {
  it("every MEASURED axis carries a dataset slug — no dead ends on a measured slot", async () => {
    const { AXES_FIN } = await import("./api/_gspc_axes_fin");
    const { AXES_C } = await import("./api/_gspc_axes_c");
    const a = await import("./api/_gspc_axes_a");
    const b = await import("./api/_gspc_axes_b");
    const all = [
      ...Object.values(a).flat(),
      ...Object.values(b).flat(),
      ...AXES_C,
      ...AXES_FIN,
    ].filter(
      (x): x is { axis: string; dataset?: string; status?: string; kind?: string } =>
        !!x && typeof x === "object" && "axis" in x,
    );

    // ADR-002: a DECLARED slot has no bank, and minting a slug for a bank that does
    // not exist would publish a dataset_url that 404s — the dead end this test is
    // against, only worse, because it looks resolvable. The invariant is therefore
    // over MEASURED slots, which is what the rationale below always said.
    // 2026-09-22: effect-binding moved to deterministic-facts / MEASURED (n = 261 servers, signed
    // run) — so the board carries no declared slot today. The invariant is kept as a rule, not a
    // fixed list: any future declared slot must be UNMEASURED, and a MEASURED slot must lead
    // somewhere — a bank slug or an evidence_url to its run — never a dead end.
    for (const x of all.filter((x) => x.kind === "declared-slot")) expect(x.status).toBe("UNMEASURED");
    const missing = all
      .filter((x) => x.status === "MEASURED" && !x.dataset && !(x as { evidence_url?: string }).evidence_url)
      .map((x) => x.axis);
    // Eight financial axes had no dataset link, so a reader on the board could not reach the
    // bank behind them even though all eight repos were public. A dead end on a measured slot
    // is the cheapest kind of lost reader.
    expect(missing).toEqual([]);
    expect(all.length).toBeGreaterThanOrEqual(22);
  });

  it("every dataset slug is a bare owner/name — a prose slug mints a URL that 404s", async () => {
    const { AXES_FIN } = await import("./api/_gspc_axes_fin");
    for (const ax of AXES_FIN) {
      expect(ax.dataset, ax.axis).toMatch(/^[A-Za-z0-9][\w.-]*\/[A-Za-z0-9][\w.-]*$/);
    }
  });
});
