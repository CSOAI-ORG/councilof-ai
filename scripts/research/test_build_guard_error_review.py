"""Offline failure-register integrity tests; no model or dataset download."""
import importlib.util
from pathlib import Path
import unittest
from copy import deepcopy

ROOT=Path(__file__).resolve().parent
for name,file in [("review","build-guard-error-review.py"),("fixture","test_external_guard_benchmark.py")]:
    spec=importlib.util.spec_from_file_location(name,ROOT/file)
    obj=importlib.util.module_from_spec(spec);spec.loader.exec_module(obj)
    globals()[name]=obj

class RegisterTests(unittest.TestCase):
    def test_failure_register_preserves_all_false_negatives(self):
        base,_=fixture.observed()
        report=review.build(base,deepcopy(base))
        self.assertEqual(report["n_errors"],19)
        self.assertEqual(report["current_counts"]["fn"],19)
        self.assertEqual(report["current_counts"]["fp"],0)
        self.assertEqual(report["changed_from_baseline"]["n_regressions"],0)
        self.assertFalse(report["scope"]["training_on_this_test_split_authorized"])
        self.assertTrue(all("text" not in row for row in report["errors"]))

    def test_new_miss_is_not_silently_merged(self):
        a,_=fixture.observed()
        changed=deepcopy(a)
        changed["cases"][41]["score"]=0.1
        changed["cases"][41]["predicted"]=0
        changed.update(review.bench.compute_counts(changed["cases"]))
        changed["threshold_sensitivity"]=[
            {"threshold":t,**review.bench.compute_counts(changed["cases"],t)}
            for t in (.05,.1,.2,.35,.5,.8)]
        out=review.build(changed,a)
        self.assertEqual(out["changed_from_baseline"]["n_regressions"],1)
        self.assertEqual(out["n_errors"],20)

    def test_swapped_case_identity_is_rejected(self):
        a,_=fixture.observed()
        changed=deepcopy(a)
        changed["cases"][0]["input_sha256"]="0"*64
        with self.assertRaisesRegex(ValueError,"case identity"):
            review.build(changed,a)

    def test_dataset_pin_drift_is_rejected(self):
        a,_=fixture.observed()
        changed=deepcopy(a);changed["data_sha256"]="0"*64
        with self.assertRaises(ValueError):
            review.build(changed,a)

    def test_incorrect_metric_counts_cannot_be_reported(self):
        a,_=fixture.observed()
        changed=deepcopy(a);changed["fn"]=0
        with self.assertRaisesRegex(ValueError,"TP/TN/FP/FN"):
            review.build(changed,a)

if __name__=="__main__":
    unittest.main()
