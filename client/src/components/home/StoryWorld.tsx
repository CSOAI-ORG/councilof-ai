import { useEffect, useState } from "react";
import { ScrollWorld, usePrefersReducedMotion, type Slide } from "@/components/scrollworld";

/**
 * StoryWorld — the councilof.ai homepage as an EPIC but ROBUST scroll-world.
 */

export const STORY: Slide[] = [
  {
    kicker: "Governance router · measurement harness",
    body: "Eunomia routes governance instruments — frameworks, law, benchmarks, compute. GSPC signs what was measured downstream: a small card you can re-check, not a slide deck. We do not compete on LLM toll roads; we prove routing was correct. Measurement, not certification.",
    bg: { src: "/images/coliseum_hero_arena.jpg", alt: "Clay figures and green verification seals gathered in a marble arena" },
  },
];

export default function StoryWorld() {
  return (
    <ScrollWorld
      slides={STORY}
      renderHero={(slide) => <section>{slide.kicker}</section>}
      renderFigure={() => null}
    />
  );
}
