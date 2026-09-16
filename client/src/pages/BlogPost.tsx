/**
 * BlogPost — one article from client/src/data/blog-content.ts, rendered for a reader and for an
 * answer engine: a single H1 equal to the post's headline, a stand-alone answer paragraph
 * (≤ 50 words, the article's own words), the article body, a Sources section listing the
 * external links the article cites (omitted when it cites none), and BlogPosting +
 * BreadcrumbList JSON-LD derived from the post's own data (lib/blogSeo).
 *
 * NOT ROUTED. App.tsx routes /blog and /blog/:slug to ContentReviewNotice under the reviewed
 * publication manifest (client/src/data/publication-state.json, 2026-09-15) and
 * scripts/content-promise-gate.mjs holds the two in step. Restoring a post is a publication
 * decision: remove the pattern from withdrawn_routes AND point the route here in the same
 * change, or the gate fails. Until then this page ships in no bundle and appears on no route.
 */
import { useLayoutEffect, useMemo } from "react";
import { Link, useParams } from "wouter";
import { getBlogDataEntry } from "@/data/blog-content";
import { applyHead, resolveHead } from "@/lib/seoHead";
import {
  answerParagraph,
  blogBreadcrumbLd,
  blogPostBySlug,
  blogPostingLd,
  bodyWithoutH1,
  ldJson,
} from "@/lib/blogSeo";

export default function BlogPost() {
  const params = useParams();
  const slug = String((params as { slug?: string })?.slug ?? "");
  const entry = getBlogDataEntry(slug);
  const post = blogPostBySlug(slug);

  const head = useMemo(
    () => resolveHead(`/blog/${slug}`, post ? { name: post.headline } : {}),
    [slug, post],
  );
  useLayoutEffect(() => {
    if (!post) { applyHead(head); return; }
    applyHead({ ...head, title: `${post.headline} | Council of AI`, description: post.description || head.description, ogTitle: post.headline, ogDescription: post.description || head.description });
  }, [head, post]);

  if (!entry || !post) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-20">
        <h1 className="text-3xl font-bold">Post not found</h1>
        <p className="mt-4 text-slate-600">No article exists at /blog/{slug}.</p>
        <Link href="/blog" className="mt-6 inline-block underline">Back to the blog</Link>
      </section>
    );
  }

  const answer = answerParagraph(post, entry.content);
  const body = bodyWithoutH1(entry.content);

  return (
    <article className="mx-auto max-w-3xl px-5 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(blogPostingLd(post)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(blogBreadcrumbLd(post)) }} />
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/">Home</Link> › <Link href="/blog">Blog</Link>
      </nav>
      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{post.headline}</h1>
      {(post.datePublished || post.author) && (
        <p className="mt-2 text-sm text-slate-500">
          {post.datePublished && <time dateTime={post.datePublished}>{post.datePublished}</time>}
          {post.datePublished && post.author && " · "}
          {post.author && <span>{post.author.name}</span>}
          {post.dateModified && post.dateModified !== post.datePublished && <span> · updated <time dateTime={post.dateModified}>{post.dateModified}</time></span>}
        </p>
      )}
      <p className="mt-6 text-lg leading-8 text-slate-800" data-testid="blog-answer">{answer}</p>
      {entry.css && <style dangerouslySetInnerHTML={{ __html: entry.css }} />}
      <div className="legacy-content mt-8" dangerouslySetInnerHTML={{ __html: body }} />
      {post.sources.length > 0 && (
        <section className="mt-12 border-t border-slate-200 pt-6" aria-labelledby="sources-heading">
          <h2 id="sources-heading" className="text-xl font-semibold">Sources</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-6 text-sm">
            {post.sources.map((u) => (
              <li key={u}><a href={u} rel="noopener noreferrer" className="underline break-all">{u}</a></li>
            ))}
          </ol>
        </section>
      )}
    </article>
  );
}
