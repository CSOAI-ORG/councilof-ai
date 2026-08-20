/**
 * ParallaxLayer — generalised depth. Drifts its children on scroll so background
 * material moves slower than the page and foreground material moves faster.
 *
 * THE SAFETY RULE THIS COMPONENT EXISTS TO OBEY
 * The only thing it ever touches is `transform: translate3d(...)`. It never sets
 * `position: fixed`, never pins, never toggles `opacity` to zero, never unmounts
 * or hides its children. The children are ordinary flow content inside an
 * ordinary `<div>`: if the bundle never loads, if rAF never fires, if
 * `prefers-reduced-motion` is set — the layer renders at offset 0 and the section
 * reads exactly as designed. There is no state in which content disappears.
 *
 * PERFORMANCE
 * All instances share ONE scroll listener and ONE rAF loop (see `scrollEngine`).
 * Reads are batched before writes, so N layers cost one reflow per frame, not N.
 * A layer that is not near the viewport unsubscribes entirely, and `will-change`
 * is only applied while it is actually animating.
 *
 *     <ParallaxLayer speed={-0.25}>  …slow, sits behind…   </ParallaxLayer>
 *     <ParallaxLayer speed={0.18}>   …fast, sits in front… </ParallaxLayer>
 */
import { useRef, type CSSProperties, type ElementType, type ReactNode } from "react";
import {
  clamp,
  useIsomorphicLayoutEffect,
  useNearViewport,
  useReducedMotion,
  useScrollEffect,
} from "./scrollEngine";

export interface ParallaxLayerProps {
  /**
   * Drift rate. 0 is static. Negative moves the layer AGAINST the scroll (slower,
   * reads as further away); positive moves it WITH the scroll (faster, nearer).
   * Sane range is -0.4 … 0.4; larger values look seasick.
   */
  speed?: number;
  /** Drift axis. Default `y`. */
  axis?: "x" | "y";
  /** Hard clamp on the drift in px, so a long section can never fling content far. Default 120. */
  maxOffset?: number;
  /** Element to render. Default `div`. */
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function ParallaxLayer({
  speed = -0.2,
  axis = "y",
  maxOffset = 120,
  as: Tag = "div",
  className,
  style,
  children,
}: ParallaxLayerProps) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const near = useNearViewport(ref);

  /** Offset we last wrote, so the next measurement can subtract our own transform. */
  const applied = useRef(0);
  /** Offset computed in the read phase, applied in the write phase. */
  const next = useRef(0);
  const hinted = useRef(false);

  const active = !reduced && speed !== 0 && near;

  useScrollEffect(
    (frame) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Undo our own contribution so the maths is stable frame to frame.
      const rawTop = (axis === "y" ? rect.top : rect.top) - (axis === "y" ? applied.current : 0);
      const rawLeft = rect.left - (axis === "x" ? applied.current : 0);
      const centre =
        axis === "y" ? rawTop + rect.height / 2 : rawLeft + rect.width / 2;
      const middle = axis === "y" ? frame.viewportH / 2 : frame.viewportW / 2;
      next.current = clamp((centre - middle) * speed, -maxOffset, maxOffset);
    },
    () => {
      const el = ref.current;
      if (!el) return;
      const value = Math.round(next.current * 100) / 100;
      if (value === applied.current) return;
      applied.current = value;
      el.style.transform =
        axis === "y" ? `translate3d(0, ${value}px, 0)` : `translate3d(${value}px, 0, 0)`;
      if (!hinted.current) {
        el.style.willChange = "transform";
        hinted.current = true;
      }
    },
    active
  );

  // When the layer goes inactive (reduced motion switched on, scrolled far away),
  // settle back to rest and drop the compositor hint. Never leaves a stale offset.
  useIsomorphicLayoutEffect(() => {
    if (active) return;
    const el = ref.current;
    applied.current = 0;
    next.current = 0;
    hinted.current = false;
    if (el) {
      el.style.transform = "";
      el.style.willChange = "";
    }
  }, [active]);

  const AnyTag = Tag as ElementType;

  return (
    <AnyTag
      ref={ref as never}
      className={className}
      // No transform on first paint: content lands exactly where the CSS puts it.
      style={style}
      data-motion="parallax-layer"
      data-motion-active={active ? "true" : "false"}
    >
      {children}
    </AnyTag>
  );
}

export default ParallaxLayer;
