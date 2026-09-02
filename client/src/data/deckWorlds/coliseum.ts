import type { Slide } from "@/components/scrollworld";

/**
 * THE COLISEUM OF AI — owner deck, fact-checked into the scroll-world at /coliseum.
 *
 * CORRECTIONS APPLIED TO THE SOURCE DECK:
 *  1. Deck slide 10 "OpenTimestamps Anchor: Immutable, untamperable date verification"
 *     — DROPPED. We publish timestamp_authority: "none". No RFC-3161, no OpenTimestamps,
 *     no Bitcoin anchor. The real anchor is Ed25519 + SHA-256 hash-chain vs did:web:csoai.org.
 *  2. Deck slide 10 "Ed25519 Signature: Post-quantum ready" — FALSE. Ed25519 is not
 *     post-quantum. ML-DSA-65 (FIPS-204) is BUILT, NOT SHIPPED (client/src/data/chain.ts);
 *     the label names it only in the commit it ships. Rewritten to that.
 *  3. Deck slide 10 "Confidence: 99.9%" — no such field exists on any card and no source
 *     evidences it. DROPPED rather than published.
 *  4. Deck slide 4 "a rigid 14-axis instrument" / 14 lit tiles — a typed count, and the
 *     wrong one. Coverage is read live from /api/gspc (totals.public_count), never typed.
 *     NOTE 2026-08-26: this note previously asserted "the board is 14 SLOTS". It is not:
 *     ADR-001 rules 14 GSPC + 8 financial/domain, and the sweep of 2026-08-26 wired all
 *     of them into the signed payload. Do not re-derive the number from this comment —
 *     read totals off the board. That re-derivation is the exact defect ADR-001 exists
 *     to stop, and it is why no count is typed in the copy below.
 *  5. Deck slide 3 "THE MANDATE: EU AI Office / UK DSIT / GPAI Delegates / US State
 *     Frameworks" — we hold NO mandate from any authority and no interface agreement with
 *     the named bodies. Rewritten: we measure published systems against published law, on
 *     nobody's instruction.
 *  6. Deck slide 9 "mathematically undeniable proof" / "incontrovertible truth" — a
 *     signature proves PROVENANCE, NOT CORRECTNESS (our own provbench caveat says exactly
 *     this). Rewritten to what a signature actually establishes.
 *  7. Deck slide 8 "10-15 day right-of-reply firewall" — no file or endpoint in this repo
 *     evidences that window. The day count is DROPPED; the right of reply itself is kept.
 *  8. Deck slide 2 "December 2, 2026: Machine-Readable Marking Grace Period Ends" —
 *     contradicted by our own canon, which states Article 50 marking applies from
 *     2 August 2026 and was NOT deferred by the Digital Omnibus. The December date is
 *     dropped; the August one is used.
 *  9. Deck slide 11 penalty figures (€15M / 3%, Art 99(4)) are statutory text, not our
 *     measurement, and are labelled as such.
 */

export const COLISEUM_HERO = {
  kicker: "The Coliseum of AI",
  title: "Put the model in the arena and see what it actually does",
  lede:
    "Frontier systems face the same frozen tests, in the open, judged by a fixed rule rather than by another model. What comes out is not an opinion or a badge — it is a signed measurement anyone can recompute, including the parts that make us look bad.",
  bg: {
    src: "/images/coliseum_hero_arena.jpg",
    alt: "Clay figures and green verification seals gathered in a marble arena",
  },
  actions: [
    { href: "/gspc-arena", label: "Enter the arena", primary: true },
    { href: "/dashboard?tab=board", label: "Read the board" },
  ],
};

export const COLISEUM_SLIDES: Slide[] = [
  {
    kicker: "Why now",
    title: "Self-reporting stopped being enough",
    body:
      "The EU AI Act's Article 50 transparency duties apply from 2 August 2026: generated content has to be marked machine-readably, and saying you comply is not the same as showing it. The statutory penalties for high-risk breaches run to €15 million or 3% of worldwide annual turnover under Article 99(4) — that is the law's number, not ours.",
    points: [
      { tag: "pain", text: "\"We comply\" is a sentence, not evidence a regulator can check" },
      { tag: "pain", text: "Marking obligations bite whether or not your tooling is ready" },
      { tag: "benefit", text: "A dated, signed measurement against the exact provision in question" },
      { tag: "usp", text: "Frozen statutory text, so the thing you were measured against cannot be moved later" },
    ],
    href: "/frameworks/eu-ai-act",
    cta: "Read the Act mapping",
  },
  {
    kicker: "From statute to instrument",
    title: "Law is turned into tests, not into adjectives",
    body:
      // No slot count typed here (ADR-001): this string is static deck copy with no
      // data source of its own, and the count it used to carry ("fourteen slots")
      // went stale the moment the board was swept. The live count is on the board.
      "Legal text is distilled into a frozen, publicly readable corpus, then mapped onto the board's slots. Every measured claim traces back to a specific provision at a specific version, so a disagreement becomes a disagreement about a line of law rather than about a mood.",
    points: [
      { tag: "pain", text: "Safety scores that cite no rulebook and answer to no one" },
      { tag: "benefit", text: "Each result names the provision it was measured against" },
      { tag: "benefit", text: "The mapping is public — argue with it clause by clause" },
      { tag: "usp", text: "Frozen versions mean today's card still means the same thing next year" },
    ],
    href: "/framework-crosswalks",
    cta: "Open the crosswalk",
    bg: {
      src: "/images/secure_evidence_vault.jpg",
      alt: "A vault door open on the frozen statutory corpus, clay figures holding a signed card",
    },
  },
  {
    kicker: "Sandbox I — the logic duel",
    title: "No model ever judges another model",
    body:
      "This is our first design law and it is not negotiable. Every verdict comes from a deterministic predicate — a fixed rule that either fires or does not. Run the same rows through the same grader tomorrow and you get the same number. There is no judge model, no rubric prompt, and therefore no place for one system's blind spots to quietly become the scoreboard.",
    points: [
      { tag: "pain", text: "Model-on-model scoring inherits the judge's own failure modes" },
      { tag: "pain", text: "Rankings you cannot reproduce are rankings you cannot challenge" },
      { tag: "benefit", text: "Same rows, same grader, same answer — every time" },
      { tag: "usp", text: "Responses no rule can parse are reported UNMEASURED, never scored as wrong" },
    ],
    href: "/methodology",
    cta: "See how it is judged",
    image: {
      src: "/images/coliseum_logic_duel.jpg",
      alt: "A human and an AI facing each other across a chessboard in the arena",
    },
  },
  {
    kicker: "Sandbox II — swarm clashes",
    title: "Systems that act in sequence, measured in motion",
    body:
      "AI is moving from a single prompt to long chains of tool calls and agent hand-offs, and behaviour that looks safe one turn at a time can drift over twenty. Our swarm bank puts multi-step workflows under adversarial pressure. It is a protocol bank — a small number of prompts scored across many instances — so its instances are not independent, and we publish that caveat next to the number rather than behind it.",
    points: [
      { tag: "pain", text: "One-shot benchmarks say nothing about a twenty-step agent run" },
      { tag: "benefit", text: "Multi-agent workflows measured under deliberate pressure" },
      { tag: "benefit", text: "The effective-n caveat travels with the score, not in a footnote nobody opens" },
      { tag: "usp", text: "Where instances are not independent we show no interval rather than a flattering one" },
    ],
    href: "/dashboard?tab=board",
    cta: "See the swarm axis",
    bg: {
      src: "/images/coliseum_swarm_clash.jpg",
      alt: "A swarm of green shards clashing with clay scientists raising shields",
    },
  },
  {
    kicker: "Sandbox III — humans versus humanoids",
    title: "The ruler needs a human end",
    body:
      "Machines grading machines is a closed loop with correlated errors. So the instrument is anchored against human performance on the same items, under consent-gated, data-protection-cleared conditions. That anchor is what stops a leaderboard from drifting away from reality while every model on it agrees with every other.",
    points: [
      { tag: "pain", text: "AI-only evaluation drifts, and every model agrees it hasn't" },
      { tag: "benefit", text: "Model behaviour compared against people on the same items" },
      { tag: "benefit", text: "Telemetry is consent-gated and assessed before it is used" },
      { tag: "usp", text: "The human baseline is published, not asserted" },
    ],
    href: "/gspc-arena",
    cta: "Take the human side",
    image: {
      src: "/images/coliseum_humans_vs_humanoids.jpg",
      alt: "People directing AI figures with beams of light, keeping human oversight",
    },
    video: { src: "/videos/proving-ground.mp4", poster: "/videos/proving-ground.jpg", title: "The Proving Ground — how we test containment" },
  },
  {
    kicker: "The public watchdog",
    title: "Anyone can report it. We measure it. The provider gets to answer.",
    body:
      "When an AI behaves badly in the real world, the report should not vanish into a vendor's support queue. Anyone can raise one here. We turn the allegation into a measurement, put the finding to the provider for reply before anything is published, and then publish what the measurement actually showed. We map behaviour to provisions; we do not make legal rulings — that is a regulator's job.",
    points: [
      { tag: "pain", text: "Real-world harms disappear into a private inbox" },
      { tag: "benefit", text: "A public route from \"this looks wrong\" to a measured, signed finding" },
      { tag: "benefit", text: "Providers get a right of reply before publication, every time" },
      { tag: "usp", text: "We map reports to provisions — we never issue a legal verdict of our own" },
    ],
    href: "/watchdog",
    cta: "Open the watchdog",
    image: {
      src: "/images/public_watchdog_intake.jpg",
      alt: "The public watchdog reporting funnel, open to everyone",
    },
  },
  {
    kicker: "What comes out",
    title: "A small signed card — and an honest account of what it proves",
    body:
      "The output is roughly three kilobytes of JSON: scores, sample sizes, intervals, the provision measured against, and the hashes of the rows behind them. It is signed with Ed25519 over a SHA-256 hash chain, checkable offline against the key published at did:web:csoai.org. Be clear about what that establishes: a surviving signature proves provenance — these bytes, unaltered, from this key. It does not prove the content is correct, safe or lawful. Those are what the measurement is for.",
    points: [
      { tag: "pain", text: "Reports that sit on someone else's server and can change quietly" },
      { tag: "benefit", text: "A ~3KB file you hold and can re-check in any browser" },
      { tag: "benefit", text: "The signing key comes from the domain itself — no key exchange with us" },
      { tag: "usp", text: "We state the limit of the signature on the card, not in a disclaimer" },
      { tag: "usp", text: "Free to verify, forever, with no account" },
    ],
    href: "/gspc-verify",
    cta: "Verify a card",
    bg: {
      src: "/images/verifiable_evidence_card.jpg",
      alt: "Hands holding a signed evidence card reading verified: true",
    },
  },
  {
    kicker: "The shift",
    title: "Certification tells you someone approved it. Measurement tells you what it did.",
    body:
      "A certificate is a judgement sold by a party with an interest in the outcome, delivered as a verdict you cannot inspect. A measurement is a number you can reproduce, with the method and the scoring code published beside it. We do not issue conformity marks, we do not accredit, and we take no money from anything we rank.",
    points: [
      { tag: "pain", text: "Pay-to-play assessment, where the grader also sells the fix" },
      { tag: "pain", text: "Opaque verdicts with no rows, no n, and no way to recompute" },
      { tag: "benefit", text: "Published tests and published scoring code — run them yourself" },
      { tag: "benefit", text: "Ties reported as ties; unmeasured cells left visibly empty" },
      { tag: "usp", text: "Independent by construction: no revenue from any ranked party" },
    ],
    href: "/methodology",
    cta: "Read the method",
  },
];

export const COLISEUM_NOT_CLAIMED = [
  "We do not claim any mandate, appointment or interface agreement with the EU AI Office, UK DSIT, GPAI bodies or any US authority. We measure published systems against published law on nobody's instruction.",
  "We do not claim the signature proves a system is correct, safe or lawful. A surviving signature proves provenance only — these bytes, unaltered, from this key. Everything else is what the measurement itself says.",
  "We do not claim any independent time-stamping. No RFC-3161, no OpenTimestamps, no blockchain anchor: our cards declare no timestamping authority, and the anchor is Ed25519 over a SHA-256 hash chain verified against did:web:csoai.org.",
  "We do not claim post-quantum signing. Cards are signed with Ed25519 today. The ML-DSA-65 (FIPS-204) signer is built but not shipped, and the label will name it in the same commit it ships — never before.",
  "We do not claim to certify, accredit or issue a legal ruling. Reports are mapped to provisions; the enforcement judgement belongs to the regulator.",
];

export const COLISEUM_RELATED = [
  { href: "/gspc-arena", label: "Council Space", what: "Watch models face the same frozen tests, head to head." },
  { href: "/dashboard?tab=board", label: "The live board", what: "Every slot, every sample size, every separation status — counted live from GET /api/gspc, never typed." },
  { href: "/watchdog", label: "The public watchdog", what: "Report AI behaviour that looks wrong — and see what happens next." },
  { href: "/methodology", label: "The method", what: "Deterministic predicates, n≥30, Wilson intervals, and what we refuse to score." },
];
