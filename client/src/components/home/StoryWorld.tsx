import { useEffect, useRef, useState } from "react";

/**
 * StoryWorld — 10-slide sticky scroll hero for councilof.ai.
 * Slide 1 H1 is locked. No sov-* names. No invented scores.
 * prefers-reduced-motion: stacked sections, no pin.
 */

type Tone = "light" | "ink" | "ring" | "board";

type Slide = {
  kicker: string;
  title?: string;
  body: string;
  href?: string;
  cta?: string;
  tone: Tone;
};

export const STORY: Slide[] = [
  {
    kicker: "Council of AI — the neutral referee for AI behaviour",
    body: "We measure how your AI behaves on our own published instruments and issue the result as a verified measurement credential: a 3KB card, Ed25519-signed and timestamp-anchored. Then we measure again. Not certification. Not another dashboard.",
    tone: "light",
  },
  {
    kicker: "02  Insurers",
    title: "Signed behaviour evidence.",
    body: "Not a grade you buy. Not a badge from the vendor. A tamper-evident measurement card showing what the AI actually did when we ran the frozen instruments. Underwrite on evidence, not on trust.",
    href: "/industries/insurance",
    cta: "For insurers",
    tone: "ink",
  },
  {
    kicker: "03  Regulators",
    title: "Verify free. Loginless.",
    body: "Paste a card hash and recompute the chain in your browser. No account. No fee. A measurement credential, not a certification badge. We do not sell the grade.",
    href: "/gspc-verify",
    cta: "Verify now",
    tone: "light",
  },
  {
    kicker: "04  Enterprises",
    title: "15 slots. 13 measured. No invented scores.",
    body: "The public board: 13 measured axes × 19 models, frozen 12 August 2026. Jail and slot-15 are empty — no invented cells. Every measured result is Ed25519-signed. Ship with evidence, not a promise.",
    href: "/gspc-scoreboard",
    cta: "Open the board",
    tone: "board",
  },
  {
    kicker: "05  Developers & Agents",
    title: "Head-to-head. No LLM-as-judge.",
    body: "Two models enter. One provision. The verdict is a predicate over frozen text, not a preference vote by another model. Deterministic, reproducible, signed.",
    href: "/gspc-arena/",
    cta: "Watch the Arena",
    tone: "ink",
  },
  {
    kicker: "06  The Arena / Council Space",
    title: "Measured head-to-head.",
    body: "AI versus AI on frozen provisions. Night coverage. Every round produces a signed cell. The spectator is live — watch models compete in real time.",
    href: "/gspc-arena/",
    cta: "Enter Council Space",
    tone: "ring",
  },
  {
    kicker: "07  The Board",
    title: "13 live axes + 2 honest empties.",
    body: "Affect is MEASURED (n=41, counsel-pending — not a legal verdict). Jail: 13 Aug floor in separate stamp, empty on this dump. Slot-15: unnamed, reserved. Sovereignty is never the public 15th.",
    href: "/gspc-scoreboard",
    cta: "Read the scoreboard",
    tone: "board",
  },
  {
    kicker: "08  Verify",
    title: "Paste. Check. Free.",
    body: "Verification stays free and loginless. No Clerk. No paywall. The signing key is public. Anyone can recompute the hash chain on their own machine.",
    href: "/gspc-verify",
    cta: "Check a card",
    tone: "light",
  },
  {
    kicker: "09  Council City",
    title: "The living layer.",
    body: "Towns, sims, clans — the product behind the public face. History is append-only. Every signed event feeds the visual mind. The city is where measurement becomes a living world.",
    tone: "ink",
  },
  {
    kicker: "10  Get Measured",
    title: "Book a measurement.",
    body: "Not a remediation. Not a badge. We run your system on the frozen instruments and issue a signed card. Your first measurement is free. Re-attest as your AI or the law changes.",
    href: "/assess",
    cta: "Get measured — free",
    tone: "light",
  },
];

const TONE: Record<Tone, string> = {
  light: "bg-gradient-to-b from-emerald-50 via-white to-white text-gray-900",
  ink: "bg-[#06140f] text-emerald-50",
  ring: "bg-gradient-to-b from-[#1a1206] via-[#0d0a06] to-black text-amber-50",
  board: "bg-[#07130e] text-emerald-50",
};

function SlideFace({ slide, index, active }: { slide: Slide; index: number; active: boolean }) {
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center px-6 text-center transition-opacity duration-500 ${
        active ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!active}
    >
      <span className={`text-xs font-bold uppercase tracking-[0.22em] ${
        slide.tone === "light" ? "text-emerald-600" : "text-emerald-300/80"
      }`}>
        {slide.kicker}
      </span>
      {index === 0 ? (
        <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.08] sm:text-5xl lg:text-6xl">
          We measure.<br />
          We sign.<br />
          We re-attest.<br />
          <span className="text-emerald-500">Everyone can check.</span>
        </h1>
      ) : (
        <h2 className="mt-5 max-w-4xl text-4xl font-black leading-[1.08] sm:text-5xl lg:text-6xl">
          {slide.title}
        </h2>
      )}
      <p className={`mt-5 max-w-2xl text-lg leading-relaxed ${
        slide.tone === "light" ? "text-gray-500" : "text-emerald-100/75"
      }`}>
        {slide.body}
      </p>
      {slide.href && slide.cta && (
        <a
          href={slide.href}
          className={`mt-8 inline-flex items-center rounded-xl px-6 py-3 text-base font-extrabold shadow-md transition-colors ${
            slide.tone === "ring"
              ? "bg-amber-400 text-gray-900 hover:bg-amber-300"
              : "bg-emerald-500 text-white hover:bg-emerald-400"
          }`}
        >
          {slide.cta}
        </a>
      )}
    </div>
  );
}

function Stacked() {
  return (
    <div>
      {STORY.map((slide, i) => (
        <section key={slide.kicker} className={`relative min-h-[80vh] ${TONE[slide.tone]}`}>
          <div className="relative mx-auto flex min-h-[80vh] max-w-5xl flex-col items-center justify-center px-6 py-24 text-center">
            <span className={`text-xs font-bold uppercase tracking-[0.22em] ${
              slide.tone === "light" ? "text-emerald-600" : "text-emerald-300/80"
            }`}>{slide.kicker}</span>
            {i === 0 ? (
              <h1 className="mt-5 text-4xl font-black leading-[1.08] sm:text-5xl">
                We measure.<br />We sign.<br />We re-attest.<br />
                <span className="text-emerald-500">Everyone can check.</span>
              </h1>
            ) : (
              <h2 className="mt-5 text-4xl font-black leading-[1.08] sm:text-5xl">{slide.title}</h2>
            )}
            <p className={`mt-5 max-w-2xl text-lg ${slide.tone === "light" ? "text-gray-500" : "text-emerald-100/75"}`}>{slide.body}</p>
            {slide.href && slide.cta && (
              <a href={slide.href} className="mt-8 inline-flex rounded-xl bg-emerald-500 px-6 py-3 font-extrabold text-white">{slide.cta}</a>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function StoryWorld() {
  const pin = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const [p, setP] = useState(0);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduce(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduce) return;
    const onScroll = () => {
      const el = pin.current;
      if (!el) return;
      const total = el.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const raw = Math.min(1, Math.max(0, -el.getBoundingClientRect().top / total));
      setP(raw);
      setI(Math.min(STORY.length - 1, Math.floor(raw * STORY.length * 0.999)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reduce]);

  if (reduce) return <Stacked />;

  const slide = STORY[i];
  const isArenaSlide = i >= 4 && i <= 6; // Slides 5-7 are arena/board focused
  const isCitySlide = i === 8; // Slide 9 is Council City

  return (
    <div ref={pin} className="relative" style={{ height: `${STORY.length * 100}vh` }}>
      <div className={`sticky top-0 h-screen overflow-hidden ${TONE[slide.tone]}`}>
        {/* Floating ambient orbs — move with scroll for depth */}
        <div
          className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl"
          style={{ transform: `translate3d(${p * 80}px, ${p * 40}px, 0)` }}
        />
        <div
          className="pointer-events-none absolute -right-16 bottom-10 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl"
          style={{ transform: `translate3d(${-p * 60}px, ${-p * 30}px, 0)` }}
        />

        {/* Arena visual — concentric rings for arena slides */}
        {isArenaSlide && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {[1, 2, 3, 4].map((ring) => (
                <div
                  key={ring}
                  className="absolute rounded-full border border-emerald-400/20"
                  style={{
                    width: `${ring * 180 + 100}px`,
                    height: `${ring * 180 + 100}px`,
                    left: `${-(ring * 90 + 50)}px`,
                    top: `${-(ring * 90 + 50)}px`,
                    transform: `rotate(${p * 30 + ring * 15}deg)`,
                    opacity: 0.15 + (0.1 * (4 - ring)),
                  }}
                />
              ))}
              {/* Center pulse for arena */}
              <div
                className="h-4 w-4 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50"
                style={{ animation: "pulse 2s ease-in-out infinite" }}
              />
            </div>
          </div>
        )}

        {/* City visual — grid pattern for city slide */}
        {isCitySlide && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(16,185,129,0.3) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(16,185,129,0.3) 1px, transparent 1px)
                `,
                backgroundSize: "60px 60px",
                transform: `perspective(500px) rotateX(60deg) translateY(${-p * 100}px)`,
                transformOrigin: "center bottom",
              }}
            />
          </div>
        )}

        {/* Floating measurement cards visual on board slides */}
        {slide.tone === "board" && (
          <div className="pointer-events-none absolute inset-0">
            {[...Array(6)].map((_, cardIdx) => (
              <div
                key={cardIdx}
                className="absolute h-16 w-24 rounded-lg border border-emerald-400/30 bg-emerald-500/10 backdrop-blur-sm"
                style={{
                  left: `${15 + cardIdx * 14}%`,
                  top: `${20 + (cardIdx % 3) * 25}%`,
                  transform: `translate3d(${Math.sin(p * 3 + cardIdx) * 20}px, ${Math.cos(p * 2 + cardIdx) * 15}px, 0) rotate(${-5 + cardIdx * 2}deg)`,
                  opacity: 0.4 - cardIdx * 0.05,
                }}
              />
            ))}
          </div>
        )}

        {STORY.map((s, idx) => (
          <SlideFace key={s.kicker} slide={s} index={idx} active={idx === i} />
        ))}

        {/* Slide indicator dots */}
        <div className="absolute right-5 top-1/2 hidden -translate-y-1/2 flex-col gap-2 sm:flex" aria-hidden>
          {STORY.map((s, idx) => (
            <span
              key={s.kicker}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                idx === i ? "bg-emerald-400 scale-125" : "bg-white/30"
              }`}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-6 left-0 right-0 px-8">
          <div className="mx-auto h-px max-w-xl bg-white/10">
            <div
              className="h-px bg-emerald-400 transition-all duration-300"
              style={{ width: `${((i + 1) / STORY.length) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-emerald-300/70">
            {String(i + 1).padStart(2, "0")} / {String(STORY.length).padStart(2, "0")}  ·  scroll the world
          </p>
        </div>
      </div>
    </div>
  );
}
