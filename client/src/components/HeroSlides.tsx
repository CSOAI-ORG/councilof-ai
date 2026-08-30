import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";

/**
 * HeroSlides — the cinematic slide band for page tops.
 *
 * The live homepage hero. Green canvas scenes (cells / council / glyphs) stay
 * the measured-not-modelled voice. Between them, the old Ken-Burns arena stills
 * — clay coliseum plates — so the band is not a wall of emerald. Each image
 * slide has its own title. Honors prefers-reduced-motion (static frame, no
 * auto-advance, no zoom).
 *
 * Discipline: no invented scores, no certification language, no frozen board
 * counts. Living totals live on GET /api/gspc.
 */

type CanvasScene = "cells" | "council" | "glyphs";

type Slide = {
  kicker: string;
  headline: [string, string];
  sub: string;
  cta: { label: string; href: string };
  scene?: CanvasScene;
  image?: { src: string; alt: string };
};

const SLIDES: Slide[] = [
  {
    kicker: "THE INSTRUMENTS",
    headline: ["Measured,", "not modelled."],
    sub: "417 statutory provisions · 237 scored GovBench items · every verdict a predicate an auditor can recompute.",
    cta: { label: "See the board", href: "/gspc-scoreboard" },
    scene: "cells",
  },
  {
    kicker: "THE PROVING GROUND",
    headline: ["The arena is open.", "Not a badge."],
    sub: "Frozen tests. A signed card you can hold. Anyone re-checks it without asking us. Measurement, not certification.",
    cta: { label: "See the board", href: "/gspc-scoreboard" },
    image: {
      src: "/images/coliseum_hero_arena.jpg",
      alt: "Clay figures and green verification seals gathered in a marble arena",
    },
  },
  {
    kicker: "THE COUNCIL OS",
    headline: ["Every seat signed.", "Every vote an artefact."],
    sub: "A council architecture where every seat is signed and every vote is an artefact — shown, not claimed.",
    cta: { label: "Open Council OS", href: "/os" },
    scene: "council",
  },
  {
    kicker: "COUNCIL SPACE",
    headline: ["AI versus AI.", "A rule, not a jury."],
    sub: "The same frozen tests, head to head. The verdict is a fixed rule — never one model grading another. Ties stay ties.",
    cta: { label: "Watch Council Space", href: "/gspc-arena" },
    image: {
      src: "/images/coliseum_swarm_clash.jpg",
      alt: "A swarm of green shards meeting clay scientists raising shields",
    },
  },
  {
    kicker: "THE REFUTATION LEDGER",
    headline: ["We publish", "our failures."],
    sub: "9 killed bets, on the live site, with the artefacts. Trust through falsifiability — not adjectives.",
    cta: { label: "Read the ledger", href: "/refutation-ledger" },
    scene: "glyphs",
  },
  {
    kicker: "YOU VERSUS THE SYSTEM",
    headline: ["Probe it yourself.", "Practice stays practice."],
    sub: "Step in and stress the instrument. Signed runs count. Practice runs stay practice and are never quoted.",
    cta: { label: "Enter the arena", href: "/gspc-arena" },
    image: {
      src: "/images/coliseum_logic_duel.jpg",
      alt: "A human and an AI facing each other across a chessboard in the arena",
    },
  },
  {
    kicker: "HUMAN OVERSIGHT",
    headline: ["Humans stay", "in the loop."],
    sub: "People set the tests, read the results, and can challenge any card. The system is steered, not hidden.",
    cta: { label: "See how it is judged", href: "/gspc-scoreboard" },
    image: {
      src: "/images/coliseum_humans_vs_humanoids.jpg",
      alt: "Humans directing AI figures with beams of light, keeping oversight",
    },
  },
];

/* ── canvas scenes ─────────────────────────────────────────────────────── */

function startScene(canvas: HTMLCanvasElement, kind: CanvasScene, reduced: boolean) {
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

  const colors: Record<CanvasScene, string> = {
    cells: "16,185,129",
    council: "45,212,191",
    glyphs: "251,191,36",
  };
  const col = colors[kind];

  const draw = (t: number) => {
    ctx.clearRect(0, 0, w, h);

    if (kind === "council") {
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

/* ── component ─────────────────────────────────────────────────────── */

export default function HeroSlides() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const slide = SLIDES[idx];
  const isImage = Boolean(slide.image);
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!canvasRef.current || !slide.scene) return;
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
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <style>{`@keyframes coaiKenBurns{from{transform:scale(1.03) translate3d(0,0,0)}to{transform:scale(1.16) translate3d(0,-1.8%,0)}}`}</style>

      {SLIDES.map((s, i) =>
        s.image ? (
          <img
            key={s.image.src}
            src={s.image.src}
            alt={i === idx ? s.image.alt : ""}
            aria-hidden={i !== idx}
            loading={i === 1 ? "eager" : "lazy"}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-in-out"
            style={{
              opacity: i === idx ? 1 : 0,
              animation: !reduced && i === idx ? "coaiKenBurns 6.4s ease-out forwards" : undefined,
              transform: reduced ? "scale(1.04)" : undefined,
            }}
          />
        ) : null,
      )}

      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full transition-opacity duration-700"
        style={{ opacity: isImage ? 0 : 1 }}
        aria-hidden="true"
      />

      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background: isImage
            ? "linear-gradient(to bottom, rgba(0,0,0,.38), rgba(0,0,0,.22) 42%, rgba(3,17,11,.72))"
            : "linear-gradient(to bottom, rgba(3,17,11,.70), transparent, rgba(3,17,11,1))",
        }}
        aria-hidden="true"
      />
      {isImage && (
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 62% 50% at 50% 46%, rgba(0,0,0,.50) 0%, rgba(0,0,0,.26) 45%, transparent 78%)" }}
          aria-hidden="true"
        />
      )}

      <div className="relative z-10 mx-auto flex min-h-[68vh] max-w-6xl flex-col items-center justify-center px-6 py-28 text-center">
        <p className="mb-5 font-mono text-xs uppercase tracking-[0.35em] text-emerald-300/70">
          {slide.kicker}
        </p>
        <h2 className="text-4xl font-black leading-[1.05] tracking-tight text-white [text-shadow:0_3px_22px_rgba(0,0,0,.75)] sm:text-5xl lg:text-6xl">
          {slide.headline[0]}{" "}
          <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-amber-200 bg-clip-text text-transparent">
            {slide.headline[1]}
          </span>
        </h2>
        <p className="mt-7 max-w-2xl text-lg leading-relaxed text-emerald-100/80 [text-shadow:0_2px_14px_rgba(0,0,0,.65)]">
          {slide.sub}
        </p>
        <div className="mt-10">
          <Link href={slide.cta.href}>
            <span className="inline-block cursor-pointer rounded-xl bg-emerald-500 px-8 py-4 text-base font-bold text-[#03110b] shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400">
              {slide.cta.label} →
            </span>
          </Link>
        </div>

        <div className="mt-14 flex items-center gap-6">
          <button
            type="button"
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
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`Slide ${i + 1}: ${s.kicker}`}
                aria-current={i === idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === idx ? "w-8 bg-emerald-400" : "w-2 bg-emerald-500/30 hover:bg-emerald-500/60"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
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
