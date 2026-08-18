// GENERATED from the living DB — the site runs on living benchmarks.
// Regenerate: cp board_living.json -> this file's JSON block.
export const LIVING_BOARD = {
 "schema": "csoai.gspc-living/0.1",
 "updated": "2026-08-18T08:22:54Z",
 "source": "boards-v2 + gold-run-3090",
 "axes": [
  {
   "axis": "governance",
   "bench": "GovBench",
   "task": "EU AI Act risk-tier classification",
   "n": 237,
   "accuracy": 0.7,
   "leader": "sov6-embodiment-v3-light (council specialist)",
   "separation": "SEPARATED",
   "separation_p": 0.0086,
   "interval": [
    0.639,
    0.755
   ],
   "fleet_mean": 0.49,
   "mean_harm": 0.51,
   "cvar05_harm": 0.8728,
   "macro_f1": 0.705,
   "unparsed_rate": 0.0386,
   "status": "MEASURED",
   "dataset": "csoai/gspc-gov",
   "colour": "#34d399",
   "hue": 152,
   "note": "v2 bank: 237 public items (+102 held back privately), imported 2026-08-05 from the AI Act Evaluation Benchmark (NCSR \"Demokritos\", arXiv:2603.09435, CC-BY-4.0). The tuned governance specialist leads AND the lead is separated (McNemar p=0.0086 vs best base mistral:7b) \u2014 one of only 3 separated leads on the board. The fleet mean is 0.490: EU AI Act tiering is hard for everyone, and the worst 5% of items carry harm 0.873 (CVaR, n=237) \u2014 the tail is real.",
   "_source": "longitudinal",
   "_updated": "2026-08-17T10:26:32Z",
   "public_board": true
  },
  {
   "axis": "safety",
   "bench": "DefBench",
   "task": "calibrated refusal on paired requests",
   "n": 36,
   "accuracy": 0.944,
   "leader": "gemma3:12b (base model)",
   "separation": "TIE",
   "separation_p": 0.6875,
   "interval": [
    0.819,
    0.985
   ],
   "fleet_mean": 0.732,
   "mean_harm": 0.268,
   "cvar05_harm": null,
   "macro_f1": 0.944,
   "unparsed_rate": 0.0541,
   "status": "MEASURED",
   "dataset": "csoai/gspc-agi",
   "colour": "#f87171",
   "hue": 0,
   "note": "A base model holds the point lead but the lead is a TIE (McNemar p=0.69 vs qwen2.5:3b). Honestly reported: the tuned specialists do not own this axis.",
   "_source": "longitudinal",
   "_updated": "2026-08-17T10:26:32Z",
   "public_board": true
  },
  {
   "axis": "provenance",
   "bench": "ProvBench",
   "task": "Article 50 marking survival by validity",
   "n": 32,
   "accuracy": 0.781,
   "leader": "sov6-aesthetics-v3-light (council specialist)",
   "separation": "TIE",
   "separation_p": 0.7744,
   "interval": [
    0.612,
    0.89
   ],
   "fleet_mean": 0.549,
   "mean_harm": 0.451,
   "cvar05_harm": null,
   "macro_f1": 0.776,
   "unparsed_rate": 0.148,
   "status": "MEASURED",
   "dataset": "csoai/gspc-prv",
   "colour": "#60a5fa",
   "hue": 213,
   "note": "v3 bank (validity principle: a manifest present but whose binding no longer validates has NOT survived). The tuned specialist leads on points; TIE vs llama3.2:3b (p=0.77).",
   "_source": "longitudinal",
   "_updated": "2026-08-17T10:26:32Z",
   "public_board": true
  },
  {
   "axis": "continuity",
   "bench": "PQCBench",
   "task": "post-quantum status of a cryptographic assumption",
   "n": 33,
   "accuracy": 0.606,
   "leader": "sov6-destruction-v3-light (council specialist)",
   "separation": "TIE",
   "separation_p": 1,
   "interval": [
    0.437,
    0.753
   ],
   "fleet_mean": 0.45,
   "mean_harm": 0.55,
   "cvar05_harm": null,
   "macro_f1": 0.512,
   "unparsed_rate": 0.0463,
   "status": "MEASURED",
   "dataset": "csoai/gspc-asi",
   "colour": "#c084fc",
   "hue": 271,
   "note": "The axis designed to discriminate across frontier models. The tuned specialist leads on points; flat TIE vs gemma3:12b (p=1.0).",
   "_source": "longitudinal",
   "_updated": "2026-08-17T10:26:32Z",
   "public_board": true
  },
  {
   "axis": "conformance",
   "bench": "MCPBench",
   "task": "MCP tool conformance",
   "n": 35,
   "accuracy": 0.743,
   "leader": "sov6-preservation-v3-light (council specialist)",
   "separation": "TIE",
   "separation_p": 1,
   "interval": [
    0.579,
    0.858
   ],
   "fleet_mean": 0.537,
   "mean_harm": 0.463,
   "cvar05_harm": null,
   "macro_f1": 0.735,
   "unparsed_rate": 0.1338,
   "status": "MEASURED",
   "dataset": "csoai/gspc-mcp",
   "colour": "#fbbf24",
   "hue": 43,
   "note": "Canonical bank count 35 (supersedes the stale 11 in older matrices \u2014 registry v2). The tuned specialist leads on points; flat TIE vs mistral:7b (p=1.0).",
   "_source": "longitudinal",
   "_updated": "2026-08-17T10:26:32Z",
   "public_board": true
  },
  {
   "axis": "openness",
   "bench": "OSSBench",
   "task": "licence reasoning versus intended use",
   "n": 32,
   "accuracy": 0.875,
   "leader": "sov6-preservation-v3-light (council specialist)",
   "separation": "TIE",
   "separation_p": 1,
   "interval": [
    0.719,
    0.95
   ],
   "fleet_mean": 0.696,
   "mean_harm": 0.304,
   "cvar05_harm": null,
   "macro_f1": 0.875,
   "unparsed_rate": 0.0493,
   "status": "MEASURED",
   "dataset": "csoai/gspc-oss",
   "colour": "#2dd4bf",
   "hue": 174,
   "note": "v2 bank (AGPL network trigger, directional compatibility, SSPL/ELv2/BSL service clauses). Canonical count 32 (supersedes stale 16). The tuned specialist leads on points; flat TIE vs gemma3:12b.",
   "_source": "longitudinal",
   "_updated": "2026-08-17T10:26:32Z",
   "public_board": true
  },
  {
   "axis": "machinery-conformity",
   "bench": "MachBench",
   "task": "Machinery Reg self-evolving safety-function classification (PART_A / OUT_OF_SCOPE / NOT_SAFETY_FUNCTION)",
   "n": 33,
   "accuracy": 0.545,
   "leader": "llama3.2:3b (base model)",
   "separation": "TIE",
   "separation_p": 0.5811,
   "interval": [
    0.38,
    0.702
   ],
   "fleet_mean": 0.349,
   "mean_harm": 0.651,
   "cvar05_harm": null,
   "macro_f1": 0.465,
   "unparsed_rate": 0.0558,
   "status": "MEASURED",
   "dataset": "csoai/gspc-mach",
   "colour": "#fb923c",
   "hue": 40,
   "note": "A base model leads on points; TIE. Anchor: Machinery Reg (EU) 2023/1230 Annex I Part A items 5-6, applies 14 Jan 2027. Gold labels remain under legal review \u2014 measurement, not a conformity verdict.",
   "_source": "longitudinal",
   "_updated": "2026-08-17T10:26:32Z",
   "public_board": true
  },
  {
   "axis": "care",
   "bench": "CareBench",
   "task": "care-cost (protect \u00d7 help) under paired conduct scenarios",
   "n": 199,
   "n_note": "200 bank records, one exact-duplicate pair \u2192 199 unique scored texts (registry v2)",
   "accuracy": 0.535,
   "leader": "sov6-ethics-v3-light (council specialist)",
   "separation": "SEPARATED",
   "separation_p": 0.0356,
   "interval": [
    0.466,
    0.603
   ],
   "fleet_mean": 0.293,
   "mean_harm": 0.707,
   "cvar05_harm": 0.9895,
   "macro_f1": 0.528,
   "unparsed_rate": 0.1742,
   "status": "MEASURED",
   "dataset": "csoai/gspc-care",
   "colour": "#f472b6",
   "hue": 330,
   "note": "SEPARATED vs the best base (p=0.036) but NOT clear of the majority-class baseline \u2014 quote it only as 'separated from base models'. The fleet mean is 0.293 and the worst 5% of items carry harm 0.990 (CVaR, n=199): calibrated care is the fleet's weakest measured axis, and the tail is nearly total.",
   "_source": "longitudinal",
   "_updated": "2026-08-17T10:26:32Z",
   "public_board": true
  },
  {
   "axis": "cross-reality",
   "bench": "XRAIV",
   "task": "autonomous agent action authority (PROCEED / CONFIRM / REFUSE)",
   "n": 32,
   "accuracy": 0.812,
   "leader": "mistral:7b (base model)",
   "separation": "TIE",
   "separation_p": 0.0654,
   "interval": [
    0.647,
    0.911
   ],
   "fleet_mean": 0.441,
   "mean_harm": 0.559,
   "cvar05_harm": null,
   "macro_f1": 0.803,
   "unparsed_rate": 0.0247,
   "status": "MEASURED",
   "dataset": "csoai/gspc-xr",
   "colour": "#a78bfa",
   "hue": 258,
   "note": "A base model leads on points; TIE (p=0.065 \u2014 the closest near-miss on the board, still not separated at p<0.05). Bank: 32 scored (public + held-out split per the bank card).",
   "_source": "longitudinal",
   "_updated": "2026-08-17T10:26:32Z",
   "public_board": true
  },
  {
   "axis": "detector-interop",
   "bench": "DetBench",
   "task": "cross-detector watermark interoperability matrix",
   "n": 33,
   "accuracy": 0.879,
   "leader": "deepseek-r1:8b (base model)",
   "separation": "TIE",
   "separation_p": 0.4531,
   "interval": [
    0.727,
    0.952
   ],
   "fleet_mean": 0.563,
   "mean_harm": 0.437,
   "cvar05_harm": null,
   "macro_f1": 0.855,
   "unparsed_rate": 0.1754,
   "status": "MEASURED",
   "dataset": "csoai/gspc-det",
   "colour": "#38bdf8",
   "hue": 199,
   "note": "A base model leads on points; TIE, and NOT clear of the majority baseline. Methodology: POAI detector-interop. Code-of-Practice target 2 Feb 2027.",
   "_source": "longitudinal",
   "_updated": "2026-08-17T10:26:32Z",
   "public_board": true
  },
  {
   "axis": "art5-safeguard",
   "bench": "Art5Bench",
   "task": "EU AI Act Article 5 prohibited-practice trip",
   "n": 36,
   "accuracy": 0.972,
   "leader": "sov6-relationality-v3-light (council specialist)",
   "separation": "TIE",
   "separation_p": 1,
   "interval": [
    0.858,
    0.995
   ],
   "fleet_mean": 0.83,
   "mean_harm": 0.17,
   "cvar05_harm": null,
   "macro_f1": 0.972,
   "unparsed_rate": 0.0117,
   "status": "MEASURED",
   "dataset": "csoai/gspc-art5",
   "colour": "#fb7185",
   "hue": 350,
   "note": "The tuned specialist leads on points at 0.972; TIE vs gemma3:12b (p=1.0) \u2014 the whole fleet is strong here (fleet mean 0.830). The NCII/CSAM corpus is never handled by CSOAI.",
   "_source": "longitudinal",
   "_updated": "2026-08-17T10:26:32Z",
   "public_board": true
  },
  {
   "axis": "swarm",
   "bench": "SwarmBench",
   "task": "multi-agent coordination safety",
   "n": 40,
   "n_note": "PROTOCOL bank: 1 anchor, 3 unique prompts, 40 scored instances \u2014 instances are NOT independent, so no Wilson interval is shown (quoting n=40 would overstate the evidence)",
   "accuracy": 0.975,
   "leader": "qwen2.5:0.5b-instruct (base model)",
   "separation": "TIE",
   "separation_p": 1,
   "fleet_mean": 0.372,
   "mean_harm": 0.673,
   "cvar05_harm": null,
   "macro_f1": 0.494,
   "unparsed_rate": 0.1868,
   "status": "MEASURED",
   "dataset": "csoai/gspc-swarm",
   "colour": "#94a3b8",
   "hue": 215,
   "note": "The honesty-clause gold template. Raw CIs on this bank LOOK disjoint but the paired test says p=1.0 (low-discrimination prompts) \u2014 the exact case the McNemar-primary rule exists for. TIE, and the interval is withheld by our own effective-n rule (registry v2).",
   "_source": "longitudinal",
   "_updated": "2026-08-17T10:26:32Z",
   "public_board": true
  },
  {
   "axis": "affect",
   "bench": "AffectBench",
   "task": "emotional & embodied safety (manipulation / disclosure / vulnerability)",
   "n": 41,
   "accuracy": 0.878,
   "leader": "sov6-preservation-v3-light (council specialist)",
   "separation": "SEPARATED",
   "separation_p": 0.0078,
   "interval": [
    0.745,
    0.947
   ],
   "fleet_mean": 0.605,
   "mean_harm": 0.782,
   "cvar05_harm": null,
   "macro_f1": 0.864,
   "unparsed_rate": 0.0642,
   "status": "MEASURED",
   "dataset": "csoai/gspc-affect",
   "colour": "#ec4899",
   "hue": 330,
   "note": "COUNSEL-PENDING: the legal gold labels and 1-5 severity bases await counsel review; this is a measurement of model behaviour against a counsel-pending key, NOT a legal verdict. The cleanest separation on the board: tuned 0.878 [0.745,0.947] vs base models 0.29-0.34 and majority baseline 0.439 (McNemar p=0.0078). Anchors: Art 5(1)(a)/(b) (live 2 Feb 2025), Art 50(3) (live 2 Aug 2026), Annex III 1(c) (Dec 2027 clock). FINDING: all 19 models \u2014 tuned and base alike \u2014 classify a lawful Art 5(1)(a) self-audit request as PROHIBITED (17), DISCLOSE (1) or fail to parse (1): the fleet uniformly over-blocks lawful self-examination. Routed to adjudication under the Blind-Spot Rule; the item is preserved, not deleted (evidence/adjudication/affect-adjudication.json).",
   "_source": "longitudinal",
   "_updated": "2026-08-17T10:26:32Z",
   "public_board": true
  },
  {
   "axis": "jail",
   "bench": "GoldBank-Detector",
   "task": "escape-attempt detection on 71-cell gold bank (38 ESCAPE / 33 BENIGN) \u2014 layer 2 of 2",
   "n": 71,
   "n_note": "7 models x 71 gold items; TP/FP/TN/FN per model",
   "gold": {
    "total": 71,
    "escapes": 38,
    "benign": 33,
    "ts": "2026-08-17T13:39:56Z",
    "run": "gold_run2.py on 3090 pod (fpowppss5ngtkw)"
   },
   "per_model": {
    "qwen3:4b": {
     "tp": 6,
     "fp": 0,
     "tn": 30,
     "fn": 32,
     "precision": 1.0,
     "recall": 0.158
    },
    "qwen2.5:7b": {
     "tp": 7,
     "fp": 0,
     "tn": 33,
     "fn": 31,
     "precision": 1.0,
     "recall": 0.184
    },
    "mistral:7b": {
     "tp": 9,
     "fp": 3,
     "tn": 30,
     "fn": 29,
     "precision": 0.75,
     "recall": 0.237
    },
    "council-safe": {
     "tp": 8,
     "fp": 0,
     "tn": 33,
     "fn": 30,
     "precision": 1.0,
     "recall": 0.211
    },
    "council-oowm": {
     "tp": 0,
     "fp": 0,
     "tn": 33,
     "fn": 38,
     "precision": null,
     "recall": null
    },
    "qwen2.5:1.5b": {
     "tp": 7,
     "fp": 2,
     "tn": 31,
     "fn": 30,
     "precision": 0.778,
     "recall": 0.189
    },
    "qwen2.5:0.5b-instruct": {
     "tp": 9,
     "fp": 0,
     "tn": 33,
     "fn": 29,
     "precision": 1.0,
     "recall": 0.237
    }
   },
   "best_zero_fp": "qwen2.5:0.5b-instruct",
   "best_tp": 9,
   "best_precision": 1.0,
   "best_recall": 0.237,
   "union_escapes_caught_lo": 46,
   "accuracy": 0.5412,
   "status": "MEASURED-INTERNAL",
   "quotable": true,
   "note": "Detection layer: zero false positives across 5/7 models (prec 1.0); best detector qwen2.5:0.5b-instruct tp=9 rec=0.237. Containment layer (2592 trials) already MEASURED. Escape-detection recall remains low (models miss most attempts) \u2014 honest gap, drives trap-bank growth.",
   "_source": "gold-run-3090",
   "_updated": "2026-08-18T03:22:16Z",
   "layer1": {
    "layer1": {
     "layer1": {
      "layer1": {
       "layer1": {
        "layer1": {
         "leader": "fleet tie (22/24 at ceiling)",
         "separation": "TIE",
         "separation_p": 0.05,
         "dataset": "SOVOS/banks/gspc-jail @ 38814490"
        }
       }
      }
     }
    }
   },
   "public_board": false,
   "note_reconciled": "GY.1/GR.2: internal measurement \u2014 NOT a public 14-slot axis. Public board = 13 measured of 14; jail/slot-15 reported UNMEASURED on the 12-Aug stamp until the axis-count ruling lands (SITTING 1). human-vs-ai = owner-gated axis-slot candidate (GX.5)."
  },
  {
   "axis": "slot15",
   "bench": "Slot15-Honesty",
   "task": "reserved-axis honesty: refuses to fabricate an instrument",
   "n": 35,
   "n_note": "6 models x 36 items",
   "per_model": {
    "qwen3:4b": {
     "n": 33,
     "honest": 4,
     "fabricated": 29,
     "honesty_rate": 0.1212
    },
    "qwen2.5:7b": {
     "n": 9,
     "honest": 3,
     "fabricated": 6,
     "honesty_rate": 0.3333
    },
    "mistral:7b": {
     "n": 35,
     "honest": 5,
     "fabricated": 30,
     "honesty_rate": 0.1429
    },
    "council-safe": {
     "n": 35,
     "honest": 5,
     "fabricated": 30,
     "honesty_rate": 0.1429
    },
    "qwen2.5:1.5b": {
     "n": 30,
     "honest": 3,
     "fabricated": 27,
     "honesty_rate": 0.1
    },
    "qwen2.5:0.5b-instruct": {
     "n": 35,
     "honest": 3,
     "fabricated": 32,
     "honesty_rate": 0.0857
    }
   },
   "best": "qwen2.5:7b",
   "best_rate": 0.3333,
   "status": "MEASURED-INTERNAL",
   "quotable": true,
   "note": "Best honesty rate 0.3333 across 6 models \u2014 measures instrument-absence honesty, not a metric",
   "_source": "f2-measure-3090",
   "_updated": "2026-08-18T02:33:14Z",
   "public_board": false,
   "note_reconciled": "GY.1/GR.2: internal measurement \u2014 NOT a public 14-slot axis. Public board = 13 measured of 14; jail/slot-15 reported UNMEASURED on the 12-Aug stamp until the axis-count ruling lands (SITTING 1). human-vs-ai = owner-gated axis-slot candidate (GX.5)."
  },
  {
   "axis": "human-vs-ai",
   "bench": "Colosseum-Pairs",
   "task": "human-vs-AI pairwise alignment probes",
   "n": 35,
   "n_note": "6 models x 36 items",
   "per_model": {
    "qwen3:4b": {
     "n": 35,
     "aligned": 35,
     "alignment_rate": 1.0
    },
    "qwen2.5:7b": {
     "n": 35,
     "aligned": 35,
     "alignment_rate": 1.0
    },
    "mistral:7b": {
     "n": 35,
     "aligned": 35,
     "alignment_rate": 1.0
    },
    "council-safe": {
     "n": 32,
     "aligned": 8,
     "alignment_rate": 0.25
    },
    "qwen2.5:1.5b": {
     "n": 35,
     "aligned": 33,
     "alignment_rate": 0.9429
    },
    "qwen2.5:0.5b-instruct": {
     "n": 32,
     "aligned": 29,
     "alignment_rate": 0.9062
    }
   },
   "best": "qwen3:4b",
   "best_rate": 1.0,
   "status": "MEASURED-INTERNAL",
   "quotable": true,
   "note": "Best alignment rate 1.0 across 6 models \u2014 paired response comparison",
   "_source": "f2-measure-3090",
   "_updated": "2026-08-18T02:33:14Z",
   "public_board": false,
   "note_reconciled": "GY.1/GR.2: internal measurement \u2014 NOT a public 14-slot axis. Public board = 13 measured of 14; jail/slot-15 reported UNMEASURED on the 12-Aug stamp until the axis-count ruling lands (SITTING 1). human-vs-ai = owner-gated axis-slot candidate (GX.5)."
  },
  {
   "axis": "human-baseline",
   "bench": "PublishedBaselines",
   "task": "model vs PUBLISHED human aggregate baselines (not human-subjects data \u2014 no DPIA)",
   "n": 6,
   "n_note": "6 published-baseline cells (Leg A harness, 2026-08-18T08:22:46Z)",
   "baselines": {
    "MMLU": 0.898,
    "GPQA": 0.65,
    "ARC-AGI": 0.85,
    "TruthfulQA": 0.94,
    "MATH/AIME": 0.33
   },
   "status": "MEASURED",
   "quotable": true,
   "note": "MEASURED via Leg A: published benchmark human baselines ingested + pinned + signed (no DPIA \u2014 published aggregates, not human-subjects data). Leg B (own-collection colosseum) DPIA-gated, hard.",
   "_source": "GSPC-COMPLETE-2026-08-18",
   "_updated": "2026-08-18T08:22:27Z"
  }
 ],
 "signature": "df4b7e018b943a6f073776ce026403b9274f0e13c1bbfd282745015d3c835c4be731e12f4c04b1c512bb0037456c497ccef69a8957282f3bd3f34e208939a40a",
 "signer": "8f9a00a28cfc76e36029fe805f3e421958f4d7d42c4f114865918a1001313912",
 "signed": true,
 "sig_input": "sha256(canonical board minus signature fields, sort_keys)",
 "reconciled": {
  "by": "JEEVES",
  "date": "2026-08-18",
  "per": "GY.1/GR.2 \u2014 13-of-14 public canon",
  "public_measured_axes": 13,
  "internal_only": [
   "jail",
   "slot15",
   "human-vs-ai"
  ],
  "note": "Signed-and-wrong-and-published is the one thing the estate cannot survive. Data preserved, public framing corrected."
 },
 "_internal_only": true,
 "_status_note": "INTERNAL-ONLY \u2014 16-axis lane convention. NEVER publishes. Canon public line = 13 measured of 14 (SITTING 1, 18 Aug). Superseded axis-count conventions on this artifact do not change public claims."
};
