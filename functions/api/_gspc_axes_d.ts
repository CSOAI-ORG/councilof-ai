// Private module — the 10 subject axes. Ruled in on 2026-10-16 (owner's call: these are
// AXES, not subject classes; Measure ruling of the same day). Each begins as a DECLARED SLOT:
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
  {
    axis: "lab-practice", family: "subject", kind: "deterministic-facts", applies_to: "ai-labs",
    bench: "2026-10-24 frozen public-page observation bank",
    task: "factual presence checks on each lab's captured public page for evaluations, safety framework, incident reports, model cards and a contact route",
    n: 38, n_unit: "reachable public lab pages", status: "MEASURED",
    method_status: "meets-rule", method: "discovery_grid.py",
    method_sha: "6baad383eb97b0984ce23adbc11668074ae77410d72690029376da61b75bd6ea",
    evidence_url: "/measurement/subject-axes/2026-10-24/lab-practice.json",
    facts_as_of: "2026-10-24T04:25:38Z", facts_status: "MEASURED", run_attestation: "CONTENT_ADDRESSED_UNSIGNED",
    coverage: "40 named candidate lab pages attempted; 38 reachable observations admitted",
    coverage_note: "A dated convenience frame, not a probability sample of all AI labs. Unreachable pages are not failures or zero scores.",
    colour: "hsl(200 45% 50%)", hue: 200,
    note: "Observed public-artefact presence only. No conduct inference, aggregate grade, rank, compliance verdict or certification.",
  },
  slot("company-practice", "ai-companies-non-lab", "pending frozen bank",
    "does a non-lab AI company do what its public material says", 210),
  {
    axis: "measurer-integrity", family: "subject", kind: "deterministic-facts", applies_to: "evaluation-orgs",
    bench: "2026-10-24 frozen evaluation-organisation observation bank",
    task: "factual presence checks for published methods, datasets or tasks, licences, reproducibility code and citations on captured public pages",
    n: 40, n_unit: "reachable evaluation-organisation pages", status: "MEASURED",
    method_status: "meets-rule", method: "build_all_10_subject_axes_and_wave1.py",
    method_sha: "abf75559b18fee62e1fa14522b1b3570d36b240710648686ac1d7ba9351171b1",
    evidence_url: "/measurement/subject-axes/2026-10-24/measurer-integrity.json",
    facts_as_of: "2026-10-24T06:25:37.853297+00:00", facts_status: "MEASURED", run_attestation: "CONTENT_ADDRESSED_UNSIGNED",
    coverage: "40 named evaluation-organisation pages attempted and reached",
    coverage_note: "A dated convenience frame, not a probability sample of all evaluation organisations.",
    colour: "hsl(220 45% 50%)", hue: 220,
    note: "Observed public-artefact presence only; presence is not proof of methodological quality or completed reproduction. No score, rank or certification.",
  },
  slot("harness-fidelity", "harnesses", "pending frozen method",
    "does the same model on the same bank score the same across evaluation harnesses", 230),
  slot("interop-conformance", "interop-standards-groups", "pending frozen bank",
    "does an interoperability/standards group publish specs, test suites and conformance records", 250),
  slot("humanoid-deployment", "humanoid-labs", "pending frozen registry",
    "what a humanoid lab has publicly deployed, checked against a public registry", 260),
  {
    axis: "regulator-transparency", family: "subject", kind: "deterministic-facts", applies_to: "regulators",
    bench: "2026-10-24 frozen regulator public-artefact observation bank",
    task: "factual presence checks on captured public artefacts for guidance, registry, methodology, consultation and a contact route; no scores or ratings",
    n: 38, n_unit: "reachable regulator pages", status: "MEASURED",
    method_status: "meets-rule", method: "expand_regulator_and_company_grid.py",
    method_sha: "acd839bbb2cdc6744290a1fcb8231f9ec4f37a87129b6ae9f3c21ac42c835eda",
    evidence_url: "/measurement/subject-axes/2026-10-24/regulator-transparency.json",
    facts_as_of: "2026-10-24T04:59:57Z", facts_status: "MEASURED", run_attestation: "CONTENT_ADDRESSED_UNSIGNED",
    coverage: "46 named regulator pages attempted; 38 reachable observations admitted",
    coverage_note: "A dated convenience frame, not a probability sample of all regulators. Transport errors and refusals remain explicit.",
    public_pages: "HIDDEN_PENDING_OWNER_GO", colour: "hsl(270 45% 50%)", hue: 270,
    note: "Observed public-artefact presence only. No regulatory-performance judgement, rank, compliance verdict or certification.",
  },
  slot("interpretability-reproducibility", "interpretability-groups", "pending frozen bank",
    "what an interpretability group publishes and whether it can be reproduced", 280),
  // Approved by the owner 2026-10-16 (33 axes). Definitions: AXES-33-SPEC.md §3.
  {
    axis: "claim-maintenance", family: "subject", kind: "deterministic-facts", applies_to: "claimed-subjects",
    bench: "2026-10-24 frozen baseline plus capture-consistent second re-read wave",
    task: "classify whether each independently baselined public claim URL is unchanged, changed, withdrawn or unreachable at re-read; says nothing about whether the claim is true",
    n: 67, n_unit: "unique baselined claim URLs", status: "MEASURED",
    method_status: "meets-rule", method: "claim_maintenance_reread.py",
    method_sha: "d777f8a022f8bf78f0f76a5508693923c2577a493209c2ed35a445f8b0a71269",
    evidence_url: "/measurement/subject-axes/2026-10-24/claim-maintenance-wave-2.json",
    facts_as_of: "2026-10-28T09:28:40.753966+00:00", facts_status: "MEASURED", run_attestation: "CONTENT_ADDRESSED_UNSIGNED",
    coverage: "67 unique URLs with an earlier baseline; eight first-time baselines, one un-baselined 404 and one duplicate URL excluded from the comparison count",
    coverage_note: "A curated longitudinal panel, not a population sample. Baseline and re-read both hash at most 3,000,000 bytes. Raw-byte changes are candidates for human materiality review, not established material changes.",
    n_note: "Counts are per URL and per outcome, never a ranking. Changed or withdrawn claims remain pending human materiality review.",
    colour: "hsl(290 45% 50%)", hue: 290,
    note: "Deterministic re-read facts only. The negative control exercises the production comparator and discriminates; no truth, materiality or compliance verdict is inferred.",
  },
  slot("serving-fidelity", "inference-endpoints-and-routers", "pending frozen bank",
    "does an endpoint or serving configuration claiming model M behave like M's reference serving on a frozen bank",
    300, { n_note: "HELD for spend: free credit only.", method_status: "reviewed, not run", method: "serving-fidelity v0.2", method_sha: "18206f71" }),
];
