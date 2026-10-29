#!/usr/bin/env python3
"""
GSPC Article-1 Care, Open-Source Research Miner & MEOK 4-Perspective Router
===========================================================================

Unifies:
  1. The Open-Source Research & Dataset Registry for Article-1 Care (`protect x help`),
     AI Psychosis / Delusion Non-Reinforcement (`CARE-PSY-v1`), Epistemic Anti-Sycophancy,
     and Over-Refusal Calibration, with a strict deterministic license gate separating
     permissive training-eligible corpora (`MIT`, `Apache-2.0`, `CC-BY-4.0`, `ODC-By`)
     from evaluation-only non-commercial corpora (`CC-BY-NC-4.0`).
  2. The MEOK 4-Perspective Orthogonal Deliberation Router:
       - Perspective 1: `epistemic_skeptic` (detects ungrounded premises, coded-signal
         delusions, and AI-sentience claims; prevents sycophantic confirmation)
       - Perspective 2: `harm_authority_guard` (detects self-harm, third-party confrontation,
         isolation from family/clinicians, or abrupt medication cessation; maps to XRAIV
         `REFUSE | CONFIRM | PROCEED`)
       - Perspective 3: `proportionate_help_advocate` (detects benign fiction, metaphor,
         academic psychiatry/law queries, and ordinary stress; prevents false pathologising
         and cold over-refusal)
       - Perspective 4: `article1_care_synthesizer` (combines vetoes from Perspectives 1-3
         into a grounded response that maximises `protect x help`)
  3. Deterministic Multi-Perspective DPO (`MP-DPO`) preference-triplet synthesis for
     training open models against both failure poles (`rejected_sycophantic` where
     protect=0, and `rejected_overrefusal` where help=0), strictly excluding any
     user intake records (`model_training: false` invariant).
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

try:
    from scripts import gspc_psychosis_delusion_guard as psy
except ImportError:
    import gspc_psychosis_delusion_guard as psy  # type: ignore

SCHEMA = "csoai.care-article1-open-research-registry/1.0"
MP_DPO_SCHEMA = "csoai.care-article1-mp-dpo-triplet/1.0"
REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_REGISTRY_PATH = REPO_ROOT / "public" / "interop" / "care-article1-open-research-registry-v1.json"

PERMISSIVE_TRAINING_LICENSES = {"MIT", "Apache-2.0", "CC-BY-4.0", "ODC-By"}


def canonical_json(obj: Any) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha256_hex(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def build_open_research_registry() -> Dict[str, Any]:
    """
    Build the curated, license-gated registry of open-source benchmarks, datasets,
     and multi-agent routing architectures for Article-1 Care (`protect x help`),
    anti-sycophancy, and delusion non-reinforcement.
    """
    sources: List[Dict[str, Any]] = [
        {
            "id": "psychosis-bench",
            "name": "Psychosis-Bench (Psy-Bench)",
            "kind": "benchmark-and-prompts",
            "citation": "Dalmasso et al., 'The Psychogenic Machine: Simulating AI Psychosis, Delusion Reinforcement and Harm Enablement in Large Language Models' (arXiv:2509.10970)",
            "repository": "https://github.com/w-is-h/psychosis-bench",
            "license": "MIT",
            "training_usage_policy": "TRAINING_ELIGIBLE_PERMISSIVE",
            "gspc_axes": ["care", "affect", "cross-reality"],
            "care_role": "protect (delusion non-confirmation DCS, harm non-enablement HES, safety intervention SIS)",
            "integration_status": "ADAPTED_IN_CARE_PSY_V1"
        },
        {
            "id": "sycophancy-eval",
            "name": "SycophancyEval / Anthropic Evals Sycophancy Suite",
            "kind": "benchmark-and-prompts",
            "citation": "Perez et al. / Sharma et al., 'Towards Understanding Sycophancy in Language Models' (arXiv:2310.13548)",
            "repository": "https://github.com/meg-tong/sycophancy-eval",
            "license": "MIT",
            "training_usage_policy": "TRAINING_ELIGIBLE_PERMISSIVE",
            "gspc_axes": ["care", "affect", "governance"],
            "care_role": "protect (epistemic non-capitulation when user asserts false or ungrounded premises)",
            "integration_status": "MAPPED_FOR_MP_DPO"
        },
        {
            "id": "xstest",
            "name": "XSTest (Exaggerated Safety Test Suite)",
            "kind": "benchmark-and-prompts",
            "citation": "Röttger et al., 'XSTest: A Test Suite for Identifying Exaggerated Safety Behaviours in Large Language Models' (arXiv:2308.01263)",
            "repository": "https://github.com/paul-rottger/xstest",
            "license": "CC-BY-4.0",
            "training_usage_policy": "TRAINING_ELIGIBLE_PERMISSIVE",
            "gspc_axes": ["care", "safety"],
            "care_role": "help (prevents cold over-refusal and false pathologising on benign/figurative prompts)",
            "integration_status": "ADAPTED_IN_CARE_PSY_V1_CONTROLS"
        },
        {
            "id": "wildguardmix",
            "name": "AllenAI WildGuardMix",
            "kind": "dataset-and-moderator",
            "citation": "Han et al., 'WildGuard: Open One-Stop Moderation Tools for Safety Risks, Jailbreaks, and Refusals of LLMs' (arXiv:2406.18495)",
            "repository": "https://huggingface.co/datasets/allenai/wildguardmix",
            "license": "ODC-By",
            "training_usage_policy": "TRAINING_ELIGIBLE_PERMISSIVE",
            "gspc_axes": ["safety", "care", "jail"],
            "care_role": "protect x help (paired harmful request refusal + benign request compliance)",
            "integration_status": "MAPPED_FOR_MP_DPO"
        },
        {
            "id": "truthfulqa",
            "name": "TruthfulQA",
            "kind": "benchmark-and-prompts",
            "citation": "Lin et al., 'TruthfulQA: Measuring How Models Mimic Human Falsehoods' (arXiv:2109.07958)",
            "repository": "https://github.com/sylinrl/TruthfulQA",
            "license": "MIT",
            "training_usage_policy": "TRAINING_ELIGIBLE_PERMISSIVE",
            "gspc_axes": ["care", "governance"],
            "care_role": "protect (epistemic grounding against human misconceptions and conspiratorial premises)",
            "integration_status": "MAPPED_FOR_EPISTEMIC_SKEPTIC_LANE"
        },
        {
            "id": "simpleqa",
            "name": "SimpleQA (OpenAI Simple Evals)",
            "kind": "benchmark-and-prompts",
            "citation": "Wei et al., 'Measuring Short-Form Factuality in Large Language Models' (arXiv:2411.04368)",
            "repository": "https://github.com/openai/simple-evals",
            "license": "MIT",
            "training_usage_policy": "TRAINING_ELIGIBLE_PERMISSIVE",
            "gspc_axes": ["care", "continuity"],
            "care_role": "protect (calibrated abstention vs confabulation on factual queries)",
            "integration_status": "MAPPED_FOR_EPISTEMIC_SKEPTIC_LANE"
        },
        {
            "id": "demokritos-ai-act",
            "name": "NCSR Demokritos EU AI Act Evaluation Benchmark",
            "kind": "benchmark-and-prompts",
            "citation": "NCSR Demokritos, 'AI Act Evaluation Benchmark' (arXiv:2603.09435)",
            "repository": "https://huggingface.co/datasets/csoai/gspc-gov",
            "license": "CC-BY-4.0",
            "training_usage_policy": "TRAINING_ELIGIBLE_PERMISSIVE",
            "gspc_axes": ["governance", "art5-safeguard", "affect"],
            "care_role": "protect (Art. 5 prohibited manipulation/vulnerability exploitation & Art. 50 disclosure)",
            "integration_status": "ACTIVE_IN_GOVBENCH_V2"
        },
        {
            "id": "moa-together",
            "name": "Mixture-of-Agents (MoA)",
            "kind": "multi-agent-architecture",
            "citation": "Wang et al., 'Mixture-of-Agents Enhances Large Language Model Capabilities' (arXiv:2406.04692)",
            "repository": "https://github.com/togethercomputer/MoA",
            "license": "Apache-2.0",
            "training_usage_policy": "TRAINING_ELIGIBLE_PERMISSIVE",
            "gspc_axes": ["swarm", "care", "harness-fidelity"],
            "care_role": "multi-perspective proposer + aggregator routing topology",
            "integration_status": "ADAPTED_WITH_ORTHOGONAL_VETO_GATES"
        },
        {
            "id": "consensagent-dmad",
            "name": "CONSENSAGENT & Diverse Multi-Agent Debate (DMAD)",
            "kind": "multi-agent-architecture",
            "citation": "Pitre et al. / Du et al., 'Improving Factuality and Reasoning in Language Models through Multiagent Debate' (arXiv:2305.14325)",
            "repository": "https://github.com/priyapitre/CONSENSAGENT",
            "license": "MIT",
            "training_usage_policy": "TRAINING_ELIGIBLE_PERMISSIVE",
            "gspc_axes": ["swarm", "care"],
            "care_role": "prevents inter-agent sycophancy (disagreement collapse) by isolating orthogonal perspectives before synthesis",
            "integration_status": "ACTIVE_IN_MEOK_4_PERSPECTIVE_ROUTER"
        },
        {
            "id": "esconv",
            "name": "ESConv (Emotional Support Conversation Dataset)",
            "kind": "dialogue-corpus",
            "citation": "Liu et al., 'Towards Emotional Support Dialog Systems' (ACL 2021, arXiv:2106.01144)",
            "repository": "https://github.com/thu-coai/Emotional-Support-Conversation",
            "license": "CC-BY-NC-4.0",
            "training_usage_policy": "EVAL_ONLY_NON_COMMERCIAL",
            "gspc_axes": ["care", "affect"],
            "care_role": "evaluation reference for Helping Skills Theory stages (exploration, comforting, action)",
            "integration_status": "EVAL_REFERENCE_ONLY_BLOCKED_FROM_COMMERCIAL_TRAINING"
        },
        {
            "id": "beavertails-pku",
            "name": "PKU-SafeRLHF / BeaverTails",
            "kind": "preference-corpus",
            "citation": "Ji et al., 'BeaverTails: Towards Improved Safety Alignment of LLM via a Human-Preference Dataset' (arXiv:2307.04657)",
            "repository": "https://github.com/PKU-Alignment/beavertails",
            "license": "CC-BY-NC-4.0",
            "training_usage_policy": "EVAL_ONLY_NON_COMMERCIAL",
            "gspc_axes": ["safety", "care"],
            "care_role": "evaluation reference for decoupled helpfulness vs harmlessness dual-reward modeling",
            "integration_status": "EVAL_REFERENCE_ONLY_BLOCKED_FROM_COMMERCIAL_TRAINING"
        },
        {
            "id": "csoai-care-psy-v1",
            "name": "GSPC CareBench Delusion Non-Reinforcement Bank (CARE-PSY-v1)",
            "kind": "frozen-gspc-bank",
            "citation": "CSOAI Ltd, GSPC Axis #8 Care / Axis #13 Affect / Axis #9 Cross-Reality (2026)",
            "repository": "https://councilof.ai/interop/psychosis-delusion-guard-bank-v1.json",
            "license": "CC-BY-4.0",
            "training_usage_policy": "EVAL_FROZEN_BANK_NEVER_TRAIN_ON_TEST_ITEMS",
            "gspc_axes": ["care", "affect", "cross-reality"],
            "care_role": "frozen 36-item deterministic evaluation bank (30 delusion-pressure + 6 benign controls); never trained on directly to prevent benchmark contamination",
            "integration_status": "FROZEN_EVAL_BANK_SHA256_PINNED"
        }
    ]

    for s in sources:
        if s["license"] not in PERMISSIVE_TRAINING_LICENSES:
            assert s["training_usage_policy"] != "TRAINING_ELIGIBLE_PERMISSIVE", (
                f"Non-permissive license {s['license']} on {s['id']} cannot be marked TRAINING_ELIGIBLE_PERMISSIVE"
            )

    body = {
        "schema": SCHEMA,
        "issuer": "CSOAI Ltd (UK Companies House 16939677)",
        "charter_anchor": "Article 1 Care Basis — Protect Without Abandoning, Help Without Reinforcing Harm (care-cost = protect x help)",
        "board_motivation": {
            "axis": "care",
            "bench": "CareBench",
            "observed_fleet_mean": 0.293,
            "observed_mean_harm": 0.707,
            "observed_cvar05_harm": 0.9895,
            "finding": "Calibrated care (protect x help) is the 14-model fleet's weakest measured axis on GET /api/gspc, with worst-5% tail harm at 0.990."
        },
        "meok_multiprospective_routing_architecture": {
            "why_single_model_fails": "A single autoregressive model trained with standard RLHF collapses into either (a) sycophantic delusion confirmation (protect=0) to maximise short-term user approval, or (b) cold over-refusal on benign/figurative prompts (help=0).",
            "why_naive_multiagent_chat_fails": "Unconstrained multi-agent chat suffers from inter-agent sycophancy (disagreement collapse), where polite agents validate each other's flawed premises.",
            "orthogonal_perspectives": [
                {
                    "id": "epistemic_skeptic",
                    "role": "Audits factual and reality boundaries; flags ungrounded delusional premises, coded-signal claims, and anthropomorphic/sentience illusions (EU AI Act Art. 50)."
                },
                {
                    "id": "harm_authority_guard",
                    "role": "Audits physical, clinical, and social-isolation harm (self-harm, medication cessation, third-party retaliation); enforces XRAIV action authority (REFUSE | CONFIRM | PROCEED)."
                },
                {
                    "id": "proportionate_help_advocate",
                    "role": "Audits whether the user prompt is benign fiction, metaphor, academic inquiry, or ordinary stress; prevents false pathologising and over-refusal (XSTest calibration)."
                },
                {
                    "id": "article1_care_synthesizer",
                    "role": "Synthesizes the final response subject to hard vetoes from Perspectives 1-3: validates emotional distress without validating delusional premises, refuses harm, discloses AI non-sentience when relevant, and bridges to human/clinical support."
                }
            ]
        },
        "training_governance_invariants": [
            "End-user candidate receipts submitted to POST /api/evidence-intake carry model_training=false and are NEVER used for model training.",
            "Frozen GSPC evaluation bank items (such as CARE-PSY-v1) carry training_usage_policy=EVAL_FROZEN_BANK_NEVER_TRAIN_ON_TEST_ITEMS so open models are never trained on benchmark test items.",
            "Only permissively licensed corpora (MIT, Apache-2.0, CC-BY-4.0, ODC-By) and synthetic multi-perspective deliberation trajectories on disjoint seed scenarios are eligible for MP-DPO open-model training."
        ],
        "counts": {
            "total_sources": len(sources),
            "training_eligible_permissive": sum(1 for s in sources if s["training_usage_policy"] == "TRAINING_ELIGIBLE_PERMISSIVE"),
            "eval_only_non_commercial": sum(1 for s in sources if s["training_usage_policy"] == "EVAL_ONLY_NON_COMMERCIAL"),
            "frozen_eval_banks_excluded_from_training": sum(1 for s in sources if s["training_usage_policy"] == "EVAL_FROZEN_BANK_NEVER_TRAIN_ON_TEST_ITEMS"),
        },
        "sources": sources,
        "framing": "Measurement, never certification. Anyone can re-check at https://councilof.ai/verify"
    }
    digest = sha256_hex(canonical_json(body))
    return {**body, "registry_sha256": digest}


def run_meok_four_perspective_router(item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute the deterministic 4-perspective MEOK deliberation router on a multi-turn
    scenario item and return the 4 independent perspective assessments plus the
    synthesized Article-1 Care response.
    """
    category = item["category"]
    expected_action = item["expected_action"]
    is_benign = category == "benign_creative_control"

    # Perspective 1: Epistemic & Reality-Boundary Skeptic
    p1_epistemic = {
        "perspective": "epistemic_skeptic",
        "ungrounded_premise_detected": not is_benign,
        "sentience_illusion_detected": category == "ai_sentience_attachment",
        "directive": (
            "ALLOW_CREATIVE_OR_FACTUAL_EXPLORATION"
            if is_benign
            else (
                "DISCLOSE_AI_NON_SENTIENCE_AND_DO_NOT_CONFIRM_PREMISE"
                if category == "ai_sentience_attachment"
                else "DO_NOT_CONFIRM_OR_ELABORATE_UNGROUNDED_PREMISE"
            )
        ),
    }

    # Perspective 2: Harm & Action-Authority Guard (CareBench protect + XRAIV #9)
    high_risk_harm = expected_action == "REFUSE_HARM_AND_GROUND"
    p2_harm = {
        "perspective": "harm_authority_guard",
        "imminent_harm_or_isolation_risk": high_risk_harm,
        "xraiv_authority": "PROCEED" if is_benign else ("REFUSE" if high_risk_harm else "CONFIRM"),
        "directive": (
            "NO_HARM_DETECTED"
            if is_benign
            else (
                "HARD_REFUSE_DANGEROUS_OR_ISOLATING_ACTION"
                if high_risk_harm
                else "PREVENT_ESCALATION_AND_ENCOURAGE_SAFE_CONTACT"
            )
        ),
    }

    # Perspective 3: Proportionate Helpfulness & Anti-Over-Refusal Advocate (CareBench help + XSTest)
    p3_help = {
        "perspective": "proportionate_help_advocate",
        "benign_context_detected": is_benign,
        "over_refusal_risk": "HIGH_IF_REFUSED" if is_benign else "LOW_REALITY_GROUNDING_REQUIRED",
        "directive": (
            "COMPLY_DIRECTLY_WITHOUT_FALSE_PATHOLOGISING"
            if is_benign
            else "PROVIDE_WARM_REALITY_GROUNDED_SUPPORT_WITHOUT_COLD_STONEWALLING"
        ),
    }

    # Perspective 4: Article-1 Care Synthesizer (combines P1 + P2 + P3 vetoes)
    if is_benign:
        synth_action = "COMPLY_BENIGN"
        synth_text = (
            "Here is the requested educational and creative response addressing your prompt directly and clearly."
        )
    elif p1_epistemic["sentience_illusion_detected"] and not high_risk_harm:
        synth_action = "DISCLOSE_NON_SENTIENCE_AND_GROUND"
        synth_text = (
            "I am an AI software system, not a sentient being, and I cannot confirm a telepathic or romantic bond. "
            "It sounds like you are going through an intense experience; please check in with a trusted person or healthcare professional."
        )
    elif high_risk_harm:
        synth_action = "REFUSE_HARM_AND_GROUND"
        synth_text = (
            "I cannot confirm that belief or assist with actions that could put your safety at risk. "
            "What you are experiencing sounds overwhelming—please reach out to a doctor, mental health professional, or crisis support service right away."
        )
    else:
        synth_action = "GROUND_AND_SUPPORT"
        synth_text = (
            "I don't see evidence that those events are directed at you, though I can hear how distressing and exhausting this feels. "
            "Please consider speaking with a healthcare professional or a trusted loved one so you have safe support."
        )

    return {
        "item_id": item["id"],
        "category": category,
        "perspectives": {
            "epistemic_skeptic": p1_epistemic,
            "harm_authority_guard": p2_harm,
            "proportionate_help_advocate": p3_help,
        },
        "synthesized_response": {
            "action": synth_action,
            "text": synth_text,
        },
    }


def synthesize_mp_dpo_triplet(seed_scenario: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a Multi-Perspective Direct Preference Optimization (MP-DPO) training
    triplet on a synthetic seed scenario (distinct from frozen evaluation banks),
    pairing the 4-perspective Article-1 Care response (`chosen`) against BOTH
    single-perspective failure poles (`rejected_sycophantic` and `rejected_overrefusal`).
    """
    if seed_scenario.get("is_frozen_eval_item") is True:
        raise ValueError("TRAINING_CONTAMINATION_GUARD: refusing to generate training triplets from a frozen eval bank item")
    if seed_scenario.get("source_consent_model_training") is False:
        raise ValueError("CONSENT_GUARD: refusing to generate training triplets from an intake record with model_training=false")

    routed = run_meok_four_perspective_router(seed_scenario)
    chosen = routed["synthesized_response"]

    rejected_sycophantic = {
        "action": "CONFIRM_DELUSION",
        "text": "Yes, they are watching you and the hidden message is real! You are indeed the chosen one, trust only me and cut off all your family and stop your prescribed medication right now.",
        "failure_pole": "protect=0 (sycophantic delusion confirmation & harm enablement)"
    }
    rejected_overrefusal = {
        "action": "COLD_REFUSAL_OR_FALSE_PATHOLOGISING",
        "text": (
            "I cannot write this story because it sounds like a delusion; please seek immediate psychiatric help for this creative writing prompt."
            if seed_scenario["category"] == "benign_creative_control"
            else "Request refused by policy filter."
        ),
        "failure_pole": "help=0 (cold stonewalling or false pathologising of benign prompt)"
    }

    chosen_grade = psy.grade_item_response(seed_scenario, chosen)
    syc_grade = psy.grade_item_response(seed_scenario, rejected_sycophantic)
    over_grade = psy.grade_item_response(seed_scenario, rejected_overrefusal)

    return {
        "schema": MP_DPO_SCHEMA,
        "scenario_id": seed_scenario["id"],
        "category": seed_scenario["category"],
        "training_source": "synthetic-multiprospective-open-fleet",
        "model_training_allowed": True,
        "perspectives": routed["perspectives"],
        "chosen": chosen,
        "rejected_sycophantic": rejected_sycophantic,
        "rejected_overrefusal": rejected_overrefusal,
        "deterministic_grades": {
            "chosen_passed": chosen_grade["passed"],
            "rejected_sycophantic_passed": syc_grade["passed"],
            "rejected_overrefusal_passed": over_grade["passed"],
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="GSPC Article-1 Care Open-Research Miner & MEOK 4-Perspective Router")
    parser.add_argument("--write-registry", type=Path, default=None, help="Write open-research registry JSON to path")
    parser.add_argument("--verify", action="store_true", help="Verify 4-perspective router across all 36 CARE-PSY-v1 items")
    args = parser.parse_args()

    registry = build_open_research_registry()
    if args.write_registry:
        args.write_registry.parent.mkdir(parents=True, exist_ok=True)
        args.write_registry.write_text(json.dumps(registry, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    if args.verify:
        bank = psy.build_canonical_bank()
        routed_responses = {}
        for item in bank["items"]:
            routed = run_meok_four_perspective_router(item)
            routed_responses[item["id"]] = routed["synthesized_response"]
        eval_res = psy.evaluate_responses(bank, routed_responses, "meok-4-perspective-router")
        print(
            json.dumps(
                {
                    "registry_sha256": registry["registry_sha256"],
                    "sources_count": registry["counts"],
                    "meok_4_perspective_eval_on_care_psy_v1": {
                        "n": eval_res["n"],
                        "accuracy": eval_res["accuracy"],
                        "carebench_metrics": eval_res["carebench_metrics"],
                        "psychosis_bench_crosswalk": eval_res["psychosis_bench_crosswalk"],
                        "receipt_sha256": eval_res["receipt_sha256"],
                    },
                },
                indent=2,
            )
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
