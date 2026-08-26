import type { Slide } from "@/components/scrollworld";

/**
 * THE LIVING LEDGER — owner deck, fact-checked into the scroll-world at /live-ledger.
 *
 * CORRECTIONS APPLIED TO THE SOURCE DECK (each is deliberate, none is a typo):
 *  1. Deck slide 7: "Axis 14 (Swarm Agency) remains honestly gated and explicitly
 *     unmeasured." — WRONG TWICE. Slot 14 is JAIL (guardrail escape), and it IS
 *     MEASURED: 7 models x 71 gold items, n=71, with its SEPARATION TIE. Swarm
 *     is a MEASURED board axis too. Rewritten to the truth. NOTE 2026-08-26: this
 *     correction originally typed a slot count and a grammar that treated every slot
 *     as measured; the board carries declared UNMEASURED slots. Read totals off
 *     GET /api/gspc — do not re-derive a count from this comment.
 *  2. Deck slide 9 ("The Expiry Trigger", validUntil = min(window, provision-change-event),
 *     "the pass instantly degrades", "EXPIRED - REGULATION CHANGED") — DROPPED ENTIRELY.
 *     Nothing we issue expires. When the law moves we RE-MEASURE and issue a DELTA CARD;
 *     the old card stays; history is append-only.
 *  3. Deck slide 11 Layer 3 "Hash-chained to an immutable... ledger" — tightened to the
 *     real mechanic: Ed25519 + SHA-256 hash-chain against did:web:csoai.org. There is NO
 *     timestamping authority (timestamp_authority: "none") — no RFC-3161, no
 *     OpenTimestamps, no Bitcoin anchoring. Those were purged as overclaims.
 *  4. Deck slides 5/6/12 "417 provisions derived from five core regulatory frameworks" —
 *     417 is canon (canonCounters.FROZEN_PROVISIONS; /api/gspc doi_note "417-Provision
 *     Frozen Corpus Anchor") but the breakdown is 113 AI Act + 99 GDPR + 71 CRA + 64 DORA
 *     + 46 NIS2 + others, so "five frameworks" is wrong. Stated as the canon breakdown.
 *  5. Deck slide 8 "Trigger: 06:45 UTC Daily Sweep" — the exact clock time is not
 *     evidenced by any file or endpoint in this repo. Dropped; "daily" retained, and the
 *     verifiable figure used instead (127 provisions across four instruments).
 *  6. Deck slide 6 "The 4 GSPC Core Axes (Governance, Safety, Provenance, Continuity)" —
 *     correct as printed here; the Pricing deck's "Privacy" variant is the wrong one.
 */

export const LIVING_LEDGER_HERO = {
  kicker: "The living ledger",
  title: "A certificate is out of date the day after it is printed",
  lede:
    "So we do not print one. We measure your AI against frozen statutory text, sign the result, and watch the law itself. When a provision actually changes, we measure again and issue a fresh card — and the old one stays on the record, because history that can be edited is not evidence.",
  bg: {
    src: "/images/liveness_drift_engine.jpg",
    alt: "An hourglass weighing a stale certification seal against a freshly re-measured one, fed by EUR-Lex and legislation.gov.uk ribbons",
  },
  actions: [
    { href: "/gspc-verify", label: "Verify a card — free", primary: true },
    { href: "/gspc-scoreboard", label: "Open the live board" },
  ],
};

export const LIVING_LEDGER_SLIDES: Slide[] = [
  {
    kicker: "The illusion",
    title: "Point-in-time compliance is a photograph of a moving thing",
    body:
      "Models change under you — a new checkpoint, a new system prompt, a new tool. The law changes too. A stamp dated last spring says nothing about either. The answer is not a faster stamp; it is a measurement that knows when it has gone stale.",
    points: [
      { tag: "pain", text: "Your model shipped three updates since the audit closed" },
      { tag: "pain", text: "A frozen certificate becomes a liability the moment the statute moves" },
      { tag: "benefit", text: "A result that is bound to a dated version of the law, not to a calendar" },
      { tag: "usp", text: "We watch the statute daily and tell you when your evidence needs redoing" },
    ],
    video: { src: "/videos/living-law.mp4", poster: "/videos/living-law.jpg", title: "Living law — why a measurement is never final" },
  },
  {
    kicker: "The doctrine",
    title: "We measure. We do not certify.",
    body:
      "We issue no approvals, no conformity marks and no accreditation. We are an instrument: we run your system on published, frozen tests, apply a fixed rule, and sign what came out. Whether that is good enough is the regulator's call and yours — never ours to sell you.",
    points: [
      { tag: "pain", text: "Assurance vendors grade you, then sell you the remedy for the grade" },
      { tag: "benefit", text: "A measured result with no product attached to the outcome" },
      { tag: "benefit", text: "The verdict is a deterministic predicate — never a vote, never a model judging a model" },
      { tag: "usp", text: "We take no money from anything we rank" },
    ],
    href: "/methodology",
    cta: "Read the method",
  },
  {
    kicker: "The bedrock",
    title: "Anchored to 417 frozen statutory provisions",
    body:
      "Every measurement points at a specific line of law, held at a specific version. The frozen corpus is 417 provisions — 113 from the EU AI Act, 99 from GDPR, 71 from the Cyber Resilience Act, 64 from DORA, 46 from NIS2, and the remainder from the other instruments in the crosswalk. Not a vibe about safety. A citation.",
    points: [
      { tag: "pain", text: "\"AI safety\" scores that trace back to nobody's rulebook" },
      { tag: "benefit", text: "Every claim carries the provision it was measured against" },
      { tag: "benefit", text: "Frozen at a version, so two people reading the same card see the same law" },
      { tag: "usp", text: "The corpus is public — you can argue with the mapping, provision by provision" },
    ],
    href: "/framework-crosswalks",
    cta: "See the crosswalk",
    bg: {
      src: "/images/secure_evidence_vault.jpg",
      alt: "Clay figures before a vault door holding a signed evidence card, the frozen statutory corpus behind them",
    },
  },
  {
    kicker: "Coverage, stated honestly",
    // No count typed in this title (ADR-001). It read "Fourteen measured of
    // fourteen quotable" — a typed slot count in a grammar that hid the
    // unmeasured slots by construction. The live counts are on the board page.
    title: "Coverage, stated with the unmeasured half included",
    body:
      // CORRECTED 2026-08-26. This typed a slot count and then called every slot
      // measured. Under the swept board that asserts runs that do not exist: some
      // slots are declared and carry no measurement at all. Counts now come from
      // GET /api/gspc, and both of them travel together.
      "Our board publishes a slot count and a measured count, and they are different numbers — cite totals.public_count on GET /api/gspc rather than either alone. A slot with no run behind it is published as UNMEASURED so the gap is visible; it is never counted as a measurement. The behavioural axes are measured on the full fleet with a separation test. Jail — whether a model can be talked past its own guardrails — is measured on a smaller seven-model fleet across 71 gold items; its separation is TIE on the live board, so we do not treat it as a separated leader or rank on it.",
    points: [
      { tag: "pain", text: "Scorecards quietly omit the axis the model would fail" },
      { tag: "benefit", text: "Every slot shows its sample size and its status, including the awkward one" },
      { tag: "benefit", text: "Ties are printed as ties — a point-estimate lead is not a measured advantage" },
      { tag: "usp", text: "Where a number would be noise, the cell stays empty and says why" },
    ],
    href: "/gspc-scoreboard",
    cta: "Open the board",
    video: { src: "/videos/proving-ground.mp4", poster: "/videos/proving-ground.jpg", title: "The Proving Ground — how we test containment" },
  },
  {
    kicker: "The liveness engine",
    title: "Frozen law is not static law — so something has to watch it",
    body:
      "Our corpus-watch re-hashes 127 provisions across four instruments — the EU AI Act, UK GDPR, the Data Protection Act 2018 and NIS2-UK — every day, from the free EUR-Lex and legislation.gov.uk feeds. A changed hash is a drift event. A drift event flags every measurement anchored to that provision for re-measurement.",
    points: [
      { tag: "pain", text: "Nobody tells you the clause your compliance rested on was amended" },
      { tag: "benefit", text: "Daily hash diffing of the statutory text you are measured against" },
      { tag: "benefit", text: "Drift events are published, not buried in a change log" },
      { tag: "usp", text: "Public feeds only — you can run the same watch yourself and check us" },
    ],
    href: "/live-ledger#records",
    cta: "Read the drift record",
    bg: {
      src: "/images/coliseum_hero_arena.jpg",
      alt: "The measurement arena seen from above, verification seals arranged around its floor",
    },
  },
  {
    kicker: "What happens when the law moves",
    title: "Nothing expires. We re-measure and issue a delta card.",
    body:
      "This is the part most assurance gets backwards. We never revoke a card and we never let one quietly rot into \"expired\". When a provision changes, we run the measurement again against the new text and publish a delta card beside the original. Both stay. The history is append-only, so the record of what was true, and when, survives.",
    points: [
      { tag: "pain", text: "\"Valid until\" dates that tell you nothing about whether the law actually moved" },
      { tag: "pain", text: "Silent edits that make yesterday's number disappear" },
      { tag: "benefit", text: "A fresh delta card the moment the statute it depends on changes" },
      { tag: "benefit", text: "The superseded card is preserved, not deleted — you can show what you relied on" },
      { tag: "usp", text: "Append-only by construction; corrections are published, never overwritten" },
    ],
    href: "/refutation-ledger",
    cta: "Read the corrections",
  },
  {
    kicker: "The artefact",
    title: "About three kilobytes, signed, and yours to keep",
    body:
      "The output is not a report. It is a small signed JSON card carrying the scores, the sample sizes, the intervals, the provision it was measured against and the hashes of the rows behind it. Records are SHA-256 hash-linked for tamper-evidence and signed with Ed25519 against the key published at did:web:csoai.org. Verify it offline, in your own browser, with no account and no API key.",
    points: [
      { tag: "pain", text: "Evidence that lives on the vendor's server and can change without you knowing" },
      { tag: "benefit", text: "A ~3KB file you hold — recompute the hash chain anywhere" },
      { tag: "benefit", text: "The public key comes from the domain itself, so no key exchange with us" },
      { tag: "usp", text: "Verification is free forever — no login, no rate limit, no relationship required" },
    ],
    href: "/gspc-verify",
    cta: "Check a card now",
    bg: {
      src: "/images/verifiable_evidence_card.jpg",
      alt: "Hands holding a signed evidence card reading verified: true",
    },
  },
  {
    kicker: "Read it yourself",
    title: "The ledger below is the live one",
    body:
      "Everything above describes how the record is kept. What follows is the record — queryable, signed, and served from the same API that feeds the board. Nothing on this page is a screenshot of it.",
    points: [
      { tag: "benefit", text: "Query the decisions, verdicts and evidence links directly" },
      { tag: "usp", text: "The same signed source serves people, agents and answer engines" },
    ],
    video: { src: "/videos/csoai-architecture.mp4", poster: "/videos/csoai-architecture.jpg", title: "How Council of AI is built — the architecture" },
  },
];

export const LIVING_LEDGER_NOT_CLAIMED = [
  "We do not claim anything we issue expires, lapses or is revoked. There is no \"valid until\" mechanic and no automatic downgrade. When the law moves we re-measure and publish a delta card beside the original.",
  "We do not claim any independent time-stamping authority. There is no RFC-3161 timestamp, no OpenTimestamps proof and no blockchain anchor behind these cards. The anchor is an Ed25519 signature over a SHA-256 hash chain, checkable against did:web:csoai.org — and nothing more.",
  "We do not claim slot 14 is unmeasured. Jail is measured across 71 gold items on a seven-model fleet; its separation is TIE on the live board — not UNTESTED, and not a separated leader — so we never compare it against the canonical axes.",
  "We do not claim to certify, approve or accredit anything. No conformity mark, no accreditation chain, no legal ruling — a measurement, and the regulator's judgement stays the regulator's.",
];

export const LIVING_LEDGER_RELATED = [
  { href: "/methodology", label: "The method", what: "Deterministic predicates, n≥30, Wilson intervals, and what we refuse to score." },
  { href: "/refutation-ledger", label: "The refutation ledger", what: "Every correction and retraction we have published, append-only." },
  { href: "/gspc-scoreboard", label: "The live board", what: "Every slot with its sample size and separation status — measured and unmeasured alike, counted live from GET /api/gspc." },
  { href: "/framework-crosswalks", label: "The crosswalk", what: "How statutory provisions map onto the measured axes." },
];
