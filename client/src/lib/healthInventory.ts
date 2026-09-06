/**
 * Health is an inventory of correct accessible facts — not a score.
 *
 * We can see what was measured, what was left empty, whether a card
 * verifies, whether evidence fetches, whether a rerun exists, whether
 * a correction touches the digest, and the census eligibility. That is
 * how healthy the RECORD is. It is not how healthy the model is, not a
 * fused SOV grade, and not an investable index.
 *
 * SNAPSHOT, not a live read. Taken 2026-09-02 from GET /api/gspc
 * (22 axis · 22 measured · 0 empty · 969 items) and GET /api/corrections (39).
 *
 * 2026-09-06: the pin said items: 893 while this very header said 969, and the
 * live board still sums 969 across its 22 axes. The struct was wrong against its
 * own provenance line; corrected to 969.
 *
 * These two numbers move: corrections went 30 → 38 → 39 inside 2026-09-02
 * alone. Any figure pinned here is stale the moment the ledger appends, so it
 * MUST be rendered as "as at <date>" and never as a live count. The living
 * board is GET https://councilof.ai/api/gspc, and the living corrections ledger
 * is GET https://councilof.ai/api/corrections — a different door, which the page
 * used to omit while quoting a corrections figure.
 *
 * 2026-09-06: corrections stood at 47, so the pinned 39 had drifted 20% in four
 * days exactly as predicted. The count is now DERIVED at run time by the
 * component; the pin below survives only as a dated fallback for when the door
 * does not answer.
 */

export type FactState = "present" | "empty" | "unknown";

export type HealthFact = {
  id: string;
  title: string;
  access: string;
  href: string;
  state: FactState;
  means: string;
};

export const HEALTH_RULING =
  "Health is every correct fact we can access. It is never one number.";

export const HEALTH_PUBLIC_LINE =
  "N measured of M declared; verify {pass|fail|unknown}; evidence {present|empty}; rerun {present|empty}; eligibility {state}; corrections touching this digest {k}.";

export const HEALTH_NEVER = [
  "A fused 0–100 health score",
  "A mean of axis F1 as ‘how healthy the model is’",
  "An investable health index or coupon",
  "Filling empty slots with zeroes so the average looks complete",
] as const;

export const LIVE_HEALTH_PIN = {
  declared: 22,
  measured: 22,
  empty: 0,
  items: 969,
  index_rows: 15,
  index_schema: "csoai.sov-signal-index/1",
  not_a_certification: true,
  /** Whole-ledger count from GET /api/corrections. Moves independently of the
   *  board fields above, so it carries its own date. Read live 2026-09-06. */
  corrections: 47,
  corrections_as_at: "6 September 2026",
  as_at: "2 September 2026",
  board: "22 axis · 22 measured",
} as const;

export const HEALTH_FACTS: HealthFact[] = [
  {
    id: "declared-slots",
    title: "Declared slots",
    access: "GET /api/gspc totals.axes",
    href: "https://councilof.ai/api/gspc",
    state: "present",
    means: "How many instruments exist on the board, including empty ones.",
  },
  {
    id: "measured-slots",
    title: "Measured slots",
    access: "GET /api/gspc totals.measured_axes",
    href: "https://councilof.ai/api/gspc",
    state: "present",
    means: "How many of those slots carry a signed cell. Quote both numbers.",
  },
  {
    id: "empty-slots",
    title: "Empty slots",
    access: "GET /api/gspc totals.unmeasured_axes",
    href: "https://councilof.ai/api/gspc",
    state: "present",
    means: "Published gaps. Empty is a fact. Do not zero-fill.",
  },
  {
    id: "index-rows",
    title: "Signed index rows",
    access: "csoai.sov-signal-index/1 total_signed_rows",
    href: "https://councilof.ai/signals/sov-signal.signed.json",
    state: "present",
    means: "The coverage index counts rows. It never predicts.",
  },
  {
    id: "verify",
    title: "Verify pass",
    access: "/gspc-verify · verify_card · did:web:csoai.org#card-attestation-1",
    href: "https://councilof.ai/gspc-verify",
    state: "present",
    means: "The card bytes check. A stranger does this without us.",
  },
  {
    id: "evidence",
    title: "Evidence fetchable",
    access: "Evidence manifest on the card. The 3 KB file is the index.",
    href: "https://councilof.ai/gspc-verify",
    state: "unknown",
    means: "Per subject. Unknown until the bundle URL answers.",
  },
  {
    id: "rerun",
    title: "Independent rerun",
    access: "Second-provider or external rerun labelled on the card.",
    href: "https://councilof.ai/assess",
    state: "empty",
    means: "Absent until one exists. Absence is honest.",
  },
  {
    id: "eligibility",
    title: "Census eligibility",
    access: "Speed 0 state: ELIGIBLE or a named block.",
    href: "https://huggingface.co/datasets/csoai/hub-queue",
    state: "present",
    means: "hub-queue is UNMEASURED. Eligibility is not a grade.",
  },
  {
    id: "corrections",
    title: "Corrections touching the digest",
    access: "GET /api/corrections",
    href: "https://councilof.ai/api/corrections",
    state: "present",
    means: "The honesty asset. Count rows that name this subject. Do not hide them.",
  },
  {
    id: "jail-floor",
    title: "Jail floor",
    access: "Living board jail axis. MEASURED, separation TIE.",
    href: "https://councilof.ai/api/gspc",
    state: "present",
    means: "A floor, not an arena door, not a health bonus.",
  },
  {
    id: "ras-pack",
    title: "RAS four-class mapping",
    access: "GET /api/evidence-pack",
    href: "https://councilof.ai/api/evidence-pack",
    state: "present",
    means: "Transparency, lineage, controls, owners — assembled, not scored.",
  },
  {
    id: "reg-observe",
    title: "Documentation triage",
    access: "Public card screen: marking, training-data, GPAI mention.",
    href: "https://councilof.ai/article-50",
    state: "unknown",
    means: "Unknown stays unknown. Not an Article 50 stamp.",
  },
];

export function healthLine(input: {
  measured: number;
  declared: number;
  verify: "pass" | "fail" | "unknown";
  evidence: FactState;
  rerun: FactState;
  eligibility: string;
  /** Corrections touching THIS digest. "unknown" when no per-digest
   *  query exists — never the whole-ledger total, which is a bigger number. */
  corrections: number | "unknown";
}): string {
  return `${input.measured} measured of ${input.declared} declared; verify ${input.verify}; evidence ${input.evidence}; rerun ${input.rerun}; eligibility ${input.eligibility}; corrections touching this digest ${input.corrections}.`;
}

export function boardHealthLine(): string {
  // RESOLVED 2026-09-06 (was FLAGGED 2026-09-02). The old body passed
  // LIVE_HEALTH_PIN.corrections — the WHOLE-ledger count from GET /api/corrections
  // — into a slot whose grammar reads "corrections touching this digest N". Those
  // are different populations and the ledger total is the bigger one, so the
  // sentence overstated: it claimed 39 corrections touched this digest when 39 was
  // every correction in the estate.
  //
  // The per-digest query still does not exist. So the slot answers "unknown",
  // which is the true answer, instead of borrowing a number from a different
  // question. The ledger total keeps its own sentence — live — in
  // boardCorrectionsLine() below.
  return healthLine({
    measured: LIVE_HEALTH_PIN.measured,
    declared: LIVE_HEALTH_PIN.declared,
    verify: "pass",
    evidence: "present",
    rerun: "empty",
    eligibility: "board",
    corrections: "unknown",
  });
}

/**
 * A read of GET /api/corrections.
 *
 * The ledger publishes NO count field — the live document's keys are
 * schema, policy, license, publisher, corrections, signature, signature_state,
 * note — so the count is the array's length or it is nothing. A `?? 0` here
 * would render "0 corrections" for a ledger we simply could not reach, and
 * "0 corrections" reads as "we have never been wrong". Absent is not zero.
 */
export type CorrectionsRead =
  | { state: "live"; count: number }
  | { state: "unread"; reason: string };

export function readCorrectionsCount(doc: unknown): CorrectionsRead {
  if (!doc || typeof doc !== "object") return { state: "unread", reason: "no document" };
  const arr = (doc as { corrections?: unknown }).corrections;
  if (!Array.isArray(arr)) return { state: "unread", reason: "no corrections array" };
  return { state: "live", count: arr.length };
}

/**
 * The ledger total, derived at run time — never pinned.
 *
 * This file's own header records why: corrections went 30 -> 38 -> 39 inside
 * 2026-09-02 alone, and by 2026-09-06 the ledger stood at 47. Anything typed
 * here is stale before it deploys. When the door does not answer we say the
 * pinned figure is a pin, with its date, rather than passing it off as current.
 */
export function boardCorrectionsLine(read: CorrectionsRead): string {
  if (read.state === "live") {
    return `${read.count} corrections in the ledger, read from GET /api/corrections.`;
  }
  return (
    `Corrections ledger unread (${read.reason}). The last figure we pinned is ` +
    `${LIVE_HEALTH_PIN.corrections}, as at ${LIVE_HEALTH_PIN.corrections_as_at} — a pin, not a live count. ` +
    `The living ledger is GET /api/corrections.`
  );
}
