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

    def test_three_way_p100_side(self):
        d = decl([], True)
        d["parity"]["per_item_cross_hardware"]["differing_items"] = [
            {"item_id": "item-0", "rtx3090": {"grade": True, "raw_output_sha256": "a"}, "p100": {"grade": False, "raw_output_sha256": "b"}}]
        d["parity"]["per_item_cross_hardware"]["grade_equal"] = 9
        d["parity"]["three_way_item_level"] = {
            "runtimes": {"rtx3090": "x", "t4": "y", "p100": "z"}, "state": "REPRODUCED_2_OF_3", "differing_runtime": "p100",
            "n_items": 10, "grade_equal_all_three": 9, "raw_output_equal_all_three": 9, "counts_equal_all_three": False,
            "t4_declaration": {"path": "/x", "sha256": "ab" * 32, "per_item_results_sha256": "cd" * 32},
            "grade_differing_items": [{"item_id": "item-0", "differs": "p100", "grades": {"rtx3090": True, "t4": True, "p100": False}}]}
        c = v.capsule_from_mill_decl(d, "t")
        self.assertEqual(c["measurement_state"], "REPRODUCED_2_OF_3")
        self.assertEqual(c["observed"]["runtime"], "kaggle 1xP100")
        self.assertEqual(c["differential"]["grade_differing_item_ids"], ["item-0"])
        self.assertEqual(c["differential"]["three_way"]["differing_runtime"], "p100")
        self.assertFalse(any(l.startswith("two runtimes only") for l in c["limitations"]))
        self.assertEqual(v.authority_violations(c), [])
        self.assertEqual(v.non_digest_sources({k: c["sources"][k] for k in ("t4_per_item_results_sha256", "t4_declaration_sha256")}), [])
        d["parity"]["three_way_item_level"]["state"] = "ADMITTED"
        with self.assertRaises(ValueError):
            v.capsule_from_mill_decl(d, "t")

    def test_two_runtime_declaration_unchanged(self):
        c = v.capsule_from_mill_decl(decl([(True, False)], False), "t")
        self.assertEqual(c["observed"]["runtime"], "kaggle 2xT4")
        self.assertNotIn("three_way", c["differential"])
        self.assertTrue(any(l.startswith("two runtimes only") for l in c["limitations"]))


if __name__ == "__main__":
    unittest.main()
