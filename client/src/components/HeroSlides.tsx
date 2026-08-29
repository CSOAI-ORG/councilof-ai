import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";

/**
 * HeroSlides — the cinematic slide band for page tops.
 *
 * Three slides, each an animated canvas scene in brand light:
 *   1. "Measured, not modelled" — the grid of measured cells connecting (emerald)
 *   2. "The Council OS" — the 33-seat council ring, breathing (teal/gold)
 *   3. "We publish our failures" — refutation glyphs falling like snow (amber)
 *
 * Discipline: every number on screen is canon (417 provisions, 193 GovBench
 * items, 9 refutations — all real, all recomputable). No composites, no hype.
 * Honors prefers-reduced-motion (static frame, no auto-advance).
 */

type Slide = {
  kicker: string;
  headline: [string, string]; // [plain, gradient]
  sub: string;
  cta: { label: string; href: string; primary?: boolean };
  scene: "cells" | "council" | "glyphs";
};

const SLIDES: Slide[] = [
  {
    kicker: "THE INSTRUMENTS",
    headline: ["Measured,", "not modelled."],
    sub: "417 statutory provisions · 237 scored GovBench items · every verdict a predicate an auditor can recompute.",
    cta: { label: "See the board", href: "/gspc-scoreboard", primary: true },
    scene: "cells",
  },
  {
    kicker: "THE COUNCIL OS",
    headline: ["Every seat signed.", "Every vote an artefact."],
    sub: "A council architecture where every seat is signed and every vote is an artefact — shown, not claimed.",
    cta: { label: "Open Council OS", href: "/os", primary: true },
    scene: "council",
  },
  {
    kicker: "THE REFUTATION LEDGER",
    headline: ["We publish", "our failures."],
    sub: "9 killed bets, on the live site, with the artefacts. Trust through falsifiability — not adjectives.",
    cta: { label: "Read the ledger", href: "/refutation-ledger", primary: true },
    scene: "glyphs",
  },
];

/* ── canvas scenes ─────────────────────────────────────────────────────── */

function startScene(canvas: HTMLCanvasElement, kind: Slide["scene"], reduced: boolean) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  let raf = 0;
  let w = (canvas.width = canvas.offsetWidth * devicePixelRatio);
  let h = (canvas.height = canvas.offsetHeight * devicePixelRatio);

  const onResize = () => {
    w = canvas.width = canvas.offsetWidth * devicePixelRatio;
    h = canvas.height = canvas.offsetHeight * devicePixelRatio;
  };
  window.addEventListener("resize", onResize);

  const N = kind === "glyphs" ? 70 : 60;
  const pts = Array.from({ length: N }, (_, i) => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.18 * devicePixelRatio,
    vy: kind === "glyphs" ? (0.25 + Math.random() * 0.5) * devicePixelRatio : (Math.random() - 0.5) * 0.18 * devicePixelRatio,
    r: (1 + Math.random() * 2.2) * devicePixelRatio,
    i,
  }));

  const colors: Record<Slide["scene"], string> = {
    cells: "16,185,129",
    council: "45,212,191",
    glyphs: "251,191,36",
  };
  const col = colors[kind];

  const draw = (t: number) => {
    ctx.clearRect(0, 0, w, h);

    if (kind === "council") {
      // the 33-seat ring, slowly rotating
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.34;
      const rot = reduced ? 0 : t * 0.00006;
      ctx.strokeStyle = `rgba(${col},0.18)`;
      ctx.lineWidth = devicePixelRatio;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      for (let s = 0; s < 33; s++) {
        const a = (s / 33) * Math.PI * 2 + rot;
        const x = cx + R * Math.cos(a);
        const y = cy + R * Math.sin(a);
        const pulse = reduced ? 0.6 : 0.45 + 0.3 * Math.sin(t * 0.001 + s);
        ctx.fillStyle = `rgba(${col},${pulse})`;
        ctx.beginPath();
        ctx.arc(x, y, 3.2 * devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // drifting points + link lines (cells) or falling glyphs (glyphs)
      for (const p of pts) {
        if (!reduced) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (kind === "glyphs") {
            if (p.y > h + 10) { p.y = -10; p.x = Math.random() * w; }
          } else if (p.y < 0 || p.y > h) p.vy *= -1;
        }
      }
      if (kind === "cells") {
        const LIM = 130 * devicePixelRatio;
        for (let a = 0; a < pts.length; a++) {
          for (let b = a + 1; b < pts.length; b++) {
            const dx = pts[a].x - pts[b].x, dy = pts[a].y - pts[b].y;
            const d = Math.hypot(dx, dy);
            if (d < LIM) {
              ctx.strokeStyle = `rgba(${col},${(1 - d / LIM) * 0.16})`;
              ctx.lineWidth = devicePixelRatio * 0.7;
              ctx.beginPath();
              ctx.moveTo(pts[a].x, pts[a].y);
              ctx.lineTo(pts[b].x, pts[b].y);
              ctx.stroke();
            }
          }
        }
      }
      for (const p of pts) {
        ctx.fillStyle = `rgba(${col},0.55)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (!reduced) raf = requestAnimationFrame(draw);
  };

  if (reduced) draw(0);
  else raf = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
  };
}

/* ── component ─────────────────────────────────────────────────────────── */

export default function HeroSlides() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const slide = SLIDES[idx];
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!canvasRef.current) return;
    return startScene(canvasRef.current, slide.scene, reduced);
  }, [idx, slide.scene, reduced]);

  useEffect(() => {
    if (paused || reduced) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 7000);
    return () => clearInterval(t);
  }, [paused, reduced]);

  const go = useCallback((d: number) => setIdx((i) => (i + d + SLIDES.length) % SLIDES.length), []);

  return (
    <section
      className="relative w-full overflow-hidden bg-[#04120c]"
      aria-label="Featured"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      {/* soft vignette so text always wins */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#03110b]/70 via-transparent to-[#03110b]" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-[68vh] max-w-6xl flex-col items-center justify-center px-6 py-28 text-center">
        <p className="mb-5 font-mono text-xs uppercase tracking-[0.35em] text-emerald-300/70">
          {slide.kicker}
        </p>
        <h2 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
          {slide.headline[0]}{" "}
          <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-amber-200 bg-clip-text text-transparent">
            {slide.headline[1]}
          </span>
        </h2>
        <p className="mt-7 max-w-2xl text-lg leading-relaxed text-emerald-100/75">
          {slide.sub}
        </p>
        <div className="mt-10">
          <Link href={slide.cta.href}>
            <span className="inline-block cursor-pointer rounded-xl bg-emerald-500 px-8 py-4 text-base font-bold text-[#03110b] shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400">
              {slide.cta.label} →
            </span>
          </Link>
        </div>

        {/* controls */}
        <div className="mt-14 flex items-center gap-6">
          <button
            onClick={() => go(-1)}
            aria-label="Previous slide"
            className="rounded-full border border-emerald-500/30 px-3 py-1.5 text-emerald-300/80 transition hover:bg-emerald-500/10"
          >
            ←
          </button>
          <div className="flex gap-2.5">
            {SLIDES.map((s, i) => (
              <button
                key={s.kicker}
                onClick={() => setIdx(i)}
                aria-label={`Slide ${i + 1}: ${s.kicker}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === idx ? "w-8 bg-emerald-400" : "w-2 bg-emerald-500/30 hover:bg-emerald-500/60"
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => go(1)}
            aria-label="Next slide"
            className="rounded-full border border-emerald-500/30 px-3 py-1.5 text-emerald-300/80 transition hover:bg-emerald-500/10"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
