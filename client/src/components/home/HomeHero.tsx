/**
 * HomeHero — the first screen (rebuilt 30 Sep 2026 on the owner's review of the live page).
 *
 * WHAT IT DOES NOW: says what the business is in one plain sentence, with one image, and offers
 * two ways forward (see the live board, check a record). That is all.
 *
 * WHAT LEFT IT, AND WHERE IT WENT. The owner found the first screen confusing and repetitive:
 *  - the "Live now" figure block moved into LiveBoardGlance, directly below, so the board and its
 *    count line are one band and each figure is printed once;
 *  - "model fleets tested 14" is gone. That figure is totals.model_fleets, which counts the
 *    model-comparison AXES, not models. The model count is now its own figure, derived from the
 *    signed cards (scripts/build-models-measured.mjs), in the board band;
 *  - the "Measured is not the same as separated" paragraph became the separation line beside the
 *    count in the board band, and the long explanation moved to /about/#numbers;
 *  - Ask / Connect / Verify moved to HomeWaysIn, after the "how it works" sections;
 *  - the company line moved to the company strip at the foot of the page.
 *
 * THE IMAGE. Decorative, held back behind the text, and NOT on phones: on a throttled phone it
 * was the Largest Contentful Paint (2.8 s, then 4.5 s on the client re-render). Below 640px the
 * first <source> resolves to an inline 1x1 GIF (no request) and the <img> is display:none, so the
 * phone's LCP is the heading. From 640px the responsive WebP set is served; nothing is upscaled
 * (the largest source is the 1376px original).
 */
import { Link } from "wouter";

export default function HomeHero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#04120c]" aria-labelledby="home-hero-h" data-testid="home-hero">
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
          className="pointer-events-none absolute inset-0 hidden h-full w-full object-cover opacity-[0.6] sm:block"
        />
      </picture>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(110% 80% at 18% 10%, rgba(16,185,129,.22) 0%, transparent 60%), linear-gradient(90deg, rgba(4,18,12,.94) 0%, rgba(4,18,12,.82) 48%, rgba(4,18,12,.45) 100%)",
        }}
      />

      <div className="section-shell relative z-10 py-12 sm:py-20 lg:py-24">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
          Independent AI measurement
        </p>
        <h1
          id="home-hero-h"
          className="mt-4 max-w-3xl font-black tracking-[-0.03em] text-white sm:mt-5"
          style={{ fontSize: "clamp(1.9rem, 1rem + 3.2vw, 3.4rem)", lineHeight: 1.05 }}
        >
          We measure how AI systems behave, and publish the evidence so you can check it yourself.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-emerald-50/90 sm:text-lg" data-testid="hero-what-we-do">
          We test AI models, agents and the endpoints they call on published tasks, graded by fixed rules,
          never by another AI. The board distinguishes signed cards, unsigned evidence and untested work.
          Verification is free, and corrections stay public.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a
            href="#board"
            data-testid="hero-cta-board"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-400 px-6 text-base font-black text-[#03110b] transition hover:bg-emerald-300"
          >
            See the live board ↓
          </a>
          <Link
            href="/gspc-verify"
            data-testid="hero-cta-check"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-emerald-300/50 px-6 text-base font-bold text-emerald-50 transition hover:border-emerald-300 hover:bg-emerald-400/10"
          >
            Check a record yourself
          </Link>
        </div>
        <p className="mt-5">
          <a
            href="/how-we-work/#machine-surface"
            data-testid="hero-cta-agents"
            className="inline-flex min-h-11 items-center font-mono text-[13px] font-semibold text-emerald-300 underline decoration-dotted underline-offset-4 hover:text-emerald-200"
          >
            Reading this as an agent? Every door is listed →
          </a>
        </p>
      </div>
    </section>
  );
}
