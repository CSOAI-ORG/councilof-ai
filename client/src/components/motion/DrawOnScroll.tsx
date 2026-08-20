/**
 * DrawOnScroll — an SVG line that draws itself as the section enters the viewport.
 * Built for the evidence motifs: the hash chain, the evidence rail, the arc that
 * carries a claim from measurement to publication.
 *
 * MECHANISM
 * `stroke-dasharray` is set to the path length and `stroke-dashoffset` is driven
 * from the element's own intersection progress. Both are paint-only properties on
 * a decorative graphic — no layout, no `position: fixed`, no pinning, nothing
 * removed from flow.
 *
 * IF JS NEVER RUNS
 * The path renders FULLY DRAWN. The undrawn state is armed in a layout effect
 * before the browser paints, so there is no flash — but the fallback direction is
 * deliberately "visible and complete", never "invisible". A slow bundle can never
 * leave a blank hole in the page.
 *
 * REDUCED MOTION
 * `prefers-reduced-motion: reduce` → the path renders fully drawn and static. No
 * subscription to the scroll loop at all.
 */
import { useMemo, useRef, useState, type CSSProperties } from "react";
import {
  clamp,
  useIsomorphicLayoutEffect,
  useNearViewport,
  useReducedMotion,
  useScrollEffect,
} from "./scrollEngine";

export type DrawPreset = "chain" | "rail" | "arc";

export interface DrawOnScrollProps {
  /** Ready-made motif. Ignored when `d` is supplied. Default `rail`. */
  preset?: DrawPreset;
  /** Custom path data — one `d` string or several drawn as one continuous stroke. */
  d?: string | string[];
  /** Only needed alongside a custom `d`. Presets bring their own. */
  viewBox?: string;
  /** Stroke colour. `currentColor` by default, so it inherits the section's text colour. */
  stroke?: string;
  strokeWidth?: number;
  /**
   * Progress window, as a fraction of viewport height measured from the top.
   * Drawing starts when the element's top passes `start` and completes at `end`.
   * Defaults 0.92 → 0.42 (starts near the fold, finishes just above centre).
   */
  start?: number;
  end?: number;
  /** Once fully drawn, stay drawn even if the user scrolls back up. Default true. */
  once?: boolean;
  /** Box height. Number is px. Default `auto` (the SVG's intrinsic ratio). */
  height?: number | string;
  /**
   * Give the graphic an accessible name if it carries meaning. Omit and it is
   * `aria-hidden` — which is right for pure decoration.
   */
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}

interface PresetDef {
  viewBox: string;
  paths: string[];
}

/** A run of interlocking links — the hash chain. Drawn as one continuous stroke. */
function chainPath(): string[] {
  const links: string[] = [];
  const rx = 46;
  const ry = 26;
  const step = 78; // < 2*rx, so consecutive links overlap and read as interlocked
  for (let i = 0; i < 7; i += 1) {
    const cx = 62 + i * step;
    links.push(
      `M${cx - rx},60 a${rx},${ry} 0 1,0 ${rx * 2},0 a${rx},${ry} 0 1,0 ${-rx * 2},0`
    );
  }
  return links;
}

/** A ledger rail: one long spine with evidence ticks hanging off it. */
function railPath(): string[] {
  const parts: string[] = ["M8,60 H592"];
  for (let i = 0; i < 8; i += 1) {
    const x = 40 + i * 74;
    const up = i % 2 === 0;
    parts.push(up ? `M${x},60 V30 m0,0 h26` : `M${x},60 V90 m0,0 h26`);
  }
  return parts;
}

const PRESETS: Record<DrawPreset, PresetDef> = {
  chain: { viewBox: "0 0 600 120", paths: chainPath() },
  rail: { viewBox: "0 0 600 120", paths: railPath() },
  arc: {
    viewBox: "0 0 600 120",
    paths: ["M12,108 C 150,6 450,6 588,108"],
  },
};

export function DrawOnScroll({
  preset = "rail",
  d,
  viewBox,
  stroke = "currentColor",
  strokeWidth = 2,
  start = 0.92,
  end = 0.42,
  once = true,
  height,
  ariaLabel,
  className,
  style,
}: DrawOnScrollProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const lengths = useRef<number[]>([]);
  const progress = useRef(1); // 1 = fully drawn — the safe default
  const peak = useRef(0);

  const reduced = useReducedMotion();
  const near = useNearViewport(hostRef, "35% 0px 35% 0px");
  const [armed, setArmed] = useState(false);

  const { paths, box } = useMemo(() => {
    if (d) {
      return {
        paths: Array.isArray(d) ? d : [d],
        box: viewBox || PRESETS[preset].viewBox,
      };
    }
    const def = PRESETS[preset];
    return { paths: def.paths, box: viewBox || def.viewBox };
  }, [d, preset, viewBox]);

  const animate = !reduced;

  // Arm BEFORE paint: measure each path and set the undrawn state in the same
  // frame React commits, so nothing flashes from drawn to undrawn.
  useIsomorphicLayoutEffect(() => {
    if (!animate) {
      // Reduced motion: strip any dash state, leave it fully drawn.
      pathRefs.current.forEach((p) => {
        if (!p) return;
        p.style.strokeDasharray = "";
        p.style.strokeDashoffset = "";
      });
      setArmed(false);
      peak.current = 0;
      return;
    }
    lengths.current = pathRefs.current.map((p) => {
      if (!p) return 0;
      try {
        return p.getTotalLength();
      } catch {
        return 0;
      }
    });
    pathRefs.current.forEach((p, i) => {
      const len = lengths.current[i];
      if (!p || !len) return;
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = `${len}`;
    });
    setArmed(true);
  }, [animate, paths]);

  useScrollEffect(
    (frame) => {
      const el = hostRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const from = frame.viewportH * start;
      const to = frame.viewportH * end;
      const span = from - to || 1;
      let p = clamp((from - rect.top) / span, 0, 1);
      if (once) {
        peak.current = Math.max(peak.current, p);
        p = peak.current;
      }
      progress.current = p;
    },
    () => {
      const p = progress.current;
      pathRefs.current.forEach((path, i) => {
        const len = lengths.current[i];
        if (!path || !len) return;
        const offset = Math.round(len * (1 - p) * 100) / 100;
        path.style.strokeDashoffset = `${offset}`;
      });
    },
    animate && armed && near
  );

  const a11y = ariaLabel
    ? { role: "img" as const, "aria-label": ariaLabel }
    : { "aria-hidden": true as const, role: "presentation" as const };

  return (
    <div
      ref={hostRef}
      className={className}
      style={{
        display: "block",
        width: "100%",
        height: typeof height === "number" ? `${height}px` : height,
        lineHeight: 0,
        pointerEvents: "none",
        ...style,
      }}
      data-motion="draw-on-scroll"
    >
      <svg
        viewBox={box}
        fill="none"
        focusable="false"
        {...a11y}
        style={{ display: "block", width: "100%", height: height ? "100%" : "auto" }}
      >
        {ariaLabel ? <title>{ariaLabel}</title> : null}
        {paths.map((pathData, i) => (
          <path
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            ref={(node) => {
              pathRefs.current[i] = node;
            }}
            d={pathData}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </div>
  );
}

export default DrawOnScroll;
