import type { Slide } from "@/components/scrollworld";

/**
 * THE AI EVIDENCE RAIL — owner deck, fact-checked into the scroll-world at /evidence-rail.
 *
 * CORRECTIONS APPLIED TO THE SOURCE DECK:
 *  1. Deck slide 4 "Ed25519 + ML-DSA-65 post-quantum cryptography, anchored to a
 *     hash-chained ledger and OpenTimestamps" — two overclaims in one line. There is NO
 *     OpenTimestamps / RFC-3161 / Bitcoin anchoring (timestamp_authority: "none"), and
 *     ML-DSA-65 is BUILT, NOT SHIPPED. Rewritten to Ed25519 over a SHA-256 hash chain.
 *  2. Deck slide 4 "Expire: ... automatically transition a pass to
 *     EXPIRED-REGULATION-CHANGED", echoed on slide 12 — DROPPED ENTIRELY. Nothing expires.
 *     When the law moves we re-measure and issue a DELTA CARD; the old card stays.
 *  3. Deck slide 4 "417 frozen provisions across 4 axis" — four axis FAMILIES (GSPC), on a
 *     board. Coverage read live from /api/gspc, never typed. NOTE 2026-08-26: this
 *     note used to state the board's size as an integer; it is now larger (ADR-001,
 *     swept 2026-08-26). Read totals off the board — do not re-derive a count here.
 *  4. Deck slide 5's competitor quadrant (AIUC, Armilla, Munich Re, Vals AI, LatticeFlow,
 *     Credo AI, Holistic AI) plus "CSOAI stands entirely alone" — DROPPED. We cannot
 *     evidence other firms' conflicts, and asserting them in our own voice is exactly the
 *     unsourced claim-making this rail exists to replace. The structural argument is kept
 *     without naming anyone.
 *  5. Deck slides 3/6/7/11 market sizing — "$4.7 billion by 2032", "80% CAGR", "Eight
 *     Unoccupied Multi-Billion Dollar Markets", "$25M+ policies" — ALL DROPPED as
 *     unevidenced. The eight domains survive as places the same evidence format applies,
 *     not as markets we claim.
 *  6. Deck slide 7 "No software exists for notified bodies to assess this" — unfalsifiable
 *     superlative, removed.
 *  7. Deck slide 8 "Humanoid UL ... We certify evidence for evolving machines" — we certify
 *     nothing. Rewritten to measurement language.
 *  8. Deck slide 8 "the SovBench fleet module" — banned naming. It is the swarm axis.
 *  9. Deck slides 9-13 (the 150-day launch calendar, the insurer pitch date, the disclosure
 *     date) — an internal go-to-market plan, not public-surface content. Removed; only the
 *     statutory clocks that are canon here survive.
 */

export const EVIDENCE_RAIL_HERO = {
  kicker: "The evidence rail",
  title: "We don't sell evaluations. We sign evidence.",
  lede:
    "The AI governance market has a structural problem: the people grading models usually have a stake in the grade — a remediation product to sell, or risk of their own on the book. We built the other thing. A measurement layer that produces signed, deterministic facts and takes no money from anything it ranks.",
  bg: {
    src: "/images/verifiable_evidence_card.jpg",
    alt: "Hands holding a signed evidence card reading verified: true",
  },
  actions: [
    { href: "/gspc-verify", label: "Check a card — free", primary: true },
    { href: "/gspc-scoreboard", label: "Open the live board" },
  ],
};

export const EVIDENCE_RAIL_SLIDES: Slide[] = [
  {
    kicker: "The conflict",
    title: "Almost everyone grading AI has a stake in the grade",
    body:
      "It is not an accusation about any particular firm, it is a description of how the market is built. If you diagnose the problem and also sell the fix, your incentive runs one way. If you carry the risk and also set the score, it runs another. Neither arrangement is fraudulent and both are fine businesses — they just cannot produce neutral evidence, because neutrality is a structural property, not an intention.",
    points: [
      { tag: "pain", text: "The party diagnosing your gaps is often the party selling the remediation" },
      { tag: "pain", text: "Scores from a party that also carries the exposure are not independent inputs" },
      { tag: "benefit", text: "A grader with no product attached to any outcome" },
      { tag: "usp", text: "Structurally independent: we take no money from anything we rank, ever" },
    ],
    video: { src: "/videos/trust-ecosystem.mp4", poster: "/videos/trust-ecosystem.jpg", title: "The trust ecosystem — who Council of AI serves" },
  },
  {
    kicker: "The architecture",
    title: "Measure, sign, re-measure. Three verbs, no fourth.",
    body:
      "We evaluate against a frozen corpus of 417 statutory provisions using deterministic predicates at temperature zero — no model judging a model. We sign the result with Ed25519 over a SHA-256 hash chain, verifiable offline against the key published at did:web:csoai.org. And when the law or the system changes, we measure again and publish a delta card beside the original. Nothing expires; nothing is revoked; nothing is silently edited.",
    points: [
      { tag: "pain", text: "\"Valid until\" dates that track a calendar rather than the statute" },
      { tag: "benefit", text: "Deterministic grading — same rows, same grader, same number" },
      { tag: "benefit", text: "A delta card when the law moves, with the original preserved" },
      { tag: "usp", text: "Append-only by construction: corrections are published, never overwritten" },
    ],
    href: "/live-ledger",
    cta: "See how it stays current",
    bg: {
      src: "/images/secure_evidence_vault.jpg",
      alt: "A vault of signed measurement records anchored to frozen statutory text",
    },
  },
  {
    kicker: "The board",
    // No slot count in this title (ADR-001). It said "Fourteen slots" — a typed
    // count of the behavioural half only, published as though it were the board.
    title: "Every slot on the board, and the honest status on each one",
    body:
      // CORRECTED 2026-08-26. This read "All 14 board slots are measured" — a typed
      // count AND a measured over-claim: the board carries declared financial slots
      // with no run behind them, and calling every slot measured asserts runs that
      // do not exist. Both counts now come from GET /api/gspc, and the unmeasured
      // half is stated rather than omitted.
      "Not every slot on the board is measured, and the board says which are not: a slot with no run behind it is published as UNMEASURED so the gap is visible, never quietly folded into the measured count. The behavioural axis run on the full fleet with a separation test; jail — whether a model can be talked past its guardrails — is measured on a smaller fleet across 71 gold items, with living-board separation TIE (a TIE is not a separated leader). Cite live totals.public_count from GET /api/gspc for the slot count and the measured count together. Where a leader is not statistically separated we print a tie. Where a response cannot be parsed by a rule we report it unmeasured rather than scoring it wrong.",
    points: [
      { tag: "pain", text: "Grids filled in by converting ambiguity into failure" },
      { tag: "benefit", text: "Sample size, interval and status visible on every slot" },
      { tag: "benefit", text: "Ties reported as ties; unmeasured cells left visibly empty" },
      { tag: "usp", text: "The awkward slot is on the board, not omitted from it" },
    ],
    href: "/gspc-scoreboard",
    cta: "Read the board",
    bg: {
      src: "/images/coliseum_humans_vs_humanoids.jpg",
      alt: "Humans and AI systems measured side by side against the same instrument",
    },
  },
  {
    kicker: "Where the rail is needed",
    title: "The same signed format, wherever behaviour has to be evidenced",
    body:
      "Generative content marking. Autonomous systems and robotics. Critical infrastructure. Supply chain. Energy. Telecommunications. Health and life-sciences data. Advanced compute. These are not markets we claim — they are places where somebody will shortly have to prove how a system behaved, to somebody who was not there. That is one problem in eight costumes, and it wants one evidence format.",
    points: [
      { tag: "pain", text: "Each sector inventing its own unverifiable assurance dialect" },
      { tag: "benefit", text: "One signed, machine-readable format that travels across sectors" },
      { tag: "benefit", text: "The same card reads for a human, an agent and an answer engine" },
      { tag: "usp", text: "Open standards throughout — nobody needs our permission to read it" },
    ],
    image: {
      src: "/images/literacy_training_arena.jpg",
      alt: "The same measurement format applied across many different settings",
    },
  },
  {
    kicker: "The clocks",
    title: "Obligations arrive on dates, not on readiness",
    body:
      "The EU AI Act's transparency duties — including machine-readable marking of generated content under Article 50 — apply from 2 August 2026, and its serious-incident reporting under Article 73 sits in the same wave. Providers will need evidence formats a regulator can actually read. Every EU member state has to stand up a regulatory sandbox, and those sandboxes need measurement rails underneath them.",
    points: [
      { tag: "pain", text: "Deadlines that arrive whether or not your evidence tooling does" },
      { tag: "pain", text: "Incident reports assembled by hand, in whatever format seemed reasonable" },
      { tag: "benefit", text: "Signed, dated evidence bound to the specific provision in question" },
      { tag: "usp", text: "Our corpus-watch tracks the statutory text daily, so drift is a published event" },
    ],
    href: "/frameworks/eu-ai-act",
    cta: "Read the Act mapping",
  },
  {
    kicker: "The business model",
    title: "The rail is free. The relying party pays.",
    body:
      "Developers never pay and never can — verification is free forever, with no account, no rate limit and no relationship required. The money comes from the parties who need the truth to be neutral: insurers, auditors, procurement. It is the Let's Encrypt shape applied to governance. Free at the point of verification is not generosity; it is the only structure in which the evidence is worth anything.",
    points: [
      { tag: "pain", text: "Paywalled assurance, where the public can never check the claim" },
      { tag: "benefit", text: "Anyone can verify any card, free, forever, without an account" },
      { tag: "benefit", text: "No pricing on any ranked outcome — a grade is never for sale" },
      { tag: "usp", text: "Paid by the observer, never by the observed" },
    ],
    href: "/gspc-verify",
    cta: "Verify something now",
    bg: {
      src: "/images/coliseum_hero_arena.jpg",
      alt: "The open arena where any observer can check the result",
    },
  },
  {
    kicker: "What actually runs today",
    title: "The parts that exist, and the parts that are design",
    body:
      "The board, the signed cards, the public verification endpoint, the corpus-watch and the refutation ledger are live and checkable right now — that is what the links on this page go to. Other pieces described in our architecture are design, and we label them as design wherever they appear. The distinction is the point: a rail that overstates what it carries is not a rail.",
    points: [
      { tag: "benefit", text: "Every claim on this page resolves to a live endpoint or a published record" },
      { tag: "benefit", text: "Design figures are labelled as design, including our own council structure" },
      { tag: "usp", text: "Where we retracted a claim, the retraction is published beside it" },
    ],
    href: "/refutation-ledger",
    cta: "Read what we retracted",
    video: { src: "/videos/csoai-architecture.mp4", poster: "/videos/csoai-architecture.jpg", title: "How Council of AI is built — the architecture" },
  },
];

export const EVIDENCE_RAIL_NOT_CLAIMED = [
  "We do not claim anything we issue expires or auto-downgrades. There is no expiry state and no revocation. When the law moves we re-measure and publish a delta card; the original stays on the record.",
  "We do not claim any independent time-stamping. No RFC-3161, no OpenTimestamps, no blockchain anchor — the anchor is Ed25519 over a SHA-256 hash chain against did:web:csoai.org.",
  "We do not claim post-quantum signing. Ed25519 today; the ML-DSA-65 (FIPS-204) signer is built but not shipped, and the label changes only when it ships.",
  "We do not publish market sizes, premium projections or growth rates for AI assurance or AI insurance. Those numbers are not ours to evidence.",
  "We do not characterise named competitors' conflicts of interest. The structural argument on this page is about market shapes, not about any particular firm.",
  "We do not certify, accredit or approve anything, in any sector named here.",
];

export const EVIDENCE_RAIL_RELATED = [
  { href: "/insurers", label: "For underwriters", what: "The same evidence, read as an actuarial input." },
  { href: "/live-ledger", label: "The living ledger", what: "How a measurement stays current when the statute moves." },
  { href: "/evidence", label: "The evidence hub", what: "Continuous evidence collection across your own controls." },
  { href: "/methodology", label: "The method", what: "Deterministic predicates, n≥30, and what we refuse to score." },
];
