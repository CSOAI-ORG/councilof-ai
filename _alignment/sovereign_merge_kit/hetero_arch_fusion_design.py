#!/usr/bin/env python3
"""hetero_arch_fusion_design.py — Design the heterogeneous-architecture fusion test.

This is the LANE-CROSSING test:
  - Hermes/Jeeves: DESIGN (what to test, what metrics, what failure modes)
  - Claude Science: EXECUTE (run it on Modal T4 with their setup)

Per sibling's TIES finding: same-base 3-around-1 does NOT emerge (proven).
The untested hypothesis: DIFFERENT-architecture 3-around-1 WILL emerge.

Architecture choices for the test (hermes design):
  - OWEM slot 1: Qwen2.5-0.5B + our LoRA (we have this on disk)
  - OWEM slot 2: Mamba/SSM (use sibling's KDA probe as starting point)
  - OWEM slot 3: A SMALL true MoE (use Apache 2.0 MoE, e.g. Mixtral-8x7B distilled to 0.5B)

Per sibling: TIES for same-base was 2.9095. We expect heterogeneous to be:
  - Higher than TIES-same-base (more architectural diversity = more decorrelated)
  - Lower than best-single-expert if it doesn't emerge
  - UNKNOWN if it actually emerges (this is what we're testing)

This script doesn't EXECUTE the test - it DESIGNS it.
The actual Modal run is claude science lane.
"""
import json
from pathlib import Path

REPO = Path("/Users/nicholas/clawd")

# Read sibling's existing KDA probe to understand what they have
kda_path = REPO / "_alignment/sovereign_merge_kit/kda_decorr_results.json"
with open(kda_path) as f:
    kda_results = json.load(f)

# Read our OWEM eval
sov3_path = REPO / "_alignment/sovereign_merge_kit/models/sov3_student_adapter/eval24_scorecard.json"
with open(sov3_path) as f:
    sov3_scorecard = json.load(f)

# Design the test
design = {
    "version": "v1_hetero_arch_fusion_design_2026-07-18",
    "lane": "hermes_designs_claude_science_executes",
    "purpose": "Design the heterogeneous-architecture fusion test (sibling's TIES finding showed same-base 3-around-1 does NOT emerge; test if DIFFERENT-arch DOES)",

    "context_from_sibling": {
        "ties_same_base_finding": {
            "ties_fused_loss": 2.9095,
            "naive_avg_loss": 2.9965,
            "best_single_loss": 2.9087,
            "verdict": "TIES > naive (no collapse) BUT ~= best-single (no emergence at same-base scale)",
        },
        "kda_probe_finding": {
            "transformer_acc": 1.0,
            "ssm_acc": 0.358,
            "kda_acc": 0.361,
            "rho_ssm_kda": 0.82,
            "verdict": "SSM and KDA are SAME family (rho=0.82), not decorrelated",
        },
    },

    "heterogeneous_architecture_test_design": {
        "three_owems_needed": [
            {
                "slot": 1,
                "arch": "Dense Transformer",
                "candidate": "Qwen2.5-0.5B + sov3_student_adapter (we have this)",
                "layer_role": "alignment / governance (LoRA-trained on 113 pairs)",
                "ready": True,
                "source_path": "_alignment/sovereign_merge_kit/models/sov3_student_adapter",
            },
            {
                "slot": 2,
                "arch": "Linear-attention (KDA-family)",
                "candidate": "Need a small KDA model. Sibling's KDA probe was 234K params, toy scale.",
                "layer_role": "serving cost / long-context",
                "ready": False,  # need to build
                "source_lane": "claude_science - they have sov33_kda_decorr_probe.py",
            },
            {
                "slot": 3,
                "arch": "True MoE (Apache 2.0)",
                "candidate": "Mixtral-8x7B distilled to 0.5B equivalent (Apache 2.0)",
                "layer_role": "capacity / routing",
                "ready": False,  # need to find/distill
                "candidate_alt": "Use a small open MoE - check Qwen MoE, OLMoE, etc.",
            },
        ],
        "expected_outcome": {
            "if_emerges": "SOV4 King can govern 3 decorrelated architectures → emergence story",
            "if_no_emergence": "SOV4 needs OUTPUT ENSEMBLE (not weight-merge) → return to sibling's path",
            "if_collapse": "Some architectures are incompatible → revert to TIES for inference only",
        },
        "metric_to_measure": {
            "primary": "held-out loss on governance bench (24 prompts)",
            "secondary": "care-floor pass rate on the 30-prompt sovereign-bench-30",
            "honest_register": "Sibling already proved same-base no emergence. We need to MEASURE whether heterogeneous changes this.",
        },
    },

    "execution_plan_claude_science_lane": {
        "step_1": "Locate + download a small Apache 2.0 MoE model (slot 3)",
        "step_2": "Train slot 2 (linear-attn KDA) to convergence on governance corpus",
        "step_3": "Output-fuse 3 architectures (not weight-fuse): route prompt to all 3, combine via care-gated ensemble",
        "step_4": "Measure emergence on governance bench (compare to TIES-same-base 2.9095)",
        "step_5": "If emerges: integrate into SOV4 King (3-arch federation)",
        "compute": "$5-10 Modal T4",
        "time_estimate": "4-8 hours of sibling execution",
    },

    "what_hermes_will_consume": {
        "schema_provided": [
            "Care-floor 0.95 (already live)",
            "SIGIL Ed25519 per response (already live)",
            "Sovereign binding CSOAI Ltd UK 16939677 (already live)",
            "4 venturi throats (care / fusion / routing / binding) (already live)",
        ],
        "schema_needed": [
            "Multi-architecture federation contract (input/output across 3 different arch types)",
            "Care-floor aggregation when 3 different brains respond",
            "SIGIL across multi-architecture outputs (chain of sigils, one per brain)",
        ],
    },

    "lane_respect": {
        "hermes_designs": True,
        "claude_science_executes": True,
        "no_duplicate_compute": "Sibling already ran same-base TIES - this is the heterogeneous NEXT test",
        "no_claim_without_data": "We do NOT claim heterogeneous WILL emerge. We test whether it does.",
    },

    "context_from_our_side": {
        "sov3_student_eval": {
            "tuned_grounded": sov3_scorecard.get("tuned_grounded", "?"),
            "tuned_rate": sov3_scorecard.get("tuned_rate", "?"),
            "n_prompts": sov3_scorecard.get("n_prompts", 24),
        },
        "kda_probe_honest_negative": "Sibling showed transformer > linear at toy scale. Our kernel (EAT-767) is mechanism-test only, not capability claim.",
    },

    "honest_pins": [
        "Same-base TIES no-emergence: PROVEN by sibling (2.9095 vs 2.9087)",
        "Heterogeneous emergence: HYPOTHESIS, untested",
        "TIES-mechanism: WORKS for inference compression, not for emergence",
        "Per-model T counts: NEVER summed",
        "Modal T4 cost: ~$5-10 total for this test",
    ],

    "delivery_format": "This file is the DESIGN SPEC. Claude Science runs the actual test and reports the result. We update the architecture matrix when measurement lands.",
}

# Save
out = REPO / "_alignment/sovereign_merge_kit/hetero_arch_fusion_design.json"
out.write_text(json.dumps(design, indent=2))
print(f"OK design spec saved: {out.relative_to(REPO)}")
print(f"  lane: {design['lane']}")
print(f"  step_1: {design['execution_plan_claude_science_lane']['step_1']}")
print()
print("HERMES DESIGNS - CLAUDE SCIENCE EXECUTES")
print()
print("Slot 1 (we have): Qwen2.5-0.5B + sov3_student_adapter")
print("Slot 2 (claude science): KDA linear-attn model")
print("Slot 3 (claude science): Apache 2.0 MoE")
print()
print("HONEST: we do NOT claim heterogeneous WILL emerge.")
print("        sibling's TIES finding (same-base no emergence) is the open hypothesis to test.")
print(f"        cost: ${design['execution_plan_claude_science_lane']['compute']}")
print(f"        time: {design['execution_plan_claude_science_lane']['time_estimate']}")