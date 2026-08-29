import type { Slide } from "@/components/scrollworld";

/**
 * THE SCIENCE OF VERIFIABLE TRUST — owner deck, fact-checked into /verifiable-trust.
 *
 * CORRECTIONS APPLIED TO THE SOURCE DECK:
 *  1. Deck slide 7 "Honesty Gating: The 14th Axis (Swarm Agency) ... Why Swarm stays
 *     UNMEASURED ... 13 Measured / 1 Gated" — WRONG TWICE, and it is the deck's
 *     centrepiece. Slot 14 is JAIL, and it IS measured: 7 models x 71 gold items. What it
 *     lacks is a separated leader, which is why it prints TIE. Swarm is a MEASURED
 *     canonical axis (a protocol bank, carrying an effective-n caveat). Rewritten to the
 *     real discipline, which is a better story than the invented one.
 *  2. Deck slides 11/12 "ProvBench & The 13.9% Retraction ... 4.2% RE-MEASURED & SIGNED"
 *     — the retraction narrative is BACKWARDS. 13.9% is not retracted: it is the figure we
 *     currently publish (one-sided 95% Clopper-Pearson upper bound, 0 of 20 assets
 *     surviving, 0 of 180 measured cells, computed at n=20 assets). The replacement "4.2%"
 *     has no source anywhere in this repo and is DROPPED. What we kept is the real
 *     correction: the interval belongs to n=20 assets, not n=180 cells, and we say so.
 *  3. Deck slide 4 "hash-timestamped sealing" — no timestamping authority exists behind
 *     these cards. Rewritten as Ed25519 over a SHA-256 hash chain vs did:web:csoai.org.
 *  4. Deck slide 9 "MMLU expert (~89.8%)" and the named third-party human panels — figures
 *     not evidenced here. The human-baseline argument is kept; the borrowed numbers are not.
 *  5. Deck slide 13's "33" shield — the 33-agent council is a DESIGNED structure and its
 *     fault-tolerance property was RETRACTED (DR-0007: measured n_eff 1.21 against 3
 *     nominal legs). Rather than drop it, this page uses it as the worked example: it is
 *     the largest thing we have withdrawn about ourselves.
 *  6. "Immutable" throughout — replaced with append-only and tamper-evident, which is what
 *     a hash chain actually gives you.
 */

export const VERIFIABLE_TRUST_HERO = {
  kicker: "The science of verifiable trust",
  title: "What we refuse to measure is why the rest can be believed",
  lede:
    "Any lab can publish the numbers that flatter it. A measurement body is only as credible as the limits it enforces on itself in public — the empty cells, the honest ties, the retractions of its own best figures. This page is about the negative space.",
  bg: {
    src: "/images/coliseum_logic_duel.jpg",
    alt: "A human and an AI facing each other across a chessboard, judged by a fixed rule",
  },
  actions: [
    { href: "/refutation-ledger", label: "Read our retractions", primary: true },
    { href: "/methodology", label: "Read the method" },
  ],
};

export const VERIFIABLE_TRUST_SLIDES: Slide[] = [
  {
    kicker: "The crisis",
    title: "Certification theatre: unsigned claims, hidden methods, models grading models",
    body:
      "Most AI assurance fails in the same three places. The result is unsigned, so it can be restated later. The method is private, so it cannot be argued with. And the grading is done by a model, which means the grader's blind spots quietly become the scoreboard. Unsigned measurement dies the moment someone disputes it.",
    points: [
      { tag: "pain", text: "Unsigned cells and point-in-time claims with nothing behind them" },
      { tag: "pain", text: "Private test sets nobody outside can run" },
      { tag: "pain", text: "Model-on-model scoring, where correlated errors look like agreement" },
      { tag: "benefit", text: "Signed results over an open corpus, with the scoring code published" },
      { tag: "usp", text: "Deterministic predicates only — no model ever judges another model" },
    ],
    video: { src: "/videos/council-of-ai.mp4", poster: "/videos/council-of-ai.jpg", title: "What Council of AI does — a 2-minute look" },
  },
  {
    kicker: "Anchored to statute",
    title: "We do not invent safety definitions",
    body:
      "The instrument maps onto a frozen corpus of 417 statutory provisions rather than onto our own idea of what good looks like. Frozen means held at a version, so a card issued today still means the same thing when someone reads it next year — and when the underlying text does move, that is a drift event we publish, not a footnote we bury.",
    points: [
      { tag: "pain", text: "Safety scores defined by whoever is selling a house metric" },
      { tag: "benefit", text: "Each measurement cites the provision and the version behind it" },
      { tag: "benefit", text: "The corpus is public, so the mapping is arguable clause by clause" },
      { tag: "usp", text: "Statutory anchoring, not a house definition of \"responsible AI\"" },
    ],
    href: "/framework-crosswalks",
    cta: "Open the crosswalk",
    bg: {
      src: "/images/secure_evidence_vault.jpg",
      alt: "A frozen statutory corpus held in a vault, scanned and signed",
    },
  },
  {
    kicker: "The honesty gate",
    title: "If a rule cannot parse it, we refuse to score it",
    body:
      "Three things stop a number reaching the board. Too small a sample, and it is not quoted at all. No statistical separation between the leader and the field, and the result is printed as a tie rather than a win. No deterministic predicate able to read the response, and it is reported UNMEASURED — never silently counted as a wrong answer, which would flatter the grader at the model's expense.",
    points: [
      { tag: "pain", text: "Leaderboards that convert unparseable answers into failures to fill the grid" },
      { tag: "pain", text: "Point-estimate leads presented as measured superiority" },
      { tag: "benefit", text: "Nothing quoted below n≥30; intervals shown only where n is honestly independent" },
      { tag: "benefit", text: "Ties printed as ties, and the unparsed rate published as its own figure" },
      { tag: "usp", text: "Where a leader is not clear of the majority-class baseline we say so on the axis" },
    ],
    href: "/methodology",
    cta: "Read the gate",
  },
  {
    kicker: "Slot fourteen, precisely",
    title: "The awkward slot is measured. Its separation is a tie.",
    body:
      "It would be tidier to say the fourteenth slot is gated and unmeasured. It is not true. Jail — whether a model can be talked past its own guardrails — is measured across 71 gold items on a seven-model fleet. Its separation is TIE on the live board, so we refuse to rank on it and never compare it against the canonical axis measured on the full fleet. A tie is not a separated leader — the discipline is in the label, not in the blank.",
    points: [
      { tag: "pain", text: "\"Gated\" is an easier story than \"measured, but not yet separable\"" },
      { tag: "benefit", text: "You see the sample size, the fleet and the exact status on the slot" },
      { tag: "benefit", text: "The best detector we measured still misses most escapes — and that is published" },
      { tag: "usp", text: "It caught our own fine-tune failing, and we published that too" },
    ],
    href: "/gspc-scoreboard",
    cta: "Open the board",
    video: { src: "/videos/proving-ground.mp4", poster: "/videos/proving-ground.jpg", title: "The Proving Ground — how we test containment" },
  },
  {
    kicker: "Breaking the mirror",
    title: "A ruler with no human end drifts, and every model agrees it hasn't",
    body:
      "If machines set the tests and machines grade the answers, the errors are correlated all the way down and nothing in the loop can see it. So the instrument is anchored against human performance on the same items, under consent-gated conditions. It is slower, it is more expensive, and it is the only thing that keeps the scale attached to reality.",
    points: [
      { tag: "pain", text: "AI-only evaluation loops that agree with themselves indefinitely" },
      { tag: "benefit", text: "Human performance measured on the same items, not borrowed from elsewhere" },
      { tag: "benefit", text: "Telemetry is consent-gated and assessed before use" },
      { tag: "usp", text: "Where we have no human baseline of our own, we cite nobody else's as if it were ours" },
    ],
    bg: {
      src: "/images/coliseum_humans_vs_humanoids.jpg",
      alt: "People and AI figures measured side by side against the same instrument",
    },
  },
  {
    kicker: "The refutation ledger",
    title: "A public, append-only log of our own corrections",
    body:
      "A leaderboard wants permanent results and no retractions. We do the opposite: every correction we make to our own published work goes into a signed, append-only record with the root cause attached. Old entries are never edited away — they are superseded in public, so you can always see what we said, when, and what changed our mind.",
    points: [
      { tag: "pain", text: "Quiet edits that make yesterday's number vanish without trace" },
      { tag: "benefit", text: "Every correction dated, signed and traceable to its cause" },
      { tag: "benefit", text: "Superseded entries preserved — append-only, never overwritten" },
      { tag: "usp", text: "We publish retractions of our own strongest claims, not just of typos" },
    ],
    href: "/refutation-ledger",
    cta: "Read the ledger",
    bg: {
      src: "/images/liveness_drift_engine.jpg",
      alt: "An append-only ledger recording corrections as they are made",
    },
  },
  {
    kicker: "Worked example",
    title: "The interval belonged to twenty assets, not a hundred and eighty cells",
    body:
      "Our provenance bench measured whether content marking survives ordinary handling. It did not: 0 of 20 marked assets survived, across 0 of 180 measured cells, giving a one-sided 95% Clopper–Pearson upper bound of 13.9%. The correction we published was about the denominator — that bound is computed at n=20 assets, not at n=180 cells, and quoting it against the larger number would have made the result look far stronger than it is. Small correction. Published anyway.",
    points: [
      { tag: "pain", text: "Intervals quoted against the biggest denominator in the room" },
      { tag: "benefit", text: "The n an interval belongs to is stated next to the interval" },
      { tag: "benefit", text: "Mis-paired values are quarantined explicitly, with the root cause logged" },
      { tag: "usp", text: "We correct in the direction that weakens our own result" },
    ],
    image: {
      src: "/images/verifiable_evidence_card.jpg",
      alt: "A measurement card annotated with its correction and the sample size the interval belongs to",
    },
  },
  {
    kicker: "The largest thing we withdrew",
    title: "We retracted our own consensus guarantee",
    body:
      "Our council is designed with 33 seats and a 23-of-33 threshold, and for a while we described that as a resilience property. Then we measured it. The effective number of independent legs came out at roughly 1.21 against three nominal ones — the legs were correlated, so the structure was not delivering the guarantee the design implied. We withdrew the claim in the ledger under DR-0007. The 33 seats and the 23-of-33 threshold remain what they always were: a design, not a measured property.",
    points: [
      { tag: "pain", text: "Architecture diagrams quietly promoted into safety guarantees" },
      { tag: "benefit", text: "A design figure labelled as design, everywhere it appears" },
      { tag: "benefit", text: "The measurement that killed the claim is published with the retraction" },
      { tag: "usp", text: "The strongest claim we ever made about ourselves is the one we withdrew first" },
    ],
    href: "/refutation-ledger",
    cta: "Read DR-0007",
    bg: {
      src: "/images/coliseum_swarm_clash.jpg",
      alt: "Many nominally independent legs revealed as correlated under measurement",
    },
  },
];

export const VERIFIABLE_TRUST_NOT_CLAIMED = [
  "We do not claim the fourteenth slot is gated or unmeasured. Jail is measured across 71 gold items on a seven-model fleet; its separation is TIE on the live board — a tie is not a separated leader — so it is never ranked.",
  "We do not claim our 33-agent council delivers a resilience or consensus guarantee. That claim was retracted under DR-0007 after we measured an effective independence of about 1.21 against 3 nominal legs. The 33 seats and the 23-of-33 threshold are a design figure only.",
  "We do not claim any independent time-stamping or sealing authority. Records are Ed25519-signed over a SHA-256 hash chain, verifiable against did:web:csoai.org, and nothing more.",
  "We do not publish third-party human-baseline scores as if they were ours. Where we have not measured a human baseline ourselves, no number appears.",
  "We do not claim our provenance result was retracted and replaced. The 13.9% one-sided upper bound stands; what we corrected was the denominator it is computed against — n=20 assets, not n=180 cells.",
];

export const VERIFIABLE_TRUST_RELATED = [
  { href: "/refutation-ledger", label: "The refutation ledger", what: "Every correction and retraction, append-only and signed." },
  { href: "/methodology", label: "The method", what: "Deterministic predicates, n≥30, Wilson intervals, and the honesty gate." },
  { href: "/gspc-scoreboard", label: "The live board", what: "Every slot with its sample size and separation status — measured and unmeasured alike, counted live from GET /api/gspc." },
  { href: "/live-ledger", label: "The living ledger", what: "How a measurement stays current when the statute moves." },
];
