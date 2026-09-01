/**
 * Health is an inventory of correct accessible facts — not a score.
 *
 * We can see what was measured, what was left empty, whether a card
 * verifies, whether evidence fetches, whether a rerun exists, whether
 * a correction touches the digest, and the census eligibility. That is
 * how healthy the RECORD is. It is not how healthy the model is, not a
 * fused SOV grade, and not an investable index.
 *
 * Live 2026-09-01: GET /api/gspc → 22 axis · 15 measured · 7 empty ·
 * 893 items. csoai.sov-signal-index/1 → 15 signed rows,
 * not_a_certification: true, never predicts. GET /api/corrections → 30.
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
  measured: 15,
  empty: 7,
  items: 893,
  index_rows: 15,
  index_schema: "csoai.sov-signal-index/1",
  not_a_certification: true,
  corrections: 30,
  board: "22 axis · 15 measured",
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
  corrections: number;
}): string {
  return `${input.measured} measured of ${input.declared} declared; verify ${input.verify}; evidence ${input.evidence}; rerun ${input.rerun}; eligibility ${input.eligibility}; corrections touching this digest ${input.corrections}.`;
}

export function boardHealthLine(): string {
  return healthLine({
    measured: LIVE_HEALTH_PIN.measured,
    declared: LIVE_HEALTH_PIN.declared,
    verify: "pass",
    evidence: "present",
    rerun: "empty",
    eligibility: "board",
    corrections: LIVE_HEALTH_PIN.corrections,
  });
}
