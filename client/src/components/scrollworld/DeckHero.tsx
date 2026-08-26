import { useEffect, useState } from "react";
import { useParallax } from "./motion";

/**
 * LiveBoardCount — the coverage sentence, READ LIVE from /api/gspc.
 *
 * Never hardcode the count. Until the fetch lands (and in the prerendered HTML that
 * answer engines read) we show the last PUBLISHED ruling string and label it as such,
 * then swap to whatever the live board actually says. If the board is unreachable we
 * say so and point at the endpoint — we never invent a number to fill the gap.
 */
export function LiveBoardCount({ className = "" }: { className?: string }) {
  const [live, setLive] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch("/api/gspc")
      .then((r) => r.json())
      .then((d) => { if (alive) setLive(d?.totals?.public_count ?? null); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, []);
  return (
    <span className={className}>
      {live ? (
        <>
          <strong>{live}</strong> — live from{" "}
          <a href="/api/gspc" className="underline decoration-emerald-400 underline-offset-2">/api/gspc</a>
        </>
      ) : failed ? (
        <>
          Board unreachable from this browser — read it yourself at{" "}
          <a href="/api/gspc" className="underline decoration-emerald-400 underline-offset-2">/api/gspc</a>
        </>
      ) : (
        <>
          Coverage is live on{" "}
          <a href="/api/gspc" className="underline decoration-emerald-400 underline-offset-2">/api/gspc</a>
        </>
      )}
    </span>
  );
}

/**
 * DeckHero — the opening band of a deck scroll-world. One full-bleed branded image,
 * a kicker, an H1, a plain-English standfirst, up to two calls to action, and the
 * live coverage line. Deliberately simpler than the homepage hero (which owns a
 * locked H1 and a Ken-Burns reel).
 */
export function DeckHero({
  kicker,
  title,
  lede,
  bg,
  actions = [],
}: {
  kicker: string;
  title: string;
  lede: string;
  bg: { src: string; alt: string };
  actions?: { href: string; label: string; primary?: boolean }[];
}) {
  const bgRef = useParallax(10);
  return (
    <section className="relative flex min-h-[88svh] items-center justify-center overflow-hidden bg-[#05130d]">
      <img
        ref={bgRef}
        src={bg.src}
        alt={bg.alt}
        loading="eager"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover will-change-transform"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/70" />
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 py-24 text-center">
        <span className="rounded-full border border-emerald-300/30 bg-black/30 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-200 backdrop-blur-sm">
          {kicker}
        </span>
        <h1 className="mt-8 text-4xl font-black leading-[1.04] tracking-tight text-white [text-shadow:0_4px_28px_rgba(0,0,0,.6)] sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-white/90 [text-shadow:0_2px_14px_rgba(0,0,0,.65)] sm:text-xl">
          {lede}
        </p>
        {actions.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {actions.map((a) => (
              <a
                key={a.href + a.label}
                href={a.href}
                className={
                  a.primary
                    ? "inline-flex min-h-[44px] items-center rounded-xl bg-emerald-700 px-6 py-3 text-base font-extrabold text-white shadow-lg transition-colors hover:bg-emerald-800"
                    : "inline-flex items-center rounded-xl border-2 border-white/40 bg-white/5 px-6 py-3 text-base font-extrabold text-white backdrop-blur-sm transition-colors hover:bg-white/15"
                }
              >
                {a.label}
              </a>
            ))}
          </div>
        )}
        <p className="mt-7 max-w-2xl text-[13px] font-medium text-white/75">
          Measurement, not certification. <LiveBoardCount />
        </p>
      </div>
    </section>
  );
}
