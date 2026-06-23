"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

interface Post {
  slug: string;
  category: string;
  date: string;
  title: string;
  excerpt: string;
  readTime: string;
}

export default function BlogClient({ posts, categories }: { posts: Post[]; categories: string[] }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [email, setEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return posts.filter((post) => {
      const categoryMatch = activeCategory === "All" || post.category === activeCategory;
      const searchMatch =
        !term ||
        post.title.toLowerCase().includes(term) ||
        post.excerpt.toLowerCase().includes(term) ||
        post.category.toLowerCase().includes(term);
      return categoryMatch && searchMatch;
    });
  }, [posts, activeCategory, search]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribeStatus("submitting");
    setSubscribeError(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "blog" }),
      });
      const data = await res.json();
      if (data.success) {
        setSubscribeStatus("success");
        setEmail("");
      } else {
        setSubscribeStatus("error");
        setSubscribeError(data.error || "Something went wrong.");
      }
    } catch {
      setSubscribeStatus("error");
      setSubscribeError("Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-4 py-20">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
          Knowledge Hub
        </span>

        {/* Hero */}
        <div className="mb-16 grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">
              <span className="gradient-text">AI Governance Blog</span>
            </h1>
            <p className="text-lg leading-relaxed text-slate-300">
              Expert insights on AI regulation, safety standards, certification, and the future of institutional AI
              governance.
            </p>
          </div>

          <div className="flex justify-center">
            <svg
              width="350"
              height="350"
              viewBox="0 0 350 350"
              fill="none"
              className="drop-shadow-[0_0_30px_rgba(16,185,129,0.25)]"
            >
              <defs>
                <linearGradient id="blogPaperGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0.7" />
                </linearGradient>
              </defs>
              <rect x="40" y="50" width="270" height="280" rx="8" fill="#0f172a" stroke="#10b981" strokeWidth="2" opacity="0.8" />
              <line x1="60" y1="85" x2="280" y2="85" stroke="#10b981" strokeWidth="2" opacity="0.7" />
              <line x1="60" y1="100" x2="280" y2="100" stroke="#10b981" strokeWidth="2" opacity="0.7" />
              <line x1="60" y1="125" x2="200" y2="125" stroke="#10b981" strokeWidth="1.5" opacity="0.5">
                <animate attributeName="x2" values="200;280;200" dur="3s" repeatCount="indefinite" />
              </line>
              <line x1="60" y1="140" x2="180" y2="140" stroke="#10b981" strokeWidth="1.5" opacity="0.5">
                <animate attributeName="x2" values="180;250;180" dur="3s" repeatCount="indefinite" />
              </line>
              <line x1="60" y1="155" x2="220" y2="155" stroke="#10b981" strokeWidth="1.5" opacity="0.5">
                <animate attributeName="x2" values="220;270;220" dur="3s" repeatCount="indefinite" />
              </line>
              <line x1="60" y1="170" x2="190" y2="170" stroke="#10b981" strokeWidth="1.5" opacity="0.5">
                <animate attributeName="x2" values="190;280;190" dur="3s" repeatCount="indefinite" />
              </line>
              <line x1="60" y1="195" x2="280" y2="195" stroke="#10b981" strokeWidth="1" opacity="0.3" />
              <line x1="60" y1="210" x2="270" y2="210" stroke="#10b981" strokeWidth="1" opacity="0.3" />
              <line x1="60" y1="225" x2="275" y2="225" stroke="#10b981" strokeWidth="1" opacity="0.3" />
              <line x1="60" y1="240" x2="260" y2="240" stroke="#10b981" strokeWidth="1" opacity="0.3" />
              <line x1="60" y1="255" x2="280" y2="255" stroke="#10b981" strokeWidth="1" opacity="0.3" />
              <line x1="60" y1="270" x2="270" y2="270" stroke="#10b981" strokeWidth="1" opacity="0.3" />
              <circle cx="50" cy="50" r="15" fill="none" stroke="#10b981" strokeWidth="2" opacity="0.6" />
              <circle cx="50" cy="50" r="8" fill="#10b981" opacity="0.4" />
            </svg>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  activeCategory === category
                    ? "bg-emerald-500 text-slate-950"
                    : "border border-white/10 bg-white/[0.03] text-slate-300 hover:border-emerald-500/30 hover:text-emerald-400"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none md:w-72"
          />
        </div>

        {/* Article grid */}
        <div className="mb-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <article
              key={post.slug}
              className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-emerald-500/30 hover:bg-white/[0.05]"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  {post.category}
                </span>
                <span className="text-xs text-slate-500">{post.date}</span>
              </div>
              <h3 className="mb-3 text-lg font-bold leading-snug text-white transition group-hover:text-emerald-400">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h3>
              <p className="mb-6 flex-1 text-sm leading-relaxed text-slate-400">{post.excerpt}</p>
              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-xs text-slate-500">{post.readTime}</span>
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-sm font-bold text-emerald-400 transition hover:text-emerald-300"
                >
                  Read More →
                </Link>
              </div>
            </article>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="mb-20 rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <p className="text-slate-400">No articles match your search.</p>
            <button
              onClick={() => {
                setActiveCategory("All");
                setSearch("");
              }}
              className="mt-4 text-sm font-bold text-emerald-400 hover:text-emerald-300"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Newsletter */}
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.05] p-8 sm:p-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-2xl font-black tracking-tight sm:text-3xl">
              <span className="gradient-accent">Stay Updated on AI Governance</span>
            </h2>
            <p className="mb-6 text-slate-300">
              Get weekly articles on certification, regulation, and AI safety best practices delivered to your inbox.
            </p>

            {subscribeStatus === "success" ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6">
                <p className="text-lg font-bold text-emerald-400">You&apos;re subscribed!</p>
                <p className="text-slate-300">Thanks for joining the CSOAI community.</p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                />
                <input type="text" name="_gotcha" className="hidden" tabIndex={-1} autoComplete="off" />
                <button
                  type="submit"
                  disabled={subscribeStatus === "submitting"}
                  className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
                >
                  {subscribeStatus === "submitting" ? "Subscribing..." : "Subscribe"}
                </button>
              </form>
            )}

            {subscribeStatus === "error" && subscribeError && (
              <p className="mt-3 text-sm text-red-400">{subscribeError}</p>
            )}
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-16 flex flex-col items-center justify-between gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-8 sm:flex-row sm:p-10">
          <p className="text-lg font-medium text-slate-200">
            Get your organization AI-certified before the August 2026 deadline.
          </p>
          <Link
            href="/contact"
            className="inline-flex rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            Get Started →
          </Link>
        </div>
      </section>
    </div>
  );
}
