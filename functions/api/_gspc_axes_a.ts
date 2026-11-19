// Private module — axes 1-8 (governance..care). Restored from blob b4b3ab1 / pre-PR#425.
import type { AxisScore } from "./_gspc_types";

export const AXES_A: AxisScore[] = [

  {
    axis: "governance", family: "gspc", kind: "model-comparison", bench: "GovBench", task: "EU AI Act risk-tier classification",
    n: 237, accuracy: 0.700, leader: "council-embodiment-v3-light (council specialist)",
    separation: "SEPARATED", separation_p: 0.0086, interval: [0.639, 0.755],
    separation_basis: "Exact McNemar between the top two base models on the published per-item " +
      "rows (rows/peritem_gov.jsonl, 237 items): mistral:7b 0.5865 (139/237) vs deepseek-r1:8b " +
      "0.5401 (128/237), 70/59 discordant, p=0.3787 — not below 0.05, so the public base-model " +
      "re-rank is a TIE; the original-run own-model lead typed on this row is excluded from the " +
      "public ranking and is not this determination. Recomputed 2026-11-18 with the board's own " +
      "producer (scripts/gspc_separation_from_rows.py) from the public per-item rows " +
      "(csoai/gspc-peritem-rows-2026-08-12), every file hash-verified against the dataset's " +
      "SHA256SUMS.",
    fleet_mean: 0.490, mean_harm: 0.510, cvar05_harm: 0.8728,
    macro_f1: 0.705, unparsed_rate: 0.0386, status: "MEASURED",
    dataset: "csoai/gspc-gov", colour: "#34d399", hue: 152,
    note: "v2 bank: 237 items, imported 2026-08-05 from the 339 scenarios of the AI Act Evaluation " +
      "Benchmark (NCSR \"Demokritos\", arXiv:2603.09435, CC-BY-4.0). The other 102 scenarios are not " +
      "graded here, and they are not a private held-out set: all 339 are public in the upstream " +
      "scenarios.json (github.com/davidath/ai-act-evaluation-benchmark). No held-out slice backs this " +
      "axis (C-2026-0929-02). In the original run our " +
      "own tuned governance specialist held the point lead, and that lead was separated from the best " +
      "base model, mistral:7b (McNemar p=0.0086). That is an in-lane result on our own model, not a " +
      "public ranking: the public board does not rank our own models and does not count it in " +
      "totals.separated_leads (C-2026-0915-01). The public leader and determination on this axis come " +
      "only from the external-only re-rank of the published per-item rows (2026-09-27). The fleet mean is 0.490: EU AI Act tiering is hard for " +
      "everyone, and the worst 5% of items carry harm 0.873 (CVaR, n=237) — the tail is real.",
  },
  {
    axis: "safety", family: "gspc", kind: "model-comparison", bench: "DefBench", task: "calibrated refusal on paired requests",
    n: 36, accuracy: 0.944, leader: "gemma3:12b (base model)",
    separation: "TIE", separation_p: 0.6875, interval: [0.819, 0.985],
    separation_basis: "Exact McNemar between the top two base models on the published per-item " +
      "rows (rows/peritem_agi.jsonl, 36 items): gemma3:12b 0.9444 (34/36) vs qwen2.5:3b 0.8889 " +
      "(32/36), 4/2 discordant, p=0.6875 — not below 0.05, a TIE. Recomputed 2026-11-18 with the " +
      "board's own producer (scripts/gspc_separation_from_rows.py) from the public per-item rows " +
      "(csoai/gspc-peritem-rows-2026-08-12), every file hash-verified against the dataset's " +
      "SHA256SUMS.",
    fleet_mean: 0.732, mean_harm: 0.268, cvar05_harm: null,
    macro_f1: 0.944, unparsed_rate: 0.0541, status: "MEASURED",
    dataset: "csoai/gspc-agi", colour: "#f87171", hue: 0,
    note: "A base model holds the point lead but the lead is a TIE (McNemar p=0.69 vs qwen2.5:3b). " +
      "Honestly reported: the tuned specialists do not own this axis.",
  },
  {
    axis: "provenance", family: "gspc", kind: "model-comparison", bench: "ProvBench", task: "Article 50 marking survival by validity",
    n: 32, accuracy: 0.781, leader: "council-aesthetics-v3-light (council specialist)",
    separation: "TIE", separation_p: 0.7744, interval: [0.612, 0.890],
    separation_basis: "Exact McNemar between the top two base models on the published per-item " +
      "rows (rows/peritem_prv.jsonl, 32 items): llama3.2:3b 0.7188 (23/32) vs gemma3:12b 0.6875 " +
      "(22/32), 6/5 discordant, p=1.0 — not below 0.05, a TIE. Recomputed 2026-11-18 with the " +
      "board's own producer (scripts/gspc_separation_from_rows.py) from the public per-item rows " +
      "(csoai/gspc-peritem-rows-2026-08-12), every file hash-verified against the dataset's " +
      "SHA256SUMS.",
    fleet_mean: 0.549, mean_harm: 0.451, cvar05_harm: null,
    macro_f1: 0.776, unparsed_rate: 0.1480, status: "MEASURED",
    dataset: "csoai/gspc-prv", colour: "#60a5fa", hue: 213,
    note: "v3 bank (validity principle: a manifest present but whose binding no longer validates has " +
      "NOT survived). The tuned specialist leads on points; TIE vs llama3.2:3b (p=0.77).",
  },
  {
    axis: "continuity", family: "gspc", kind: "model-comparison", bench: "PQCBench", task: "post-quantum status of a cryptographic assumption",
    n: 33, accuracy: 0.606, leader: "council-destruction-v3-light (council specialist)",
    separation: "TIE", separation_p: 1.0, interval: [0.437, 0.753],
    separation_basis: "Exact McNemar between the top two base models on the published per-item " +
      "rows (rows/peritem_asi.jsonl, 33 items): gemma3:12b 0.6061 (20/33) vs deepseek-r1:8b " +
      "0.5455 (18/33), 4/2 discordant, p=0.6875 — not below 0.05, a TIE. Recomputed 2026-11-18 " +
      "with the board's own producer (scripts/gspc_separation_from_rows.py) from the public " +
      "per-item rows (csoai/gspc-peritem-rows-2026-08-12), every file hash-verified against the " +
      "dataset's SHA256SUMS.",
    fleet_mean: 0.450, mean_harm: 0.550, cvar05_harm: null,
    macro_f1: 0.512, unparsed_rate: 0.0463, status: "MEASURED",
    dataset: "csoai/gspc-asi", colour: "#c084fc", hue: 271,
    note: "The axis designed to discriminate across frontier models. The tuned specialist leads on points; " +
      "flat TIE vs gemma3:12b (p=1.0).",
  },
  {
    axis: "conformance", family: "gspc", kind: "model-comparison", bench: "MCPBench", task: "MCP tool conformance",
    n: 35, accuracy: 0.743, leader: "council-preservation-v3-light (council specialist)",
    separation: "TIE", separation_p: 1.0, interval: [0.579, 0.858],
    separation_basis: "Exact McNemar between the top two base models on the published per-item " +
      "rows (rows/peritem_mcp.jsonl, 35 items): mistral:7b 0.7143 (25/35) vs llama3.2:3b 0.6571 " +
      "(23/35), 3/1 discordant, p=0.625 — not below 0.05, a TIE. Recomputed 2026-11-18 with the " +
      "board's own producer (scripts/gspc_separation_from_rows.py) from the public per-item rows " +
      "(csoai/gspc-peritem-rows-2026-08-12), every file hash-verified against the dataset's " +
      "SHA256SUMS.",
    fleet_mean: 0.537, mean_harm: 0.463, cvar05_harm: null,
    macro_f1: 0.735, unparsed_rate: 0.1338, status: "MEASURED",
    dataset: "csoai/gspc-mcp", colour: "#fbbf24", hue: 43,
    note: "Canonical bank count 35 (supersedes the stale 11 in older matrices — registry v2). " +
      "The tuned specialist leads on points; flat TIE vs mistral:7b (p=1.0).",
  },
  {
    axis: "openness", family: "gspc", kind: "model-comparison", bench: "OSSBench", task: "licence reasoning versus intended use",
    n: 32, accuracy: 0.875, leader: "council-preservation-v3-light (council specialist)",
    separation: "TIE", separation_p: 1.0, interval: [0.719, 0.950],
    separation_basis: "Exact McNemar between the top two base models on the published per-item " +
      "rows (rows/peritem_oss.jsonl, 32 items): gemma3:12b 0.8438 (27/32) vs mistral:7b 0.7188 " +
      "(23/32), 9/5 discordant, p=0.424 — not below 0.05, a TIE. Recomputed 2026-11-18 with the " +
      "board's own producer (scripts/gspc_separation_from_rows.py) from the public per-item rows " +
      "(csoai/gspc-peritem-rows-2026-08-12), every file hash-verified against the dataset's " +
      "SHA256SUMS.",
    fleet_mean: 0.696, mean_harm: 0.304, cvar05_harm: null,
    macro_f1: 0.875, unparsed_rate: 0.0493, status: "MEASURED",
    dataset: "csoai/gspc-oss", colour: "#2dd4bf", hue: 174,
    note: "v2 bank (AGPL network trigger, directional compatibility, SSPL/ELv2/BSL service clauses). " +
      "Canonical count 32 (supersedes stale 16). The tuned specialist leads on points; flat TIE vs gemma3:12b.",
  },
  {
    axis: "machinery-conformity", family: "gspc", kind: "model-comparison", bench: "MachBench",
    task: "Machinery Reg self-evolving safety-function classification (PART_A / OUT_OF_SCOPE / NOT_SAFETY_FUNCTION)",
    n: 33, accuracy: 0.545, leader: "llama3.2:3b (base model)",
    separation: "TIE", separation_p: 0.5811, interval: [0.380, 0.702],
    separation_basis: "Rows exist (rows/peritem_mach.jsonl, 33 items) and the exact McNemar on " +
      "them gives 8/5 discordant, p=0.5811 — not significant, but sample size alone is not the " +
      "reason this row stays UNTESTED: the axis carries no signed per-model card in " +
      "/signed/card_index.json, and a separation determination is published only on carded axes. " +
      "Recomputed 2026-11-18 with the board's own producer " +
      "(scripts/gspc_separation_from_rows.py) from the public per-item rows " +
      "(csoai/gspc-peritem-rows-2026-08-12), every file hash-verified against the dataset's " +
      "SHA256SUMS.",
    fleet_mean: 0.349, mean_harm: 0.651, cvar05_harm: null,
    macro_f1: 0.465, unparsed_rate: 0.0558, status: "MEASURED",
    dataset: "csoai/gspc-mach", colour: "#fb923c", hue: 40,
    note: "A base model leads on points; TIE. Anchor: Machinery Reg (EU) 2023/1230 Annex I Part A " +
      "items 5-6, applies 14 Jan 2027. Gold labels remain under legal review — measurement, not a " +
      "conformity verdict.",
  },
  {
    axis: "care", family: "gspc", kind: "model-comparison", bench: "CareBench", task: "care-cost (protect × help) under paired conduct scenarios",
    n: 199, n_note: "200 bank records, one exact-duplicate pair → 199 unique scored texts (registry v2)",
    accuracy: 0.535, leader: "council-ethics-v3-light (council specialist)",
    separation: "SEPARATED", separation_p: 0.0356, interval: [0.466, 0.603],
    separation_basis: "Exact McNemar between the top two base models on the published per-item " +
      "rows (rows/peritem_care.jsonl, 199 distinct paired items, 200 scored rows per model): " +
      "qwen2.5:0.5b-instruct 0.405 (81/200) vs qwen2.5:3b 0.37 (74/200), 32/25 discordant, " +
      "p=0.427 — not below 0.05, so the public base-model re-rank is a TIE; the original-run " +
      "own-model lead typed on this row is excluded from the public ranking and is not this " +
      "determination. Recomputed 2026-11-18 with the board's own producer " +
      "(scripts/gspc_separation_from_rows.py) from the public per-item rows " +
      "(csoai/gspc-peritem-rows-2026-08-12), every file hash-verified against the dataset's " +
      "SHA256SUMS.",
    fleet_mean: 0.293, mean_harm: 0.707, cvar05_harm: 0.9895,
    macro_f1: 0.528, unparsed_rate: 0.1742, status: "MEASURED",
    dataset: "csoai/gspc-care", colour: "#f472b6", hue: 330,
    note: "In the original run our own care specialist held the point lead, SEPARATED vs the best base " +
      "(p=0.036) but NOT clear of the majority-class baseline. That is an in-lane result on our own " +
      "model, not a public ranking, and it is not counted in totals.separated_leads (C-2026-0915-01). " +
      "The fleet mean is 0.293 and the worst 5% of items " +
      "carry harm 0.990 (CVaR, n=199): calibrated care is the fleet's weakest measured axis, and " +
      "the tail is nearly total.",
  }
];
