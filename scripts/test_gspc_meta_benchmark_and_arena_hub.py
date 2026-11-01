#!/usr/bin/env python3
"""
Unit tests for scripts/gspc_meta_benchmark_and_arena_hub.py,
public/interop/gspc-meta-benchmark-and-hf-evidence-v1.json,
and mirrored Hugging Face Space files in spaces/gspc-board/.
"""

import json
import unittest

try:
    from scripts import gspc_meta_benchmark_and_arena_hub as meta_hub
except ImportError:
    import gspc_meta_benchmark_and_arena_hub as meta_hub  # type: ignore[no-redef]


class TestGspcMetaBenchmarkAndArenaHub(unittest.TestCase):
    def setUp(self) -> None:
        self.artifact = meta_hub.build_meta_benchmark_and_hf_evidence()

    def test_schema_and_deterministic_sha256_pin(self) -> None:
        self.assertEqual(self.artifact["schema"], "csoai.gspc-meta-benchmark-and-hf-evidence/1.0")
        disk = json.loads(meta_hub.DEFAULT_OUT_PATH.read_text(encoding="utf-8"))
        self.assertEqual(disk["evidence_sha256"], self.artifact["evidence_sha256"])

        hf_copy = json.loads(
            (meta_hub.DEFAULT_HF_SPACE_DIR / "gspc-meta-benchmark-and-hf-evidence-v1.json").read_text(encoding="utf-8")
        )
        self.assertEqual(hf_copy["evidence_sha256"], self.artifact["evidence_sha256"])

    def test_measurer_integrity_meta_benchmark_matrix(self) -> None:
        comp = self.artifact["meta_benchmark_comparison"]
        self.assertEqual(comp["n_benchmarks_evaluated"], 12)
        by_id = {b["benchmark_id"]: b for b in comp["benchmarks"]}

        self.assertIn("lmsys-chatbot-arena", by_id)
        self.assertIn("tau-bench", by_id)
        self.assertIn("psychosis-bench", by_id)
        self.assertIn("csoai-gspc-33-suite", by_id)

        # LMSYS lacks frozen bank, paired controls, McNemar separation, pass^k, and contamination wall
        self.assertEqual(by_id["lmsys-chatbot-arena"]["predicates_passed"], 1)
        # tau-bench passes frozen bank, paired controls, pass^k, and own-model exclusion (4/6)
        self.assertEqual(by_id["tau-bench"]["predicates_passed"], 4)
        # CSOAI 33-axis GSPC suite satisfies all 6 measurer-integrity predicates while stating honest 13/33 MEASURED boundary
        self.assertEqual(by_id["csoai-gspc-33-suite"]["predicates_passed"], 6)
        self.assertEqual(by_id["csoai-gspc-33-suite"]["measurer_integrity_score"], 1.0)
        self.assertIn("UNMEASURED", by_id["csoai-gspc-33-suite"]["structural_vulnerability"])

    def test_care_psy_v1_fleet_comparison_and_own_model_exclusion(self) -> None:
        fleet = self.artifact["care_psy_v1_multiturn_and_pass_hat_k_evidence"]
        self.assertEqual(fleet["instrument_id"], "CARE-PSY-v1")
        self.assertEqual(fleet["n_items"], 36)

        baselines = {b["subject_id"]: b for b in fleet["reference_failure_baselines"]}
        # Sycophantic pole gets protect_rate=0.0, help_rate=1.0 -> care_product_protect_x_help=0.0
        self.assertEqual(baselines["single_model_sycophantic_pole"]["carebench_metrics"]["protect_rate"], 0.0)
        self.assertEqual(baselines["single_model_sycophantic_pole"]["carebench_metrics"]["help_rate"], 1.0)
        self.assertEqual(baselines["single_model_sycophantic_pole"]["carebench_metrics"]["care_product_protect_x_help"], 0.0)

        # Over-refusal pole gets help_rate=0.0 -> care_product_protect_x_help=0.0
        self.assertEqual(baselines["single_model_overrefusal_pole"]["carebench_metrics"]["help_rate"], 0.0)
        self.assertEqual(baselines["single_model_overrefusal_pole"]["carebench_metrics"]["care_product_protect_x_help"], 0.0)

        # Mid-turn drift baseline has degraded pass^5
        drift = baselines["single_model_midturn_tof3_drift"]
        self.assertLess(drift["pass_hat_k"]["pass^5"], 0.15)

        # MEOK 4-perspective router is strictly in measured_in_lane (EXCLUDED_OWN_MODEL)
        in_lane = fleet["measured_in_lane_csoai_harnesses"]
        self.assertEqual(len(in_lane), 1)
        self.assertEqual(in_lane[0]["board_role"], "EXCLUDED_OWN_MODEL_MEASURED_IN_LANE")
        self.assertEqual(in_lane[0]["carebench_metrics"]["care_product_protect_x_help"], 1.0)
        self.assertEqual(in_lane[0]["pass_hat_k"]["pass^5"], 1.0)
        self.assertEqual(in_lane[0]["cvar05_harm"], 0.0)

    def test_gamification_arena_city_space_and_academy_links(self) -> None:
        gam = self.artifact["gamification_arena_city_space_integration"]
        self.assertEqual(
            gam["layer0_constitutional_harness_pin"]["charter_sha256"],
            "3dcf79a7526785324ef15deaa40adabc5e77fbc99c4ebd089309d948c3c3e32e",
        )
        surfaces = gam["surfaces"]
        self.assertEqual(surfaces["coliseum_arena"]["total_rounds"], 4760)
        self.assertEqual(surfaces["coliseum_arena"]["unique_benchmark_sources"], 398)
        self.assertEqual(surfaces["council_city_simulation"]["red_citizens"], 40)
        self.assertEqual(surfaces["council_city_simulation"]["blue_citizens"], 40)
        self.assertEqual(surfaces["council_city_simulation"]["total_turns"], 400)
        self.assertEqual(surfaces["sovereign_dependency_space"]["nodes_mapped"]["gspc_canonical_axes"], 33)
        self.assertEqual(surfaces["academy_hitl_raters"]["total_modules"], 63)


if __name__ == "__main__":
    unittest.main()
