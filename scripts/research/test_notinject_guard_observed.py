"""Offline source pins and arithmetic integrity for a REAL but self-run benign-only measurement."""
import importlib.util
import json
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("notinject_model",ROOT/"notinject_guard_observed.py")
method=importlib.util.module_from_spec(spec)
spec.loader.exec_module(method)
SUMMARY=json.loads((ROOT.parent.parent/"docs/research/turkish-guard-observed-20261124/notinject-summary.json").read_text())

class NotInjectSourceControls(unittest.TestCase):
    def test_exact_dataset_counts(self):
        self.assertEqual(len(method.SOURCES),3)
        self.assertEqual(SUMMARY["total_benign"],339)
        self.assertEqual(sum(x["n"] for x in SUMMARY["subgroups"].values()),339)
    def test_real_observed_false_alarms_match_derived_counts(self):
        self.assertEqual(sum(x["false_alarms"] for x in SUMMARY["subgroups"].values()),13)
        self.assertEqual(SUMMARY["false_alarms"],13)
        self.assertAlmostEqual(SUMMARY["false_alarm_rate"],13/339,places=5)
    def test_exact_sources_and_model_pin(self):
        self.assertEqual(SUMMARY["source_split_parquet_sha256"],method.SOURCES)
        self.assertEqual(SUMMARY["dataset_revision"],method.REV)
        self.assertEqual(SUMMARY["model_revision"],method.MODEL_REV)
        self.assertEqual(SUMMARY["model_weights_sha256"],method.MODEL_SHA)
    def test_real_method_bytes_match_recorded_sha(self):
        import hashlib
        self.assertEqual(hashlib.sha256((ROOT/"notinject_guard_observed.py").read_bytes()).hexdigest(),SUMMARY["method_source_sha256"])
    def test_original_aggregate_is_not_misrepresented_as_uploaded(self):
        self.assertFalse(SUMMARY["original_aggregate_bytes_published"])
        self.assertEqual(len(SUMMARY["original_local_aggregate_sha256"]),64)
        self.assertTrue(SUMMARY["limitations"])
    def test_model_classifications_cannot_mark_signed_measured_or_effect(self):
        self.assertFalse(SUMMARY["gspc_admitted"])
        self.assertFalse(SUMMARY["external_receiver_accepted"])
        self.assertFalse(SUMMARY["model_effect_tested"])
        self.assertFalse(SUMMARY["source_text_redistributed"])

if __name__=="__main__":unittest.main()
