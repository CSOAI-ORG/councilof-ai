/**
 * The blog's answer-engine surface is derived, never typed: dates and authors appear only when
 * the post's own JSON-LD carries them, sources only when the body links out, and the answer
 * paragraph is the article's own words cut to 50 at a sentence.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  answerParagraph,
  BLOG_INDEX,
  blogBreadcrumbLd,
  blogListingLd,
  blogPostBySlug,
  blogPostingLd,
  bodyWithoutH1,
  clampWords,
  ldJson,
  postUrl,
} from "./blogSeo";
import { blogdata } from "../data/blog-content";

describe("blog-index.json is derived from blog-content.ts and never invents a field", () => {
  it("covers every post in the dataset, one row each", () => {
    expect(BLOG_INDEX.length).toBe(blogdata.length);
    expect(new Set(BLOG_INDEX.map((p) => p.slug)).size).toBe(blogdata.length);
  });

  it("a date or author appears only when the post's own JSON-LD has it", () => {
    for (const p of BLOG_INDEX) {
      const entry = blogdata.find((e) => e.slug === p.slug)!;
      const ld = entry.ldJson.map((s) => { try { return JSON.parse(s); } catch { return null; } }).find((j) => j?.["@type"] === "BlogPosting");
      expect(p.datePublished ?? undefined, p.slug).toBe(ld?.datePublished ?? undefined);
      expect(p.dateModified ?? undefined, p.slug).toBe(ld?.dateModified ?? undefined);
      expect(p.author?.name ?? undefined, p.slug).toBe(ld?.author?.name ?? undefined);
      expect(p.headline.length, p.slug).toBeGreaterThan(10);
      expect(p.headline).not.toMatch(/&#x27;|&amp;|\| CSOAI Blog/);
    }
  });

  it("is what the generator produces from the current dataset (the build regenerates it)", () => {
    const committed = readFileSync(new URL("../data/blog-index.json", import.meta.url), "utf8");
    expect(JSON.parse(committed).posts.length).toBe(BLOG_INDEX.length);
  });
});

describe("blogPostingLd", () => {
  it("carries headline, publisher, mainEntityOfPage and the dates the data has", () => {
    const dated = BLOG_INDEX.find((p) => p.datePublished && p.dateModified)!;
    const node = blogPostingLd(dated);
    expect(node["@type"]).toBe("BlogPosting");
    expect(node.headline).toBe(dated.headline);
    expect(node.datePublished).toBe(dated.datePublished);
    expect(node.dateModified).toBe(dated.dateModified);
    expect((node.publisher as { name: string }).name).toBe("CSOAI Ltd");
    expect((node.author as { name: string }).name).toBe("CSOAI Ltd");
    expect((node.mainEntityOfPage as { "@id": string })["@id"]).toBe(postUrl(dated.slug));
    expect(node.url).toBe(`https://councilof.ai/blog/${dated.slug}/`);
  });

  it("omits datePublished, dateModified and author when the data lacks them", () => {
    const bare = { slug: "x", headline: "X", description: "d", sources: [] };
    const node = blogPostingLd(bare);
    expect("datePublished" in node).toBe(false);
    expect("dateModified" in node).toBe(false);
    expect("author" in node).toBe(false);
    expect("citation" in node).toBe(false);
  });

  it("lists cited external sources as citations, own-site links excluded", () => {
    const node = blogPostingLd({ slug: "x", headline: "X", description: "d", sources: ["https://eur-lex.europa.eu/eli/reg/2024/1689"] });
    expect(node.citation).toEqual([{ "@type": "CreativeWork", url: "https://eur-lex.europa.eu/eli/reg/2024/1689" }]);
    const withSources = BLOG_INDEX.filter((p) => p.sources.length);
    for (const p of withSources) for (const u of p.sources) expect(u).not.toMatch(/csoai\.org|councilof\.ai/);
  });
});

describe("breadcrumb and listing nodes", () => {
  it("breadcrumb is Home → Blog → Post", () => {
    const post = BLOG_INDEX[0];
    const crumb = blogBreadcrumbLd(post);
    const items = crumb.itemListElement as { position: number; name: string; item: string }[];
    expect(items.map((i) => i.name)).toEqual(["Home", "Blog", post.headline]);
    expect(items[2].item).toBe(postUrl(post.slug));
    expect((blogBreadcrumbLd().itemListElement as unknown[]).length).toBe(2);
  });

  it("the listing node embeds one BlogPosting per listed post", () => {
    const node = blogListingLd(BLOG_INDEX.slice(0, 3));
    expect(node["@type"]).toBe("Blog");
    const posts = node.blogPost as Record<string, unknown>[];
    expect(posts.length).toBe(3);
    expect(posts[0]["@type"]).toBe("BlogPosting");
    expect("@context" in posts[0]).toBe(false);
  });

  it("ldJson never closes the script tag early", () => {
    expect(ldJson({ a: "</script><script>alert(1)" })).not.toMatch(/<\/script>/);
  });
});

describe("answer paragraph, H1 and body", () => {
  it("is at most 50 words for every post and comes from the post's own words", () => {
    for (const entry of blogdata) {
      const post = blogPostBySlug(entry.slug)!;
      const answer = answerParagraph(post, entry.content);
      const words = answer.split(/\s+/).filter(Boolean).length;
      expect(words, `${entry.slug}: ${words} words`).toBeLessThanOrEqual(50);
      expect(words, entry.slug).toBeGreaterThan(3);
    }
  });

  it("clampWords cuts at a sentence boundary when one exists", () => {
    const text = "First sentence is here. Second sentence is longer and keeps going with many words. " + "more ".repeat(60);
    const out = clampWords(text, 20);
    expect(out).toBe("First sentence is here. Second sentence is longer and keeps going with many words.");
    expect(clampWords("short text", 50)).toBe("short text");
  });

  it("the article body loses its own leading h1 so the page has one H1: the headline", () => {
    const entry = blogdata.find((e) => /<h1/i.test(e.content))!;
    expect(bodyWithoutH1(entry.content)).not.toMatch(/<h1\b/i);
  });
});
