// Private module — AxisScore type + MEASURED_ON.
// Restored from blob b4b3ab1788ec044156da0d4962189fe5f4dd975f (pre-PR#425).
export interface AxisScore {
  axis: string;
  bench: string;
  task: string;

  // ── family + measurement kind (added 2026-08-26, ADR-001 22-axis sweep) ──────
  // The board carries TWO families of axis measured by TWO different kinds of
  // instrument. Conflating them is how a count goes wrong, so both are explicit
  // in the data rather than inferred from the id.
  //
  //   family "gspc"      — the 14 behavioural axes (Governance/Safety/Provenance/
  //                        Continuity). A model fleet answers a frozen bank.
  //   family "financial" — the 8 financial/domain axes. Not a model fleet.
  //
  //   kind "model-comparison"   — an accuracy against a bank, with a LEADER and a
  //                               separation determination. Only these axes may
  //                               contribute to separation stats or to any mean.
  //   kind "deterministic-facts"— facts read off a public source (e.g. on-chain
  //                               issuer flags). No fleet, no leader, no accuracy,
  //                               and therefore NO separation test is applicable.
  //                               Absent fields are honest absence, never a zero.
  //   kind "declared-slot"      — the slot is published so the gap is public. No
  //                               measurement exists. status is UNMEASURED.
  family: "gspc" | "financial";
  kind: "model-comparison" | "deterministic-facts" | "declared-slot";

  // n is the size of whatever was actually measured (items, or instruments for a
  // deterministic-facts axis). 0 on a declared-slot axis means "nothing measured",
  // which is the literal truth and is never averaged into anything.
  n: number;
  n_note?: string;            // set-name caveat (e.g. swarm instances-vs-prompts)
  n_unit?: string;            // what an n counts, when it is not bank items

  // OPTIONAL from 2026-08-26. A deterministic-facts or declared-slot axis has no
  // leader and no accuracy. Emitting 0 / "n/a" would be a fabricated measurement,
  // so the field is simply absent. Consumers must treat absence as UNMEASURED.
  accuracy?: number;          // the board LEADER's accuracy (whoever leads — tuned or base)
  accuracy_is?: string;       // set when accuracy is NOT a point estimate (e.g. a stated Wilson lower bound)
  leader?: string;            // which model holds the point-estimate lead
  // UNTESTED = no McNemar separation test has been run on this bank yet (living-stamp axes).
  // Absent  = no separation test is APPLICABLE (no fleet to compare). Different facts.
  separation?: "SEPARATED" | "TIE" | "UNTESTED";
  separation_p?: number;      // McNemar exact p on discordant pairs (leader vs best base)
  separation_basis?: string;  // stated when the determination is not McNemar (e.g. Wilson-bound non-overlap)
  interval?: [number, number];   // Wilson 95% CI on the leader — present ONLY where the n is honestly independent
  fleet_mean?: number;        // mean accuracy across the measured fleet — the linear aggregator; absent where the fleet mean is not in the signed source
  fleet?: string;             // which fleet this axis was measured on, when NOT the 19-model board fleet
  mean_harm?: number;         // (1 - item pass rate) x severity, fleet-level, mean — board-v2 axes only
  cvar05_harm?: number | null;   // mean of the WORST 5% of item harms — only where n>=100 (BV floor)
  macro_f1?: number;          // board-v2 axes only — never invented for living-stamp axes
  unparsed_rate?: number;     // board-v2 axes only
  per_model?: Record<string, Record<string, number | null>>; // living-stamp axes: verbatim per-model rows
  status: "MEASURED" | "UNMEASURED" | "DRAFT" | "SPEC" | "PLANNED";

  // dataset is the frozen HF bank slug; it is resolved to dataset_url against
  // BANK_HOST. A financial axis has no HF bank, so it carries evidence_url — an
  // absolute-on-site path to the signed run or the declaration — instead. An
  // axis with neither carries no link, which is the honest state of a slot that
  // has no evidence to point at.
  dataset?: string;
  evidence_url?: string;

  // How much of the axis's own declared universe was actually covered, and on what
  // rail. An axis that measured 6 of 16 named instruments has NOT measured the
  // other 10, and a fact read from mainnet is not the same as a fact attested on
  // mainnet. Both are stated on the axis rather than left for a reader to assume.
  coverage?: string;
  coverage_note?: string;
  carrier?: string;
  colour: string;   // globe layer colour
  hue: number;      // 0-360, for procedural ramps
  note?: string;
}

// Pages nudge 2026-08-25T18:47Z — ensure measured_on.note TIE ships past sticky storm
export const MEASURED_ON = {
  model: "13 canonical axes: 19-model fleet (8 tuned council specialists + 6 base models + frontier " +
    "cross-lab models). Jail (slot 14): 7-model fleet — smaller, stated on the axis, never " +
    "conflated with the board fleet.",
  endpoint: "A100 · local Ollama (board v2) · OpenRouter (cross-lab models) · 3090 pod (jail)",
  date: "2026-08-12 (13 canonical axes) · 2026-08-18 (jail)",
  grading: "deterministic grading on 15,580 per-item rows (0 transport errors) — reproducible from csoai-static-deploy2 bb15589c with agents-repo/agents/board_v2.py",
  note: "GSPC (Governance · Safety · Provenance · Continuity) board. Slot counts live in totals " +
    "(public_count, measured_axes, quotable_axes) and are derived, never typed. " +
    "The measured canonical axes used the same fleet, same rows, same grader. " +
    "Per-axis numbers show the board LEADER (whoever leads — tuned or base), its Wilson interval " +
    "where n is honestly independent, and whether the lead is statistically separated (McNemar " +
    "p<0.05) or a TIE. fleet_mean and mean_harm show the fleet, not the leader. Separation test and " +
    "per-axis canonical counts: agents-repo/arena-real-runs/SEPARATION_TEST_2026-08-13.md and " +
    "GSPC_AXIS_REGISTRY.json v2. Jail carries its per-model rows verbatim from the signed living " +
    "board; its separation is TIE (determined 2026-08-25) — a TIE is not a separated leader. " +
    "slot15 and human-vs-ai are measured in-lane only — see measured_in_lane, not the board.",
  living_stamp: {
    source: "board_living.json (csoai.gspc-living/0.1, boards-v2 + gold-run-3090)",
    updated: "2026-08-18T03:22:16Z",
    signed: true,
    signer: "8f9a00a28cfc76e36029fe805f3e421958f4d7d42c4f114865918a1001313912",
    signature: "bd199fd34a80b6352be727160c2fef34e6f66ca412baeba5b03dbe097a100afd89b037f5806c2924bc54cc27f75c09aa52762e016481ffafe1fab026e3c62f06",
    sig_input: "sha256(canonical board minus signature fields, sort_keys)",
  },
};
