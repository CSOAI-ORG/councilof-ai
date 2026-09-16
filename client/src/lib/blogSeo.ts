/**
 * blogSeo — the answer-engine surface of the blog, derived from the posts' own data.
 *
 * Every field here is read from client/src/data/blog-index.json (generated from the dataset's
 * own JSON-LD and fields by scripts/generate-blog-index.mjs) or from the post body. Nothing is
 * typed: a post with no datePublished gets no datePublished; a post with no external links gets
 * no Sources section; a post whose first paragraph runs past 50 words falls back to its own
 * meta description and, if that is long too, is cut at a sentence boundary.
 *
 * Route state: App.tsx routes /blog and /blog/:slug to the withdrawal notice under the reviewed
 * publication manifest (client/src/data/publication-state.json, 2026-09-15). These producers
 * are wired into the listing page and BlogPost.tsx so the moment a reviewer restores a route,
 * its head, JSON-LD, H1, answer paragraph and Sources are already right. They do not restore
 * the route themselves — that is a publication decision, not a build step.
 */
import index from "../data/blog-index.json";
import { SITE_ORIGIN } from "./seoHead";

export interface BlogIndexPost {
  slug: string;
  headline: string;
  description: string;
  sources: string[];
  datePublished?: string;
  dateModified?: string;
  author?: { type: string; name: string };
}

export const BLOG_INDEX: BlogIndexPost[] = index.posts as BlogIndexPost[];
export const BLOG_BASE = "/blog";

/** The estate's canonical publisher node — the same identity PageSchema and the home schema use. */
export const PUBLISHER = {
  "@type": "Organization",
  name: "CSOAI Ltd",
  alternateName: "CSOAI",
  url: SITE_ORIGIN,
  identifier: "UK Companies House 16939677",
} as const;

export function blogPostBySlug(slug: string): BlogIndexPost | undefined {
  return BLOG_INDEX.find((p) => p.slug === slug);
}

export const postPath = (slug: string): string => `${BLOG_BASE}/${slug}`;
export const postUrl = (slug: string): string => `${SITE_ORIGIN}${BLOG_BASE}/${slug}/`;

/** The post's author as a schema.org node — the dataset's own name; CSOAI is the publisher's short name. */
function authorNode(post: BlogIndexPost) {
  if (!post.author?.name) return undefined;
  if (/^CSOAI( Ltd)?$/i.test(post.author.name)) return PUBLISHER;
  return { "@type": post.author.type || "Organization", name: post.author.name };
}

/** schema.org BlogPosting for one post. Dates and author appear only when the data has them. */
export function blogPostingLd(post: BlogIndexPost): Record<string, unknown> {
  const url = postUrl(post.slug);
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.headline,
    description: post.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    publisher: PUBLISHER,
    isPartOf: { "@type": "Blog", name: "Council of AI blog", url: `${SITE_ORIGIN}${BLOG_BASE}/` },
  };
  if (post.datePublished) node.datePublished = post.datePublished;
  if (post.dateModified) node.dateModified = post.dateModified;
  const author = authorNode(post);
  if (author) node.author = author;
  if (post.sources.length) node.citation = post.sources.map((u) => ({ "@type": "CreativeWork", url: u }));
  return node;
}

/** Home → Blog → Post. */
export function blogBreadcrumbLd(post?: BlogIndexPost): Record<string, unknown> {
  const items = [
    { name: "Home", item: `${SITE_ORIGIN}/` },
    { name: "Blog", item: `${SITE_ORIGIN}${BLOG_BASE}/` },
  ];
  if (post) items.push({ name: post.headline, item: postUrl(post.slug) });
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.item })),
  };
}

/** The listing page's Blog node: every listed post as a BlogPosting, in the order given. */
export function blogListingLd(posts: BlogIndexPost[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Council of AI blog",
    url: `${SITE_ORIGIN}${BLOG_BASE}/`,
    publisher: PUBLISHER,
    blogPost: posts.map((p) => {
      const { "@context": _ctx, ...node } = blogPostingLd(p);
      return node;
    }),
  };
}

function stripTags(html: string): string {
  return html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

const wordCount = (s: string): number => s.split(/\s+/).filter(Boolean).length;

/** Cut to at most `max` words at a sentence boundary where one exists, else at a word boundary. */
export function clampWords(text: string, max = 50): string {
  if (wordCount(text) <= max) return text;
  const words = text.split(/\s+/).filter(Boolean).slice(0, max);
  const joined = words.join(" ");
  const sentenceEnd = Math.max(joined.lastIndexOf(". "), joined.lastIndexOf("? "), joined.lastIndexOf("! "));
  if (sentenceEnd > joined.length * 0.4) return joined.slice(0, sentenceEnd + 1);
  return joined.replace(/[,;:\s]+$/, "") + "…";
}

/**
 * The stand-alone answer paragraph (≤ 50 words): the article's own first paragraph when it is
 * short enough, else the post's own description, else the first paragraph cut at a sentence.
 */
export function answerParagraph(post: BlogIndexPost, contentHtml: string): string {
  const firstP = (contentHtml.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "");
  const first = stripTags(firstP);
  if (first && wordCount(first) <= 50) return first;
  if (post.description && wordCount(post.description) <= 50) return post.description;
  return clampWords(first || post.description, 50);
}

/** The article body without its own leading <h1>, so the page's single H1 is the headline. */
export function bodyWithoutH1(contentHtml: string): string {
  return contentHtml.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/i, "");
}

/** Serialise a JSON-LD node for a <script type="application/ld+json"> without closing the tag early. */
export function ldJson(node: Record<string, unknown>): string {
  return JSON.stringify(node).replace(/<\//g, "<\\/");
}
