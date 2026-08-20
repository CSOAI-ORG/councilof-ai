/**
 * ScrollRail — a slim emerald progress rail showing how far through the story the
 * reader is, with optional labelled ticks for each section.
 *
 * WHY IT IS `sticky` AND NOT `fixed`
 * The kit's hard rule is that nothing may be `position: fixed` or pinned, because
 * a pinned/opacity-toggled scroll is exactly what made sections vanish on desktop
 * once before. This rail therefore uses a zero-height `position: sticky` wrapper:
 *   - it occupies NO layout space (height 0 / width 0), so it cannot offset,
 *     reflow, or shift a single pixel of the page;
 *   - it holds NO content — it is `aria-hidden`, `pointer-events: none`, purely a
 *     decorative indicator, so there is nothing it could possibly hide;
 *   - if sticky is unsupported or JS never runs it degrades to a static bar at the
 *     top of its flow position, which is harmless.
 * The only properties it animates are `transform: scaleX/scaleY` and `opacity` on
 * its own decorative parts.
 *
 * Mount it as the FIRST child of the page wrapper (not inside an
 * `overflow: hidden` ancestor, which would clip it).
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import {
  clamp,
  useIsomorphicLayoutEffect,
  useMediaQuery,
  useScrollEffect,
} from "./scrollEngine";

export interface ScrollRailTick {
  /** Short section name. Decorative — the real heading still lives in the section. */
  label: string;
  /**
   * Position 0…1 along the rail. Omit and ticks are spread evenly.
   * Pass an `elementId` instead to derive the position from the real section.
   */
  at?: number;
  /** `id` of the section this tick marks; measured on mount and on resize. */
  elementId?: string;
}

export interface ScrollRailProps {
  /** Where the rail sits. Default `left`. */
  position?: "left" | "right" | "top";
  /** Optional labelled ticks. */
  ticks?: ScrollRailTick[];
  /** Rail colour. Default the emerald the site already uses. */
  color?: string;
  /** Track colour behind the fill. */
  trackColor?: string;
  /** Rail thickness in px. Default 3. */
  thickness?: number;
  /** Distance from the viewport edge in px (side rails only). Default 24. */
  inset?: number;
  /** Rail length for side variants. Default `"60vh"`. */
  length?: string;
  /** Hide the whole rail below this width. Default `"(min-width: 1024px)"` for side rails. */
  showAt?: string;
  className?: string;
  style?: CSSProperties;
  /** Show the tick labels next to the rail. Default true for side rails. */
  showLabels?: boolean;
}

export function ScrollRail({
  position = "left",
  ticks = [],
  color = "#10b981",
  trackColor = "rgba(16,185,129,0.16)",
  thickness = 3,
  inset = 24,
  length = "60vh",
  showAt,
  className,
  style,
  showLabels = true,
}: ScrollRailProps) {
  const isTop = position === "top";
  const fillRef = useRef<HTMLDivElement | null>(null);
  const tickRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progress = useRef(0);

  const wide = useMediaQuery(showAt || (isTop ? "(min-width: 0px)" : "(min-width: 1024px)"));

  const evenSpread = useCallback(
    (i: number) => (ticks.length > 1 ? i / (ticks.length - 1) : 0),
    [ticks.length]
  );

  /**
   * Tick positions live in state, not a ref, so the rendered `top` is always the
   * resolved one — never a first-paint estimate that nothing re-renders away.
   * They start at an even spread, which is a correct-looking rail even if the
   * sections cannot be measured.
   */
  const [resolved, setResolved] = useState<number[]>(() => ticks.map((_, i) => evenSpread(i)));

  const measureTicks = useCallback(() => {
    if (typeof document === "undefined") return;
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    const next = ticks.map((t, i) => {
      if (typeof t.at === "number") return clamp(t.at, 0, 1);
      if (t.elementId && scrollable > 0) {
        const el = document.getElementById(t.elementId);
        if (el) {
          const top = el.getBoundingClientRect().top + (window.scrollY || 0);
          return clamp(top / scrollable, 0, 1);
        }
      }
      return evenSpread(i);
    });
    setResolved((prev) =>
      prev.length === next.length && prev.every((v, i) => Math.abs(v - next[i]) < 0.002)
        ? prev
        : next
    );
  }, [ticks, evenSpread]);

  useIsomorphicLayoutEffect(() => {
    measureTicks();
  }, [measureTicks, wide]);

  // Sections grow as images and lazy chunks land: re-measure on resize and once
  // the page has settled. Never inside the scroll frame — that would thrash.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => measureTicks();
    window.addEventListener("resize", onResize, { passive: true });
    const settle = window.setTimeout(measureTicks, 600);
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(settle);
    };
  }, [measureTicks]);

  useScrollEffect(
    () => {
      if (typeof document === "undefined") return;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      progress.current = scrollable > 0 ? clamp((window.scrollY || 0) / scrollable, 0, 1) : 0;
    },
    () => {
      const fill = fillRef.current;
      const p = Math.round(progress.current * 1000) / 1000;
      if (fill) {
        fill.style.transform = isTop ? `scaleX(${p})` : `scaleY(${p})`;
      }
      tickRefs.current.forEach((node, i) => {
        if (!node) return;
        const at = resolved[i] ?? 0;
        const lit = p >= at - 0.005;
        node.style.opacity = lit ? "1" : "0.35";
        node.style.transform = lit ? "scale(1)" : "scale(0.72)";
      });
    },
    wide
  );

  if (!wide) return null;

  // Zero-space sticky shell — cannot offset layout, cannot trap focus, holds no content.
  const shell: CSSProperties = {
    position: "sticky",
    top: 0,
    height: 0,
    width: "100%",
    zIndex: 30,
    pointerEvents: "none",
    overflow: "visible",
    display: "flex",
    justifyContent: position === "right" ? "flex-end" : "flex-start",
    ...style,
  };

  if (isTop) {
    return (
      <div aria-hidden="true" role="presentation" className={className} style={shell}>
        <div
          style={{
            width: "100%",
            height: thickness,
            background: trackColor,
            overflow: "hidden",
          }}
        >
          <div
            ref={fillRef}
            style={{
              width: "100%",
              height: "100%",
              background: color,
              transform: "scaleX(0)",
              transformOrigin: "left center",
              willChange: "transform",
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div aria-hidden="true" role="presentation" className={className} style={shell}>
      <div
        style={{
          marginTop: `calc((100vh - ${length}) / 2)`,
          marginLeft: position === "left" ? inset : 0,
          marginRight: position === "right" ? inset : 0,
          height: length,
          width: thickness,
          background: trackColor,
          borderRadius: thickness,
          position: "relative",
        }}
      >
        <div
          ref={fillRef}
          style={{
            position: "absolute",
            inset: 0,
            background: color,
            borderRadius: thickness,
            transform: "scaleY(0)",
            transformOrigin: "center top",
            willChange: "transform",
          }}
        />
        {ticks.map((tick, i) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={`${tick.label}-${i}`}
            ref={(node) => {
              tickRefs.current[i] = node;
            }}
            style={{
              position: "absolute",
              top: `${(resolved[i] ?? evenSpread(i)) * 100}%`,
              left: "50%",
              marginLeft: -4,
              marginTop: -4,
              width: 8,
              height: 8,
              borderRadius: 8,
              background: color,
              opacity: 0.35,
              transform: "scale(0.72)",
              transformOrigin: "center",
              display: "flex",
              alignItems: "center",
            }}
          >
            {showLabels ? (
              <span
                style={{
                  position: "absolute",
                  [position === "right" ? "right" : "left"]: 16,
                  whiteSpace: "nowrap",
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color,
                  opacity: 0.85,
                } as CSSProperties}
              >
                {tick.label}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ScrollRail;
