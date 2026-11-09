import copy
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("tracr_repro", Path(__file__).with_name("tracr-example-reproduction.py"))
repro = importlib.util.module_from_spec(spec)
spec.loader.exec_module(repro)


class ReproductionControls(unittest.TestCase):
    def setUp(self):
        self.bank = repro.bank()
        self.spec = {"input_bank": self.bank}
        self.rows = [{"id": c["id"], "input": c["input"], "reverse_output": c["expected"],
                      "identity_output": ["BOS", *c["input"]]} for c in self.bank]

    def test_prospective_exhaustive_domain_and_discriminating_controls(self):
        self.assertEqual(len(self.bank), 39)
        self.assertEqual(len({tuple(c["input"]) for c in self.bank}), 39)
        self.assertEqual(sum(c["identity_is_discriminating"] for c in self.bank), 24)

    def test_expected_counts_are_recomputed_from_rows(self):
        self.assertEqual(repro.evaluate_rows(self.spec, self.rows), {
            "cases": 39, "exact_reverse_cases": 39, "wrong_identity_cases_rejected": 24,
            "non_discriminating_identity_cases": 15})

    def test_identity_implementation_does_not_pass_reverse_experiment(self):
        for r in self.rows:
            r["reverse_output"] = r["identity_output"]
        self.assertEqual(repro.evaluate_rows(self.spec, self.rows)["exact_reverse_cases"], 15)

    def test_always_correct_negative_control_is_not_discriminating(self):
        for r in self.rows:
            r["identity_output"] = r["reverse_output"]
        self.assertEqual(repro.evaluate_rows(self.spec, self.rows)["wrong_identity_cases_rejected"], 0)

    def test_missing_duplicate_and_reordered_rows_are_rejected(self):
        for rows in [self.rows[:-1], [*self.rows[:-1], self.rows[0]], list(reversed(self.rows))]:
            with self.assertRaises(ValueError):
                repro.evaluate_rows(self.spec, rows)

    def test_changed_input_is_rejected(self):
        self.rows[0]["input"] = [9]
        with self.assertRaises(ValueError):
            repro.evaluate_rows(self.spec, self.rows)

    def test_wrong_tokens_do_not_receive_partial_credit(self):
        for output in [["BOS", "1"], [1], ["BOS", 1, 1], None]:
            rows = copy.deepcopy(self.rows)
            rows[0]["reverse_output"] = output
            self.assertEqual(repro.evaluate_rows(self.spec, rows)["exact_reverse_cases"], 38)


if __name__ == "__main__":
    unittest.main()
