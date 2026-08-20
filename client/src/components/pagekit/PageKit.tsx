import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * PageKit — the homepage scroll-world design language, applied to INNER pages.
 *
 * The homepage (client/src/components/home/StoryWorld.tsx) established the visual
 * grammar this file reproduces for the primary-nav pages:
 *
 *   • full-bleed branded image bands with a FROSTED WHITE type panel over the
 *     image's open space — the claymation world is bright, so it never gets a
 *     dark scrim; the panel carries legibility instead
 *   • light / white split bands alternating underneath for rhythm
 *   • big bold headings — text-4xl→5xl, font-black, tracking-tight
 *   • medium-weight body at text-lg/xl
 *   • end-user pain → benefit → USP bullets
 *   • Reveal fade/rise on scroll, and a background parallax drift
 *
 * DELIBERATELY LOCAL. A shared `client/src/components/scrollworld/` module is
 * being extracted in parallel; this file must not pre-empt it. Once that module
 * lands, PageKit should be deleted and these pages re-pointed at it. Until then
 * nothing here imports from home/ or scrollworld/.
 *
 * Doctrine baked in: measurement, not certification. No number appears here that
 * is not sourced by the page that renders it.
 */

/* ————————————————————————— motion primitives ————————————————————————— */

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

/** Fade + rise as the block enters the viewport. Runs once. */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setShown(true);
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-[900ms] ease-out ${shown ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/** Drifts the BACKGROUND layer only, so the band feels like a world behind the type. */
export function useParallax(strength = 14) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const vh = window.innerHeight;
      // A zero-height viewport (headless capture, a hidden pane, a tab restored
      // before layout) makes the ratio below meaningless — and because the rect we
      // read already carries the transform we wrote, a meaningless ratio feeds back
      // on itself and runs away to millions of pixels. Bail, and clamp regardless.
      if (!vh) return;
      const r = el.getBoundingClientRect();
      if (!r.height) return;
      const raw = (r.top + r.height / 2 - vh / 2) / vh;
      const p = Math.max(-2, Math.min(2, raw)); // a band is never more than ~2 viewports away and still visible
      el.style.transform = `translate3d(0, ${(-p * strength).toFixed(2)}%, 0) scale(1.16)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [strength]);
  return ref;
}

/* ————————————————————————— pain / benefit / USP ————————————————————————— */

export type Point = { tag: "pain" | "benefit" | "usp"; text: string };

const TAG_LABEL: Record<Point["tag"], string> = {
  pain: "Pain",
  benefit: "You get",
  usp: "Only here",
};
const TAG_TONE: Record<Point["tag"], string> = {
  pain: "bg-rose-50 text-rose-600 ring-1 ring-rose-100",
  benefit: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  usp: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
};

export function Points({ points, center }: { points: Point[]; center?: boolean }) {
  return (
    <ul className={`mt-6 flex w-full max-w-xl flex-col gap-2.5 ${center ? "mx-auto text-left" : ""}`}>
      {points.map((pt) => (
        <li key={pt.text} className="flex items-start gap-3">
          <span
            className={`mt-0.5 inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TAG_TONE[pt.tag]}`}
          >
            {TAG_LABEL[pt.tag]}
          </span>
          <span className="text-[15px] leading-snug text-gray-700">{pt.text}</span>
        </li>
      ))}
    </ul>
  );
}

/* ————————————————————————— actions ————————————————————————— */

export type Action = { href: string; label: string; tone?: "solid" | "ghost"; external?: boolean };

export function Actions({ actions, center }: { actions?: Action[]; center?: boolean }) {
  if (!actions?.length) return null;
  return (
    <div className={`mt-7 flex flex-wrap gap-3 ${center ? "justify-center" : ""}`}>
      {actions.map((a) => (
        <a
          key={a.href + a.label}
          href={a.href}
          target={a.external ? "_blank" : undefined}
          rel={a.external ? "noreferrer" : undefined}
          className={
            a.tone === "ghost"
              ? "inline-flex items-center rounded-xl border border-emerald-600/30 bg-white/80 px-5 py-3 text-base font-bold text-emerald-800 backdrop-blur-sm transition-colors hover:bg-white"
              : "inline-flex items-center rounded-xl bg-emerald-500 px-6 py-3 text-base font-extrabold text-white shadow-lg transition-colors hover:bg-emerald-400"
          }
        >
          {a.label}
        </a>
      ))}
    </div>
  );
}

/* ————————————————————————— HERO — full-bleed band, frosted panel ————————————————————————— */

export function PageHero({
  kicker,
  title,
  lede,
  points,
  actions,
  image,
  contentRight = false,
  footnote,
  children,
}: {
  kicker: string;
  title: ReactNode;
  lede: ReactNode;
  points?: Point[];
  actions?: Action[];
  image: { src: string; alt: string };
  contentRight?: boolean;
  /** small print under the panel — a disclaimer, a stamp, a source */
  footnote?: ReactNode;
  children?: ReactNode;
}) {
  const bgRef = useParallax(16);
  const wash = contentRight
    ? "bg-gradient-to-l from-white/75 via-white/30 to-transparent"
    : "bg-gradient-to-r from-white/75 via-white/30 to-transparent";
  return (
    <section className="relative flex min-h-[76vh] items-center overflow-hidden bg-white">
      <img
        ref={bgRef}
        src={image.src}
        alt={image.alt}
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover will-change-transform"
      />
      <div className={`absolute inset-0 ${wash}`} />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
        <Reveal className={`max-w-2xl ${contentRight ? "ml-auto" : ""}`}>
          <div className="rounded-3xl border border-white/70 bg-white/85 p-8 shadow-[0_24px_70px_-30px_rgba(4,18,12,.55)] backdrop-blur-md sm:p-10">
            <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-700">{kicker}</span>
            <h1 className="mt-3 text-4xl font-black leading-[1.04] tracking-tight text-gray-900 sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 text-lg font-medium leading-relaxed text-gray-700 sm:text-xl">{lede}</p>
            {points && <Points points={points} />}
            <Actions actions={actions} />
            {children}
            {footnote && <p className="mt-6 text-[13px] leading-relaxed text-gray-500">{footnote}</p>}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/**
 * MediaHero — the hero for pages whose lead asset is a film rather than a still.
 * Same type scale and rhythm as PageHero; the branded video sits in the media
 * column on a light ground, click-to-play (nothing autoplays, nothing preloads).
 */
export function MediaHero({
  kicker,
  title,
  lede,
  points,
  actions,
  media,
  footnote,
}: {
  kicker: string;
  title: ReactNode;
  lede: ReactNode;
  points?: Point[];
  actions?: Action[];
  media: ReactNode;
  footnote?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-20 sm:py-24 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <Reveal>
          <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-700">{kicker}</span>
          <h1 className="mt-3 text-4xl font-black leading-[1.04] tracking-tight text-gray-900 sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-xl text-lg font-medium leading-relaxed text-gray-700 sm:text-xl">{lede}</p>
          {points && <Points points={points} />}
          <Actions actions={actions} />
          {footnote && <p className="mt-6 max-w-xl text-[13px] leading-relaxed text-gray-500">{footnote}</p>}
        </Reveal>
        <Reveal delay={120}>{media}</Reveal>
      </div>
    </section>
  );
}

/* ————————————————————————— HEAVY — full-bleed band, content overlaid ————————————————————————— */

export function ImageBand({
  kicker,
  title,
  body,
  points,
  actions,
  image,
  contentRight = false,
  children,
}: {
  kicker: string;
  title: ReactNode;
  body?: ReactNode;
  points?: Point[];
  actions?: Action[];
  image: { src: string; alt: string };
  contentRight?: boolean;
  children?: ReactNode;
}) {
  const bgRef = useParallax(16);
  const wash = contentRight
    ? "bg-gradient-to-l from-white/75 via-white/30 to-transparent"
    : "bg-gradient-to-r from-white/75 via-white/30 to-transparent";
  return (
    <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-white">
      <img
        ref={bgRef}
        src={image.src}
        alt={image.alt}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover will-change-transform"
      />
      <div className={`absolute inset-0 ${wash}`} />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-20">
        <Reveal className={`max-w-xl ${contentRight ? "ml-auto" : ""}`}>
          <div className="rounded-3xl border border-white/70 bg-white/85 p-8 shadow-[0_24px_70px_-30px_rgba(4,18,12,.55)] backdrop-blur-md sm:p-10">
            <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-700">{kicker}</span>
            <h2 className="mt-3 text-4xl font-black leading-[1.04] tracking-tight text-gray-900 sm:text-5xl">
              {title}
            </h2>
            {body && <p className="mt-5 text-lg font-medium leading-relaxed text-gray-700 sm:text-xl">{body}</p>}
            {points && <Points points={points} />}
            {children}
            <Actions actions={actions} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ————————————————————————— LIGHT — the breathing bands ————————————————————————— */

/**
 * A light/white band. `tone` alternates the ground for rhythm exactly as the
 * homepage does: gray-50 → white → gray-50.
 */
export function Band({
  tone = "white",
  kicker,
  title,
  lede,
  points,
  actions,
  center = false,
  width = "wide",
  children,
}: {
  tone?: "white" | "tint" | "deep";
  kicker?: string;
  title?: ReactNode;
  lede?: ReactNode;
  points?: Point[];
  actions?: Action[];
  center?: boolean;
  width?: "wide" | "prose";
  children?: ReactNode;
}) {
  const ground =
    tone === "tint" ? "bg-gray-50" : tone === "deep" ? "bg-emerald-50/70" : "bg-white";
  const max = width === "prose" ? "max-w-3xl" : "max-w-6xl";
  return (
    <section className={`relative ${ground}`}>
      <div className={`mx-auto ${max} px-6 py-20 sm:py-24 ${center ? "text-center" : ""}`}>
        {(kicker || title || lede) && (
          <Reveal className={center ? "mx-auto max-w-3xl" : "max-w-3xl"}>
            {kicker && (
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-600">{kicker}</span>
            )}
            {title && (
              <h2 className="mt-3 text-4xl font-black leading-[1.04] tracking-tight text-gray-900 sm:text-5xl">
                {title}
              </h2>
            )}
            {lede && (
              <p className="mt-5 text-lg font-medium leading-relaxed text-gray-600 sm:text-xl">{lede}</p>
            )}
            {points && <Points points={points} center={center} />}
          </Reveal>
        )}
        {children && <Reveal delay={100} className="mt-10">{children}</Reveal>}
        {actions && (
          <Reveal delay={160}>
            <Actions actions={actions} center={center} />
          </Reveal>
        )}
      </div>
    </section>
  );
}

/** A light band that splits type against a media column (image or video). */
export function SplitBand({
  tone = "white",
  kicker,
  title,
  lede,
  points,
  actions,
  media,
  mediaRight = true,
}: {
  tone?: "white" | "tint";
  kicker?: string;
  title?: ReactNode;
  lede?: ReactNode;
  points?: Point[];
  actions?: Action[];
  media: ReactNode;
  mediaRight?: boolean;
}) {
  return (
    <section className={`relative ${tone === "tint" ? "bg-gray-50" : "bg-white"}`}>
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-20 sm:py-24 lg:grid-cols-2 lg:gap-16">
        <Reveal className={mediaRight ? "lg:order-1" : "lg:order-2"}>
          {kicker && (
            <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-600">{kicker}</span>
          )}
          {title && (
            <h2 className="mt-3 text-4xl font-black leading-[1.04] tracking-tight text-gray-900 sm:text-5xl">
              {title}
            </h2>
          )}
          {lede && (
            <p className="mt-5 max-w-xl text-lg font-medium leading-relaxed text-gray-600 sm:text-xl">{lede}</p>
          )}
          {points && <Points points={points} />}
          <Actions actions={actions} />
        </Reveal>
        <Reveal delay={120} className={mediaRight ? "lg:order-2" : "lg:order-1"}>
          {media}
        </Reveal>
      </div>
    </section>
  );
}

/* ————————————————————————— small parts ————————————————————————— */

/** A plain white card on a light band — the default container for detail. */
export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-[0_18px_50px_-32px_rgba(4,18,12,.45)] sm:p-7 ${className}`}
    >
      {children}
    </div>
  );
}

export function PanelGrid({ cols = 3, children }: { cols?: 2 | 3 | 4; children: ReactNode }) {
  const grid =
    cols === 2 ? "sm:grid-cols-2" : cols === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
  return <div className={`grid grid-cols-1 gap-5 ${grid}`}>{children}</div>;
}

/** The honest-limits note. Every page that claims something carries one. */
export function Caveat({ title = "What this is not", children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-amber-300/50 bg-amber-50/70 p-6 sm:p-7">
      <h3 className="text-sm font-black uppercase tracking-[0.18em] text-amber-800">{title}</h3>
      <div className="mt-3 space-y-2 text-[15px] leading-relaxed text-amber-950/80">{children}</div>
    </div>
  );
}

/** Kicker → number → source. Never renders a number the caller cannot source. */
export function Stat({ value, label, source }: { value: ReactNode; label: string; source?: string }) {
  return (
    <div className="rounded-2xl border border-emerald-900/10 bg-white p-6">
      <div className="text-3xl font-black tracking-tight text-emerald-700 sm:text-4xl">{value}</div>
      <div className="mt-2 text-sm font-bold text-gray-900">{label}</div>
      {source && <div className="mt-1 text-[12px] leading-snug text-gray-500">{source}</div>}
    </div>
  );
}
