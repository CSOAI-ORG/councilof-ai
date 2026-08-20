import type { ReactNode } from "react";
import type { Slide } from "./types";
import { HeavySection, LightSection } from "./Sections";

/**
 * ScrollWorld — the single renderer behind the homepage story and every deck page.
 *
 * ROBUST BY CONSTRUCTION: a plain, normal document scroll. Every section is a static
 * <section> in flow — no pin, no sticky, no opacity-toggle slides, no 3D perspective.
 * (The old pinned/opacity-slide renderer was buggy on desktop — slide 1 vanished on
 * scroll — and was removed entirely.) Nothing can disappear.
 *
 * Slides with `bg` render as HEAVY full-bleed bands (alternating content column);
 * everything else renders LIGHT (alternating media side, or centered with a figure).
 */
export function ScrollWorld({
  slides,
  renderHero,
  renderFigure,
}: {
  slides: Slide[];
  /** if supplied, slide 0 is rendered by the consumer (e.g. the homepage's locked-H1 reel) */
  renderHero?: (slide: Slide) => ReactNode;
  /** inline figure for media-less light sections */
  renderFigure?: (figureIndex: number) => ReactNode;
}) {
  let heavyCount = 0;
  let lightMediaCount = 0;
  return (
    <div>
      {slides.map((slide, i) => {
        if (i === 0 && renderHero) return <div key={slide.kicker}>{renderHero(slide)}</div>;
        if (slide.bg) {
          const contentRight = heavyCount % 2 === 1; // alternate the overlaid column
          heavyCount += 1;
          return <HeavySection key={slide.kicker} slide={slide} contentRight={contentRight} />;
        }
        const mediaRight = lightMediaCount % 2 === 0; // alternate media side
        if (slide.image || slide.video) lightMediaCount += 1;
        return (
          <LightSection key={slide.kicker} slide={slide} index={i} mediaRight={mediaRight} renderFigure={renderFigure} />
        );
      })}
    </div>
  );
}

export default ScrollWorld;
