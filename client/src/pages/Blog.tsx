/**
 * Blog/News index — the list view for client/src/data/blog-content.ts.
 *
 * Every card here is one real entry from `blogdata` and links to /blog/<slug>,
 * the route App.tsx serves from that same dataset. There is no hardcoded post
 * array and deliberately no fallback array: a placeholder fallback is precisely
 * how seven fictional, unlinked posts survived on this route while 48 real
 * articles sat live and unreachable. If `blogdata` is empty the page says so.
 *
 * Categories, dates and read times all come from lib/blogIndex — see the note
 * there on why the pills filter by publication period and not by category.
 */

import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Newspaper,
  Calendar,
  User,
  ArrowRight,
  Bell,
  BookOpen,
  FileText,
  MessageCircle,
} from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ALL_PERIODS,
  blogPeriodFilters,
  buildBlogIndex,
  filterByPeriod,
  periodGradient,
} from "@/lib/blogIndex";

const UNLISTED_SLUGS = new Set(["ai-governance-legislation-2026", "byzantine-consensus", "iso-42001-nist-ai-rmf", "ai-governance-trends-2026"]);

export default function Blog() {
  // 2026-08-26: this form used to call preventDefault(), flip a boolean, and show
  // "Thanks for subscribing! Check your email for confirmation." — while never
  // sending the address anywhere. POST /api/subscribe already exists and carries
  // its own honesty contract ("never a 200 that drops data silently": it answers
  // stored:true, or stored:false with a fallback address). The form now posts to
  // it and reports back whatever it actually says.
  const [state, setState] = useState<"idle" | "sending" | "stored" | "queued" | "error">("idle");
  const [errMsg, setErrMsg] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState(ALL_PERIODS);

  // Three posts are rejected by brand-gate (certification claims / the retracted BFT post) and are
  // not prerendered, so linking them is a dead link. Unlisted until rewritten; the entries stay in the data.
  const allPosts = useMemo(() => buildBlogIndex().filter((p) => !UNLISTED_SLUGS.has(p.slug)), []);
  const periods = useMemo(() => blogPeriodFilters(allPosts), [allPosts]);
  const filteredPosts = useMemo(
    () => filterByPeriod(allPosts, selectedPeriod),
    [allPosts, selectedPeriod],
  );

  // The newest post in the current selection leads; the rest fill the grid.
  const [featuredPost, ...regularPosts] = filteredPosts;

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") || "").trim();
    if (!email) return;
    setState("sending");
    try {
      const r = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source: "blog-index" }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setErrMsg(String(d?.error || `HTTP ${r.status}`)); setState("error"); return; }
      setState(d?.stored ? "stored" : "queued");
    } catch (err) {
      setErrMsg(String((err as Error)?.message || err));
      setState("error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Hero Section with Newsletter */}
      <div className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 text-white py-16 sm:py-20 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Hero Title and Subtitle */}
            <div className="mb-12 text-center">
              <h1 className="text-4xl sm:text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                AI Safety News &amp; Insights
              </h1>
              <p className="text-lg sm:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed">
                Stay informed about AI governance, regulatory updates, and best practices for building responsible AI systems.
              </p>
            </div>

            {/* Newsletter Signup Form */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <Bell className="h-6 w-6 text-emerald-300" />
                <h2 className="text-lg font-semibold">Subscribe to our newsletter</h2>
              </div>
              <p className="text-slate-200 mb-6 text-sm">
                Get weekly updates on AI safety, compliance standards, and industry developments.
              </p>

              {state === "stored" ? (
                <div role="status" className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-4 text-emerald-100 font-medium flex items-center gap-2">
                  <span className="text-lg" aria-hidden="true">✓</span> Thanks — your address is on the list.
                </div>
              ) : state === "queued" ? (
                <div role="status" className="bg-amber-500/20 border border-amber-400/50 rounded-lg p-4 text-amber-50 font-medium">
                  Received, but there is no subscriber store bound yet, so nothing was saved. Email{" "}
                  <a className="underline" href="mailto:nicholas@csoai.org">nicholas@csoai.org</a> to be added.
                </div>
              ) : (
                <>
                  <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                    <label htmlFor="blog-newsletter-email" className="sr-only">Email address</label>
                    <Input
                      id="blog-newsletter-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="Enter your email address"
                      className="min-h-[44px] flex-1 bg-white/90 border-0 rounded-lg text-slate-900 placeholder-slate-600"
                      required
                    />
                    <Button type="submit" disabled={state === "sending"} className="min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8">
                      {state === "sending" ? "Subscribing…" : "Subscribe"}
                    </Button>
                  </form>
                  {state === "error" && (
                    <p role="alert" className="mt-3 text-sm font-semibold text-red-200">
                      That did not go through ({errMsg}). Nothing was saved — try again, or email{" "}
                      <a className="underline" href="mailto:nicholas@csoai.org">nicholas@csoai.org</a>.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12 md:py-16">
        {/* Featured Post */}
        {featuredPost && (
          <div className="mb-16">
            <div className={`bg-gradient-to-br ${featuredPost.gradient} rounded-xl overflow-hidden shadow-xl transition-transform duration-300 hover:-translate-y-1`}>
              <div className="p-8 sm:p-10 md:p-12 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                    Featured
                  </Badge>
                  <Badge className={featuredPost.badgeClass}>
                    {featuredPost.period}
                  </Badge>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-4xl font-bold mb-4 leading-tight">
                  <Link href={featuredPost.href} className="hover:underline">
                    {featuredPost.title}
                  </Link>
                </h2>
                <p className="text-lg text-white/90 mb-8 max-w-2xl leading-relaxed">
                  {featuredPost.excerpt}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-8">
                  {featuredPost.author && (
                    <div className="flex items-center gap-2 text-white/80 text-sm">
                      <User className="h-4 w-4" />
                      <span>{featuredPost.author}</span>
                    </div>
                  )}
                  {featuredPost.dateLabel && (
                    <div className="flex items-center gap-2 text-white/80 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>{featuredPost.dateLabel}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <Newspaper className="h-4 w-4" />
                    <span>{featuredPost.readTime}</span>
                  </div>
                </div>
                <Link href={featuredPost.href}>
                  <Button className="bg-white text-slate-900 hover:bg-slate-100 font-semibold">
                    Read Article
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Period Filter */}
        <div className="mb-12">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {periods.map((period) => (
              <button
                key={period}
                type="button"
                aria-pressed={selectedPeriod === period}
                onClick={() => setSelectedPeriod(period)}
                className={`min-h-[44px] px-4 sm:px-5 py-2 rounded-full font-medium transition-all duration-200 ${
                  selectedPeriod === period
                    ? `bg-gradient-to-r ${periodGradient(allPosts, period)} text-white shadow-lg`
                    : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Regular Posts Grid */}
        {regularPosts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-slate-900">Latest Articles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={post.href}
                  className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col"
                >
                  {/* Period Gradient Header */}
                  <div className={`bg-gradient-to-r ${post.gradient} h-32 flex items-end p-4`}>
                    <Badge className={post.badgeClass}>
                      {post.period}
                    </Badge>
                  </div>

                  {/* Content */}
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900 mb-3 line-clamp-2 leading-tight">
                      {post.title}
                    </h3>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2 flex-1">
                      {post.excerpt}
                    </p>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 border-t border-slate-100 pt-4">
                      {post.author && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {post.author}
                        </span>
                      )}
                      {post.dateLabel && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {post.dateLabel}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Newspaper className="h-3 w-3" />
                        {post.readTime}
                      </span>
                    </div>
                  </CardContent>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <Newspaper className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No articles found</h3>
            <p className="text-slate-600">Try selecting a different period.</p>
          </div>
        )}

        {/* Resources Section */}
        <div className="mt-16 pt-12 border-t border-slate-200">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center text-slate-900">
            Explore More Resources
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {/* FAQ Card */}
            <Link href="/faq">
              <div className="bg-white rounded-xl p-8 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-slate-100">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">FAQ</h3>
                <p className="text-slate-600 text-sm">Find answers to common questions about AI safety and compliance.</p>
              </div>
            </Link>

            {/* Glossary Card */}
            <Link href="/glossary">
              <div className="bg-white rounded-xl p-8 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-slate-100">
                <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Glossary</h3>
                <p className="text-slate-600 text-sm">Learn key terms and concepts in AI governance and safety.</p>
              </div>
            </Link>

            {/* Case Studies Card */}
            <Link href="/case-studies">
              <div className="bg-white rounded-xl p-8 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-slate-100">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Case Studies</h3>
                <p className="text-slate-600 text-sm">See real-world examples of AI safety implementation.</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
