# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
import copy, json, unittest
import venturi_capsule as v


def decl(grade_pairs, agg_equal):
    diffs = [{"item_id": f"item-{i}", "rtx3090": {"grade": g3}, "t4": {"grade": g4}} for i, (g3, g4) in enumerate(grade_pairs) if g3 != g4 or True]
    return {"subject": "ollama:m@sha256:aa", "axis": "x", "card_id": "c", "card_file": "f", "run_id": "t4run",
            "counts": {"correct": 1}, "accuracy": 0.5, "intake_bundle_sha256": "b", "instrument_sha256": "i",
            "items_sha256": "it", "per_item_results_sha256": "p",
            "runtime": {"bank_sha256": "bk", "model_manifest_file_sha256": "aa", "code_commit": "cc", "gpu": "T4"},
            "baseline_runtime": {"ollama": "client 0.33.0 (version at run time not separately recorded)", "driver": "UNRECORDED",
                                 "runs": [{"run_id": "r3090", "counts": {"correct": 1}, "accuracy": 0.5, "bundle_sha256": "bb"}]},
            "parity": {"aggregate_equal_to_3090": agg_equal,
                       "per_item_cross_hardware": {"n_items": 10, "grade_equal": 10 - sum(a != b for a, b in grade_pairs),
                                                   "differing_items": diffs}}}


class T(unittest.TestCase):
    def test_itemwise(self):
        c = v.capsule_from_mill_decl(decl([], True), "t")
        self.assertEqual(c["measurement_state"], "REPRODUCED_ITEMWISE")

    def test_flips_cancel_is_not_itemwise(self):
        c = v.capsule_from_mill_decl(decl([(True, False), (False, True)], True), "t")
        self.assertEqual(c["measurement_state"], "REPRODUCED_AGGREGATE_ONLY")
        self.assertEqual(len(c["differential"]["grade_differing_item_ids"]), 2)

    def test_not_reproduced(self):
        c = v.capsule_from_mill_decl(decl([(True, False)], False), "t")
        self.assertEqual(c["measurement_state"], "NOT_REPRODUCED")

    def test_raw_diff_same_grade_is_itemwise(self):
        c = v.capsule_from_mill_decl(decl([(True, True)], True), "t")
        self.assertEqual(c["measurement_state"], "REPRODUCED_ITEMWISE")
        self.assertEqual(c["differential"]["raw_output_differing_item_ids"], ["item-0"])

    def test_id_is_content_address_and_tamper_detected(self):
        c = v.capsule_from_mill_decl(decl([], True), "t")
        self.assertEqual(v.capsule_id(c), c["capsule_id"])
        t = copy.deepcopy(c); t["observed"]["accuracy"] = 0.99
        self.assertNotEqual(v.capsule_id(t), c["capsule_id"])

    def test_merkle_order_independent_and_sensitive(self):
        ids = [v.sha(bytes([i])) for i in range(5)]
        self.assertEqual(v.merkle_root(ids), v.merkle_root(list(reversed(ids))))
        self.assertNotEqual(v.merkle_root(ids), v.merkle_root(ids[:4]))

    def test_no_decision_or_authority_field(self):
        c = v.capsule_from_mill_decl(decl([], True), "t")
        s = json.dumps(c).lower()
        self.assertNotIn('"decision"', s); self.assertNotIn("allow", s); self.assertIsNone(c["effect_reference"])
        self.assertTrue(c["authority_state"].startswith("NONE"))
        self.assertEqual(v.authority_violations(c), [])  # the structural check every adapter is held to (test_adapters.py)


if __name__ == "__main__":
    unittest.main()
