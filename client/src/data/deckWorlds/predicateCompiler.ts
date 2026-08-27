import type { Slide } from "@/components/scrollworld";

/**
 * FROM STATUTE TO PREDICATE — owner deck ("Deterministic Legal Metrology"),
 * fact-checked into the scroll-world at /statute-to-predicate.
 *
 * WHAT THIS PAGE IS: the method by which a frozen statutory provision becomes a
 * boolean a stranger can evaluate. This is the part of the pipeline that RUNS —
 * it is how the board's predicates are authored. The apparatus for procedurally
 * generated environments is a separate, published DOCTRINE and lives at /metrology;
 * it is deliberately not restated here.
 *
 * SOURCE ART: slides from the owner deck, cut to their text-free region at build
 * time (public/images/method/) and badged, exactly as the infographics under
 * /images/infographics/crop/ are. The baked-in slide captions carried claims we
 * could not evidence, so the art is used and the words are ours.
 *
 * CORRECTIONS APPLIED TO THE SOURCE DECK:
 *  1. Deck title "Compliance as Absolute Mathematical Evidence" and the slide-6
 *     closing line "It is absolute mathematical evidence" — DROPPED. A predicate is
 *     only ever as good as the reading of the provision behind it. "Absolute" is not
 *     a property measurement has, and "compliance" is a determination a regulator
 *     makes, not one we make. Retitled to what the pipeline actually does.
 *  2. Deck slide 3 "A 3KB Ed25519/ML-DSA-65 signed JSON receipt" — CORRECTED. We sign
 *     Ed25519 today. ML-DSA-65 (FIPS 204) is built, not shipped — that exact discipline
 *     is already recorded in our own corrections ledger. The page says Ed25519 only.
 *  3. Deck slide 3 "Seed-reproducible (TrueSkill/OpenSkill math)" — DROPPED. No
 *     TrueSkill or OpenSkill implementation exists in this codebase. The rating claim
 *     is not made.
 *  4. Deck slides 2/3 "Instantaneous execution (milliseconds)" — DROPPED. No latency
 *     figure is measured for publication, so none is published.
 *  5. Deck slide 2 "Completely sterile from human interference" and slide 7 "Zero
 *     human-judge intervention … entirely sterile" — CORRECTED. Humans author the gold
 *     labels; what is excluded is a model or a vote deciding the verdict. The honest
 *     statement is the first design law, which is kept verbatim.
 *  6. Deck slide 5 "Ambiguity is stripped away" — CORRECTED. Where a provision is
 *     genuinely disputed we record the dispute rather than resolving it silently, which
 *     is what the deadline feed already does. Compilation removes ambiguity from the
 *     PREDICATE, never from the law.
 *  7. Deck slide 4 "distilled into 13 measurable axis (Governance, Security, Privacy,
 *     Commerce)" — CORRECTED. (NOTE 2026-08-26: this correction used to state the
 *     board's size and measured count as words. Both moved when the board was swept
 *     under ADR-001 — read totals off GET /api/gspc, never from this comment.) The
 *     count is read live from /api/gspc and never typed into the page. "Commerce" is
 *     not one of our axes and the invented grouping is dropped.
 *  8. Deck slide 7 "Strict environment parity — matched interfaces, action-rate caps,
 *     information parity" — NOT CLAIMED. Those strings appear only in deck copy in this
 *     repository; there is no implementation. Listed in the honesty band as design.
 *  9. Deck slides 8-13 restate the procedural-generation / contamination-resistance
 *     doctrine that already has a page at /metrology, where it is correctly marked as
 *     design rather than shipped. Not duplicated here; linked instead.
 * 10. RETAINED unchanged because it is correct and is our own first design law:
 *     "The verdict comes from a deterministic predicate. Never a vote. Never a model."
 *     Also retained: the 417-provision frozen corpus, and the Article 14 worked example.
 */

export const PREDICATE_HERO = {
  kicker: "The method — from statute to predicate",
  title: "A law is prose. A test has to be a boolean.",
  lede:
    "Between a published provision and a score there is a step most assurance skips: turning legal text into something a stranger can run and get the same answer. This page shows that step in full — the frozen corpus it starts from, the structure it is cut into, the boolean it ends as, and the signed record it produces.",
  bg: {
    src: "/images/method/foundry.png",
    alt: "A block of stone split by a green beam, a machined channel revealed inside it",
  },
  actions: [
    { href: "/methodology", label: "Read the full method", primary: true },
    { href: "/gspc-verify", label: "Verify a card yourself" },
  ],
};

export const PREDICATE_SLIDES: Slide[] = [
  {
    kicker: "Design law 1",
    title: "The verdict comes from a deterministic predicate. Never a vote. Never a model.",
    body:
      "This is the rule the rest of the pipeline exists to serve. A human-in-the-loop audit varies by assessor and by mood; a language model asked to grade another language model varies by temperature and cannot show its working. Neither can be recomputed by someone who does not trust us — which makes both useless as evidence. A predicate can be handed to a stranger, run, and checked against our answer.",
    points: [
      { tag: "pain", text: "An assessor's opinion cannot be re-run by the person relying on it" },
      { tag: "pain", text: "A model grading a model inherits the grader's failure modes silently" },
      { tag: "benefit", text: "A frozen predicate returns the same verdict for anyone who runs it" },
      { tag: "usp", text: "No model judges another model — anywhere in the scoring path" },
    ],
  },
  {
    kicker: "The raw material",
    title: "We do not invent rules. We parse frozen ones.",
    body:
      "The corpus is 417 published statutory provisions — the EU AI Act, GDPR and the Cyber Resilience Act, DORA and NIS2, NIST AI RMF and ISO/IEC 42001 among them. Frozen means the exact text we measured against is recorded with the result, so a disagreement can be traced to a provision rather than to an opinion. The board those predicates feed publishes both a slot count and a measured count, read live from /api/gspc and never typed into this page.",
    points: [
      { tag: "benefit", text: "417 frozen provisions, each cited and dated" },
      { tag: "benefit", text: "When a provision changes, the mapped predicates expire and we re-measure" },
      { tag: "usp", text: "The instrument is the law as published, not our summary of it" },
      { tag: "pain", text: "Where a date or a reading is genuinely disputed, we record the dispute rather than resolving it quietly" },
    ],
  },
  {
    kicker: "Step one — structure",
    title: "A provision is cut into a tree until every leaf is a boolean",
    body:
      "The text is parsed into its conditions: a root that is the statutory requirement, branches for each condition it imposes, and leaves that are true-or-false tests. Compilation removes ambiguity from the predicate — it does not remove ambiguity from the law, and it is not allowed to pretend otherwise. Where a provision admits more than one reasonable reading, that is recorded as a dispute rather than silently collapsed into one branch.",
    image: {
      src: "/images/method/ast.png",
      alt: "A carved stone dissolving into particles and reforming as a branching tree whose leaves are labelled as boolean executable conditions",
    },
    points: [
      { tag: "benefit", text: "Root: the statutory requirement, cited" },
      { tag: "benefit", text: "Leaves: conditions that evaluate TRUE or FALSE, nothing in between" },
      { tag: "usp", text: "An UNMEASURED slot stays empty — it is never rendered as a zero" },
    ],
  },
  {
    kicker: "Step two — the worked example",
    title: "Article 14, compiled",
    body:
      "Take the human-oversight obligation: a deployer must log the initiating person, the timestamp and the reason for every halt. Structural extraction names the variables — initiating person, timestamp, reason code. The assertion then reads: the log has a non-null initiator AND a valid timestamp AND a reason drawn from the approved set. True is a pass, false is a fail, and there is no third path in which someone's judgement decides. The predicate is frozen: it cannot be lobbied, it cannot hallucinate, and it does not sample from a language model.",
    points: [
      { tag: "pain", text: "The prose version is arguable; the assertion is not" },
      { tag: "benefit", text: "The same predicate, run by you, returns our answer or contradicts it in public" },
      { tag: "usp", text: "Frozen means a later disagreement is about the reading, and the reading is published" },
    ],
    href: "/methodology",
    cta: "See how gold labels are set",
  },
  {
    kicker: "Step three — the record",
    title: "About 3KB of signed JSON that you hold, not us",
    body:
      "The output is a small signed record: the scores, the sample size behind each one, the confidence interval where one is honest, the hashes, and the signature. It is Ed25519 over RFC-8785 canonical JSON, against the trust root at did:web:csoai.org, and it is deliberately small enough to email or attach to a tender. Re-attestation issues a new record; the old one is never edited. Verification is free, needs no account, and runs in your browser.",
    image: {
      src: "/images/method/receipt.png",
      alt: "A white slab bearing a green tag reading Ed25519 Verified, a signature seam running through it",
    },
    points: [
      { tag: "benefit", text: "Ed25519 over RFC-8785 canonical JSON — recomputable without our code" },
      { tag: "benefit", text: "Append-only: a correction is a new record, never an edit" },
      { tag: "usp", text: "You keep the card. It does not live on our server for us to amend later." },
    ],
    href: "/gspc-verify",
    cta: "Verify a card now — free",
  },
];

export const PREDICATE_NOT_CLAIMED = [
  "We do not claim this produces absolute or mathematical proof of anything. A predicate is exactly as good as the reading of the provision behind it, and that reading is a human judgement we publish so it can be argued with.",
  "We do not determine compliance. We measure behaviour against frozen, published instruments and sign the result. Whether an organisation complies is a determination for a regulator, and we are not one.",
  "We do not sign with ML-DSA-65 today. Signing is Ed25519. The post-quantum path is built and not shipped, and we say so rather than let the stronger word stand.",
  "We do not publish an execution-latency figure. Nothing here runs in a stated number of milliseconds, because we do not measure that for publication.",
  "We do not implement TrueSkill or OpenSkill rating in the shipped board, and no rating claim on this page depends on either.",
  "We do not claim environment parity, matched interfaces or action-rate caps as running features. They are design, and the arena's isolation apparatus is doctrine — see /metrology, where it is marked as such.",
  "We do not claim humans are absent from the method. Humans author the gold labels and the readings. What is excluded is a model, or a vote, deciding a verdict.",
];

export const PREDICATE_RELATED = [
  { href: "/methodology", label: "The method in full", what: "Determinism, n≥30, and why no model ever judges another." },
  { href: "/metrology", label: "The metrology apparatus", what: "The procedural-environment doctrine — published as design, not as shipped." },
  { href: "/gspc-verify", label: "Verify a card", what: "Run the chain yourself, in your browser, with no account." },
  { href: "/honesty", label: "The honesty gate", what: "Where our own fine-tunes lose our own arena, published in full." },
];
