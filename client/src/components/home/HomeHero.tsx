/** The homepage proposition. Figures and run dates belong to the live board below. */
import { Link } from "wouter";
export default function HomeHero() {
  return (
    <section
      className="relative isolate overflow-hidden border-b border-emerald-900/60 bg-[#04120c]"
      aria-labelledby="home-hero-h"
      data-testid="home-hero"
    >
      <picture>
        <source
          media="(max-width: 639.98px)"
          srcSet="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        />
        <source
          type="image/webp"
          srcSet="/images/coliseum_hero_arena-640.webp 640w, /images/coliseum_hero_arena-1024.webp 1024w, /images/coliseum_hero_arena-1376.webp 1376w"
          sizes="100vw"
        />
        <img
          src="/images/coliseum_hero_arena.jpg"
          alt=""
          aria-hidden="true"
          width={1376}
          height={768}
          fetchPriority="high"
          decoding="async"
          className="pointer-events-none absolute inset-0 hidden h-full w-full object-cover object-right opacity-40 sm:block"
        />
      </picture>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 90% at 15% 0%, rgba(16,185,129,.24) 0%, transparent 65%), linear-gradient(90deg, rgba(4,18,12,.98) 0%, rgba(4,18,12,.88) 48%, rgba(4,18,12,.4) 100%)",
        }}
      />
      <div className="section-shell relative z-10 py-12 sm:py-16 lg:py-20">
        <p className="inline-flex rounded-full border border-emerald-300/25 bg-emerald-900/30 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
          GSPC · Independent AI measurement
        </p>
        <h1
          id="home-hero-h"
          className="mt-6 max-w-5xl font-black tracking-[-0.045em] text-white"
          style={{
            fontSize: "clamp(1.875rem, 0.75rem + 5.5vw, 4.75rem)",
            lineHeight: 1.05,
          }}
        >
          <span className="block">AI behaviour.</span>
          <span className="mt-1 block text-emerald-300">
            Check the evidence.
          </span>
        </h1>
        <p
          className="mt-6 max-w-2xl text-base leading-relaxed text-emerald-50/85 sm:text-lg"
          data-testid="hero-what-we-do"
        >
          GSPC measures AI models, agents and the endpoints they call against
          published tasks. Explore signed cards, unsigned evidence and untested
          work. Verification is free; corrections stay public.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a
            href="#board"
            data-testid="hero-cta-board"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-300 px-6 text-base font-bold text-[#04120c] transition-colors hover:bg-emerald-200"
          >
            Explore the living board ↓
          </a>
          <Link
            href="/gspc-verify"
            data-testid="hero-cta-check"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-emerald-200/40 bg-emerald-950/30 px-6 text-base font-semibold text-emerald-50 transition-colors hover:border-emerald-200 hover:bg-emerald-900/50"
          >
            Verify a record · free
          </Link>
        </div>
        <p className="mt-5">
          <a
            href="/how-we-work/#machine-surface"
            data-testid="hero-cta-agents"
            className="inline-flex min-h-11 items-center font-mono text-[13px] font-semibold text-emerald-200 underline decoration-emerald-300/40 underline-offset-4 hover:text-white"
          >
            Use the board from your own tools →
          </a>
        </p>
        <p className="mt-5 max-w-2xl border-t border-emerald-200/15 pt-5 text-sm leading-relaxed text-emerald-50/65">
          A measurement records a run. Decisions about the system remain yours.
        </p>
      </div>
    </section>
  );
}
