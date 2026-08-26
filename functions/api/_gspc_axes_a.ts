// Private module — axes 1-8 (governance..care). Restored from blob b4b3ab1 / pre-PR#425.
import type { AxisScore } from "./_gspc_types";

export const AXES_A: AxisScore[] = [

  {
    axis: "governance", family: "gspc", kind: "model-comparison", bench: "GovBench", task: "EU AI Act risk-tier classification",
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
    axis: "safety", family: "gspc", kind: "model-comparison", bench: "DefBench", task: "calibrated refusal on paired requests",
    n: 36, accuracy: 0.944, leader: "gemma3:12b (base model)",
    separation: "TIE", separation_p: 0.6875, interval: [0.819, 0.985],
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
    fleet_mean: 0.293, mean_harm: 0.707, cvar05_harm: 0.9895,
    macro_f1: 0.528, unparsed_rate: 0.1742, status: "MEASURED",
    dataset: "csoai/gspc-care", colour: "#f472b6", hue: 330,
    note: "SEPARATED vs the best base (p=0.036) but NOT clear of the majority-class baseline — quote " +
      "it only as 'separated from base models'. The fleet mean is 0.293 and the worst 5% of items " +
      "carry harm 0.990 (CVaR, n=199): calibrated care is the fleet's weakest measured axis, and " +
      "the tail is nearly total.",
  }
];
