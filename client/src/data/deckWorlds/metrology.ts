import type { Slide } from "@/components/scrollworld";

/**
 * THE METROLOGY APPARATUS — owner deck (games as calibrated measurement instruments),
 * fact-checked into the scroll-world at /metrology.
 *
 * WHAT THIS PAGE IS: a published DOCTRINE, clearly separated from what runs today. The
 * thesis — that procedurally generated, novel-per-eval interactive environments resist
 * contamination in a way static benchmarks cannot — is sound and is argued here. The
 * apparatus itself is design.
 *
 * CORRECTIONS APPLIED TO THE SOURCE DECK:
 *  1. Deck slide 9 "The 15-Axis Coliseum Governance Game" — WRONG: slot 15 is measured
 *     IN-LANE ONLY and is never board-quotable (/api/gspc measured_in_lane). Corrected
 *     throughout. NOTE 2026-08-26: the correction as originally written asserted "the
 *     board is 14 SLOTS (13 measured + jail)". That is no longer true — ADR-001 rules
 *     14 GSPC + 8 financial/domain, and the 2026-08-26 sweep wired all of them into the
 *     signed payload. Do NOT re-derive the board's size from this comment; read
 *     totals.public_count off /api/gspc. The copy below now types no count at all.
 *  2. Deck slides 10/11 gloss RHAE as "Robust Hashing and Authenticity Engine", which
 *     contradicts the deck's own slide 4 ("Relative Human Action Efficiency"). The slide-4
 *     definition is used, and the predicate is labelled PROPOSED — it is not shipped.
 *  3. Deck slide 2 third-party figures — MMLU saturation ~89.8%, SWE-bench Verified 59.4%
 *     flawed tests / ~32.67% leakage, BALROG max 1.57% — DROPPED. Not evidenced here, and
 *     the argument does not need them.
 *  4. Deck slide 5 AlphaStar figures (~280 avg APM, 900 burst, ~350ms reaction) and slide 6
 *     OpenSkill timings (0.97s vs 3.41s) — DROPPED for the same reason. The fairness and
 *     rating arguments survive without borrowed numbers.
 *  5. Deck slide 3 ARC-AGI-3 results — RETAINED but strictly as a third-party REPORTED
 *     figure, attributed to the ARC Prize project and labelled "reported by the source,
 *     not measured here". The per-model breakdown (named frontier model versions) is
 *     dropped; only the human-versus-frontier contrast is carried.
 *  6. Deck slide 11 "The arena is ready to be built" — the honest downgrade the research
 *     requires: auto-generating fresh environments from existing benchmarks via LLM or
 *     procedural generation (the POET / OMNI / Genie / AdA line of work) is a RESEARCH
 *     DIRECTION, not a shippable product, and any LLM in the scoring loop is forbidden by
 *     our first design law. Stated plainly rather than promised.
 *  7. Environment licences: only permissively licensed environments are named as things a
 *     frozen instrument could be built from (OpenSpiel, PettingZoo, Lux AI, MuJoCo
 *     Playground, Overcooked-AI). Copyleft, deprecated and proprietary/non-commercial
 *     environments are deliberately not named as hostable.
 *  8. The operator/measurer firewall is stated explicitly: MEOK operates and monetises
 *     play; Council of AI measures the same environments as frozen instruments and is
 *     never paid by a ranked party.
 */

export const METROLOGY_HERO = {
  kicker: "The metrology apparatus — a published doctrine",
  title: "A benchmark you can memorise is not an instrument",
  lede:
    "Static tests leak into training data and then measure recall wearing reasoning's clothes. The way out is metrology: environments generated fresh for every evaluation, turn-based and seed-reproducible, scored by a fixed rule. This page sets out that doctrine — and marks clearly which parts of it run today and which are design.",
  bg: {
    src: "/images/coliseum_logic_duel.jpg",
    alt: "A human and an AI facing each other across a board, judged by a fixed rule",
  },
  actions: [
    { href: "/gspc-scoreboard", label: "See what is measured today", primary: true },
    { href: "/methodology", label: "Read the method" },
  ],
};

export const METROLOGY_SLIDES: Slide[] = [
  {
    kicker: "The crisis",
    title: "Static benchmarks leak, then flatter everyone",
    body:
      "A fixed test published once ends up in the next training corpus, and from then on it measures memorisation. This is not a scandal, it is thermodynamics: any benchmark that stays still long enough becomes training data. Saturation and contamination are widely documented across the popular static suites — we do not restate other people's audit numbers here, but the direction of travel is not in dispute.",
    points: [
      { tag: "pain", text: "Yesterday's benchmark is tomorrow's training set" },
      { tag: "pain", text: "A high score can mean recall rather than reasoning, and the score cannot tell you which" },
      { tag: "benefit", text: "An instrument that generates a fresh instance every evaluation" },
      { tag: "usp", text: "Nothing fixed to memorise means nothing to contaminate" },
    ],
  },
  {
    kicker: "Metrology, not scoreboard",
    title: "Procedural freshness is the whole argument",
    body:
      "Procedurally generated interactive environments — novel per evaluation, with no stated goal and no instructions — force a system to work out the rules rather than recall them. That is the property worth building an instrument around, and it is the reason a game can be a measuring device rather than a leaderboard.",
    points: [
      { tag: "pain", text: "Leaderboards reward whoever saw the test set most recently" },
      { tag: "benefit", text: "A fresh instance per evaluation, so scores are about reasoning under novelty" },
      { tag: "benefit", text: "No instructions and no stated goal — the agent has to infer the rules" },
      { tag: "usp", text: "Contamination resistance is a design property, not a policy promise" },
    ],
    bg: {
      src: "/images/coliseum_swarm_clash.jpg",
      alt: "Fresh procedurally generated environments produced for each evaluation",
    },
  },
  {
    kicker: "The archetype — reported, not measured here",
    title: "The gap an interactive instrument can still see",
    body:
      "The clearest existing example of this design is ARC-AGI-3, a set of novel, handcrafted, turn-based environments with no instructions. On the ARC Prize project's own published results, a human panel solves essentially all of them while frontier systems average well under one percent. We cite that as reported by the source, not measured here — we have not run it ourselves, and we do not put other people's numbers on our board. One caveat we owe the reader, because our own instrument found it elsewhere: a human-versus-machine contrast only means what it appears to mean if both sides were scored under the same rule. On ARC-AGI-2 we recomputed ARC's published rows and found the human figure is measured under a looser attempt budget than the machine scores, worth about eleven points. Whether the same is true of ARC-AGI-3 is UNMEASURED — its scoring formula is not published, so we cannot check, and we will not assume either way.",
    points: [
      { tag: "pain", text: "Saturated static suites can no longer separate strong systems from weak ones" },
      { tag: "benefit", text: "An interactive, novel-per-eval instrument still has enormous discriminating power" },
      { tag: "usp", text: "Third-party results are labelled reported and attributed — never absorbed into our own measurements" },
    ],
    image: {
      src: "/images/coliseum_humans_vs_humanoids.jpg",
      alt: "A human panel and frontier systems facing the same novel environments",
    },
  },
  {
    kicker: "The gate",
    title: "If it is not deterministic, it cannot be signed",
    body:
      "This is the hard boundary between an entertaining arena and an instrument. Only turn-based, fixed-seed, tick-locked environments with an append-only action log can produce a result that someone else can reproduce — and only a reproducible result can be meaningfully signed. Real-time, stochastic or wall-clock-dependent environments are wonderful to watch and cannot be measurement.",
    points: [
      { tag: "pain", text: "Real-time environments produce runs nobody can replay exactly" },
      { tag: "benefit", text: "Fixed seed plus append-only action log means the run replays to the same result" },
      { tag: "benefit", text: "A deterministic scoring predicate, applied identically every time" },
      { tag: "usp", text: "We would rather leave an environment unmeasured than sign a result we cannot reproduce" },
    ],
    href: "/methodology",
    cta: "Read the determinism rule",
  },
  {
    kicker: "Calibration",
    title: "Mechanical speed is not strategic superiority",
    body:
      "The lesson from competitive game AI is that an unconstrained agent wins on execution and everyone reads it as reasoning. A comparative instrument therefore has to equalise the mechanics: capped action rates, matched observation — a locked camera rather than full-map injection — equal time controls on a tick-locked clock, and either a matched visual interface or a strictly typed API on both sides. Constrain the hands to measure the mind.",
    points: [
      { tag: "pain", text: "Superhuman input rates read as superhuman strategy" },
      { tag: "pain", text: "Full-state access on one side quietly invalidates the comparison" },
      { tag: "benefit", text: "Information parity and matched interfaces on both sides of every match" },
      { tag: "usp", text: "Calibration constraints are published with the result, so the fairness is auditable" },
    ],
    bg: {
      src: "/images/literacy_training_arena.jpg",
      alt: "A calibration bench equalising the mechanical conditions of a match",
    },
  },
  {
    kicker: "Teaming",
    title: "Self-play does not make a good partner",
    body:
      "An agent trained entirely against copies of itself learns to expect an optimal mechanical partner, and then fails with real people who hesitate, improvise and change their minds. Cooperative environments under permissive licences — the Overcooked-AI line of work is the canonical one — make that failure measurable. Alignment measured only in AI-versus-AI conditions is measuring the wrong thing.",
    points: [
      { tag: "pain", text: "Self-play agents that collapse the moment a human joins the team" },
      { tag: "benefit", text: "Coordination measured with real human partners, not simulated ones" },
      { tag: "usp", text: "Human-in-the-loop is a condition of the measurement, not an optional extra" },
    ],
    image: {
      src: "/images/coliseum_hero_arena.jpg",
      alt: "Humans and agents cooperating inside a shared environment",
    },
  },
  {
    kicker: "The firewall",
    title: "Whoever runs the game must not be whoever scores it",
    body:
      "This is the part that makes the rest safe. MEOK operates and hosts the play, and may monetise it. Council of AI measures the same environments as frozen instruments, publishes the results, and is never paid by any party it ranks. The operator and the measurer are separate by construction, exactly as they are everywhere else on this site.",
    points: [
      { tag: "pain", text: "An arena operator that also sets the scores is a promoter, not an instrument" },
      { tag: "benefit", text: "The environments are frozen and published, so the measurement is reproducible off-platform" },
      { tag: "usp", text: "We take no money from anything we rank — including anything we play against" },
    ],
    bg: {
      src: "/images/coliseum_humans_vs_humanoids.jpg",
      alt: "A wall between those who run the arena and those who measure it",
    },
  },
  {
    kicker: "What is design, and what runs",
    title: "The apparatus is doctrine. The board is live.",
    body:
      "Being precise about this matters more than the pitch. What runs today is the fourteen-slot board, the signed cards, the public verification endpoint and the swarm axis — a protocol bank measuring multi-step agent behaviour, with its effective-n caveat published. What is design is the games apparatus itself: the proposed efficiency predicate, the rating engine, the calibrated arena. And auto-generating fresh environments from existing benchmarks is a live research direction, not a product we are promising — the moment a language model enters the scoring loop, our first design law is broken.",
    points: [
      { tag: "pain", text: "Roadmap architecture presented as shipped capability" },
      { tag: "benefit", text: "A published doctrine you can hold us to as it gets built" },
      { tag: "benefit", text: "Environments named as candidates are permissively licensed, so anyone can rebuild the instrument" },
      { tag: "usp", text: "Design is labelled design on every surface, including this one" },
    ],
    href: "/gspc-scoreboard",
    cta: "See what is measured today",
    video: { src: "/videos/proving-ground.mp4", poster: "/videos/proving-ground.jpg", title: "The Proving Ground — how we test containment" },
  },
];

export const METROLOGY_NOT_CLAIMED = [
  // No slot count typed in this copy (ADR-001). This array is a static list of
  // claims we do NOT make, rendered by a generic deck component with no data of
  // its own, so it cannot derive a count — it therefore states the claim without
  // one. The live count is on /gspc-scoreboard, derived from GET /api/gspc.
  "We do not claim the games apparatus is built or measuring anything today. It is a published doctrine. What runs is the signed board (its live slot and measured counts are on the board page), the signed cards, the verification endpoint and the swarm axis.",
  "We do not claim an automatic generator that turns existing benchmarks into fresh environments. That is a research direction, and any design that puts a language model into the scoring loop is ruled out by our first design law: no model judges another model.",
  "We do not claim slot 15 as a board axis. It is measured in-lane only, is never board-quotable, and is never counted in any total — the board's own slot and measured counts are published on the board page and come from the signed payload, not from copy.",
  "We do not claim the ARC-AGI-3 results as our own measurement. They are third-party figures from the ARC Prize project, reported here and attributed, and they are not on our board.",
  "We do not publish other projects' saturation, contamination or timing figures as if we had measured them. The arguments on this page stand without borrowed numbers.",
  "We do not claim to host or measure any environment whose licence forbids it. Only permissively licensed environments are named as candidates for a frozen instrument.",
];

export const METROLOGY_RELATED = [
  { href: "/gspc-scoreboard", label: "The live board", what: "What is actually measured today, with every sample size and status." },
  { href: "/gspc-arena", label: "Council Space", what: "Models facing the same frozen tests, head to head." },
  { href: "/methodology", label: "The method", what: "Determinism, n≥30, and why no model ever judges another." },
  { href: "/verifiable-trust", label: "The science of verifiable trust", what: "The negative space — what we refuse to measure, and why." },
];
