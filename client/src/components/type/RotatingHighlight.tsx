import { useEffect, useRef, useState } from "react";

/**
 * RotatingHighlight — a section title whose key phrase cycles through the
 * audiences/keywords that section serves, highlighted in emerald.
 *
 * Two things make this safe rather than a gimmick:
 *
 * 1. AEO/SEO: every variant is present in the DOM. Crawlers and answer engines
 *    that do not run the rotation still read the complete keyword set, because
 *    the non-visible variants are rendered (visually hidden, not removed).
 *    A JS-only rotator would hide most of your keywords from the very engines
 *    you want to be cited by.
 *
 * 2. No layout shift: all variants are stacked in one grid cell, so the line
 *    box is sized by the LONGEST word from first paint. Nothing reflows as it
 *    cycles — rotating text is a classic CLS offender and this avoids it.
 *
 * Reduced motion: renders the first variant, static. Content never depends on
 * the animation running.
 */
export function RotatingHighlight({
  before,
  words,
  after,
  intervalMs = 2600,
  className = "",
}: {
  before?: string;
  words: string[];
  after?: string;
  intervalMs?: number;
  className?: string;
}) {
  const [i, setI] = useState(0);
  const [reduced, setReduced] = useState(false);
  const liveRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);

  useEffect(() => {
    if (reduced || words.length < 2) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % words.length), intervalMs);
    return () => window.clearInterval(t);
  }, [reduced, words.length, intervalMs]);

  return (
    <span className={className}>
      {before ? <>{before} </> : null}
      {/* one grid cell, every variant stacked — sized by the longest, so no CLS */}
      <span ref={liveRef} className="relative inline-grid align-baseline">
        {words.map((w, n) => (
          <span
            key={w}
            aria-hidden={n !== i}
            className={`col-start-1 row-start-1 whitespace-nowrap text-emerald-600 transition-all duration-500 ease-out ${
              reduced
                ? n === 0
                  ? "opacity-100"
                  : "opacity-0"
                : n === i
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-1 opacity-0"
            }`}
          >
            {w}
          </span>
        ))}
      </span>
      {after ? <> {after}</> : null}
    </span>
  );
}

/** Dark-section variant: the highlight reads emerald-300 on ink grounds. */
export function RotatingHighlightDark(props: React.ComponentProps<typeof RotatingHighlight>) {
  return (
    <span className="[&_.text-emerald-600]:!text-emerald-300">
      <RotatingHighlight {...props} />
    </span>
  );
}
