import type { Slide } from "@/components/scrollworld";

/**
 * PRICING AI RISK — owner deck, fact-checked into the scroll-world at /insurers.
 *
 * CORRECTIONS APPLIED TO THE SOURCE DECK:
 *  1. Deck slide 6 "GSPC ... Governance, Safety, Privacy, Continuity" — WRONG. GSPC is
 *     Governance · Safety · PROVENANCE · Continuity (/api/gspc, schema csoai.gspc-axes).
 *  2. Deck slides 1/3/11 market sizing — "$4.7 billion by 2032", "80% CAGR", "Verisk
 *     exclusion endorsements (Jan 1, 2026)", "Munich Re aiSure ($15M capacity)",
 *     "Armilla Vanguard AI ($25M+ capacity)" — ALL DROPPED. Not evidenced by any file or
 *     endpoint here. Third-party figures belong on /api/reported, cited and dated, under
 *     "reported by the source, not measured here" — never asserted in our own voice.
 *  3. Deck slides 3/9 "Illinois SB 315 / NY RAISE effective Jan 1, 2027", "$1M/$3M
 *     Illinois" — DROPPED for the same reason. The EU AI Act penalty band is statutory
 *     text and is kept, labelled as the law's number rather than a measurement.
 *  4. Deck slide 5 "Setting the n >= 100+ CVaR threshold" — invented. Our quoting floor
 *     is n>=30 and Wilson intervals are shown only where n is honestly independent.
 *  5. Deck slide 7 "Parametric Payout — the smart contract or policy is triggered
 *     automatically" — we operate no oracle, no contract and no settlement. Rewritten:
 *     we supply signed rows; the trigger, the distribution and the payout are the
 *     insurer's, computed in their own model.
 *  6. Deck slide 11 "CSOAI Deterministic Oracle" — "oracle" implies an on-chain feed we
 *     do not run. Called what it is: a measurement rail.
 *  7. Deck slide 8 "the first measurement artifact an insurer can read without
 *     translation" — unfalsifiable superlative, removed.
 */

export const PRICING_RISK_HERO = {
  kicker: "Pricing AI risk",
  title: "You cannot underwrite what nobody has measured",
  lede:
    "Actuaries price tails from evidence. AI assurance mostly produces adjectives. We produce signed, deterministic rows — per-axis results with their sample sizes and intervals, recomputable offline — so the exposure can be modelled in your own book rather than taken on a vendor's word.",
  bg: {
    src: "/images/secure_evidence_vault.jpg",
    alt: "Clay figures before a vault of signed measurement records",
  },
  actions: [
    { href: "/api/gspc", label: "Read the live board", primary: true },
    { href: "/gspc-verify", label: "Verify a card — free" },
  ],
};

export const PRICING_RISK_SLIDES: Slide[] = [
  {
    kicker: "Why AI breaks the usual maths",
    title: "Human error is independent. Model failure is correlated.",
    body:
      "Traditional indemnity works because a thousand people have a thousand separate bad days, and averages behave. One model deployed a thousand times has one bad day a thousand times at once. The law compounds this: statute does not grade your average, it names the events that must not happen. That is a tail problem wearing an averages costume.",
    points: [
      { tag: "pain", text: "Claims history from human-error lines does not transfer to model failure" },
      { tag: "pain", text: "A single weight update can move every deployed instance at once" },
      { tag: "benefit", text: "Per-axis failure mass, not just a headline accuracy" },
      { tag: "usp", text: "We publish severity-weighted harm alongside accuracy, because the mean hides the tail" },
    ],
  },
  {
    kicker: "What changes",
    title: "From reactive indemnity to evidence you can price against",
    body:
      "The gap is not appetite, it is inputs. Underwriters have questionnaires and incident anecdotes; what they need is a continuous, deterministic feed of how the system actually behaves against the provisions that carry the penalties. That is the only thing we make.",
    points: [
      { tag: "pain", text: "Subjective questionnaires that the applicant fills in about themselves" },
      { tag: "pain", text: "Forensic claims investigations that take longer than the policy period" },
      { tag: "benefit", text: "Deterministic, signed evidence with n and interval on every row" },
      { tag: "benefit", text: "Re-measured when the model or the statute moves, not annually" },
      { tag: "usp", text: "Same rows, same grader, same number — reproducible by you, without us" },
    ],
    video: { src: "/videos/trust-ecosystem.mp4", poster: "/videos/trust-ecosystem.jpg", title: "The trust ecosystem — who Council of AI serves" },
  },
  {
    kicker: "The instrument",
    title: "GSPC — governance, safety, provenance, continuity",
    body:
      // CORRECTED 2026-08-26. This typed a slot count AND asserted every slot was
      // measured — while its own last sentence claimed coverage is never typed by
      // hand. The board carries declared slots with no run behind them.
      "Four axis families, anchored to a frozen corpus of 417 statutory provisions. The board publishes a slot count and a measured count and they are different numbers — cite totals.public_count on GET /api/gspc rather than either alone, because a slot with no run behind it is published UNMEASURED and is never counted as a measurement. The behavioural axis carry separation on the full fleet; jail is measured on a smaller fleet at n=71 and prints separation TIE — a tie is not a separated leader, and we never rank on it or compare it against the rest. Coverage on this site is read from the live board, never typed by hand.",
    points: [
      { tag: "pain", text: "Assurance scores with no provision behind them and no n on the row" },
      { tag: "benefit", text: "Every result names its provision, its sample size and its status" },
      { tag: "benefit", text: "Wilson 95% intervals wherever n is honestly independent — and none where it is not" },
      { tag: "usp", text: "A point-estimate lead with no statistical separation is printed as a tie, not a win" },
    ],
    href: "/gspc-scoreboard",
    cta: "Open the board",
    bg: {
      src: "/images/coliseum_hero_arena.jpg",
      alt: "The measurement arena seen from above, its instrument slots laid out",
    },
  },
  {
    kicker: "The pipeline",
    title: "Behaviour in, signed rows out — and the model stays yours",
    body:
      "An agent acts. We measure that behaviour against the frozen instrument and bound it statistically. We sign the result and hash-chain the record. Then we stop. We do not compute your tail measure, we do not hold a trigger, we do not settle anything. The distribution, the threshold and the payout logic stay inside your book, built on rows you can recompute.",
    points: [
      { tag: "pain", text: "Vendors who want to own the trigger as well as the data" },
      { tag: "benefit", text: "Per-item rows and aggregation functions published, so your actuaries rebuild the number" },
      { tag: "benefit", text: "Evidence you can attach to a file and defend later" },
      { tag: "usp", text: "We take no position in the risk we measure — no capacity, no broking, no settlement" },
    ],
    video: { src: "/videos/csoai-architecture.mp4", poster: "/videos/csoai-architecture.jpg", title: "How Council of AI is built — the architecture" },
  },
  {
    kicker: "The claims artefact",
    title: "One card pins the gold, the rows and the aggregator",
    body:
      "Silent edits are the enemy of claims evidence, so the card fixes three things at once: the provision and threshold it was measured against, the per-item execution rows behind the number, and the exact aggregation function and version used to reduce them. Change any one and the Ed25519 signature over the SHA-256 hash chain stops verifying — offline, against the key published at did:web:csoai.org.",
    points: [
      { tag: "pain", text: "Evidence that lives on the counterparty's server and can be quietly restated" },
      { tag: "benefit", text: "A ~3KB file on your side of the wall, verifiable without contacting us" },
      { tag: "benefit", text: "Provision, rows and aggregator all bound by one signature" },
      { tag: "usp", text: "A surviving signature proves provenance — we say exactly that, and never that it proves correctness" },
    ],
    href: "/gspc-verify",
    cta: "Verify a card",
    bg: {
      src: "/images/verifiable_evidence_card.jpg",
      alt: "Hands holding a signed evidence card reading verified: true",
    },
  },
  {
    kicker: "The neutrality firewall",
    title: "Nobody we rank pays us. The relying party does.",
    body:
      "This is the whole reason the evidence is worth anything. A grader funded by the graded is a marketing department with a methodology page. So the developer never pays and never can: verification is free forever, the rail is open, and the money comes from the observers who need the truth to be neutral — insurers, procurement, auditors.",
    points: [
      { tag: "pain", text: "Assurance firms that grade a model and sell the remediation for the grade" },
      { tag: "pain", text: "Underwriters buying scores from a party that also carries the risk" },
      { tag: "benefit", text: "A grader with no commercial exposure to the outcome of any grade" },
      { tag: "usp", text: "We take no money from anything we rank — verification is free, forever, for everyone" },
    ],
    bg: {
      src: "/images/coliseum_humans_vs_humanoids.jpg",
      alt: "A wall separating those who are measured from those who rely on the measurement",
    },
  },
  {
    kicker: "Where it sits",
    title: "One rail, three parties, no conflict of interest",
    body:
      "The regulator sets the provisions and the penalty bands — under the EU AI Act those run to €35 million or 7% of worldwide turnover for prohibited practices, which is the statute's number and not a measurement of ours. The developer needs continuous evidence against those provisions. The insurer needs rows it can model. We are the piece in the middle that is paid by none of the first two.",
    points: [
      { tag: "pain", text: "Every party re-running its own half-trusted assessment of the same system" },
      { tag: "benefit", text: "One signed measurement all three sides can read and check" },
      { tag: "benefit", text: "Third-party figures we cite are served separately, dated and attributed" },
      { tag: "usp", text: "Independence is structural here, not a promise in a policy document" },
    ],
    href: "/api/reported",
    cta: "See what is reported vs measured",
    image: {
      src: "/images/literacy_training_arena.jpg",
      alt: "Regulator, developer and insurer around a shared measurement",
    },
  },
];

export const PRICING_RISK_NOT_CLAIMED = [
  "We do not publish a market size for AI insurance. No premium projection, no CAGR, no carrier capacity figure appears on this page — none of it is ours to evidence. Third-party figures we do cite are served from /api/reported, dated and attributed, as reported by the source and not measured here.",
  "We do not operate an oracle, a trigger or a settlement mechanism. We publish signed rows; the tail measure, the threshold and the payout logic are computed inside the insurer's own model.",
  "We do not claim a signature proves a system is safe or lawful. It proves provenance — these bytes, unaltered, from this key. The measurement is what speaks to behaviour, and it comes with its limits attached.",
  "We do not claim slot 14 is comparable to the canonical axes. Jail is measured at n=71 on a smaller fleet with separation TIE on the live board — a tie is not a separated leader, and we never rank on it.",
  "We do not certify, accredit or approve. There is no conformity mark here and no accreditation chain behind it.",
];

export const PRICING_RISK_RELATED = [
  { href: "/gspc-scoreboard", label: "The live board", what: "Every slot, its n, its interval and its separation status." },
  { href: "/methodology", label: "The method", what: "Deterministic predicates, n≥30, Wilson intervals, and what we refuse to score." },
  { href: "/live-ledger", label: "The living ledger", what: "How results stay current when the statute moves." },
  { href: "/refutation-ledger", label: "Corrections", what: "Every figure we have retracted, and why." },
];
