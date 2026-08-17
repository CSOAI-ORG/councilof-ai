// functions/api/gspc.ts — the 13-axis GSPC payload, board v2 (2026-08-12).
//
// PUBLISH-DELTA 2026-08-13 (owner word): every axis now carries a measured
// number from the 13-axis board v2 — 19 models × per-item rows (15,580 rows,
// 0 transport errors), committed at csoai-static-deploy2 bb15589c, harness
// SOVOS/agents/board_v2.py (2c2f9faa, byte-reproducible per peer-audit
// 10e37101), separation test at SOVOS/arena-real-runs/SEPARATION_TEST_2026-08-13.md.
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
//   Re-run the board harness and SOVOS/agents/separation_test.py, then paste
//   the resulting values. Do not hand-edit a score without re-running the
//   harness — that is the whole point of the instrument.

interface AxisScore {
  axis: string;
  bench: string;
  task: string;
  n: number;
  n_note?: string;            // set-name caveat (e.g. swarm instances-vs-prompts)
  held_out?: number;          // items held back privately (never trained-on / never published) — S3 discipline
  accuracy: number;           // the board LEADER's accuracy (whoever leads — sovereign or base)
  leader: string;             // which model holds the point-estimate lead
  separation: "SEPARATED" | "TIE";
  separation_p?: number;      // McNemar exact p on discordant pairs (leader vs best base)
  interval?: [number, number];   // Wilson 95% CI on the leader — present ONLY where the n is honestly independent
  fleet_mean: number;         // mean accuracy across all 19 models — the linear aggregator
  mean_harm: number;          // (1 - item pass rate) x severity, fleet-level, mean
  cvar05_harm?: number | null;   // mean of the WORST 5% of item harms — only where n>=100 (BV floor)
  macro_f1: number;
  unparsed_rate: number;
  status: "MEASURED" | "UNMEASURED" | "DRAFT" | "SPEC" | "PLANNED";
  dataset: string;
  colour: string;   // globe layer colour
  hue: number;      // 0-360, for procedural ramps
  note?: string;
}

const MEASURED_ON = {
  model: "19-model fleet: 8 sov6 sovereign specialists + 6 base models + frontier cross-lab citizens",
  endpoint: "A100 · local Ollama (board v2) · OpenRouter (cross-lab citizens)",
  date: "2026-08-12",
  grading: "deterministic grading on 15,580 per-item rows (0 transport errors) — reproducible from csoai-static-deploy2 bb15589c with SOVOS/agents/board_v2.py",
  note: "All 13 axes measured on the same fleet, same rows, same grader. Per-axis numbers show the " +
    "board LEADER (whoever leads — sovereign or base), its Wilson interval where n is honestly " +
    "independent, and whether the lead is statistically separated (McNemar p<0.05) or a TIE. " +
    "fleet_mean and mean_harm show the fleet, not the leader. Separation test and per-axis " +
    "canonical counts: SOVOS/arena-real-runs/SEPARATION_TEST_2026-08-13.md and GSPC_AXIS_REGISTRY.json v2.",
};

const AXES: AxisScore[] = [
  {
    axis: "governance", bench: "GovBench", task: "EU AI Act risk-tier classification",
    n: 237, accuracy: 0.700, leader: "sov6-embodiment-v3-light (sovereign specialist)",
    separation: "SEPARATED", separation_p: 0.0086, interval: [0.639, 0.755], held_out: 102,
    fleet_mean: 0.490, mean_harm: 0.510, cvar05_harm: 0.8728,
    macro_f1: 0.705, unparsed_rate: 0.0386, status: "MEASURED",
    dataset: "csoai/gspc-gov", colour: "#34d399", hue: 152,
    note: "v2 bank: 237 public items (+102 held back privately), imported 2026-08-05 from the AI Act " +
      "Evaluation Benchmark (NCSR \"Demokritos\", arXiv:2603.09435, CC-BY-4.0). The sovereign governance " +
      "specialist leads AND the lead is separated (McNemar p=0.0086 vs best base mistral:7b) — one of " +
      "only 3 separated leads on the board. The fleet mean is 0.490: EU AI Act tiering is hard for " +
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
      "Honestly reported: the sovereigns do not own this axis.",
  },
  {
    axis: "provenance", bench: "ProvBench", task: "Article 50 marking survival by validity",
    n: 32, accuracy: 0.781, leader: "sov6-aesthetics-v3-light (sovereign specialist)",
    separation: "TIE", separation_p: 0.7744, interval: [0.612, 0.890],
    fleet_mean: 0.549, mean_harm: 0.451, cvar05_harm: null,
    macro_f1: 0.776, unparsed_rate: 0.1480, status: "MEASURED",
    dataset: "csoai/gspc-prv", colour: "#60a5fa", hue: 213,
    note: "v3 bank (validity principle: a manifest present but whose binding no longer validates has " +
      "NOT survived). Sovereign leads on points; TIE vs llama3.2:3b (p=0.77).",
  },
  {
    axis: "continuity", bench: "PQCBench", task: "post-quantum status of a cryptographic assumption",
    n: 33, accuracy: 0.606, leader: "sov6-destruction-v3-light (sovereign specialist)",
    separation: "TIE", separation_p: 1.0, interval: [0.437, 0.753],
    fleet_mean: 0.450, mean_harm: 0.550, cvar05_harm: null,
    macro_f1: 0.512, unparsed_rate: 0.0463, status: "MEASURED",
    dataset: "csoai/gspc-asi", colour: "#c084fc", hue: 271,
    note: "The axis designed to discriminate across frontier models. Sovereign leads on points; " +
      "flat TIE vs gemma3:12b (p=1.0).",
  },
  {
    axis: "conformance", bench: "MCPBench", task: "MCP tool conformance",
    n: 35, accuracy: 0.743, leader: "sov6-preservation-v3-light (sovereign specialist)",
    separation: "TIE", separation_p: 1.0, interval: [0.579, 0.858],
    fleet_mean: 0.537, mean_harm: 0.463, cvar05_harm: null,
    macro_f1: 0.735, unparsed_rate: 0.1338, status: "MEASURED",
    dataset: "csoai/gspc-mcp", colour: "#fbbf24", hue: 43,
    note: "Canonical bank count 35 (supersedes the stale 11 in older matrices — registry v2). " +
      "Sovereign leads on points; flat TIE vs mistral:7b (p=1.0).",
  },
  {
    axis: "openness", bench: "OSSBench", task: "licence reasoning versus intended use",
    n: 32, accuracy: 0.875, leader: "sov6-preservation-v3-light (sovereign specialist)",
    separation: "TIE", separation_p: 1.0, interval: [0.719, 0.950],
    fleet_mean: 0.696, mean_harm: 0.304, cvar05_harm: null,
    macro_f1: 0.875, unparsed_rate: 0.0493, status: "MEASURED",
    dataset: "csoai/gspc-oss", colour: "#2dd4bf", hue: 174,
    note: "v2 bank (AGPL network trigger, directional compatibility, SSPL/ELv2/BSL service clauses). " +
      "Canonical count 32 (supersedes stale 16). Sovereign leads on points; flat TIE vs gemma3:12b.",
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
    accuracy: 0.535, leader: "sov6-ethics-v3-light (sovereign specialist)",
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
    n: 36, accuracy: 0.972, leader: "sov6-relationality-v3-light (sovereign specialist)",
    separation: "TIE", separation_p: 1.0, interval: [0.858, 0.995],
    fleet_mean: 0.830, mean_harm: 0.170, cvar05_harm: null,
    macro_f1: 0.972, unparsed_rate: 0.0117, status: "MEASURED",
    dataset: "csoai/gspc-art5", colour: "#fb7185", hue: 350,
    note: "Sovereign leads on points at 0.972; TIE vs gemma3:12b (p=1.0) — the whole fleet is strong " +
      "here (fleet mean 0.830). The NCII/CSAM corpus is never handled by CSOAI.",
  },
  {
    axis: "swarm", bench: "SwarmBench", task: "multi-agent coordination safety",
    n: 40, n_note: "PROTOCOL bank: 1 anchor, 3 unique prompts, 40 scored instances — instances are NOT " +
      "independent, so no Wilson interval is shown (quoting n=40 would overstate the evidence)",
    accuracy: 0.975, leader: "qwen2.5:0.5b-instruct (base model)",
    separation: "TIE", separation_p: 1.0,
    fleet_mean: 0.372, mean_harm: 0.673, cvar05_harm: null,
    macro_f1: 0.494, unparsed_rate: 0.1868, status: "MEASURED",
    dataset: "csoai/gspc-swarm", colour: "#94a3b8", hue: 215,
    note: "The honesty-clause gold template. Raw CIs on this bank LOOK disjoint but the paired test " +
      "says p=1.0 (low-discrimination prompts) — the exact case the McNemar-primary rule exists for. " +
      "TIE, and the interval is withheld by our own effective-n rule (registry v2).",
  },
  {
    axis: "affect", bench: "AffectBench", task: "emotional & embodied safety (manipulation / disclosure / vulnerability)",
    n: 41, accuracy: 0.878, leader: "sov6-preservation-v3-light (sovereign specialist)",
    separation: "SEPARATED", separation_p: 0.0078, interval: [0.745, 0.947],
    fleet_mean: 0.605, mean_harm: 0.782, cvar05_harm: null,
    macro_f1: 0.864, unparsed_rate: 0.0642, status: "MEASURED",
    dataset: "csoai/gspc-affect", colour: "#ec4899", hue: 330,
    note: "COUNSEL-PENDING: the legal gold labels and 1-5 severity bases await counsel review; this " +
      "is a measurement of model behaviour against a counsel-pending key, NOT a legal verdict. The " +
      "cleanest separation on the board: sovereign 0.878 [0.745,0.947] vs base models 0.29-0.34 and " +
      "majority baseline 0.439 (McNemar p=0.0078). Anchors: Art 5(1)(a)/(b) (live 2 Feb 2025), " +
      "Art 50(3) (live 2 Aug 2026), Annex III 1(c) (Dec 2027 clock). FINDING: all 19 models — " +
      "sovereign and base alike — classify a lawful Art 5(1)(a) self-audit request as PROHIBITED " +
      "(17), DISCLOSE (1) or fail to parse (1): the fleet uniformly over-blocks lawful " +
      "self-examination. Routed to adjudication under the Blind-Spot Rule; the item is preserved, " +
      "not deleted (evidence/adjudication/affect-adjudication.json).",
  },
];

const round = (x: number, p = 4) => Math.round(x * 10 ** p) / 10 ** p;

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const axis = url.searchParams.get("axis");

  // LIVING BOARD MERGE — append axes from the bundled living DB not in the
  // hardcoded 13 (e.g. jail, measured 2026-08-13). The site runs on living
  // benchmarks, not only the frozen snapshot. (JEEVES 2026-08-17)
  let merged = AXES;
  try {
    const { LIVING_BOARD } = await import("./living_board.ts");
    const known = new Set(AXES.map((a) => a.axis));
    const extra = (LIVING_BOARD.axes || []).filter(
      (a: any) => a.axis && !known.has(a.axis),
    );
    if (extra.length) merged = [...AXES, ...extra];
  } catch {
    merged = AXES; // no living board bundled — serve frozen snapshot (never fail)
  }

  const selected = axis ? merged.filter((a: any) => a.axis === axis) : merged;
  if (axis && selected.length === 0) {
    return new Response(
      JSON.stringify({ error: "unknown axis", known: merged.map((a: any) => a.axis) }, null, 2),
      { status: 404, headers: { "content-type": "application/json; charset=utf-8" } },
    );
  }

  const items = selected.reduce((s, a) => s + a.n, 0);
  const body = {
    schema: "csoai.gspc-axes/0.3",
    issuer: "CSOAI Ltd (GB, Companies House 16939677)",
    doi: "10.5281/zenodo.21755656",
    measured_on: MEASURED_ON,
    note:
      "Measurement, not certification. Every score is a measured run on a published, " +
      "frozen split; the harness is public and anyone can recompute and challenge it. " +
      "unparsed_rate is the share of responses no label could be read from — reported " +
      "as UNMEASURED, never scored as a wrong answer. A TIE means the leader's " +
      "point-estimate lead is not statistically separated; we do not count ties as wins.",
    totals: (() => {
      const m = selected.filter((a) => a.status === "MEASURED");
      const avg = (f: (a: typeof m[number]) => number) =>
        m.length ? round(m.reduce((s, a) => s + f(a), 0) / m.length) : null;
      return {
        axes: selected.length,
        measured_axes: m.length,
        items,
        separated_leads: m.filter((a) => a.separation === "SEPARATED").length,
        ties: m.filter((a) => a.separation === "TIE").length,
        mean_macro_f1: avg((a) => a.macro_f1),
        mean_accuracy: avg((a) => a.accuracy),
        mean_fleet_mean: avg((a) => a.fleet_mean),
        mean_harm: avg((a) => a.mean_harm),
        mean_unparsed_rate: avg((a) => a.unparsed_rate),
        mean_note: "Means are over MEASURED axes only. mean_accuracy averages the per-axis LEADERS; " +
          "mean_fleet_mean averages the full 19-model fleet — the difference is selection, not skill. " +
          "mean_harm is the severity-weighted failure mass the mean accuracy hides.",
      };
    })(),
    axes: selected,
    limitations: [
      "3 of 13 axes show a statistically separated leader (McNemar p<0.05 on discordant items): governance, care, affect. 10 are statistical ties — a point-estimate lead is not a measured advantage.",
      "care is separated from base models but NOT clear of the majority-class baseline; detector-interop and swarm leaders are also not clear of baseline. Quote accordingly.",
      "swarm is a protocol bank (3 unique prompts, 40 scored instances): its instances are not independent, so no interval is shown and its numbers carry an effective-n caveat.",
      "affect's legal gold labels and severity bases are COUNSEL-PENDING: the numbers measure model behaviour against a counsel-pending key and are not legal verdicts.",
      "Scores describe measured runs on frozen splits on a date. They do not describe a system's compliance with anything.",
      "CSOAI is a measurement body, not a certification or accreditation body, and not a notified body.",
    ],
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });
};
