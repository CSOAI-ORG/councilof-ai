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
    kicker: "02  The lie",
    title: "A PDF you cannot recompute.",
    body: "Vendors sell a claim. The evidence is a slide, a badge, or a private report. You cannot run the same test. You cannot see what was left unmeasured. Six months later the model has changed and the PDF has not.",
    tone: "ink",
  },
  {
    kicker: "03  The atom",
    title: "A 3KB signed card.",
    body: "We run the system on frozen, published instruments. We sign the result. You keep the card. Anyone can recompute the hash chain in their own browser. The signing key is public.",
    href: "/gspc-verify",
    cta: "Verify a card",
    tone: "light",
  },
  {
    kicker: "04  Honest grid",
    title: "16 measured axes — including the ones that catch us.",
    body: "Empty cells stay empty. No invented scores. 13 canonical axes across 19 models; jail (escape detection), instrument-honesty and human-vs-ai measured 18 Aug on a smaller fleet, separation untested. Every measured cell with n, and CI where the n is honest.",
    href: "/gspc-scoreboard",
    cta: "Open the board",
    tone: "board",
  },
  {
    kicker: "05  Council Space",
    title: "AI versus AI. Night coverage.",
    body: "Models compete on frozen provisions. Each match is two subjects and one instrument. The verdict is a predicate, not a preference vote. Every round can become a signed card.",
    href: "/gspc-arena",
    cta: "Watch Council Space",
    tone: "ink",
  },
  {
    kicker: "06  Colosseum",
    title: "Human versus AI. Day surprise.",
    body: "Three play modes: CITIZEN, MAYOR, RED. A human walks in. The system is measured live. Signed versus unsigned is a promotion gate — unsigned stays practice.",
    href: "/gspc-arena",
    cta: "Enter the colosseum",
    tone: "ring",
  },
  {
    kicker: "07  The board",
    title: "13 × 19. UNSIGNED on this stamp.",
    body: "UNSIGNED on this stamp. Every cell is live from the GSPC API. Empty cells stay empty. Nobody edits yesterday.",
    href: "/gspc-scoreboard",
    cta: "Read the scoreboard",
    tone: "board",
  },
  {
    kicker: "08  Council City",
    title: "The living layer.",
    body: "Cities, towns, sims, clans. Signed events feed the visual mind. The public face is Council City — a place you can walk, not a marketing page.",
    href: "/city",
    cta: "Enter the city",
    tone: "light",
  },
  {
    kicker: "09  Re-attest",
    title: "A new record. Never an edit.",
    body: "AI changes. Law changes. We measure again and issue a delta card. The old card stays. History is append-only. Frozen is anchored. Fluid is drift.",
    href: "/assess",
    cta: "Get measured",
    tone: "ink",
  },
  {
    kicker: "10  Anyone can check",
    title: "No login. No fee to verify.",
    body: "Verification stays free and loginless. We take no money from anything we rank. Measurement credential — never a certification badge.",
    href: "/gspc-verify",
    cta: "Check a card now",
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

  return (
    <div ref={pin} className="relative" style={{ height: `${STORY.length * 100}vh` }}>
      <div className={`sticky top-0 h-screen overflow-hidden ${TONE[slide.tone]}`}>
        <div
          className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl"
          style={{ transform: `translate3d(${p * 80}px, ${p * 40}px, 0)` }}
        />
        <div
          className="pointer-events-none absolute -right-16 bottom-10 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl"
          style={{ transform: `translate3d(${-p * 60}px, ${-p * 30}px, 0)` }}
        />
        {STORY.map((s, idx) => (
          <SlideFace key={s.kicker} slide={s} index={idx} active={idx === i} />
        ))}
        <div className="absolute right-5 top-1/2 hidden -translate-y-1/2 flex-col gap-2 sm:flex" aria-hidden>
          {STORY.map((s, idx) => (
            <span
              key={s.kicker}
              className={`h-2 w-2 rounded-full ${idx === i ? "bg-emerald-400 scale-125" : "bg-white/30"}`}
            />
          ))}
        </div>
        <div className="absolute bottom-6 left-0 right-0 px-8">
          <div className="mx-auto h-px max-w-xl bg-white/10">
            <div className="h-px bg-emerald-400" style={{ width: `${((i + 1) / STORY.length) * 100}%` }} />
          </div>
          <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-emerald-300/70">
            {String(i + 1).padStart(2, "0")} / {String(STORY.length).padStart(2, "0")}  ·  scroll the world
          </p>
        </div>
      </div>
    </div>
  );
}
