import { useEffect, useRef, useState, type ReactNode } from "react";
import { VideoEmbed } from "./VideoEmbed";

/**
 * StoryWorld — the councilof.ai homepage as an EPIC but ROBUST scroll-world.
 *
 * Cinematic: heavy sections are full-bleed, full-height claymation-arena image bands
 * with a readable scrim and content overlaid in white. Light sections breathe between
 * them (video, a clear image, or an infographic on a clean ground).
 *
 * ROBUST: this is a plain, normal document scroll. Every section is a static <section>
 * in flow — no pin, no sticky, no opacity-toggle slides, no 3D perspective. (The old
 * pinned/opacity-slide renderer was buggy on desktop — slide 1 vanished on scroll — and
 * has been removed entirely.) Nothing can disappear.
 *
 * Hero H1 is locked. No sov-* names. No invented scores. Doctrine: measurement, not
 * certification; "13 measured of 14"; jail is a floor with separation untested; ties are ties.
 */

type Point = { tag: "pain" | "benefit" | "usp"; text: string };

type Slide = {
  kicker: string;
  title?: string;
  body: string;
  points?: Point[];
  href?: string;
  cta?: string;
  video?: { src: string; poster: string; title: string };
  /** full-bleed background image → makes the section a heavy cinematic band */
  bg?: { src: string; alt: string };
  /** a clear, in-flow image shown in a light section's media column */
  image?: { src: string; alt: string };
  /** inline-SVG infographic index for light sections that have no media */
  figure?: number;
};

export const STORY: Slide[] = [
  {
    // 01 HERO — H1 is locked. Hero video sits above the headline, over the arena.
    kicker: "Council of AI — the independent measurement body for AI behaviour",
    body: "We measure how your AI actually behaves on published, frozen tests, then hand you a signed result you can re-check yourself — a small card, not a slide deck. When your model or the law changes, we measure again. That is measurement, not certification.",
    bg: { src: "/images/coliseum_hero_arena.jpg", alt: "Clay figures and green verification seals gathered in a marble arena" },
  },
  {
    // 02 The problem — light, breathes
    kicker: "The problem",
    video: { src: "/videos/council-of-ai.mp4", poster: "/videos/council-of-ai.jpg", title: "What Council of AI does — a 2-minute look" },
    title: "The “trust us” PDF",
    body: "Most AI assurance is a claim on a slide — a badge, a private report, a number with no test behind it. You can’t run it, you can’t see what was skipped, and the moment the model updates the paperwork is already out of date.",
    points: [
      { tag: "pain", text: "You get a badge, not a test you can run" },
      { tag: "pain", text: "No sample size, no interval, no list of what was skipped" },
      { tag: "benefit", text: "Evidence built to outlive the vendor that sold it" },
      { tag: "usp", text: "We publish the test and the scoring code — recompute it yourself" },
    ],
    figure: 1,
  },
  {
    // 03 Your proof — heavy, the vault + 3KB credential
    kicker: "Your proof",
    title: "One small card, signed and yours",
    body: "We run your system on frozen, published tests, sign the result, and give you the card — about 3KB of scores, sample sizes, intervals, hashes and a signature. Anyone can recompute it in their own browser, and the signing key is public.",
    points: [
      { tag: "pain", text: "Reports sit on someone else’s server and can quietly change" },
      { tag: "benefit", text: "You hold a ~3KB card — recheck the hash chain in any browser" },
      { tag: "benefit", text: "Scores, sample size and intervals all travel with it" },
      { tag: "usp", text: "Public signing key — anyone verifies without asking us" },
    ],
    href: "/gspc-verify",
    cta: "Verify a card",
    bg: { src: "/images/secure_evidence_vault.jpg", alt: "Clay figures holding a glowing 3KB credential card before a vault door" },
  },
  {
    // 04 The honest board — light, proving-ground video
    kicker: "The honest board",
    title: "13 measured of 14 — including the one that catches us",
    body: "Our board shows 13 measured axes across 19 models. The 14th — jail, whether a model can be talked out of its guardrails — is a measured floor on a smaller fleet with separation still untested, and we say so. It caught our own fine-tune missing every escape, and we published that.",
    points: [
      { tag: "pain", text: "Scorecards quietly hide the tests a model fails" },
      { tag: "benefit", text: "Empty cells stay empty — you see exactly what’s measured" },
      { tag: "benefit", text: "Jail is a floor, “separation untested” stated in plain sight" },
      { tag: "usp", text: "It caught our own fine-tune — and we published it" },
    ],
    href: "/gspc-scoreboard",
    cta: "Open the board",
    video: { src: "/videos/proving-ground.mp4", poster: "/videos/proving-ground.jpg", title: "The Proving Ground — how we test containment" },
  },
  {
    // 05 Council Space — heavy, AI vs AI
    kicker: "Council Space",
    title: "AI versus AI, 24/7",
    body: "Models face the same frozen tests, head to head. Each match is two systems and one instrument, and the verdict is a fixed rule — never one AI grading another. Any round can become a signed card.",
    points: [
      { tag: "pain", text: "Leaderboards run on vibes and vote-brigading" },
      { tag: "benefit", text: "Every match is a fixed pass/fail rule you can audit" },
      { tag: "benefit", text: "Ties are ties — never counted as a win" },
      { tag: "usp", text: "No model ever judges another — grading is deterministic" },
      { tag: "usp", text: "Runs 24/7, so coverage never depends on who is awake" },
    ],
    href: "/gspc-arena",
    cta: "Watch Council Space",
    bg: { src: "/images/coliseum_swarm_clash.jpg", alt: "A swarm of green shards clashing with clay scientists raising shields" },
  },
  {
    // 06 Colosseum — heavy, Human vs AI
    kicker: "Colosseum",
    title: "You versus the AI",
    body: "Step in and probe a system live in three modes — Citizen, Mayor, Red. Signed runs count; practice runs stay practice and are never quoted.",
    points: [
      { tag: "pain", text: "You never get to stress-test the AI yourself" },
      { tag: "benefit", text: "Three hands-on modes to push a system live" },
      { tag: "usp", text: "Only measured runs are ever quoted — practice stays practice" },
    ],
    href: "/gspc-arena",
    cta: "Enter the colosseum",
    image: { src: "/images/coliseum_logic_duel.jpg", alt: "A human and an AI facing each other across a chessboard in the arena" },
  },
  {
    // 07 The live board — light, architecture video
    kicker: "The live board",
    title: "The whole board, live from the API",
    body: "Every cell is pulled live from our public API. Empty cells stay empty, every row shows its sample size, and nobody edits yesterday’s numbers.",
    points: [
      { tag: "pain", text: "Marketing dashboards refresh silently and rewrite history" },
      { tag: "benefit", text: "A 13 × 19 grid, live, with a sample size on every row" },
      { tag: "usp", text: "One signed source feeds people, agents and answer engines" },
    ],
    href: "/gspc-scoreboard",
    cta: "Read the scoreboard",
    video: { src: "/videos/csoai-architecture.mp4", poster: "/videos/csoai-architecture.jpg", title: "How Council of AI is built — the architecture" },
  },
  {
    // 08 Council City — heavy, living layer
    kicker: "Council City",
    title: "A place you can walk, not a pitch",
    body: "Signed results feed a living layer — cities, towns and sims you can explore. Every scene traces back to a real receipt, so learning how the system behaves is something you do, not something you’re told.",
    points: [
      { tag: "pain", text: "Governance sites are walls of text nobody reads" },
      { tag: "benefit", text: "Explore how AI behaves through a world, not a whitepaper" },
      { tag: "usp", text: "Every scene traces back to a signed event — nothing is decorative" },
    ],
    href: "/gspc-arena?view=towns",
    cta: "Enter the city",
    bg: { src: "/images/literacy_training_arena.jpg", alt: "People learning how AI behaves inside a training arena" },
  },
  {
    // 09 Always current — light split, liveness image + living-law video
    kicker: "Always current",
    title: "The day it’s stamped, a static certificate starts going stale",
    body: "So we watch the law itself. Our corpus-watch tracks EUR-Lex and legislation.gov.uk by hash, day after day. When a provision actually changes, we re-measure and issue a fresh delta card — the old one stays, history is append-only, never quietly edited.",
    points: [
      { tag: "pain", text: "A one-time stamp goes stale the moment the law moves" },
      { tag: "benefit", text: "We watch the law daily and re-measure when it changes" },
      { tag: "benefit", text: "A fresh delta card each time — old cards preserved" },
      { tag: "usp", text: "Append-only history, corrections published — never a silent edit" },
    ],
    href: "/assess",
    cta: "Get measured",
    image: { src: "/images/liveness_drift_engine.jpg", alt: "An hourglass weighing a stale certification seal against a re-attested current seal, fed by EUR-Lex and legislation.gov.uk ribbons" },
    video: { src: "/videos/living-law.mp4", poster: "/videos/living-law.jpg", title: "Living law — why a measurement is never final" },
  },
  {
    // 10 Human oversight — heavy, humans directing AI
    kicker: "Human oversight",
    title: "Humans stay in the loop",
    body: "Measurement isn’t a black box you’re asked to trust. People set the tests, read the results, and can challenge any card — the system is steered by humans, not hidden behind them.",
    points: [
      { tag: "pain", text: "AI assurance you’re simply told to take on faith" },
      { tag: "benefit", text: "People set the tests and can challenge any result" },
      { tag: "usp", text: "Every judgement is a fixed rule a human can inspect — never a hidden model" },
      { tag: "usp", text: "AI is measured against a published human baseline — not just against other AI" },
    ],
    href: "/gspc-scoreboard",
    cta: "See how it’s judged",
    bg: { src: "/images/coliseum_humans_vs_humanoids.jpg", alt: "Humans directing AI figures with beams of light, keeping oversight" },
  },
  {
    // 11 Who it's for — light, trust-ecosystem video
    kicker: "Who it’s for",
    title: "One signed measurement, four fronts",
    body: "Insurers pricing AI risk, regulators checking behaviour against the law, teams proving a model before they ship, developers measuring per call — the same signed card serves them all.",
    points: [
      { tag: "pain", text: "Everyone re-runs their own half-trusted checks" },
      { tag: "benefit", text: "One signed result every side can rely on" },
      { tag: "usp", text: "Independent of all of them — we take no money from anything we rank" },
    ],
    href: "/start",
    cta: "Prove your AI",
    video: { src: "/videos/trust-ecosystem.mp4", poster: "/videos/trust-ecosystem.jpg", title: "The trust ecosystem — who Council of AI serves" },
  },
  {
    // 12 Anyone can check — heavy, the signed card in hand
    kicker: "Anyone can check",
    title: "Free to check. No login, ever.",
    body: "Verifying a card is free forever — no account, no fee — and we take no money from anything we rank. Recompute the hash chain, check the public key, read the board: the proof is yours to hold, not ours to gatekeep.",
    points: [
      { tag: "pain", text: "Assurance is usually paywalled and closed to the public" },
      { tag: "benefit", text: "Check any card in your own browser — free, no login" },
      { tag: "usp", text: "We take no money from anything we rank" },
    ],
    href: "/gspc-verify",
    cta: "Check a card now",
    bg: { src: "/images/verifiable_evidence_card.jpg", alt: "Hands holding a signed evidence card reading verified: true" },
  },
  {
    // 13 Public watchdog — heavy, report what looks wrong
    kicker: "Open to everyone",
    title: "See something wrong? Report it.",
    body: "When an AI behaves badly in the real world, anyone can flag it. Reports feed the public watchdog, and what we act on is measured and signed like everything else — no closed inbox, no quiet dismissal.",
    points: [
      { tag: "pain", text: "Harms get buried in a vendor’s private support queue" },
      { tag: "benefit", text: "A public place to report AI behaviour that looks wrong" },
      { tag: "usp", text: "What we act on is measured and signed — in the open" },
    ],
    href: "/watchdog",
    cta: "Open the watchdog",
    image: { src: "/images/public_watchdog_intake.jpg", alt: "The public watchdog reporting funnel, open to everyone" },
  },
];

// The four doors, folded into the hero.
const PERSONAS: { who: string; hook: string; href: string }[] = [
  { who: "Insurers", hook: "price AI risk on signed evidence", href: "/industries/insurance" },
  { who: "Regulators", hook: "check behaviour against the law", href: "/regulators" },
  { who: "Enterprises", hook: "prove your AI before you ship", href: "/start" },
  { who: "Developers", hook: "measure per call on the agent rail", href: "/payg" },
];

function HeroActions() {
  return (
    <>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <a
          href="/gspc-verify"
          className="inline-flex items-center rounded-xl bg-emerald-500 px-6 py-3 text-base font-extrabold text-white shadow-lg transition-colors hover:bg-emerald-400"
        >
          Verify a card — free
        </a>
        <a
          href="/gspc-scoreboard"
          className="inline-flex items-center rounded-xl border-2 border-white/40 bg-white/5 px-6 py-3 text-base font-extrabold text-white backdrop-blur-sm transition-colors hover:bg-white/15"
        >
          Open the live board
        </a>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {PERSONAS.map((p) => (
          <a
            key={p.who}
            href={p.href}
            title={p.hook}
            className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[13px] font-semibold text-white backdrop-blur-sm transition hover:border-emerald-300 hover:bg-white/20"
          >
            {p.who} <span aria-hidden className="text-emerald-300">→</span>
          </a>
        ))}
      </div>
    </>
  );
}

/* ————— benefit-led bullets: PAIN · BENEFIT · USP ————— */
const TAG_LABEL: Record<Point["tag"], string> = { pain: "Pain", benefit: "You get", usp: "Only here" };
const TAG_LIGHT: Record<Point["tag"], string> = {
  pain: "bg-rose-50 text-rose-600 ring-1 ring-rose-100",
  benefit: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  usp: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
};
const TAG_DARK: Record<Point["tag"], string> = {
  pain: "bg-rose-500/20 text-rose-100 ring-1 ring-rose-300/30",
  benefit: "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-300/30",
  usp: "bg-amber-500/25 text-amber-50 ring-1 ring-amber-300/40",
};

function Points({ points, dark, center }: { points: Point[]; dark?: boolean; center?: boolean }) {
  return (
    <ul className={`mt-6 flex w-full max-w-xl flex-col gap-2.5 ${center ? "mx-auto text-left" : ""}`}>
      {points.map((pt) => (
        <li key={pt.text} className="flex items-start gap-3">
          <span className={`mt-0.5 inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${dark ? TAG_DARK[pt.tag] : TAG_LIGHT[pt.tag]}`}>
            {TAG_LABEL[pt.tag]}
          </span>
          <span className={`text-[15px] leading-snug ${dark ? "text-white/90" : "text-gray-700"}`}>{pt.text}</span>
        </li>
      ))}
    </ul>
  );
}

/* ————— per-section infographic (inline SVG, no deps) for light media-less sections ————— */
function Infographic({ index }: { index: number }) {
  const ink = "#059669";
  const dim = "rgba(5,150,105,0.35)";
  const bad = "#ef4444";
  const common = { fill: "none", stroke: ink, strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (index === 1) {
    // PDF (dead) vs signed card (live)
    return (
      <svg viewBox="0 0 300 96" className="h-24 w-auto sm:h-28" aria-hidden>
        <g transform="translate(30,10)">
          <rect width="70" height="76" rx="6" {...common} stroke={bad} opacity="0.8" />
          {[16, 28, 40, 52].map((y) => <line key={y} x1="10" x2="60" y1={y} y2={y} stroke={bad} strokeWidth="1.2" opacity="0.4" />)}
          <line x1="8" y1="8" x2="62" y2="68" stroke={bad} strokeWidth="2" />
          <text x="35" y="92" textAnchor="middle" fontSize="9" fill={bad} fontWeight="700">static PDF</text>
        </g>
        <text x="150" y="52" textAnchor="middle" fontSize="13" fontWeight="800" fill={ink}>vs</text>
        <g transform="translate(200,10)">
          <rect width="70" height="76" rx="6" {...common} fill="rgba(16,185,129,0.06)" />
          {[16, 28, 40].map((y) => <line key={y} x1="10" x2="60" y1={y} y2={y} stroke={ink} strokeWidth="1.2" opacity="0.5" />)}
          <path d="M14 60 l6 6 l12 -12" {...common} strokeWidth="2.2" />
          <text x="44" y="66" fontSize="8.5" fill={ink} fontWeight="700">signed</text>
          <text x="35" y="92" textAnchor="middle" fontSize="9" fill={ink} fontWeight="700">3KB card</text>
        </g>
      </svg>
    );
  }
  // default: measure → sign → re-attest → check loop
  return (
    <svg viewBox="0 0 320 90" className="h-24 w-auto sm:h-28" aria-hidden>
      {["Measure", "Sign", "Re-attest", "Check"].map((label, k) => (
        <g key={label} transform={`translate(${18 + k * 78},14)`}>
          <rect width="62" height="40" rx="10" {...common} fill="rgba(16,185,129,0.06)" />
          <text x="31" y="25" textAnchor="middle" fontSize="11" fontWeight="700" fill={ink}>{label}</text>
          {k < 3 && <path d={`M66 20 h8 m-3 -4 l4 4 l-4 4`} {...common} />}
        </g>
      ))}
      <path d="M290 60 q10 22 -130 22 q-140 0 -130 -22" {...common} stroke={dim} strokeDasharray="3 4" />
      <text x="160" y="88" textAnchor="middle" fontSize="9" fill={dim} fontWeight="600">append-only · forever checkable</text>
    </svg>
  );
}

function Cta({ slide }: { slide: Slide }) {
  if (!slide.href || !slide.cta) return null;
  return (
    <a
      href={slide.href}
      className="mt-7 inline-flex items-center rounded-xl bg-emerald-500 px-6 py-3 text-base font-extrabold text-white shadow-lg transition-colors hover:bg-emerald-400"
    >
      {slide.cta}
    </a>
  );
}


/* ————— motion helpers — all animate opacity/transform ONLY; content never leaves the flow ————— */
const HERO_REEL: { src: string; alt: string }[] = [
  { src: "/images/coliseum_hero_arena.jpg", alt: "Clay figures and green verification seals gathered in a marble arena" },
  { src: "/images/coliseum_swarm_clash.jpg", alt: "A swarm of green shards meeting clay scientists raising shields" },
  { src: "/images/secure_evidence_vault.jpg", alt: "Clay figures holding a glowing 3KB credential card before a vault door" },
  { src: "/images/coliseum_logic_duel.jpg", alt: "A human and an AI facing each other across a chessboard" },
  { src: "/images/liveness_drift_engine.jpg", alt: "An hourglass weighing a stale certification against a re-attested current seal" },
  { src: "/images/coliseum_humans_vs_humanoids.jpg", alt: "People directing AI figures with beams of light, keeping oversight" },
  { src: "/images/verifiable_evidence_card.jpg", alt: "Hands holding a signed evidence card reading verified: true" },
];

function usePrefersReducedMotion() {
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
function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
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
function useParallax(strength = 14) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const p = (r.top + r.height / 2 - window.innerHeight / 2) / (window.innerHeight || 1);
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

/* ————— HERO — cinematic Ken-Burns reel through the branded world ————— */
function HeroSection({ slide }: { slide: Slide }) {
  const reduced = usePrefersReducedMotion();
  const [shot, setShot] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const t = window.setInterval(() => setShot((n) => (n + 1) % HERO_REEL.length), 3800);
    return () => window.clearInterval(t);
  }, [reduced]);
  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[#05130d]">
      <style>{`@keyframes coaiKenBurns{from{transform:scale(1.03) translate3d(0,0,0)}to{transform:scale(1.16) translate3d(0,-1.8%,0)}}`}</style>
      {HERO_REEL.map((img, n) => (
        <img
          key={img.src}
          src={img.src}
          alt={n === 0 ? img.alt : ""}
          aria-hidden={n !== 0}
          loading={n === 0 ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1500ms] ease-in-out"
          style={{
            opacity: n === shot ? 1 : 0,
            animation: !reduced && n === shot ? "coaiKenBurns 5.6s ease-out forwards" : undefined,
            transform: reduced ? "scale(1.03)" : undefined,
          }}
        />
      ))}
      {/* lighter scrim — the world stays visible; type carries its own shadow */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-black/60" />
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 py-24 text-center">
        <span className="rounded-full border border-emerald-300/30 bg-black/25 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-200 backdrop-blur-sm">
          {slide.kicker}
        </span>
        <h1 className="mt-8 max-w-5xl text-5xl font-black leading-[1.02] tracking-tight text-white [text-shadow:0_4px_28px_rgba(0,0,0,.6)] sm:text-6xl lg:text-7xl">
          See how your AI behaves.<br />
          Get proof you can trust.<br />
          Kept current as the rules change.<br />
          <span className="text-emerald-300">Anyone can check — free.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-white/90 [text-shadow:0_2px_14px_rgba(0,0,0,.65)] sm:text-xl">
          {slide.body}
        </p>
        <HeroActions />
        <div className="mt-10 flex items-center gap-2" aria-hidden>
          {HERO_REEL.map((img, n) => (
            <span
              key={img.src}
              className={`h-1.5 rounded-full transition-all duration-500 ${n === shot ? "w-8 bg-emerald-300" : "w-1.5 bg-white/40"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ————— HEAVY — full-bleed image band, content overlaid ————— */
function HeavySection({ slide, contentRight }: { slide: Slide; contentRight: boolean }) {
  const bgRef = useParallax(16);
  // The claymation world is BRIGHT — no dark scrim over it. Type sits on a frosted
  // white panel over the image's open space, so the art stays vivid and the words
  // stay legible whatever is behind them.
  const wash = contentRight
    ? "bg-gradient-to-l from-white/70 via-white/25 to-transparent"
    : "bg-gradient-to-r from-white/70 via-white/25 to-transparent";
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-white">
      {slide.bg && (
        <img
          ref={bgRef}
          src={slide.bg.src}
          alt={slide.bg.alt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover will-change-transform"
        />
      )}
      <div className={`absolute inset-0 ${wash}`} />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-24">
        <Reveal className={`max-w-xl ${contentRight ? "ml-auto" : ""}`}>
          <div className="rounded-3xl border border-white/70 bg-white/80 p-8 text-left shadow-[0_24px_70px_-30px_rgba(4,18,12,.55)] backdrop-blur-md sm:p-10">
            <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-700">{slide.kicker}</span>
            <h2 className="mt-3 text-4xl font-black leading-[1.04] tracking-tight text-gray-900 sm:text-5xl lg:text-[3.4rem]">
              {slide.title}
            </h2>
            <p className="mt-5 text-lg font-medium leading-relaxed text-gray-700 sm:text-xl">{slide.body}</p>
            {slide.points && <Points points={slide.points} />}
            {slide.video && (
              <VideoEmbed src={slide.video.src} poster={slide.video.poster} title={slide.video.title} className="mt-8 !mx-0" />
            )}
            <Cta slide={slide} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ————— LIGHT — breathing band: image and/or video (split) or infographic (centered) ————— */
function LightSection({ slide, index, mediaRight }: { slide: Slide; index: number; mediaRight: boolean }) {
  const bg = index % 2 === 0 ? "bg-gray-50" : "bg-white";
  const hasMedia = Boolean(slide.image || slide.video);
  if (hasMedia) {
    return (
      <section className={`relative ${bg}`}>
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-20 sm:py-24 lg:grid-cols-2 lg:gap-16">
          <Reveal className={mediaRight ? "lg:order-1" : "lg:order-2"}>
            <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-600">{slide.kicker}</span>
            <h2 className="mt-3 text-4xl font-black leading-[1.04] tracking-tight text-gray-900 sm:text-5xl">{slide.title}</h2>
            <p className="mt-5 max-w-xl text-lg font-medium leading-relaxed text-gray-600 sm:text-xl">{slide.body}</p>
            {slide.points && <Points points={slide.points} />}
            <Cta slide={slide} />
          </Reveal>
          <Reveal delay={120} className={`flex flex-col gap-6 ${mediaRight ? "lg:order-2" : "lg:order-1"}`}>
            {slide.image && (
              <img
                src={slide.image.src}
                alt={slide.image.alt}
                loading="lazy"
                className="w-full rounded-2xl object-cover shadow-xl ring-1 ring-black/10"
              />
            )}
            {slide.video && (
              <VideoEmbed src={slide.video.src} poster={slide.video.poster} title={slide.video.title} className="!max-w-none" />
            )}
          </Reveal>
        </div>
      </section>
    );
  }
  // media-less light section — centered with an infographic
  return (
    <section className={`relative ${bg}`}>
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-20 text-center sm:py-24">
        <div className="hidden sm:block">
          <Infographic index={slide.figure ?? index} />
        </div>
        <span className="mt-4 text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">{slide.kicker}</span>
        <h2 className="mt-3 max-w-3xl text-4xl font-black leading-[1.04] tracking-tight text-gray-900 sm:text-5xl">{slide.title}</h2>
        <p className="mt-5 max-w-2xl text-lg font-medium leading-relaxed text-gray-600 sm:text-xl">{slide.body}</p>
        {slide.points && <Points points={slide.points} center />}
        <Cta slide={slide} />
      </div>
    </section>
  );
}

export default function StoryWorld() {
  let heavyCount = 0;
  let lightMediaCount = 0;
  return (
    <div>
      {STORY.map((slide, i) => {
        if (i === 0) return <HeroSection key={slide.kicker} slide={slide} />;
        if (slide.bg) {
          const contentRight = heavyCount % 2 === 1; // alternate the overlaid column
          heavyCount += 1;
          return <HeavySection key={slide.kicker} slide={slide} contentRight={contentRight} />;
        }
        const mediaRight = lightMediaCount % 2 === 0; // alternate media side
        if (slide.image || slide.video) lightMediaCount += 1;
        return <LightSection key={slide.kicker} slide={slide} index={i} mediaRight={mediaRight} />;
      })}
    </div>
  );
}
