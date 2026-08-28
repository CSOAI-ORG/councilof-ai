import { useEffect, useState } from "react";
import { ScrollWorld, usePrefersReducedMotion, type Slide } from "@/components/scrollworld";
import { fetchAxes } from "@/lib/gspcAxes";

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
 * certification; slot counts live on GET /api/gspc; jail is a floor when the stamp says so; ties are ties.
 */

export const STORY: Slide[] = [
  {
    // 01 HERO — H1 is locked. Hero video sits above the headline, over the arena.
    kicker: "Council of AI — the unsolicited, permissionless measurement body for AI behaviour",
    body: "We measure how your AI actually behaves on published, frozen tests — invited or not — then hand you a signed result anyone can re-check without our permission: a small card, not a slide deck. When your model or the law changes, we measure again. That is measurement, not certification.",
    bg: { src: "/images/coliseum_hero_arena.jpg", alt: "Clay figures and green verification seals gathered in a marble arena" },
  },
  {
    // 02 The problem — light, breathes
    kicker: "The problem",
    video: { src: "/videos/council-of-ai.mp4", poster: "/videos/council-of-ai.jpg", title: "What Council of AI does — a 9-minute look" },
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
    // 03 Your proof — heavy, the vault + the signed credential
    kicker: "Your proof",
    title: "One small card, signed and yours",
    body: "We run your system on frozen, published tests, sign the result, and give you the card — under a kilobyte holding the axis, the model, the accuracy, the issuer, the date, the previous card's hash and the signature. Sample sizes and intervals live on the board beside it, not inside it. Anyone can recompute the card in their own browser, and the signing key is public.",
    points: [
      { tag: "pain", text: "Reports sit on someone else’s server and can quietly change" },
      { tag: "benefit", text: "You hold a sub-kilobyte card — recheck the signature and hash in any browser" },
      { tag: "benefit", text: "The score travels in the card; its sample size and interval stay on the live board" },
      { tag: "usp", text: "Public signing key — anyone verifies without asking us" },
    ],
    href: "/gspc-verify",
    cta: "Verify a card",
    bg: { src: "/images/secure_evidence_vault.jpg", alt: "Clay figures holding a glowing signed measurement card before a vault door" },
  },
  {
    // 04 The honest board — light, proving-ground video
    kicker: "The honest board",
    title: "The living board — including the axis that catches us",
    body: "The public board is signed and honest: empty cells stay empty, ties stay ties. Jail — whether a model can be talked out of its guardrails — is a measured floor when the stamp says so, and we say so. It caught our own fine-tune missing every escape, and we published that. Live counts: GET /api/gspc.",
    points: [
      { tag: "pain", text: "Scorecards quietly hide the tests a model fails" },
      { tag: "benefit", text: "Empty cells stay empty — you see exactly what’s measured" },
      { tag: "benefit", text: "Jail is a floor — measured; living-board separation is TIE, stated in plain sight" },
      { tag: "usp", text: "It caught our own fine-tune — and we published it" },
    ],
    href: "/gspc-scoreboard",
    cta: "Open the board",
    video: { src: "/videos/proving-ground.mp4", poster: "/videos/proving-ground.jpg", title: "The Proving Ground — how we test containment" },
  },
  {
    // 05 Council Space — heavy, AI vs AI
    kicker: "Council Space",
    title: "AI versus AI",
    body: "Models face the same frozen tests, head to head. Each match is two systems and one instrument, and the verdict is a fixed rule — never one AI grading another. Any round can become a signed card.",
    points: [
      { tag: "pain", text: "Leaderboards run on vibes and vote-brigading" },
      { tag: "benefit", text: "Every match is a fixed pass/fail rule you can audit" },
      { tag: "benefit", text: "Ties are ties — never counted as a win" },
      { tag: "usp", text: "No model ever judges another — grading is deterministic" },
      { tag: "usp", text: "Coverage is measured when a run exists — empty is stated, never hidden" },
    ],
    href: "/gspc-arena",
    cta: "Watch Council Space",
    bg: { src: "/images/coliseum_swarm_clash.jpg", alt: "A swarm of green shards clashing with clay scientists raising shields" },
  },
  {
    // 06 Colosseum — REMOVED: Citizen/Mayor/Red modes 404. Replaced with honest claim.
    kicker: "Colosseum",
    title: "You versus the AI",
    body: "Step in and probe a system live. Signed runs count; practice runs stay practice and are never quoted.",
    points: [
      { tag: "pain", text: "You never get to stress-test the AI yourself" },
      { tag: "benefit", text: "Probe a system with real questions, live" },
      { tag: "usp", text: "Only measured runs are ever quoted — practice stays practice" },
    ],
    href: "/gspc-arena",
    cta: "Enter the arena",
    image: { src: "/images/coliseum_logic_duel.jpg", alt: "A human and an AI facing each other across a chessboard in the arena" },
  },
  {
    // 07 The live board — light, architecture video
    kicker: "The live board",
    title: "The whole board, live from the API",
    body: "Every cell is pulled live from our public API. Empty cells stay empty, every row shows its sample size, and nobody edits yesterday’s numbers.",
    points: [
      { tag: "pain", text: "Marketing dashboards refresh silently and rewrite history" },
      { tag: "benefit", text: "A living grid, live from GET /api/gspc, with a sample size on every row" },
      { tag: "usp", text: "One signed source feeds people, agents and answer engines" },
    ],
    href: "/gspc-scoreboard",
    cta: "Read the scoreboard",
    video: { src: "/videos/csoai-architecture.mp4", poster: "/videos/csoai-architecture.jpg", title: "The architecture of measurement — how a signed card is made" },
  },
  {
    // 08 Council City — HONEST: City is a view over signed records, not a walkable world
    kicker: "Council City",
    title: "A view over the measurements",
    body: "Council City is a window on the same signed records the board is built from — a different view of the measurements, not a second source of them. Every tile links to a signed card.",
    points: [
      { tag: "pain", text: "Governance sites are walls of text nobody reads" },
      { tag: "benefit", text: "See the measurements as a map, not a table" },
      { tag: "usp", text: "Every tile links to a signed card — nothing is decorative" },
    ],
    href: "/gspc-arena?view=towns",
    cta: "Open City view",
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
    body: "Insurers pricing AI risk, regulators checking behaviour against the law, teams proving a model before they ship, developers verifying a signed card — the same signed card serves them all.",
    points: [
      { tag: "pain", text: "Everyone re-runs their own half-trusted checks" },
      { tag: "benefit", text: "One signed result every side can rely on" },
      { tag: "usp", text: "Independent of all of them — we take no money from anything we rank" },
    ],
    href: "/?lobby=measured&task=get-measured",
    cta: "Prove your AI",
    video: { src: "/videos/trust-ecosystem.mp4", poster: "/videos/trust-ecosystem.jpg", title: "The trust lobby — who the measurement is for" },
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
    // Was /watchdog (the map). The real intake is the incident-report form at
    // /report — the CTA said "report it" and landed on something you cannot report on.
    href: "/report",
    cta: "Report an incident",
    image: { src: "/images/public_watchdog_intake.jpg", alt: "The public watchdog reporting funnel, open to everyone" },
  },
];

// The four doors, folded into the hero.
const PERSONAS: { who: string; hook: string; href: string }[] = [
  // /insurers is the current audience page; /industries/insurance is the sector page
  // behind it. The hero door should open the audience page, not a sector leaf.
  { who: "Insurers", hook: "price AI risk on signed evidence", href: "/insurers" },
  { who: "Regulators", hook: "check behaviour against the law", href: "/regulators" },
  { who: "Enterprises", hook: "prove your AI before you ship", href: "/?lobby=measured&task=enterprise-start" },
  { who: "Developers", hook: "verify a signed card — free forever", href: "/gspc-verify" },
];

/**
 * The first screen has to answer "what is measured RIGHT NOW" — and it has to answer
 * it from the wire, never from a number typed into this file.
 *
 * fetchAxes() reports its own `source`. On "wire" we print totals.public_count from
 * GET /api/gspc verbatim, plus the stamp date. On "snapshot" (the API was unreachable)
 * we say the live read failed and point at the endpoint — we do NOT quietly render the
 * bundled snapshot's count as if it were live. A surface that looks live while reading
 * a stale local copy is the same defect as reporting an unearned score.
 */
function LiveCoverage() {
  const [state, setState] = useState<{ count?: string; date?: string; live: boolean; done: boolean }>({
    live: false,
    done: false,
  });

  useEffect(() => {
    const ac = new AbortController();
    fetchAxes(ac.signal).then((r) => {
      setState({
        count: r.publicCount,
        date: r.measuredOn,
        live: r.source === "wire",
        done: true,
      });
    });
    return () => ac.abort();
  }, []);

  const measured = state.done && state.live && state.count
    ? state.count
    : state.done
      ? "live count unavailable — read GET /api/gspc"
      : "reading GET /api/gspc…";

  return (
    <div className="mt-9 w-full max-w-3xl rounded-2xl border border-emerald-300/20 bg-black/40 px-5 py-5 backdrop-blur-sm sm:px-6">
      <dl className="grid gap-5 text-left sm:grid-cols-3 sm:gap-6">
        <div>
          <dt className="t-kicker text-emerald-300">
            Measured right now
          </dt>
          <dd className="mt-1.5 text-sm font-bold leading-snug text-white">
            {measured}
            {state.done && state.live && state.date && (
              <span className="ml-1 font-medium text-white/60">· stamped {state.date}</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
            What it costs to check
          </dt>
          <dd className="mt-1 text-sm font-bold text-white">
            Nothing, forever <span className="font-medium text-white/60">· no account, no fee</span>
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
            What we refuse to do
          </dt>
          <dd className="mt-1 text-sm font-bold text-white">
            Certify anything{" "}
            <span className="font-medium text-white/60">· no marks, no badges, no seals</span>
          </dd>
        </div>
      </dl>
    </div>
  );
}

function HeroActions() {
  return (
    <>
      <LiveCoverage />
      <div className="mt-9 grid w-full max-w-md grid-cols-1 gap-3 sm:flex sm:max-w-none sm:flex-wrap sm:items-center sm:justify-center">
        <a
          href="/?lobby=measured&task=get-measured"
          className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-6 py-3.5 text-base font-extrabold text-white shadow-lg transition-colors hover:bg-emerald-400"
        >
          Get measured
        </a>
        <a
          href="/gspc-verify"
          className="inline-flex items-center justify-center rounded-xl border border-white/45 bg-white/10 px-6 py-3.5 text-base font-extrabold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
        >
          Verify a card — free
        </a>
        <a
          href="/gspc-scoreboard"
          className="inline-flex items-center justify-center rounded-xl border border-white/45 bg-white/10 px-6 py-3.5 text-base font-extrabold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
        >
          Open the live board
        </a>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {PERSONAS.map((p) => (
          <a
            key={p.who}
            href={p.href}
            title={p.hook}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[13px] font-semibold text-white backdrop-blur-sm transition hover:border-emerald-300 hover:bg-white/20"
          >
            {p.who} <span aria-hidden className="text-emerald-300">→</span>
          </a>
        ))}
      </div>
    </>
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
          <text x="35" y="92" textAnchor="middle" fontSize="9" fill={ink} fontWeight="700">signed card</text>
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

/* ————— motion helpers — all animate opacity/transform ONLY; content never leaves the flow ————— */
const HERO_REEL: { src: string; alt: string }[] = [
  // Text-free arena plates ONLY. The diagram images (liveness engine, evidence card,
  // watchdog funnel, credential vault) carry their own baked-in labels, which collide
  // with the headline when used as a backdrop — they belong to sections, not the hero.
  { src: "/images/coliseum_hero_arena.jpg", alt: "Clay figures and green verification seals gathered in a marble arena" },
  { src: "/images/coliseum_swarm_clash.jpg", alt: "A swarm of green shards meeting clay scientists raising shields" },
  { src: "/images/coliseum_logic_duel.jpg", alt: "A human and an AI facing each other across a chessboard" },
  { src: "/images/coliseum_humans_vs_humanoids.jpg", alt: "People directing AI figures with beams of light, keeping oversight" },
];

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
    <section className="surface-ink relative flex min-h-[100svh] items-center justify-center overflow-hidden">
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
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/20 to-black/65" />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 62% 50% at 50% 46%, rgba(0,0,0,.52) 0%, rgba(0,0,0,.28) 45%, transparent 78%)" }} />
      <div className="section-shell relative z-10 flex max-w-4xl flex-col items-center py-24 text-center sm:py-28">
        <span className="measure-tight rounded-full border border-emerald-300/30 bg-black/25 px-4 py-2 text-[10px] font-bold uppercase leading-[1.5] tracking-[0.16em] text-emerald-200 backdrop-blur-sm sm:text-[11px] sm:tracking-[0.24em]">
          {slide.kicker}
        </span>
        <h1 className="mt-7 max-w-[22ch] text-[clamp(1.7rem,1.05rem+2.4vw,3.25rem)] font-black leading-[1.1] tracking-tight text-white text-balance [text-shadow:0_3px_22px_rgba(0,0,0,.85)] sm:mt-8">
          See how your AI behaves.<br />
          Get proof you can trust.<br />
          Kept current as the rules change.<br />
          <span className="text-emerald-300">Anyone can check — free.</span>
        </h1>
        <p className="t-lede measure measure-center mt-6 font-medium text-white [text-shadow:0_2px_16px_rgba(0,0,0,.9)]">
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

/**
 * THE STORY IS SPLIT IN TWO ON PURPOSE.
 *
 * Rendered as one block, the hero is followed immediately by twelve full-height
 * story bands — roughly eleven thousand pixels of scroll before a reader reaches
 * anything they can DO. So the homepage renders the hero, then the nine tool
 * sections (components/home/ToolStack.tsx), then the rest of the story. The slide
 * array is untouched and the alternation counters in ScrollWorld still run over the
 * whole array, so nothing about the story's rhythm changes — only where the reader
 * meets the tools.
 */
export function StoryWorldHero() {
  return <HeroSection slide={STORY[0]} />;
}

export function StoryWorldRest() {
  return (
    <ScrollWorld
      slides={STORY}
      // Slide 0 is rendered above by StoryWorldHero; here it renders as nothing.
      renderHero={() => null}
      renderFigure={(index) => <Infographic index={index} />}
    />
  );
}

export default function StoryWorld() {
  return (
    <>
      <StoryWorldHero />
      <StoryWorldRest />
    </>
  );
}
