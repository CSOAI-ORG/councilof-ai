// Private module — the 10 subject axes. Ruled in on 2026-10-16 (owner's call: these are
// AXES, not subject classes; Measure ruling of the same day). Each is a DECLARED SLOT:
// kind "declared-slot", status UNMEASURED, n 0, and an applies_to naming the ONE subject
// type it measures. An axis becomes MEASURED for its subject only with a frozen,
// sha-pinned method or bank, n_valid >= 30, passing the gate (queued in
// bank-next-version). Never a zero score: n 0 means nothing measured, and a declared
// slot joins no mean, no lid leader and no separation tally.
//
// Census checks (the 5-check verifiability grid on labs / evaluation orgs) are NOT axis
// scores: n=5 is below the n>=30 floor. They are shown only as a DISCOVERED check grid
// beside the axis, never in these rows.
//
// effect-binding is NOT repeated here: it is already the live MEASURED MCP axis
// (_gspc_axes_c.ts); promoting it again would double-count it.
//
// Ids are kebab-case and stable; never reused.
import type { AxisScore } from "./_gspc_types";

const SLOT_NOTE =
  "DECLARED-UNMEASURED slot (2026-10-16). Nothing has been measured: n 0 is the literal truth, never a score. " +
  "Becomes MEASURED only with a frozen sha-pinned bank or method, n_valid >= 30, passing the gate. " +
  "Census checks are a DISCOVERED check grid, not scores on this axis.";

const slot = (
  axis: string, applies_to: string, bench: string, task: string, hue: number, extra: Partial<AxisScore> = {},
): AxisScore => ({
  axis, family: "subject", kind: "declared-slot", applies_to,
  bench, task, n: 0, status: "UNMEASURED",
  colour: `hsl(${hue} 10% 55%)`, hue, note: SLOT_NOTE, method_status: "no-method: declared slot", ...extra,
});

export const AXES_D: AxisScore[] = [
  slot("lab-practice", "ai-labs", "pending frozen bank",
    "does an AI lab publish its evaluations, safety framework and incident reports", 200),
  slot("company-practice", "ai-companies-non-lab", "pending frozen bank",
    "does a non-lab AI company do what its public material says", 210),
  slot("measurer-integrity", "evaluation-orgs", "pending frozen bank",
    "does an evaluation organisation publish methods, test sets and reproducible results", 220),
  slot("harness-fidelity", "harnesses", "pending frozen method",
    "does the same model on the same bank score the same across evaluation harnesses", 230),
  slot("interop-conformance", "interop-standards-groups", "pending frozen bank",
    "does an interoperability/standards group publish specs, test suites and conformance records", 250),
  slot("humanoid-deployment", "humanoid-labs", "pending frozen registry",
    "what a humanoid lab has publicly deployed, checked against a public registry", 260),
  slot("regulator-transparency", "regulators", "pending frozen check bank",
    "factual presence checks on public artefacts (guidance, registry, methodology, consultation, contact route); no scores, no ratings",
    270, { public_pages: "HIDDEN_PENDING_OWNER_GO" }),
  slot("interpretability-reproducibility", "interpretability-groups", "pending frozen bank",
    "what an interpretability group publishes and whether it can be reproduced", 280),
  // Approved by the owner 2026-10-16 (33 axes). Definitions: AXES-33-SPEC.md §3.
  // PROMOTED 2026-10-29 (owner ruling: option 3 — publish on the four outcomes the evidence
  // settles, and say in the axis's own note that the disclosure split is not part of the
  // measurement). This is the FIRST MEASURED SUBJECT AXIS: kind "measured-subject", with a
  // frozen sha-pinned method and bank and n_valid >= 30, so it counts towards measured_axes.
  // It measures CLAIMED SUBJECTS, not models: no fleet, so it joins no mean, no lid leader
  // and no separation tally — exactly as a declared slot does not.
  //
  // Every number below is read off the wave's bytes, never typed here:
  //   n 174          <- wave .thresholds.n_valid        (182 captured - 8 unreachable)
  //   bank_sha256    <- sha256 of public/interop/claim-maintenance-wave-2026-10-28.json
  //   method_sha     <- sha256 of the spec's reference manifest, v0.2
  //   per_outcome    <- wave .counts
  {
    axis: "claim-maintenance", family: "subject", kind: "measured-subject",
    applies_to: "claimed-subjects",
    bench: "claim-maintenance v0.2 re-read wave",
    task: "at each scheduled re-read, is a captured public claim still served unchanged, changed, withdrawn or unreachable; says nothing about whether the claim is true",
    n: 174, status: "MEASURED", method_status: "meets-rule",
    method: "claim-maintenance v0.2",
    method_sha: "32470d102112154b14a4d5530d71d7a30ecc2acdc5cd8c906c21f672b1deeef7",
    bank: "public/interop/claim-maintenance-wave-2026-10-28.json",
    bank_sha256: "a62b017a9081b817613c03887c3c6690597a2016ea175f9d95c211d593db0877",
    per_outcome: { UNCHANGED: 12, CHANGED: 110, WITHDRAWN: 52, UNREACHABLE: 8 },
    colour: "hsl(290 10% 55%)", hue: 290,
    n_note: "Reported DISCOVERED-style as counts per subject class, never a ranking.",
    note: "n_valid 174 of 182 captured claims, re-read 2026-10-28 with the spec's own visible-text extractor. Counts per outcome, never a ranking, and never a statement that a claim is true. The disclosure split ('changed with disclosure' vs 'changed silently') is NOT part of this measurement: the published spec defines disclosure at the artefact level and not for a source's own edit, so those claims are recorded as CHANGED_DISCLOSURE_NOT_DECIDABLE.",
  },
  slot("serving-fidelity", "inference-endpoints-and-routers", "pending frozen bank",
    "does an endpoint or serving configuration claiming model M behave like M's reference serving on a frozen bank",
    300, { n_note: "HELD for spend: free credit only.", method_status: "reviewed, not run", method: "serving-fidelity v0.2", method_sha: "18206f71" }),
];
