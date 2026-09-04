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
import { describe, expect, it } from "vitest";
import { onRequestGet as canonicalFeed } from "./api/feed.xml";
import { onRequestGet as aliasFeed } from "./feed.xml";
import { onRequestGet as aliasRss } from "./rss.xml";
import { onRequestGet as badgeMd } from "./badge.md";

const ctx = {} as never;

describe("/feed.xml and /rss.xml — aliases, not a second engine", () => {
  it("both aliases are the very same handler as the canonical feed", () => {
    // Identity, not equality: a copied implementation could pass a content check and still drift.
    expect(aliasFeed).toBe(canonicalFeed);
    expect(aliasRss).toBe(canonicalFeed);
  });

  it("the alias serves byte-identical RSS to the canonical route", async () => {
    const [a, b] = await Promise.all([
      (await aliasFeed(ctx)).text(),
      (await canonicalFeed(ctx)).text(),
    ]);
    expect(a).toBe(b);
    expect(a).toMatch(/^<\?xml version="1\.0"/);
    expect(a).toContain("<rss");
    expect(a).toContain("<item>");
  });

  it("serves an RSS content type", async () => {
    const res = await aliasFeed(ctx);
    expect(res.headers.get("content-type") ?? "").toMatch(/xml/i);
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
