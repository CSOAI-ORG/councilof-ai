/**
 * /blog — the index of every article that actually exists.
 *
 * NAV-INTEGRITY 2026-08-26. This page used to render six hard-coded posts that were
 * not articles at all: the "Read Article" button was a <Button> with no href, the
 * cards were `cursor-pointer` divs with no onClick, and the newsletter form flipped a
 * boolean and printed "Thanks for subscribing!" while sending nothing anywhere. Meanwhile
 * 48 real articles sat reachable at /blog/:slug with nothing linking to them.
 *
 * Now: the list IS the dataset (client/src/data/blog-content.ts), every card is a real
 * <Link href="/blog/:slug">, and the form POSTs to /api/subscribe — which reports back
 * whether it stored the address, so this page can only ever say what actually happened.
 */

import { useState } from "react";
import { Link } from "wouter";
import { Newspaper, Calendar, ArrowRight, Bell, BookOpen, FileText, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { blogdata } from "@/data/blog-content";

/**
 * Six slugs are 308'd straight back to /blog by public/_redirects, so a deep link to
 * them bounces. Listing them here would be advertising a destination that does not
 * arrive. They stay out of the index until whoever set those redirects lifts them.
 */
const REDIRECTED_AWAY = new Set([
  "ai-governance-vs-compliance",
  "choosing-ai-compliance-vendor",
  "dora-compliance-uk-financial-services",
  "eu-ai-act-article-50-countdown",
  "layer-0-agent-economy-trust",
  "nis2-compliance-critical-infrastructure",
]);

const decode = (s: string) =>
  s
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–");

const cleanTitle = (t: string) => decode(t.replace(/\s*\|\s*CSOAI(\s+Blog)?\s*$/i, "").trim());

const pick = (html: string, cls: string) => {
  const m = html.match(new RegExp(`class="${cls}"[^>]*>([^<]+)<`));
  return m ? decode(m[1].trim()) : "";
};

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
};

const posts: Post[] = blogdata
  .filter((e) => !REDIRECTED_AWAY.has(e.slug))
  .map((e) => ({
    slug: e.slug,
    title: cleanTitle(e.title),
    excerpt: decode(e.description || ""),
    category: pick(e.content, "article-category"),
    date: pick(e.content, "article-date"),
    readTime: pick(e.content, "article-readtime"),
  }));

const categories = ["All", ...Array.from(new Set(posts.map((p) => p.category).filter(Boolean))).sort()];

const categoryColors: Record<string, string> = {
  Regulation: "bg-blue-100 text-blue-800",
  Governance: "bg-emerald-100 text-emerald-800",
  Standards: "bg-purple-100 text-purple-800",
  Certification: "bg-teal-100 text-teal-800",
};

type SubState =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "stored" }
  | { kind: "notStored"; fallback: string }
  | { kind: "failed"; message: string };

export default function Blog() {
  const [sub, setSub] = useState<SubState>({ kind: "idle" });
  const [email, setEmail] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSub({ kind: "sending" });
    try {
      const r = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source: "blog-index" }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setSub({ kind: "failed", message: String(j.error || `the server returned ${r.status}`) });
        return;
      }
      if (j.stored) setSub({ kind: "stored" });
      else setSub({ kind: "notStored", fallback: String(j.fallback || "email nicholas@csoai.org") });
    } catch {
      setSub({ kind: "failed", message: "the request did not reach the server" });
    }
  };

  const filtered =
    selectedCategory === "All" ? posts : posts.filter((p) => p.category === selectedCategory);
  const [featured, ...rest] = filtered;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 text-white py-16 sm:py-20 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12 text-center">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                AI Safety News &amp; Insights
              </h1>
              <p className="text-lg sm:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed">
                {posts.length} articles on AI governance, regulatory change, and how measurement works.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <Bell className="h-6 w-6 text-emerald-300" />
                <h3 className="text-lg font-semibold">Subscribe to our newsletter</h3>
              </div>
              <p className="text-slate-200 mb-6 text-sm">
                Updates on AI safety, regulatory change, and measurement — no schedule promised.
              </p>

              {sub.kind === "stored" ? (
                <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-4 text-emerald-100 font-medium">
                  Your address is on the list. You will hear from us when there is something to say.
                </div>
              ) : sub.kind === "notStored" ? (
                <div className="rounded-lg border border-amber-400/50 bg-amber-500/15 p-4 text-sm text-amber-100">
                  We received your address but there is no subscriber store connected yet, so it was
                  not saved. Until there is, {sub.fallback}.
                </div>
              ) : sub.kind === "failed" ? (
                <div className="rounded-lg border border-red-400/50 bg-red-500/15 p-4 text-sm text-red-100">
                  Not subscribed — {sub.message}. Nothing was saved.
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="flex-1 bg-white/90 border-0 rounded-lg text-slate-900 placeholder-slate-500"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={sub.kind === "sending"}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8"
                  >
                    {sub.kind === "sending" ? "Sending…" : "Subscribe"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12 md:py-16">
        {featured && (
          <div className="mb-16">
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl overflow-hidden shadow-xl transition-transform duration-300 hover:-translate-y-1">
              <div className="p-8 sm:p-10 md:p-12 text-white">
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">Latest</Badge>
                  {featured.category && (
                    <Badge className={categoryColors[featured.category] || "bg-white/20 text-white"}>
                      {featured.category}
                    </Badge>
                  )}
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
                  {featured.title}
                </h2>
                <p className="text-lg text-white/90 mb-8 max-w-2xl leading-relaxed">{featured.excerpt}</p>
                {(featured.date || featured.readTime) && (
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-8 text-sm text-white/80">
                    {featured.date && (
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {featured.date}
                      </span>
                    )}
                    {featured.readTime && (
                      <span className="flex items-center gap-2">
                        <Newspaper className="h-4 w-4" />
                        {featured.readTime}
                      </span>
                    )}
                  </div>
                )}
                <Link href={`/blog/${featured.slug}`}>
                  <Button className="bg-white text-slate-900 hover:bg-slate-100 font-semibold">
                    Read article
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {categories.length > 1 && (
          <div className="mb-12">
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 sm:px-5 py-2 rounded-full font-medium transition-all duration-200 ${
                    selectedCategory === category
                      ? "bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg"
                      : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Only {posts.filter((p) => p.category).length} of {posts.length} articles carry a
              category tag; the rest are listed under All.
            </p>
          </div>
        )}

        {rest.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-slate-900">All articles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="block">
                  <article className="h-full bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
                    <div className="bg-gradient-to-r from-slate-700 to-emerald-700 h-24 flex items-end p-4">
                      {post.category && (
                        <Badge className={categoryColors[post.category] || "bg-white/90 text-slate-800"}>
                          {post.category}
                        </Badge>
                      )}
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-lg font-bold text-slate-900 mb-3 leading-tight">
                        {post.title}
                      </h3>
                      <p className="text-sm text-slate-600 mb-4 line-clamp-3 flex-1">{post.excerpt}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 border-t border-slate-100 pt-4">
                        {post.date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {post.date}
                          </span>
                        )}
                        {post.readTime && (
                          <span className="flex items-center gap-1">
                            <Newspaper className="h-3 w-3" />
                            {post.readTime}
                          </span>
                        )}
                        <span className="ml-auto font-semibold text-emerald-700">Read article →</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Newspaper className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No articles found</h3>
            <p className="text-slate-600">Try selecting a different category.</p>
          </div>
        )}

        <div className="mt-16 pt-12 border-t border-slate-200">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center text-slate-900">
            Explore More Resources
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <Link href="/faq">
              <div className="bg-white rounded-xl p-8 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-slate-100">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">FAQ</h3>
                <p className="text-slate-600 text-sm">
                  Find answers to common questions about AI safety and compliance.
                </p>
              </div>
            </Link>

            <Link href="/glossary">
              <div className="bg-white rounded-xl p-8 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-slate-100">
                <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Glossary</h3>
                <p className="text-slate-600 text-sm">
                  Learn key terms and concepts in AI governance and safety.
                </p>
              </div>
            </Link>

            <Link href="/case-studies">
              <div className="bg-white rounded-xl p-8 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-slate-100">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Case Studies</h3>
                <p className="text-slate-600 text-sm">
                  See real-world examples of AI safety implementation.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
