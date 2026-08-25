// Private module — AxisScore type + MEASURED_ON.
// Restored from blob b4b3ab1788ec044156da0d4962189fe5f4dd975f (pre-PR#425).
export interface AxisScore {
  axis: string;
  bench: string;
  task: string;
  n: number;
  n_note?: string;            // set-name caveat (e.g. swarm instances-vs-prompts)
  accuracy: number;           // the board LEADER's accuracy (whoever leads — tuned or base)
  accuracy_is?: string;       // set when accuracy is NOT a point estimate (e.g. a stated Wilson lower bound)
  leader: string;             // which model holds the point-estimate lead
  // UNTESTED = no McNemar separation test has been run on this bank yet (living-stamp axes).
  separation: "SEPARATED" | "TIE" | "UNTESTED";
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
  dataset: string;
  colour: string;   // globe layer colour
  hue: number;      // 0-360, for procedural ramps
  note?: string;
}

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
