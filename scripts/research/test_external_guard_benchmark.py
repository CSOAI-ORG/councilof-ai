"""Offline provenance, denominator, false-negative and sensitivity controls."""
import importlib.util
import json
from pathlib import Path
import unittest
from datetime import datetime, timezone

FILE=Path(__file__).with_name("external-guard-benchmark.py")
spec=importlib.util.spec_from_file_location("external_guard",FILE)
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

def observed():
    source=[{"text":f"synthetic row {i}","label":1 if i<60 else 0} for i in range(116)]
    cases=[]
    for i,d in enumerate(source):
        score=.9 if i<41 else .1 if i<60 else .02
        cases.append({"id":i,"label":d["label"],"score":score,
                      "predicted":int(score>=.5),
                      "input_sha256":m.digest(d["text"].encode()),
                      "chars":len(d["text"]),"token_count":8})
    record={"schema":"csoai.external-dataset-guard-eval/0.1",
      "observed_at":datetime.now(timezone.utc).isoformat(),
      "dataset":m.DATASET,"dataset_revision":m.DATA_REV,
      "data_file":m.DATA_FILE,"data_sha256":m.DATA_SHA,
      "model":m.MODEL,"model_revision":m.MODEL_REV,
      "model_file_sha256":m.ONNX_SHA,"normalizer_sha256":m.NORM_SHA,
      "threshold":m.THRESHOLD,"n":116,**m.compute_counts(cases),"cases":cases,
      "threshold_sensitivity":[{"threshold":t,**m.compute_counts(cases,t)}
                               for t in (.05,.1,.2,.35,.5,.8)],
      "operator_scope":"CSOAI_SELF_RESEARCH","real_tool_effects_observed":False,
      "gspc_admitted":False,"production_authority":False,
      "independent_review":"NOT_CONDUCTED"}
    return record,source

class ExternalDataTests(unittest.TestCase):
    def test_baseline_contains_misses(self):
        r,src=observed()
        self.assertEqual(m.validate(r,src),dict(tp=41,tn=56,fp=0,fn=19))
        e=m.canonical(r)
        self.assertEqual(e["state"],"PARTIAL")
        self.assertIsNone(e["signature"])
        self.assertIsNone(e["value"])

    def test_falsified_ground_truth_rejected_when_source_supplied(self):
        r,src=observed()
        r["cases"][0]["label"]=0
        with self.assertRaisesRegex(ValueError,"source label"):
            m.validate(r,src)

    def test_changed_text_digest_rejected(self):
        r,src=observed()
        r["cases"][0]["input_sha256"]="0"*64
        with self.assertRaisesRegex(ValueError,"source label"):
            m.validate(r,src)

    def test_false_success_count_rejected(self):
        r,src=observed()
        r["fn"]=0
        with self.assertRaisesRegex(ValueError,"cannot be reconstructed"):
            m.validate(r,src)

    def test_nonmatching_predictions_rejected(self):
        r,src=observed()
        r["cases"][0]["predicted"]=0
        with self.assertRaisesRegex(ValueError,"score and prediction"):
            m.validate(r,src)

    def test_posthoc_threshold_cannot_hide_errors(self):
        r,src=observed()
        r["threshold_sensitivity"][0]["fn"]=0
        with self.assertRaisesRegex(ValueError,"threshold sensitivity"):
            m.validate(r,src)

    def test_no_invented_external_witness(self):
        r,src=observed()
        r["independent_review"]="COMPLETED"
        with self.assertRaisesRegex(ValueError,"false authority"):
            m.validate(r,src)

    def test_event_mutation_detected(self):
        r,src=observed()
        event=m.canonical(r)
        event["observed"]["fn"]=0
        mod=importlib.util.spec_from_file_location("evidence_validation",m.ROOT/"packages/evidence-fabric/event.py")
        v=importlib.util.module_from_spec(mod)
        mod.loader.exec_module(v)
        self.assertTrue(v.validate(event))

    def test_data_population_well_scoped(self):
        r,src=observed()
        r["cases"].pop()
        with self.assertRaisesRegex(ValueError,"missing case-level"):
            m.validate(r,src)
        
if __name__=="__main__":
    unittest.main()
