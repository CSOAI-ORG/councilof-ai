import { useEffect, useRef, useState, type ReactNode } from "react";

/* ————— motion helpers — all animate opacity/transform ONLY; content never leaves the flow ————— */

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

/** Fade + rise the first time a block scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }),
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-[900ms] ease-out ${shown ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/** Scroll-world parallax: drifts the BACKGROUND layer only. */
export function useParallax(strength = 14) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const vh = window.innerHeight || 0;
      const r = el.getBoundingClientRect();
      // The rect already carries the transform written last frame, so on a zero-height
      // viewport (or a zero rect) the feedback runs away — a sibling copy of this hook
      // was measured at translateY ~287,000px. Bail on the degenerate case, and clamp
      // the ratio so a pathological rect can never drive an unbounded offset.
      if (!vh || !r.height) return;
      const raw = (r.top + r.height / 2 - vh / 2) / vh;
      const p = Math.max(-2, Math.min(2, raw));
      el.style.transform = `translate3d(0, ${(-p * strength).toFixed(2)}%, 0) scale(1.16)`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [strength]);
  return ref;
}
