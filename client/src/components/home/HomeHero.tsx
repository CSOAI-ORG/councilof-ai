/**
 * HomeHero — a controlled, image-led tour of the six things a first-time reader can do here.
 * Only the active slide is rendered: one H1, one image and one clear next step. Rotation pauses
 * on hover/focus, can be paused explicitly, and never starts for reduced-motion readers.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";

export interface HeroSlide {
  id: string;
  kicker: string;
  title: string;
  body: string;
  image: string;
  srcSet?: string;
  alt: string;
  href: string;
  cta: string;
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "measure",
    kicker: "Independent AI measurement",
    title: "See how AI behaves. Check the evidence yourself.",
    body: "Published tasks, fixed grading rules and a live board that keeps ties, gaps and untested work visible. Measurement, not certification.",
    image: "/images/coliseum_hero_arena.jpg",
    srcSet: "/images/coliseum_hero_arena-640.webp 640w, /images/coliseum_hero_arena-1024.webp 1024w, /images/coliseum_hero_arena-1376.webp 1376w",
    alt: "AI systems and people facing a row of illuminated test stations in an arena",
    href: "/board",
    cta: "Live board",
  },
  {
    id: "verify",
    kicker: "Free record verification",
    title: "A signed record you do not have to take on trust.",
    body: "Paste a supported card into the browser verifier and inspect its integrity and signature result. No account, no fee, and clear limits on what VALID means.",
    image: "/images/verifiable_evidence_card.jpg",
    alt: "Hands holding a transparent green signed evidence card",
    href: "/gspc-verify",
    cta: "Verify a record",
  },
  {
    id: "workspace",
    kicker: "Council OS",
    title: "The board, verifier and evidence tools in one workspace.",
    body: "Move from a measured result to its source, check a card, ask about a run or open an evidence pack without stitching the journey together yourself.",
    image: "/images/cinematic/council-os-lobby.jpg",
    alt: "People using connected evidence screens in a bright digital workspace",
    href: "/dashboard",
    cta: "Open Council OS",
  },
  {
    id: "connect",
    kicker: "MCP, API and agent access",
    title: "Bring checkable measurements into the AI you already use.",
    body: "Connect the public tool surface, read the board from your own code, or let an agent inspect a signed record through documented, machine-readable doors.",
    image: "/images/cinematic/harness-plugin.jpg",
    alt: "A robotic connector plugging a glowing green measurement cable into a system",
    href: "/connect/",
    cta: "Connect your AI",
  },
  {
    id: "maintain",
    kicker: "Claim maintenance",
    title: "Evidence that gets re-read when the world changes.",
    body: "Public claims keep their dates and sources. Scheduled re-reads surface moved evidence, stale claims and the point where a fresh measurement is needed.",
    image: "/images/liveness_drift_engine.jpg",
    alt: "An hourglass beside stale and re-attested current evidence seals",
    href: "/claim-maintenance/",
    cta: "See claim maintenance",
  },
  {
    id: "correct",
    kicker: "Public accountability",
    title: "Corrections stay public. Signed history is not quietly rewritten.",
    body: "When we get something wrong, the dated ledger says what changed and why. Superseded records remain inspectable, because trust needs a memory.",
    image: "/images/public_watchdog_intake.jpg",
    alt: "People contributing reports to a public watchdog evidence funnel",
    href: "/corrections/",
    cta: "Read corrections",
  },
];

const ROTATE_MS = 6500;

export default function HomeHero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion] = useState(() => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const slide = HERO_SLIDES[active];
  const show = (index: number) => setActive((index + HERO_SLIDES.length) % HERO_SLIDES.length);

  useEffect(() => {
    if (paused || hovered || focused || reducedMotion) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % HERO_SLIDES.length), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [paused, hovered, focused, reducedMotion]);

  return (
    <section
      className="relative isolate overflow-hidden bg-[#04120c] text-white"
      aria-labelledby="home-hero-h"
      aria-roledescription="carousel"
      aria-label="Council of AI services and benefits"
      data-testid="home-hero"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(16,185,129,.20),transparent_42%),linear-gradient(135deg,#04120c_20%,#09271a_100%)]" />
      <div className="section-shell relative z-10 grid items-stretch gap-8 py-8 sm:py-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 lg:py-16">
        <div className="flex min-w-0 flex-col justify-center" role="group" aria-roledescription="slide" aria-label={`${active + 1} of ${HERO_SLIDES.length}`} data-slide={slide.id}>
          <div className="flex items-center gap-3">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">{slide.kicker}</p>
            <span className="font-mono text-xs text-emerald-100/50" aria-hidden="true">{String(active + 1).padStart(2, "0")} / {String(HERO_SLIDES.length).padStart(2, "0")}</span>
          </div>
          <h1 id="home-hero-h" className="mt-5 max-w-2xl font-black tracking-[-0.035em] text-white" style={{ fontSize: "clamp(2rem, 1.1rem + 3.2vw, 3.75rem)", lineHeight: 1.02 }}>
            {slide.title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-emerald-50/85 sm:text-lg" data-testid="hero-what-we-do">{slide.body}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={slide.href}
              data-testid={active === 0 ? "hero-cta-board" : "hero-slide-cta"}
              data-cta="primary"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-400 px-6 text-base font-black text-[#03110b] transition hover:bg-emerald-300"
            >
              {slide.cta}
            </Link>
            {active === 0 ? (
              <Link
                href="/gspc-verify"
                data-testid="hero-cta-check"
                data-cta="secondary"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-emerald-300/50 px-6 text-base font-bold text-emerald-50 transition hover:border-emerald-300 hover:bg-emerald-400/10"
              >
                Verify a record
              </Link>
            ) : null}
          </div>
          <p className="mt-4">
            <a href="/how-we-work/#machine-surface" data-testid="hero-cta-agents" className="inline-flex min-h-11 items-center font-mono text-[13px] font-semibold text-emerald-300 underline decoration-dotted underline-offset-4 hover:text-emerald-200">
              Reading this as an agent? Every door is listed →
            </a>
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2" aria-label="Hero slide controls">
            <button type="button" onClick={() => show(active - 1)} aria-label="Previous slide" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-emerald-300/30 text-lg text-emerald-100 transition hover:bg-emerald-400/10">←</button>
            <div className="flex items-center gap-1.5 px-1">
              {HERO_SLIDES.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => show(index)}
                  aria-label={`Show ${item.kicker}`}
                  aria-current={index === active ? "true" : undefined}
                  data-hero-dot={item.id}
                  className={`inline-flex min-h-11 min-w-7 items-center justify-center after:block after:h-1.5 after:rounded-full after:transition-all ${index === active ? "after:w-7 after:bg-emerald-300" : "after:w-2.5 after:bg-emerald-100/30 hover:after:bg-emerald-100/60"}`}
                />
              ))}
            </div>
            <button type="button" onClick={() => show(active + 1)} aria-label="Next slide" data-testid="hero-next" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-emerald-300/30 text-lg text-emerald-100 transition hover:bg-emerald-400/10">→</button>
            <button type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused} disabled={reducedMotion} className="ml-1 inline-flex min-h-11 items-center rounded-full px-3 font-mono text-[11px] font-bold text-emerald-100/70 transition hover:bg-emerald-400/10 hover:text-emerald-100 disabled:cursor-default disabled:opacity-60">
              {reducedMotion ? "Rotation off" : paused ? "Play rotation" : "Pause rotation"}
            </button>
          </div>
        </div>
        <div className="relative min-h-[17rem] overflow-hidden rounded-3xl border border-emerald-200/20 bg-emerald-950 shadow-[0_32px_80px_-36px_rgba(0,0,0,.75)] sm:min-h-[24rem] lg:min-h-[31rem]">
          <img
            key={slide.id}
            src={slide.image}
            srcSet={slide.srcSet}
            sizes="(min-width: 1024px) 52vw, 100vw"
            alt={slide.alt}
            width={1376}
            height={768}
            fetchPriority={active === 0 ? "high" : "auto"}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#04120c]/45 via-transparent to-transparent" />
          <p className="absolute bottom-4 left-4 rounded-full border border-white/20 bg-[#04120c]/80 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-100 backdrop-blur-sm">Evidence you can inspect</p>
        </div>
      </div>
    </section>
  );
}
