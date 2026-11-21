"""Offline tests of positive-only multilingual classifier interpretation."""
import importlib.util
from pathlib import Path
import copy
import unittest
from datetime import datetime,timezone

p=Path(__file__).with_name("japanese-indirect-classifier.py")
spec=importlib.util.spec_from_file_location("ja_classification",p)
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

def sample():
    classes=sorted(m.EXPECTED_CATEGORIES)
    source=[]
    out=[]
    for cat in classes:
        for j in range(6):
            ident=f"{cat}-{j}"
            doc=f"Japanese sample {ident}"
            prompt=f"Task plus sample {ident}"
            d={"id":ident,"category":cat,"position":"middle","document":doc,"prompt":prompt}
            source.append(d)
            row={"id":ident,"category":cat,"position":"middle"}
            for key in ("document","prompt"):
                sc=0.1 if cat=="obfuscation-script" and j<2 else 0.9
                row[key+"_score"]=sc
                row[key+"_detected"]=sc>=.5
                row[key+"_sha256"]=m.sha(d[key].encode())
            out.append(row)
    record={"schema":"csoai.japanese-indirect-classifier-probe/0.1",
            "source":m.DATA,"source_revision":m.DATA_REV,"source_file":m.DATA_FILE,
            "source_sha256":m.DATA_SHA,"model":m.MODEL,"model_revision":m.MODEL_REV,
            "model_file_sha256":m.MODEL_SHA,"normalizer_sha256":m.NORM_SHA,
            "n":60,"threshold":0.5,"observed_at":datetime.now(timezone.utc).isoformat(),
            "counts":m.counts(out),"cases":out,"classification_only":True,
            "no_benign_controls":True,"gspc_admitted":False,
            "human_review":"NOT_CONDUCTED","real_tool_effects_observed":False}
    return record,source

class JapaneseTests(unittest.TestCase):
    def test_positive_only_58_of_60_misses_are_visible(self):
        r,src=sample()
        o=m.validate(r,src)
        self.assertEqual(o["document"]["detected"],58)
        self.assertEqual(o["prompt"]["missed"],2)
        self.assertEqual(o["document"]["by_category"]["obfuscation-script"],4)
        e=m.canonical(r)
        self.assertEqual(e["state"],"PARTIAL")
        self.assertIsNone(e["value"])
        self.assertEqual(e["negative_control"]["got"],"NOT_RUN")

    def test_source_text_tamper_rejected(self):
        r,src=sample()
        src[0]["document"]="changed"
        with self.assertRaisesRegex(ValueError,"source text digest"):
            m.validate(r,src)

    def test_misreported_detection_counts_rejected(self):
        r,src=sample()
        r["counts"]["document"]["detected"]=60
        with self.assertRaisesRegex(ValueError,"category detections"):
            m.validate(r,src)

    def test_score_flag_disagreement_rejected(self):
        r,src=sample()
        r["cases"][0]["document_detected"]=False
        with self.assertRaisesRegex(ValueError,"score/prediction"):
            m.validate(r,src)

    def test_no_benign_control_cannot_be_conjured(self):
        r,src=sample()
        r["no_benign_controls"]=False
        with self.assertRaisesRegex(ValueError,"scope or population"):
            m.validate(r,src)

    def test_production_and_board_authority_false(self):
        r,src=sample()
        r["gspc_admitted"]=True
        with self.assertRaisesRegex(ValueError,"scope or population"):
            m.validate(r,src)

if __name__=="__main__":
    unittest.main()
