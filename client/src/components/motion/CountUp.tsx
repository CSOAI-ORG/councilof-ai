/**
 * CountUp — animates a number up when it scrolls into view.
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * HONESTY GUARD — BINDING, NOT A STYLE NOTE
 * ══════════════════════════════════════════════════════════════════════════════
 * This component MUST NEVER be given a hardcoded, rounded-up, estimated, or
 * invented figure. It exists to animate a number that was MEASURED, and the only
 * legitimate source is a live endpoint — typically `/api/gspc` — or another value
 * that is recomputable from its rows.
 *
 * Concretely:
 *   - `value` is the TRUE final number. There is no `to`, `target`, or `fake`
 *     prop, and the component cannot be told to count to something it was not
 *     given.
 *   - The true value is what React renders as text. The animation temporarily
 *     overwrites the text node AFTER mount and always lands back on the exact
 *     same value. Prerendered HTML, view-source, a copy/paste, an answer engine
 *     scraping the page, and a screen reader all see the real figure.
 *   - `prefers-reduced-motion`, JS disabled, a slow bundle, a thrown error
 *     upstream — every one of those paths renders the true value immediately and
 *     statically. There is no state in which a wrong number is on screen.
 *   - `value={null}` (fetch failed / not measured yet) renders `placeholder`
 *     (default "—"). It does NOT guess, does not fall back to a last-known
 *     constant, and does not animate. An unmeasured number stays unmeasured.
 *
 * Anyone wiring this into a page: fetch the figure, pass it through, and cite the
 * source next to it. If you find yourself typing a literal into `value`, stop —
 * that is the exact failure this guard is here to prevent.
 * ══════════════════════════════════════════════════════════════════════════════
 */
import { useEffect, useRef, type CSSProperties } from "react";
import { addTicker, useReducedMotion } from "./scrollEngine";

export interface CountUpProps {
  /**
   * The TRUE, measured value. Pass `null`/`undefined` when it is not available —
   * never a placeholder integer. See the honesty guard above.
   */
  value: number | null | undefined;
  /** Animation length in ms. Default 900. */
  duration?: number;
  /** Decimal places for the default formatter. Default 0. */
  decimals?: number;
  /** Custom formatter. Receives the interpolated number; must be pure. */
  format?: (n: number) => string;
  /** Rendered verbatim before/after the number (inside the same element). */
  prefix?: string;
  suffix?: string;
  /** Shown when `value` is null/undefined/non-finite. Default `"—"`. */
  placeholder?: string;
  /** Where the count starts. Default 0. Purely cosmetic; the landing value is always `value`. */
  from?: number;
  className?: string;
  style?: CSSProperties;
}

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export function CountUp({
  value,
  duration = 900,
  decimals = 0,
  format,
  prefix = "",
  suffix = "",
  placeholder = "—",
  from = 0,
  className,
  style,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const played = useRef(false);
  const reduced = useReducedMotion();

  const valid = typeof value === "number" && Number.isFinite(value);
  const formatter =
    format ||
    ((n: number) =>
      n.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }));

  // The TRUE value is the rendered text. Everything below is a temporary overlay.
  const truth = valid ? `${prefix}${formatter(value as number)}${suffix}` : placeholder;

  useEffect(() => {
    played.current = false;
  }, [value]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !valid || reduced || played.current) return;
    if (typeof IntersectionObserver === "undefined") return; // stays at the true value
    if (typeof window === "undefined" || !("requestAnimationFrame" in window)) return;

    const target = value as number;
    let stopTicker: (() => void) | null = null;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || played.current) continue;
          played.current = true;
          io.disconnect();

          const startedAt =
            typeof performance !== "undefined" ? performance.now() : Date.now();

          stopTicker = addTicker((now) => {
            const node = ref.current;
            if (!node) return false;
            const t = Math.min(1, (now - startedAt) / Math.max(1, duration));
            const n = from + (target - from) * easeOutCubic(t);
            // Land on the exact measured value, never on an eased approximation.
            node.textContent =
              t >= 1 ? truth : `${prefix}${formatter(n)}${suffix}`;
            return t < 1;
          });
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.2 }
    );

    io.observe(el);
    return () => {
      io.disconnect();
      if (stopTicker) stopTicker();
      // Whatever happens, the DOM is left holding the true value.
      const node = ref.current;
      if (node) node.textContent = truth;
    };
    // `truth` covers value/prefix/suffix/format changes.
  }, [truth, valid, reduced, duration, from, value, prefix, suffix, formatter]);

  return (
    <span
      ref={ref}
      className={className}
      style={style}
      data-motion="count-up"
      data-true-value={valid ? String(value) : "unmeasured"}
    >
      {truth}
    </span>
  );
}

export default CountUp;
