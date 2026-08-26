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
    <section className="surface-raised relative flex min-h-[92svh] items-center overflow-hidden">
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
      <div className="section-shell section-y relative z-10">
        <Reveal className={`max-w-xl ${contentRight ? "ml-auto" : ""}`}>
          <div className="rounded-3xl border border-white/70 bg-white/85 p-6 text-left shadow-[0_24px_70px_-30px_rgba(4,18,12,.55)] backdrop-blur-md sm:p-9 lg:p-10">
            <span className="t-kicker text-emerald-700">{slide.kicker}</span>
            <h2 className="t-band mt-4 text-gray-900">
              {slide.title}
            </h2>
            <p className="t-lede measure mt-5 font-medium text-gray-700">{slide.body}</p>
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
  const bg = index % 2 === 0 ? "surface-sunken" : "surface-raised";
  const hasMedia = Boolean(slide.image || slide.video);
  if (hasMedia) {
    return (
      <section className={`relative ${bg}`}>
        <div className="section-shell section-y grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal className={mediaRight ? "lg:order-1" : "lg:order-2"}>
            <span className="t-kicker text-primary">{slide.kicker}</span>
            <h2 className="t-band mt-4 text-foreground">{slide.title}</h2>
            <p className="t-lede measure mt-5 font-medium text-muted-foreground">{slide.body}</p>
            {slide.points && <Points points={slide.points} />}
            <Cta slide={slide} />
          </Reveal>
          <Reveal delay={120} className={`flex flex-col gap-6 ${mediaRight ? "lg:order-2" : "lg:order-1"}`}>
            {slide.image && (
              <img
                src={slide.image.src}
                alt={slide.image.alt}
                loading="lazy"
                className="w-full rounded-2xl object-cover shadow-xl ring-1 ring-border"
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
      <div className="section-shell-narrow section-y flex flex-col items-center text-center">
        {figure && <div className="hidden sm:block">{figure}</div>}
        <span className={`${figure ? "mt-5" : ""} t-kicker text-primary`}>{slide.kicker}</span>
        <h2 className="t-band mt-4 text-foreground">{slide.title}</h2>
        <p className="t-lede measure measure-center mt-5 font-medium text-muted-foreground">{slide.body}</p>
        {slide.points && <Points points={slide.points} center />}
        <Cta slide={slide} />
      </div>
    </section>
  );
}
