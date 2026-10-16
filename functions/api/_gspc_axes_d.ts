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
  colour: `hsl(${hue} 10% 55%)`, hue, note: SLOT_NOTE, ...extra,
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
  slot("claim-maintenance", "claimed-subjects", "pending gated re-read wave (>=30 claims)",
    "at each scheduled re-read, is a captured public claim still served unchanged, changed with disclosure, changed silently, withdrawn or unreachable; says nothing about whether the claim is true",
    290, { n_note: "Reported DISCOVERED-style as counts per subject class, never a ranking." }),
  slot("serving-fidelity", "inference-endpoints-and-routers", "pending frozen bank",
    "does an endpoint or serving configuration claiming model M behave like M's reference serving on a frozen bank",
    300, { n_note: "HELD for spend: free credit only." }),
];
