/**
 * councilof.ai scroll-world motion kit.
 *
 * THE ONE RULE EVERY COMPONENT HERE OBEYS
 * Transform and opacity only. Content stays in normal document flow, permanently.
 * Nothing is `position: fixed`, nothing is pinned, nothing is removed or hidden
 * when JS is slow, absent, or broken — and every component has a correct static
 * fallback under `prefers-reduced-motion: reduce`.
 *
 * All instances share ONE scroll listener and ONE rAF loop with reads batched
 * before writes (see `scrollEngine.ts`). No new dependencies.
 *
 * Live demo of everything: /motion-lab
 */
export { SectionBlend } from "./SectionBlend";
export type {
  SectionBlendProps,
  SectionBlendVariant,
  SectionBlendFlip,
} from "./SectionBlend";

export { ParallaxLayer } from "./ParallaxLayer";
export type { ParallaxLayerProps } from "./ParallaxLayer";

export { DrawOnScroll } from "./DrawOnScroll";
export type { DrawOnScrollProps, DrawPreset } from "./DrawOnScroll";

export { ScrollRail } from "./ScrollRail";
export type { ScrollRailProps, ScrollRailTick } from "./ScrollRail";

export { CountUp } from "./CountUp";
export type { CountUpProps } from "./CountUp";

export { GrainOverlay } from "./GrainOverlay";
export type { GrainOverlayProps } from "./GrainOverlay";

export {
  useReducedMotion,
  useMediaQuery,
  useNearViewport,
  useScrollEffect,
  subscribe,
  addTicker,
  schedule,
  clamp,
} from "./scrollEngine";
export type { ScrollFrame, ScrollSubscriber, Ticker } from "./scrollEngine";
