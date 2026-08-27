/**
 * The guard that keeps /blog honest.
 *
 * The index previously rendered seven hardcoded, fictional posts and linked to
 * none of them, while 48 real articles were live under /blog/<slug> and
 * unreachable. This renders the actual page and checks the only thing that
 * matters: every link on it resolves to a slug the /blog/:slug route can serve,
 * and every article in the dataset is reachable from the index.
 *
 * The one permitted exception is REDIRECTED_AWAY — six slugs that public/_redirects
 * 308s back to /blog, so linking them would advertise a destination that bounces.
 * That exception is itself tested below against the redirect file, so it cannot
 * quietly become a way to drop an article somebody would rather not publish.
 */

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import Blog from "./Blog";
import { blogdata } from "../data/blog-content";
import { REDIRECTED_AWAY } from "../lib/blogIndex";
import { readFileSync } from "node:fs";

/** Articles that must be reachable: everything except the ones whose URL redirects away. */
const expectedSlugs = blogdata.map((e) => e.slug).filter((s) => !REDIRECTED_AWAY.has(s));

const html = renderToStaticMarkup(
  <Router ssrPath="/blog">
    <Blog />
  </Router>,
);

const linkedSlugs = [...html.matchAll(/href="\/blog\/([^"#?]+)"/g)].map((m) => m[1]);
const knownSlugs = new Set(blogdata.map((e) => e.slug));

describe("/blog index", () => {
  it("renders a link for every article", () => {
    expect(linkedSlugs.length).toBeGreaterThan(0);
    expect(blogdata.length).toBeGreaterThan(0);
  });

  it("every card on the page resolves to a slug present in blogdata", () => {
    const unresolved = [...new Set(linkedSlugs)].filter((slug) => !knownSlugs.has(slug));
    expect(unresolved).toEqual([]);
  });

  it("leaves no reachable article in blogdata unreachable from the index", () => {
    const linked = new Set(linkedSlugs);
    const orphaned = expectedSlugs.filter((slug) => !linked.has(slug));
    expect(orphaned).toEqual([]);
  });

  it("withholds only slugs the redirect table really sends away", () => {
    // The exclusion list is not editorial. Every slug on it must be provably
    // unreachable in public/_redirects; if a redirect is lifted, this test fails
    // and the article goes back on the index.
    const redirects = readFileSync("public/_redirects", "utf8");
    const notActuallyRedirected = [...REDIRECTED_AWAY].filter(
      (slug) => !new RegExp(`^/blog/${slug}\\s`, "m").test(redirects),
    );
    expect(notActuallyRedirected).toEqual([]);
  });

  it("links none of the redirected-away slugs", () => {
    const bounced = [...new Set(linkedSlugs)].filter((slug) => REDIRECTED_AWAY.has(slug));
    expect(bounced).toEqual([]);
  });

  it("renders exactly one card per article", () => {
    // The featured post carries two links to the same slug (its heading and its
    // 'Read Article' CTA); every other article is linked exactly once.
    const counts = new Map<string, number>();
    for (const slug of linkedSlugs) counts.set(slug, (counts.get(slug) ?? 0) + 1);
    expect(counts.size).toBe(expectedSlugs.length);
    const doubled = [...counts].filter(([, n]) => n > 1);
    expect(doubled.length).toBeLessThanOrEqual(1);
  });

  it("points the featured 'Read Article' CTA at a real article", () => {
    const cta = /href="\/blog\/([^"]+)"[^>]*>\s*<button[^>]*>\s*Read Article/.exec(html);
    expect(cta, "the featured CTA must be wrapped in a link").not.toBeNull();
    expect(knownSlugs.has(cta![1])).toBe(true);
  });

  it("carries no trace of the hardcoded placeholder posts", () => {
    expect(html).not.toContain("EU AI Act: What Enterprises Need to Know for 2025 Compliance");
    expect(html).not.toContain("Watchdog Program: Join Our Global Network");
    // Every placeholder date was 2024/2025; every real post is dated 2026.
    expect(html).not.toMatch(/\b(?:Nov|Dec|Jan) \d{1,2}, 202[45]\b/);
  });
});
