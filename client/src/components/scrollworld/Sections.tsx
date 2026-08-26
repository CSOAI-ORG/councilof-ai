import type { ReactNode } from "react";
import type { Slide } from "./types";
import { Points, Cta } from "./Points";
import { Reveal, useParallax } from "./motion";
import { VideoEmbed } from "./VideoEmbed";

/* ————— HEAVY — full-bleed image band, content overlaid on a frosted white panel ————— */
export function HeavySection({ slide, contentRight }: { slide: Slide; contentRight: boolean }) {
  const bgRef = useParallax(16);
  // The claymation world is BRIGHT — no dark scrim over it. Type sits on a frosted
  // white panel over the image's open space, so the art stays vivid and the words
  // stay legible whatever is behind them.
  const wash = contentRight
    ? "bg-gradient-to-l from-white/70 via-white/25 to-transparent"
    : "bg-gradient-to-r from-white/70 via-white/25 to-transparent";
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-white">
      {slide.bg && (
        <img
          ref={bgRef}
          src={slide.bg.src}
          alt={slide.bg.alt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover will-change-transform"
        />
      )}
      <div className={`absolute inset-0 ${wash}`} />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-24">
        <Reveal className={`max-w-xl ${contentRight ? "ml-auto" : ""}`}>
          <div className="rounded-3xl border border-white/70 bg-white/80 p-8 text-left shadow-[0_24px_70px_-30px_rgba(4,18,12,.55)] backdrop-blur-md sm:p-10">
            <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-700">{slide.kicker}</span>
            <h2 className="mt-3 text-4xl font-black leading-[1.04] tracking-tight text-gray-900 sm:text-5xl lg:text-[3.4rem]">
              {slide.title}
            </h2>
            <p className="mt-5 text-lg font-medium leading-relaxed text-gray-700 sm:text-xl">{slide.body}</p>
            {slide.points && <Points points={slide.points} />}
            {slide.video && (
              <VideoEmbed src={slide.video.src} poster={slide.video.poster} title={slide.video.title} className="mt-8 !mx-0" />
            )}
            <Cta slide={slide} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ————— LIGHT — breathing band: image and/or video (split) or figure (centered) ————— */
export function LightSection({
  slide,
  index,
  mediaRight,
  renderFigure,
}: {
  slide: Slide;
  index: number;
  mediaRight: boolean;
  /** consumer-supplied inline figure for media-less light sections (optional) */
  renderFigure?: (figureIndex: number) => ReactNode;
}) {
  const bg = index % 2 === 0 ? "bg-gray-50" : "bg-white";
  const hasMedia = Boolean(slide.image || slide.video);
  if (hasMedia) {
    return (
      <section className={`relative ${bg}`}>
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-20 sm:py-24 lg:grid-cols-2 lg:gap-16">
          <Reveal className={mediaRight ? "lg:order-1" : "lg:order-2"}>
            <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-700">{slide.kicker}</span>
            <h2 className="mt-3 text-4xl font-black leading-[1.04] tracking-tight text-gray-900 sm:text-5xl">{slide.title}</h2>
            <p className="mt-5 max-w-xl text-lg font-medium leading-relaxed text-gray-600 sm:text-xl">{slide.body}</p>
            {slide.points && <Points points={slide.points} />}
            <Cta slide={slide} />
          </Reveal>
          <Reveal delay={120} className={`flex flex-col gap-6 ${mediaRight ? "lg:order-2" : "lg:order-1"}`}>
            {slide.image && (
              <img
                src={slide.image.src}
                alt={slide.image.alt}
                loading="lazy"
                className="w-full rounded-2xl object-cover shadow-xl ring-1 ring-black/10"
              />
            )}
            {slide.video && (
              <VideoEmbed src={slide.video.src} poster={slide.video.poster} title={slide.video.title} className="!max-w-none" />
            )}
          </Reveal>
        </div>
      </section>
    );
  }
  // media-less light section — centered, with the consumer's figure if it supplies one
  const figure = renderFigure?.(slide.figure ?? index);
  return (
    <section className={`relative ${bg}`}>
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-20 text-center sm:py-24">
        {figure && <div className="hidden sm:block">{figure}</div>}
        <span className={`${figure ? "mt-4" : ""} text-xs font-bold uppercase tracking-[0.22em] text-emerald-700`}>{slide.kicker}</span>
        <h2 className="mt-3 max-w-3xl text-4xl font-black leading-[1.04] tracking-tight text-gray-900 sm:text-5xl">{slide.title}</h2>
        <p className="mt-5 max-w-2xl text-lg font-medium leading-relaxed text-gray-600 sm:text-xl">{slide.body}</p>
        {slide.points && <Points points={slide.points} center />}
        <Cta slide={slide} />
      </div>
    </section>
  );
}
