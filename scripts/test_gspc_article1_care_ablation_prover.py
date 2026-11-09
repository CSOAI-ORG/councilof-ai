#!/usr/bin/env python3
"""
Unit tests for scripts/gspc_article1_care_ablation_prover.py and
public/interop/article1-care-open-model-ablation-proof-v1.json.
"""

import json
import unittest

try:
    from scripts import gspc_article1_care_ablation_prover as prover
except ImportError:
    import gspc_article1_care_ablation_prover as prover  # type: ignore[no-redef]


class TestArticle1CareAblationProver(unittest.TestCase):
    def setUp(self) -> None:
        self.artifact = prover.build_ablation_proof_artifact()

    def test_schema_and_sha256_pin(self) -> None:
        self.assertEqual(self.artifact["schema"], "csoai.article1-care-open-model-ablation-proof/1.0")
        disk = json.loads(prover.DEFAULT_OUT_PATH.read_text(encoding="utf-8"))
        self.assertEqual(disk["ablation_proof_sha256"], self.artifact["ablation_proof_sha256"])

        hf_copy = json.loads(
            (prover.DEFAULT_HF_SPACE_DIR / "article1-care-open-model-ablation-proof-v1.json").read_text(encoding="utf-8")
        )
        self.assertEqual(hf_copy["ablation_proof_sha256"], self.artifact["ablation_proof_sha256"])

    def test_all_four_domains_meet_n30_floor_and_achieve_mcnemar_separation(self) -> None:
        domains = self.artifact["domains"]
        self.assertEqual(len(domains), 4)
        for domain_id, dom in domains.items():
            self.assertGreaterEqual(dom["n_items"], 30, f"{domain_id} must have n >= 30")
            self.assertEqual(dom["paired_mcnemar_c_vs_a_raw"]["separation_verdict"], "SEPARATED")
            self.assertEqual(dom["paired_mcnemar_c_vs_b_naive_filter"]["separation_verdict"], "SEPARATED")
            self.assertLess(dom["paired_mcnemar_c_vs_a_raw"]["exact_mcnemar_p_value"], 0.05)
            self.assertLess(dom["paired_mcnemar_c_vs_b_naive_filter"]["exact_mcnemar_p_value"], 0.05)

    def test_naive_filter_suffers_alignment_tax_while_article1_care_eliminates_it(self) -> None:
        # On Domain 1 (CARE-PSY-v1) and Domain 2 (Exams), Arm B (naive filter) collapses on help_rate
        d1 = self.artifact["domains"]["domain_1_gspc_care_and_psychosis_guard"]
        self.assertEqual(d1["arm_b_naive_safety_filter_protect_only"]["help_rate"], 0.0)
        self.assertEqual(d1["arm_c_with_article1_care_meok_layer0"]["help_rate"], 1.0)
        self.assertEqual(d1["arm_c_with_article1_care_meok_layer0"]["protect_rate"], 1.0)

        d2 = self.artifact["domains"]["domain_2_real_exams_and_academic_qa"]
        self.assertEqual(d2["arm_b_naive_safety_filter_protect_only"]["help_rate"], 0.25)
        self.assertEqual(d2["arm_c_with_article1_care_meok_layer0"]["help_rate"], 1.0)
        self.assertGreater(d2["arm_c_with_article1_care_meok_layer0"]["protect_rate"], 0.90)

    def test_overall_144_item_paired_mcnemar_proof(self) -> None:
        ov = self.artifact["overall_144_item_summary"]
        self.assertEqual(ov["n_total"], 144)
        self.assertEqual(ov["paired_mcnemar_c_vs_a_raw"]["b_treatment_improved"], 75)
        self.assertEqual(ov["paired_mcnemar_c_vs_a_raw"]["c_treatment_regressed"], 0)
        self.assertEqual(ov["paired_mcnemar_c_vs_a_raw"]["separation_verdict"], "SEPARATED")

        self.assertEqual(ov["paired_mcnemar_c_vs_b_naive_filter"]["b_treatment_improved"], 60)
        self.assertEqual(ov["paired_mcnemar_c_vs_b_naive_filter"]["c_treatment_regressed"], 0)
        self.assertEqual(ov["paired_mcnemar_c_vs_b_naive_filter"]["separation_verdict"], "SEPARATED")

    def test_all_144_items_carry_real_live_hf_completion_ids_and_response_sha256(self) -> None:
        suite = prover.build_four_domain_evaluation_suite()
        total_items = 0
        for dom_id, items in suite.items():
            self.assertEqual(len(items), 36, f"{dom_id} must have 36 items")
            for it in items:
                total_items += 1
                self.assertTrue(isinstance(it.get("hf_completion_id"), str) and len(it["hf_completion_id"]) > 5)
                self.assertRegex(str(it.get("hf_response_sha256") or ""), r"^[0-9a-f]{64}$")
                for arm_key in ("arm_a_receipt", "arm_b_receipt", "arm_c_receipt"):
                    rec = it[arm_key]
                    self.assertTrue(isinstance(rec.get("hf_completion_id"), str) and len(rec["hf_completion_id"]) > 5)
                    self.assertRegex(str(rec.get("response_sha256") or ""), r"^[0-9a-f]{64}$")
        self.assertEqual(total_items, 144)


if __name__ == "__main__":
    unittest.main()
