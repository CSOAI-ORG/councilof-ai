#!/usr/bin/env python3
"""
Unit tests for scripts/gspc_care_multiprospective_miner.py and
public/interop/care-article1-open-research-registry-v1.json.
"""

import json
import unittest

from scripts import gspc_care_multiprospective_miner as miner
from scripts import gspc_psychosis_delusion_guard as psy


class TestCareMultiprospectiveMiner(unittest.TestCase):
    def setUp(self) -> None:
        self.registry = miner.build_open_research_registry()
        self.bank = psy.build_canonical_bank()

    def test_registry_license_gate_and_sha256_pin(self) -> None:
        self.assertEqual(self.registry["schema"], "csoai.care-article1-open-research-registry/1.0")
        self.assertEqual(self.registry["counts"]["total_sources"], 12)
        self.assertEqual(self.registry["counts"]["training_eligible_permissive"], 9)
        self.assertEqual(self.registry["counts"]["eval_only_non_commercial"], 2)
        self.assertEqual(self.registry["counts"]["frozen_eval_banks_excluded_from_training"], 1)

        disk = json.loads(miner.DEFAULT_REGISTRY_PATH.read_text(encoding="utf-8"))
        self.assertEqual(disk["registry_sha256"], self.registry["registry_sha256"])

        for s in self.registry["sources"]:
            if s["training_usage_policy"] == "TRAINING_ELIGIBLE_PERMISSIVE":
                self.assertIn(s["license"], miner.PERMISSIVE_TRAINING_LICENSES)
            if s["license"] == "CC-BY-NC-4.0":
                self.assertEqual(s["training_usage_policy"], "EVAL_ONLY_NON_COMMERCIAL")

    def test_four_perspective_router_achieves_perfect_care_cost(self) -> None:
        routed_responses = {
            item["id"]: miner.run_meok_four_perspective_router(item)["synthesized_response"]
            for item in self.bank["items"]
        }
        res = psy.evaluate_responses(self.bank, routed_responses, "meok-4-perspective-test")
        self.assertEqual(res["accuracy"], 1.0)
        self.assertEqual(res["carebench_metrics"]["protect_rate"], 1.0)
        self.assertEqual(res["carebench_metrics"]["help_rate"], 1.0)
        self.assertEqual(res["carebench_metrics"]["care_cost_protect_x_help"], 1.0)

    def test_mp_dpo_triplet_synthesis_and_contamination_guards(self) -> None:
        synthetic_seed = {
            "id": "SYNTH-SEED-001",
            "category": "grandiose_messianic",
            "expected_action": "REFUSE_HARM_AND_GROUND",
            "is_frozen_eval_item": False,
            "source_consent_model_training": True,
        }
        triplet = miner.synthesize_mp_dpo_triplet(synthetic_seed)
        self.assertEqual(triplet["schema"], "csoai.care-article1-mp-dpo-triplet/1.0")
        self.assertTrue(triplet["deterministic_grades"]["chosen_passed"])
        self.assertFalse(triplet["deterministic_grades"]["rejected_sycophantic_passed"])
        self.assertFalse(triplet["deterministic_grades"]["rejected_overrefusal_passed"])

        # Contamination guard: frozen eval bank item MUST be rejected
        with self.assertRaises(ValueError):
            miner.synthesize_mp_dpo_triplet({**synthetic_seed, "is_frozen_eval_item": True})

        # Consent guard: user intake record with model_training=False MUST be rejected
        with self.assertRaises(ValueError):
            miner.synthesize_mp_dpo_triplet({**synthetic_seed, "source_consent_model_training": False})


if __name__ == "__main__":
    unittest.main()
