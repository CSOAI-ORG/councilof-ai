import importlib.util
import json
from pathlib import Path
from datetime import datetime, timezone
import unittest

PATH = Path(__file__).with_name("firstparty-guard-replay.py")
spec = importlib.util.spec_from_file_location("guard_replay", PATH)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


def sample(scores=(0.10,0.01,0.36,0.09,0.99,0.99,1.0,0.99)):
    rows, fixture_sha = m.produce_rows(scores, datetime.now(timezone.utc))
    counts = m.counts(rows)
    return {"schema":"csoai.local-model-inference-sample/0.1",
            "model":m.MODEL,"model_commit":m.REVISION,
            "model_file":m.WEIGHT,"model_file_sha256":m.WEIGHT_SHA256,
            "normalizer_sha256":m.NORMALIZER_SHA256,
            "fixtures_sha256":fixture_sha,"threshold":0.5,"n":8,
            "cases":rows,**counts,
            "observed_at":"2026-11-21T01:10:00.000000+00:00",
            "operator_scope":"SELF_RUN_NO_CUSTOMER",
            "production_authority":False,"gspc_admitted":False,
            "independent_review":"NOT_CONDUCTED"}


class GuardReplayTests(unittest.TestCase):
    def test_case_labels_recompute_from_scores(self):
        r=sample()
        self.assertEqual(m.check_record(r),{"tp":4,"tn":4,"fp":0,"fn":0})
        self.assertEqual(m.canonical(r)["state"],"CONSISTENT")
        self.assertIsNone(m.canonical(r)["signature"])

    def test_benign_false_positive_is_visible_not_deleted(self):
        r=sample(scores=(0.1,0.8,0.3,0.09,0.99,0.99,1.0,0.99))
        self.assertEqual(m.check_record(r)["fp"],1)
        e=m.canonical(r)
        self.assertEqual(e["state"],"DIVERGENT")
        self.assertEqual(e["negative_control"]["got"],"INJECTION")

    def test_injection_miss_is_not_hidden(self):
        r=sample(scores=(0.1,0.01,0.3,0.09,0.99,0.02,1.0,0.99))
        self.assertEqual(m.check_record(r)["fn"],1)
        self.assertEqual(m.canonical(r)["state"],"DIVERGENT")

    def test_benign_input_hash_tamper_is_rejected(self):
        r=sample()
        r["cases"][0]["text_sha256"]="0"*64
        with self.assertRaisesRegex(ValueError,"input hash"):
            m.check_record(r)

    def test_count_tamper_is_rejected(self):
        r=sample()
        r["tp"]=9
        with self.assertRaisesRegex(ValueError,"counts mismatch"):
            m.check_record(r)

    def test_model_pin_and_scope_cannot_change(self):
        r=sample()
        r["model_file_sha256"]="0"*64
        with self.assertRaisesRegex(ValueError,"model or normalizer"):
            m.check_record(r)
        r=sample()
        r["independent_review"]="COMPLETED"
        with self.assertRaisesRegex(ValueError,"scope"):
            m.check_record(r)

    def test_event_mutation_is_detected_by_canonical_validator(self):
        r=sample()
        e=m.canonical(r)
        e["observed"]["tp"]=0
        # Stored id is no longer the digest of actual bytes.
        spec=importlib.util.spec_from_file_location("canonical",m.EVENT_PATH)
        canonical=importlib.util.module_from_spec(spec)
        spec.loader.exec_module(canonical)
        self.assertTrue(canonical.validate(e))


if __name__=="__main__":
    unittest.main()
