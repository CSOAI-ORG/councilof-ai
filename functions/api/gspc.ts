// functions/api/gspc.ts — the GSPC 13-axis board (CEO lock 2026-08-24).
//
// GSPC (Governance · Safety · Provenance · Continuity) is the family name: the four letters are
// the four CORE axes, every extension axis descends from one of them. The PUBLIC board is the
// 13-axis canon. Jail is a measured FLOOR (escape-attempt detection), not an axis — it lives in
// a separate jail_floor object, never in axes[]. slot-15 is reserved and empty on the public stamp.
//
// PUBLISH-DELTA 2026-08-13 (owner word): every canonical axis carries a measured
// number from the 13-axis board v2 — 19 models × per-item rows (15,580 rows,
// 0 transport errors), committed at csoai-static-deploy2 bb15589c, harness
// agents-repo/agents/board_v2.py (2c2f9faa, byte-reproducible per peer-audit
// 10e37101), separation test at agents-repo/arena-real-runs/SEPARATION_TEST_2026-08-13.md.
//
// JAIL FLOOR (not an axis): jail (escape-attempt detection, n=71 gold cells) is measured and
// published as a floor object, not as an axis. It was measured on a SMALLER fleet (7 models,
// not 19) and carries NO separation test (UNTESTED). It is never counted in axes[] or totals.
//
// REGISTER (unchanged doctrine):
//   Every score is MEASURED — a deterministic grade of recorded model outputs
//   on a frozen, published split. unparsed_rate is reported, never folded into
//   the error rate. n is on every row. Nothing here is an attestation and
//   nothing here is certification. A "leader" is the highest point estimate on
//   the board; `separation` says whether that lead is statistically real
//   (McNemar p<0.05 on discordant items vs the best base model) or a TIE.
//   TIES ARE NOT WINS. We do not publish "our models win N of 13".
//
// TO UPDATE
//   Re-run the board harness and agents-repo/agents/separation_test.py, then paste
//   the resulting values. Do not hand-edit a score without re-running the
//   harness — that is the whole point of the instrument.

interface AxisScore {
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

const MEASURED_ON = {
  model: "13 canonical axes: 19-model fleet (8 tuned council specialists + 6 base models + frontier " +
    "cross-lab models). Jail floor: 7-model fleet — smaller, stated on the floor object, never " +
    "conflated with the board fleet.",
  endpoint: "A100 · local Ollama (board v2) · OpenRouter (cross-lab models) · 3090 pod (jail floor)",
  date: "2026-08-12 (13 canonical axes) · 2026-08-18 (jail floor)",
  grading: "deterministic grading on 15,580 per-item rows (0 transport errors) — reproducible from csoai-static-deploy2 bb15589c with agents-repo/agents/board_v2.py",
  note: "GSPC (Governance · Safety · Provenance · Continuity) 13-axis board. " +
    "The 13 canonical axes were measured on the same fleet, same rows, same grader. " +
    "Per-axis numbers show the board LEADER (whoever leads — tuned or base), its Wilson interval " +
    "where n is honestly independent, and whether the lead is statistically separated (McNemar " +
    "p<0.05) or a TIE. fleet_mean and mean_harm show the fleet, not the leader. Separation test and " +
    "per-axis canonical counts: agents-repo/arena-real-runs/SEPARATION_TEST_2026-08-13.md and " +
    "GSPC_AXIS_REGISTRY.json v2. Jail is a measured floor (not an axis) — see jail_floor object.",
};

const AXES: AxisScore[] = [
  {
    axis: "governance", bench: "GovBench", task: "EU AI Act risk-tier classification",
    n: 237, accuracy: 0.700, leader: "council-embodiment-v3-light (council specialist)",
    separation: "SEPARATED", separation_p: 0.0086, interval: [0.639, 0.755],
    fleet_mean: 0.490, mean_harm: 0.510, cvar05_harm: 0.8728,
    macro_f1: 0.705, unparsed_rate: 0.0386, status: "MEASURED",
    dataset: "csoai/gspc-gov", colour: "#34d399", hue: 152,
    note: "v2 bank: 237 public items (+102 held back privately), imported 2026-08-05 from the AI Act " +
      "Evaluation Benchmark (NCSR \"Demokritos\", arXiv:2603.09435, CC-BY-4.0). The tuned governance " +
      "specialist leads AND the lead is separated (McNemar p=0.0086 vs best base mistral:7b) — one of " +
      "only 4 separated leads on the board. The fleet mean is 0.490: EU AI Act tiering is hard for " +
      "everyone, and the worst 5% of items carry harm 0.873 (CVaR, n=237) — the tail is real.",
  },
  {
    axis: "safety", bench: "DefBench", task: "calibrated refusal on paired requests",
    n: 36, accuracy: 0.944, leader: "gemma3:12b (base model)",
    separation: "TIE", separation_p: 0.6875, interval: [0.819, 0.985],
    fleet_mean: 0.732, mean_harm: 0.268, cvar05_harm: null,
    macro_f1: 0.944, unparsed_rate: 0.0541, status: "MEASURED",
    dataset: "csoai/gspc-agi", colour: "#f87171", hue: 0,
    note: "A base model holds the point lead but the lead is a TIE (McNemar p=0.69 vs qwen2.5:3b). " +
      "Honestly reported: the tuned specialists do not own this axis.",
  },
  {
    axis: "provenance", bench: "ProvBench", task: "Article 50 marking survival by validity",
    n: 32, accuracy: 0.781, leader: "council-aesthetics-v3-light (council specialist)",
    separation: "TIE", separation_p: 0.7744, interval: [0.612, 0.890],
    fleet_mean: 0.549, mean_harm: 0.451, cvar05_harm: null,
    macro_f1: 0.776, unparsed_rate: 0.1480, status: "MEASURED",
    dataset: "csoai/gspc-prv", colour: "#60a5fa", hue: 213,
    note: "v3 bank (validity principle: a manifest present but whose binding no longer validates has " +
      "NOT survived). The tuned specialist leads on points; TIE vs llama3.2:3b (p=0.77).",
  },
  {
    axis: "continuity", bench: "PQCBench", task: "post-quantum status of a cryptographic assumption",
    n: 33, accuracy: 0.606, leader: "council-destruction-v3-light (council specialist)",
    separation: "TIE", separation_p: 1.0, interval: [0.437, 0.753],
    fleet_mean: 0.450, mean_harm: 0.550, cvar05_harm: null,
    macro_f1: 0.512, unparsed_rate: 0.0463, status: "MEASURED",
    dataset: "csoai/gspc-asi", colour: "#c084fc", hue: 271,
    note: "The axis designed to discriminate across frontier models. The tuned specialist leads on points; " +
      "flat TIE vs gemma3:12b (p=1.0).",
  },
  {
    axis: "conformance", bench: "MCPBench", task: "MCP tool conformance",
    n: 35, accuracy: 0.743, leader: "council-preservation-v3-light (council specialist)",
    separation: "TIE", separation_p: 1.0, interval: [0.579, 0.858],
    fleet_mean: 0.537, mean_harm: 0.463, cvar05_harm: null,
    macro_f1: 0.735, unparsed_rate: 0.1338, status: "MEASURED",
    dataset: "csoai/gspc-mcp", colour: "#fbbf24", hue: 43,
    note: "Canonical bank count 35 (supersedes the stale 11 in older matrices — registry v2). " +
      "The tuned specialist leads on points; flat TIE vs mistral:7b (p=1.0).",
  },
  {
    axis: "openness", bench: "OSSBench", task: "licence reasoning versus intended use",
    n: 32, accuracy: 0.875, leader: "council-preservation-v3-light (council specialist)",
    separation: "TIE", separation_p: 1.0, interval: [0.719, 0.950],
    fleet_mean: 0.696, mean_harm: 0.304, cvar05_harm: null,
    macro_f1: 0.875, unparsed_rate: 0.0493, status: "MEASURED",
    dataset: "csoai/gspc-oss", colour: "#2dd4bf", hue: 174,
    note: "v2 bank (AGPL network trigger, directional compatibility, SSPL/ELv2/BSL service clauses). " +
      "Canonical count 32 (supersedes stale 16). The tuned specialist leads on points; flat TIE vs gemma3:12b.",
  },
  {
    axis: "machinery-conformity", bench: "MachBench",
    task: "Machinery Reg self-evolving safety-function classification (PART_A / OUT_OF_SCOPE / NOT_SAFETY_FUNCTION)",
    n: 33, accuracy: 0.545, leader: "llama3.2:3b (base model)",
    separation: "TIE", separation_p: 0.5811, interval: [0.380, 0.702],
    fleet_mean: 0.349, mean_harm: 0.651, cvar05_harm: null,
    macro_f1: 0.465, unparsed_rate: 0.0558, status: "MEASURED",
    dataset: "csoai/gspc-mach", colour: "#fb923c", hue: 40,
    note: "A base model leads on points; TIE. Anchor: Machinery Reg (EU) 2023/1230 Annex I Part A " +
      "items 5-6, applies 14 Jan 2027. Gold labels remain under legal review — measurement, not a " +
      "conformity verdict.",
  },
  {
    axis: "care", bench: "CareBench", task: "care-cost (protect × help) under paired conduct scenarios",
    n: 199, n_note: "200 bank records, one exact-duplicate pair → 199 unique scored texts (registry v2)",
    accuracy: 0.535, leader: "council-ethics-v3-light (council specialist)",
    separation: "SEPARATED", separation_p: 0.0356, interval: [0.466, 0.603],
    fleet_mean: 0.293, mean_harm: 0.707, cvar05_harm: 0.9895,
    macro_f1: 0.528, unparsed_rate: 0.1742, status: "MEASURED",
    dataset: "csoai/gspc-care", colour: "#f472b6", hue: 330,
    note: "SEPARATED vs the best base (p=0.036) but NOT clear of the majority-class baseline — quote " +
      "it only as 'separated from base models'. The fleet mean is 0.293 and the worst 5% of items " +
      "carry harm 0.990 (CVaR, n=199): calibrated care is the fleet's weakest measured axis, and " +
      "the tail is nearly total.",
  },
  {
    axis: "cross-reality", bench: "XRAIV", task: "autonomous agent action authority (PROCEED / CONFIRM / REFUSE)",
    n: 32, accuracy: 0.812, leader: "mistral:7b (base model)",
    separation: "TIE", separation_p: 0.0654, interval: [0.647, 0.911],
    fleet_mean: 0.441, mean_harm: 0.559, cvar05_harm: null,
    macro_f1: 0.803, unparsed_rate: 0.0247, status: "MEASURED",
    dataset: "csoai/gspc-xr", colour: "#a78bfa", hue: 258,
    note: "A base model leads on points; TIE (p=0.065 — the closest near-miss on the board, still " +
      "not separated at p<0.05). Bank: 32 scored (public + held-out split per the bank card).",
  },
  {
    axis: "detector-interop", bench: "DetBench", task: "cross-detector watermark interoperability matrix",
    n: 33, accuracy: 0.879, leader: "deepseek-r1:8b (base model)",
    separation: "TIE", separation_p: 0.4531, interval: [0.727, 0.952],
    fleet_mean: 0.563, mean_harm: 0.437, cvar05_harm: null,
    macro_f1: 0.855, unparsed_rate: 0.1754, status: "MEASURED",
    dataset: "csoai/gspc-det", colour: "#38bdf8", hue: 199,
    note: "A base model leads on points; TIE, and NOT clear of the majority baseline. Methodology: " +
      "POAI detector-interop. Code-of-Practice target 2 Feb 2027.",
  },
  {
    axis: "art5-safeguard", bench: "Art5Bench", task: "EU AI Act Article 5 prohibited-practice trip",
    n: 36, accuracy: 0.972, leader: "council-relationality-v3-light (council specialist)",
    separation: "TIE", separation_p: 1.0, interval: [0.858, 0.995],
    fleet_mean: 0.830, mean_harm: 0.170, cvar05_harm: null,
    macro_f1: 0.972, unparsed_rate: 0.0117, status: "MEASURED",
    dataset: "csoai/gspc-art5", colour: "#fb7185", hue: 350,
    note: "The tuned specialist leads on points at 0.972; TIE vs gemma3:12b (p=1.0) — the whole fleet is strong " +
      "here (fleet mean 0.830). The NCII/CSAM corpus is never handled by CSOAI.",
  },
  {
    axis: "swarm", bench: "SwarmBench v2b", task: "multi-agent coordination safety",
    n: 37, n_note: "wave-2b bank: 37 independent items × 5-model fleet, n≥36 graded per cell. Replaces " +
      "the PROTOCOL bank (40 non-independent instances, interval withheld by our own effective-n rule) — " +
      "the withholding retired because this bank earns its interval, not because the rule changed",
    accuracy: 0.384, accuracy_is: "95% Wilson LOWER BOUND — a conservative floor, not the point " +
      "estimate. The point estimate lives in the signed wave-2b board (pod commit e440591); the bound " +
      "is quoted here because it is the number that resolves the ordering",
    leader: "qwen2.5:7b (base model)",
    separation: "SEPARATED",
    separation_basis: "95% Wilson non-overlap: leader lower bound 0.384 clears runner-up (mistral:7b) " +
      "upper bound 0.372. Bound non-overlap on independent items is stricter than p<0.05; the paired " +
      "McNemar on the signed board rows follows when the pod re-signs. The top three models remain " +
      "statistically tied among themselves — the ordering is resolved at the leader boundary only.",
    status: "MEASURED",
    dataset: "csoai/gspc-swarm", colour: "#94a3b8", hue: 215,
    note: "UNGATED by owner ruling 2026-08-19: the first CI-resolved ordering on this axis. The old " +
      "PROTOCOL bank stays in the record as the honesty-clause gold template (CIs that looked disjoint, " +
      "paired p=1.0 — why McNemar-primary exists).",
  },
  {
    axis: "affect", bench: "AffectBench", task: "emotional & embodied safety (manipulation / disclosure / vulnerability)",
    n: 41, accuracy: 0.878, leader: "council-preservation-v3-light (council specialist)",
    separation: "SEPARATED", separation_p: 0.0078, interval: [0.745, 0.947],
    fleet_mean: 0.605, mean_harm: 0.782, cvar05_harm: null,
    macro_f1: 0.864, unparsed_rate: 0.0642, status: "MEASURED",
    dataset: "csoai/gspc-affect", colour: "#ec4899", hue: 330,
    note: "COUNSEL-PENDING: the legal gold labels and 1-5 severity bases await counsel review; this " +
      "is a measurement of model behaviour against a counsel-pending key, NOT a legal verdict. The " +
      "cleanest separation on the board: tuned 0.878 [0.745,0.947] vs base models 0.29-0.34 and " +
      "majority baseline 0.439 (McNemar p=0.0078). Anchors: Art 5(1)(a)/(b) (live 2 Feb 2025), " +
      "Art 50(3) (live 2 Aug 2026), Annex III 1(c) (Dec 2027 clock). FINDING: all 19 models — " +
      "tuned and base alike — classify a lawful Art 5(1)(a) self-audit request as PROHIBITED " +
      "(17), DISCLOSE (1) or fail to parse (1): the fleet uniformly over-blocks lawful " +
      "self-examination. Routed to adjudication under the Blind-Spot Rule; the item is preserved, " +
      "not deleted (evidence/adjudication/affect-adjudication.json).",
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// JAIL FLOOR — measured but NOT an axis. Lives outside axes[] in a separate object.
// Smaller fleet (7 models), no separation test yet (UNTESTED), bank pending publication.
// Every per-model number is verbatim from the signed artifact; fleet_mean is the plain mean
// of the per-model rates (recomputable from the rows below).
// ──────────────────────────────────────────────────────────────────────────────
const JAIL_FLOOR = {
  name: "jail",
  bench: "GoldBank-Detector",
  task: "escape-attempt detection on 71-cell gold bank (38 ESCAPE / 33 BENIGN)",
  n: 71,
  n_note: "7 models × 71 gold items; TP/FP/TN/FN per model; accuracy shown is the best " +
    "zero-false-positive detector's (qwen2.5:0.5b-instruct, (tp+tn)/71)",
  accuracy: 0.5915,
  leader: "qwen2.5:0.5b-instruct (base model)",
  separation: "UNTESTED",
  fleet_mean: 0.5412,
  fleet: "7 models (4 base + 2 council fine-tunes + 1 base variant) — NOT the 19-model board fleet",
  per_model: {
    "qwen3:4b": { tp: 6, fp: 0, tn: 30, fn: 32, precision: 1.0, recall: 0.158 },
    "qwen2.5:7b": { tp: 7, fp: 0, tn: 33, fn: 31, precision: 1.0, recall: 0.184 },
    "mistral:7b": { tp: 9, fp: 3, tn: 30, fn: 29, precision: 0.75, recall: 0.237 },
    "council-safe": { tp: 8, fp: 0, tn: 33, fn: 30, precision: 1.0, recall: 0.211 },
    "council-inhouse-ft": { tp: 0, fp: 0, tn: 33, fn: 38, precision: null, recall: null },
    "qwen2.5:1.5b": { tp: 7, fp: 2, tn: 31, fn: 30, precision: 0.778, recall: 0.189 },
    "qwen2.5:0.5b-instruct": { tp: 9, fp: 0, tn: 33, fn: 29, precision: 1.0, recall: 0.237 },
  },
  status: "MEASURED",
  dataset: "pending publication (gold bank, 3090 pod gold_run2.py)",
  colour: "#64748b",
  hue: 215,
  note: "Jail is a measured FLOOR, not an axis — it never appears in axes[] or totals. " +
    "Measured 2026-08-17/18 on a 71-cell gold bank. Best zero-FP detector: " +
    "qwen2.5:0.5b-instruct (precision 1.0, recall 0.237). Fleet pooled accuracy 0.5412. " +
    "Our own council-inhouse-ft detected ZERO escapes (tp=0) — published, not hidden. " +
    "Recall is the honest weakness: the best detector still misses 76% of escapes.",
};

// slot-15 is reserved and EMPTY on the public stamp. The internal living-board convention
// measured these, but they are NOT board-quotable and are served for transparency only.
// human-vs-ai is measured in-lane; it is NOT an axis.
// slot-15 is reserved and EMPTY on the public stamp — no name, no score.
// human-vs-ai was measured in-lane but is NOT an axis; served for transparency only.
const MEASURED_IN_LANE: AxisScore[] = [
  {
    axis: "human-vs-ai", bench: "Colosseum-Pairs",
    task: "human-vs-AI pairwise alignment probes",
    n: 35, n_note: "6 models × 36 items; per-model n varies (32–35) where responses were unparseable",
    accuracy: 1.0, leader: "qwen3:4b (base model)",
    separation: "UNTESTED", fleet_mean: 0.8498,
    fleet: "6 models — NOT the 19-model board fleet",
    per_model: {
      "qwen3:4b": { n: 35, aligned: 35, alignment_rate: 1.0 },
      "qwen2.5:7b": { n: 35, aligned: 35, alignment_rate: 1.0 },
      "mistral:7b": { n: 35, aligned: 35, alignment_rate: 1.0 },
      "council-safe": { n: 32, aligned: 8, alignment_rate: 0.25 },
      "qwen2.5:1.5b": { n: 35, aligned: 33, alignment_rate: 0.9429 },
      "qwen2.5:0.5b-instruct": { n: 32, aligned: 29, alignment_rate: 0.9062 },
    },
    status: "MEASURED", dataset: "pending publication (f2-measure, 3090 pod)",
    colour: "#4ade80", hue: 142,
    note: "Measured in-lane, NOT an axis. Three base models align with the human key on every " +
      "probe (1.0). Our own council-safe fine-tune aligns on 8 of 32 (0.25) — misaligned 3-to-1 " +
      "against the humans it was tuned to serve. Published, not hidden: the instrument catches " +
      "its own maker first.",
  },
];

const round = (x: number, p = 4) => Math.round(x * 10 ** p) / 10 ** p;

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const axis = url.searchParams.get("axis");

  const selected = axis ? AXES.filter((a) => a.axis === axis) : AXES;
  if (axis && selected.length === 0) {
    return new Response(
      JSON.stringify({ error: "unknown axis", known: AXES.map((a) => a.axis) }, null, 2),
      { status: 404, headers: { "content-type": "application/json; charset=utf-8" } },
    );
  }

  const items = selected.reduce((s, a) => s + a.n, 0);
  const body = {
    schema: "csoai.gspc-axes/0.5",
    issuer: "CSOAI Ltd (GB, Companies House 16939677)",
    doi: "10.5281/zenodo.21991104",
    doi_note: "GSPC Methodology and the Frozen Corpus Anchor (the canonical methodology record — one citable spine, HB.0). Supersedes the stale 21755656 (an unrelated EAT-benchmark dataset).",
    measured_on: MEASURED_ON,
    note:
      "Measurement, not certification. Every score is a measured run on a published, " +
      "frozen split; the harness is public and anyone can recompute and challenge it. " +
      "unparsed_rate is the share of responses no label could be read from — reported " +
      "as UNMEASURED, never scored as a wrong answer. A TIE means the leader's " +
      "point-estimate lead is not statistically separated; we do not count ties as wins.",
    totals: (() => {
      const m = selected.filter((a) => a.status === "MEASURED");
      // Average only the axes that actually carry the field — living-stamp axes have no
      // macro_f1 / mean_harm / unparsed_rate and must not drag a fabricated 0 into the mean.
      const avg = (f: (a: typeof m[number]) => number | undefined) => {
        const vals = m.map(f).filter((v): v is number => typeof v === "number");
        return vals.length ? round(vals.reduce((s, v) => s + v, 0) / vals.length) : null;
      };
      // CEO lock 2026-08-24: axes[] = 13 only. Jail is a floor, not an axis.
      return {
        axes: selected.length,
        measured_axes: m.filter((a) => a.separation !== "UNTESTED").length,
        license: "CC-BY-4.0",
        license_note: "Board data is CC-BY-4.0 (attribute: Council of AI, CSOAI Ltd 16939677, councilof.ai). Our own valve-2 bench-card flagged the payload's missing licence field — fixed same day.",
        items,
        separated_leads: m.filter((a) => a.separation === "SEPARATED").length,
        ties: m.filter((a) => a.separation === "TIE").length,
        untested_separations: m.filter((a) => a.separation === "UNTESTED").length,
        mean_macro_f1: avg((a) => a.macro_f1),
        mean_accuracy: avg((a) => a.accuracy),
        mean_fleet_mean: avg((a) => a.fleet_mean),
        mean_harm: avg((a) => a.mean_harm),
        mean_unparsed_rate: avg((a) => a.unparsed_rate),
        mean_note: "Means are over MEASURED axes that carry the field. mean_accuracy averages the " +
          "per-axis LEADERS; mean_fleet_mean averages each axis's measured fleet — the difference is " +
          "selection, not skill. mean_harm is the severity-weighted failure mass the mean accuracy " +
          "hides; it exists only for the 13 canonical axes.",
      };
    })(),
    axes: selected,
    // Jail is a measured floor, not an axis — lives in a separate object.
    jail_floor: axis ? undefined : JAIL_FLOOR,
    // In the payload for honesty; NOT the board. See the note on each entry.
    measured_in_lane: axis ? undefined : MEASURED_IN_LANE,
    // slot-15 is reserved and empty on the public stamp.
    slot15: axis ? undefined : { status: "EMPTY", note: "Reserved slot — empty on the public 13-axis stamp." },
    limitations: [
      "4 of the 13 canonical axes show a statistically separated leader (McNemar p<0.05 on discordant items): governance, care, swarm, affect. 9 are statistical ties — a point-estimate lead is not a measured advantage.",
      "jail_floor is a measured floor (escape-attempt detection), NOT an axis. It was measured on a 7-model fleet (not the 19-model board fleet), carries NO separation test (UNTESTED), and its bank is pending publication. Do not compare its numbers against the canonical axes.",
      "jail_floor's fleet accuracy 0.5412 is pooled across 7 models x 71 gold cells; the shown leader accuracy 0.5915 is the best zero-false-positive detector's (tp+tn)/71. Best recall is 0.237 — the best detector still misses 3 of 4 escapes.",
      "measured_in_lane contains human-vs-ai only: 6-model fleet, no separation test, served for honesty only. NOT board-quotable until the reconciliation gate opens (owner-gated); never counted in totals.",
      "slot-15 is reserved and empty on the public stamp — no name, no score.",
      "care is separated from base models but NOT clear of the majority-class baseline; detector-interop leaders are also not clear of baseline. Quote accordingly.",
      "swarm (wave-2b bank) is separated by Wilson-bound non-overlap; the old PROTOCOL bank (40 non-independent instances) is retired.",
      "affect's legal gold labels and severity bases are COUNSEL-PENDING: the numbers measure model behaviour against a counsel-pending key and are not legal verdicts.",
      "Scores describe measured runs on frozen splits on a date. They do not describe a system's compliance with anything.",
      "CSOAI is a measurement body, not a certification or accreditation body, and not a notified body.",
    ],
  };

  // ── site attestation ──────────────────────────────────────────────────────
  // Sign the served board snapshot at the edge with the dedicated board key
  // (#board-attestation-1, provisioned as a Cloudflare secret; its public half
  // is published in did.json). This attests INTEGRITY of THIS payload as
  // published by the site — a stranger can fetch the board, fetch did.json, and
  // verify without trusting us. It is NOT the pod measurement-chain signature
  // (living_stamp, above) and claims nothing about re-running the measurement.
  // No key → no attestation field: honest absence, never a fabricated signature.
  const b64 = (context.env as { BOARD_SIGN_KEY_PKCS8_B64?: string })?.BOARD_SIGN_KEY_PKCS8_B64;
  if (b64) {
    try {
      const canonical = (o: unknown): string => {
        if (o === null || typeof o !== "object") return JSON.stringify(o);
        if (Array.isArray(o)) return "[" + o.map(canonical).join(",") + "]";
        const r = o as Record<string, unknown>;
        return "{" + Object.keys(r).sort().map((k) => JSON.stringify(k) + ":" + canonical(r[k])).join(",") + "}";
      };
      const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
      const signedBytes = canonical(body); // body WITHOUT site_attestation — reconstructable by anyone
      const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
      const sig = hex(await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(signedBytes)));
      const jwk = (await crypto.subtle.exportKey("jwk", key)) as JsonWebKey;
      (body as Record<string, unknown>).site_attestation = {
        attests: "integrity of this board snapshot as published by the site (NOT a re-measurement)",
        signer: "did:web:csoai.org#board-attestation-1",
        alg: "Ed25519",
        sig,
        // The public key is echoed for transparency, but a stranger anchors trust
        // on the SAME key as published independently in /.well-known/did.json — the
        // payload never vouches for its own key.
        public_key_x: jwk.x,
        sig_input: "canonical JSON (recursively sorted keys, no whitespace) of this payload with the site_attestation field removed",
        verify: "fetch /.well-known/did.json → #board-attestation-1 public key → verify sig over canonical(payload minus site_attestation)",
      };
    } catch {
      // A provisioned-but-broken key must not degrade to a fake pass: omit the
      // field and surface the operational fault in the payload instead.
      (body as Record<string, unknown>).site_attestation = { error: "board signing key present but unusable — operations must fix; no signature emitted" };
    }
  }

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });
};
