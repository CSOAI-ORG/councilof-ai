import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import WorldGlobe from "./WorldGlobe";

/**
 * HomeGlobe — the landing page. The Cesium globe IS the homepage.
 *
 * One product, understood in ten seconds: what is this (the measurement body),
 * what have they measured (the finding + leaderboard), what do I do (free check).
 * The measurement engine is credited once, at the bottom, linking to councilof.ai.
 *
 * Register rules (COPY_POLISH_CSOAI.md): numbers beat adjectives; no internal
 * codenames; every claim links to its signed record.
 */

const CARDS = [
  {
    key: "finding",
    badge: "THE FINDING",
    badgeCls: "bg-emerald-600 hover:bg-emerald-600",
    title: "1,301 of 1,312 compliance questions have no published answer.",
    body: "We mapped the rulebook — 349 provisions across EU, UK and US. 99.2% had never been measured. We're measuring it.",
    href: "/benchmarks",
    cta: "See the benchmark estate →",
  },
  {
    key: "leaderboard",
    badge: "MEASURED",
    badgeCls: "bg-sky-600 hover:bg-sky-600",
    title: "The leaderboard — models ranked on statute, not vibes.",
    body: "Head-to-head on the same frozen provisions, intervals published, ties called ties. The uncomfortable numbers lead.",
    href: "/gspc-arena",
    cta: "Open the arena →",
  },
  {
    key: "check",
    badge: "FREE",
    badgeCls: "bg-amber-500 hover:bg-amber-500",
    title: "Is your AI high-risk? Signed answer in 2 minutes.",
    body: "Run the free check. The result is signed — you can prove compliance instead of asserting it.",
    href: "/article-50",
    cta: "Run the free check →",
    primary: true,
  },
  {
    key: "verify",
    badge: "TRUST",
    badgeCls: "bg-gray-700 hover:bg-gray-700",
    title: "Don't trust us. Verify one record.",
    body: "Every figure on this site traces to a signed record. Recompute the chain locally — tamper-evidence, not promises.",
    href: "/certificate-verification",
    cta: "Verify a record →",
  },
];

export default function HomeGlobe() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-950">
      {/* The globe is the page */}
      <div className="absolute inset-0">
        <WorldGlobe />
      </div>

      {/* Headline */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 px-6 pt-8 sm:px-10">
        <div className="max-w-2xl">
          <Badge className="mb-3 bg-emerald-600 hover:bg-emerald-600">The independent measurement body for AI</Badge>
          <h1 className="text-4xl sm:text-4xl font-black tracking-tighter text-white drop-shadow-lg">
            We measure AI systems against statute. You verify it.
          </h1>
        </div>
      </div>

      {/* Card stack */}
      <div className="pointer-events-none absolute bottom-0 left-0 top-32 z-10 flex w-full max-w-md flex-col justify-end gap-3 overflow-y-auto px-6 pb-8 sm:px-10">
        {CARDS.map((c) => (
          <div
            key={c.key}
            className="pointer-events-auto rounded-xl border border-white/10 bg-gray-900/80 p-4 backdrop-blur-md shadow-xl"
          >
            <Badge className={`mb-2 ${c.badgeCls}`}>{c.badge}</Badge>
            <p className="text-sm font-bold text-white leading-snug">{c.title}</p>
            <p className="mt-1 text-xs text-gray-300 leading-relaxed">{c.body}</p>
            <Link href={c.href}>
              <Button
                size="sm"
                variant={c.primary ? "default" : "outline"}
                className={c.primary
                  ? "mt-3 w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "mt-3 w-full border-white/20 text-gray-100 hover:bg-white/10"}
              >
                {c.cta}
              </Button>
            </Link>
          </div>
        ))}
        <p className="mt-1 text-center text-[11px] text-gray-400">
          Runs on the Council measurement engine →{" "}
          <a href="https://councilof.ai" className="underline hover:text-gray-200 pointer-events-auto">councilof.ai</a>
        </p>
      </div>
    </div>
  );
}
