"""Offline source/claim and arithmetic guards; fixtures are unit tests, not model measurements."""
import importlib.util
import math
import unittest
from pathlib import Path

spec=importlib.util.spec_from_file_location(
    "turkish_guard_observed",Path(__file__).with_name("turkish_guard_observed.py"))
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class GuardObservations(unittest.TestCase):
    def test_source_pins_and_denominators_are_fixed(self):
        self.assertEqual(module.ROWS,3372)
        self.assertEqual(module.ATTACKS,317)
        self.assertEqual(module.BENIGN,3055)
        self.assertEqual(module.ATTACKS+module.BENIGN,module.ROWS)
        self.assertEqual(module.THRESHOLD,0.5)
        self.assertEqual(len(module.DATA_SHA),64)
        self.assertEqual(len(module.MODEL_SHA),64)
        self.assertEqual(len(module.NORMALIZER_SHA),64)

    def test_counts_on_mixed_provenance_values(self):
        cases=[dict(label=y,prediction=p) for y,p in [(1,1),(1,0),(0,1),(0,0)]]
        self.assertEqual(module.counts(cases),dict(tp=1,tn=1,fp=1,fn=1))

    def test_wilson_zero_false_alarm_has_nonzero_upper_limit(self):
        ci=module.wilson(0,module.BENIGN)
        self.assertEqual(ci[0],0.0)
        self.assertGreater(ci[1],0)

    def test_wilson_missed_attacks_bounded(self):
        ci=module.wilson(100,module.ATTACKS)
        self.assertLess(ci[0],100/module.ATTACKS)
        self.assertGreater(ci[1],100/module.ATTACKS)
        self.assertLessEqual(ci[1],1)

    def test_sha_is_exact_bytes_not_lowercased_document(self):
        self.assertNotEqual(module.sha("İ".encode("utf8")),module.sha("i".encode("utf8")))

    def test_fail_closed(self):
        with self.assertRaises(ValueError):module.require(False,"missing")
        module.require(True,"okay")

    def test_case_receipt_source_and_threshold_drift_rejected(self):
        # A full-size fake label vector is ONLY a unit-test fixture, never a published observation.
        rows=[{"text":"test"+str(i),"label":int(i<module.ATTACKS),"subset":"unit"}
              for i in range(module.ROWS)]
        cases=[{"i":i,"label":r["label"],"prediction":int(r["label"]),
                "score":0.9 if r["label"] else 0.1,
                "text_sha256":module.sha(r["text"].encode("utf8"))}
               for i,r in enumerate(rows)]
        v=module.record_observation(rows,cases,1)
        self.assertFalse(v["gspc_measurement_admitted"])
        self.assertFalse(v["model_production_prevention_proven"])
        self.assertFalse(v["external_receiving_party_acceptance"])
        cases[0]["text_sha256"]="0"*64
        with self.assertRaises(ValueError):module.record_observation(rows,cases,1)

    def test_unexpected_noninteger_prediction_rejected_by_consistency(self):
        rows=[{"text":"test"+str(i),"label":int(i<module.ATTACKS),"subset":"unit"}
              for i in range(module.ROWS)]
        cases=[{"i":i,"label":r["label"],"prediction":int(r["label"]),
                "score":0.9 if r["label"] else 0.1,
                "text_sha256":module.sha(r["text"].encode("utf8"))}
               for i,r in enumerate(rows)]
        cases[1]["prediction"]=0
        with self.assertRaises(ValueError):module.record_observation(rows,cases,1)

if __name__=="__main__":unittest.main()
