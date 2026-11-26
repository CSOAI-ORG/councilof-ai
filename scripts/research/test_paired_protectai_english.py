"""Checks observed same-case model outcomes and exact published source pins; no model rerun."""
import hashlib,importlib.util,json,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
HERE=ROOT/"scripts/research"
REC=json.loads((ROOT/"docs/research/turkish-guard-observed-20261124/protectai-paired-english-observation.json").read_text())
OLD=json.loads((ROOT/"docs/research/external-guard-benchmark-20261121/record.json").read_text())
spec=importlib.util.spec_from_file_location("paired_english",HERE/"paired_protectai_english.py")
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)

class ActualPairedClassifier(unittest.TestCase):
    def test_method_was_frozen_before_new_model_run(self):
        actual=hashlib.sha256((HERE/"paired_protectai_english.py").read_bytes()).hexdigest()
        self.assertEqual(actual,"ae5e28c9b3ce483f9146ab53d746df963b2417984c1c163e89edcb4b3693c347")
    def test_repo_data_model_and_threshold_are_exact(self):
        self.assertEqual(REC["data_sha256"],mod.DATA_SHA)
        self.assertEqual(REC["data_revision"],mod.DATA_REV)
        self.assertEqual(REC["tested_revision"],mod.REV)
        self.assertEqual(REC["tested_weights_sha256"],"f0ea7f239f765aedbde7c9e163a7cb38a79c5b8853d3f76db5152172047b228c")
        self.assertEqual(REC["threshold"],0.5)
    def test_actual_counts_and_paired_input_sha(self):
        self.assertEqual(len(REC["row_evidence_without_raw_text"]),116)
        self.assertEqual(mod.confusion(REC["row_evidence_without_raw_text"]),{"tp":22,"fn":38,"tn":56,"fp":0})
        self.assertEqual(mod.confusion(OLD["cases"]),{"tp":41,"fn":19,"tn":56,"fp":0})
        for i,(n,o) in enumerate(zip(REC["row_evidence_without_raw_text"],OLD["cases"])):
            self.assertEqual(n["id"],o["id"])
            self.assertEqual(n["input_sha256"],o["input_sha256"])
            self.assertEqual(n["label"],o["label"])
            self.assertEqual(n["predicted"],int(n["score"]>=0.5))
    def test_paired_discordances_and_exact_significance(self):
        n=REC["row_evidence_without_raw_text"];o=OLD["cases"]
        a=sum(x["predicted"]==x["label"] and y["predicted"]!=y["label"] for x,y in zip(o,n))
        b=sum(x["predicted"]!=x["label"] and y["predicted"]==y["label"] for x,y in zip(o,n))
        self.assertEqual((a,b),(20,1))
        self.assertAlmostEqual(mod.exact_mcnemar_p(a,b),REC["paired_exact_mcnemar_two_sided_p"],places=7)
    def test_case_output_hash_and_no_text(self):
        rows=REC["row_evidence_without_raw_text"]
        raw=json.dumps(rows,sort_keys=True,separators=(",",":")).encode()
        self.assertEqual(hashlib.sha256(raw).hexdigest(),REC["row_scores_sha256"])
        self.assertTrue(all("text" not in x and "prompt" not in x for x in rows))
        self.assertEqual(sum(x["label"] for x in rows),60)
    def test_non_authority_and_nonblind(self):
        self.assertIs(REC["gspc_admitted"],False)
        self.assertIs(REC["real_agent_effect_tested"],False)
        self.assertIs(REC["external_receiving_party_accepted"],False)
        self.assertIs(REC["fully_blind_external_holdout"],False)
        self.assertIs(REC["model_vendor_endorsed"],False)
    def test_contamination_or_mixed_bank_cannot_be_interpreted_as_paired(self):
        old=[{"label":1,"predicted":1},{"label":0,"predicted":0}]
        new=[{"label":1,"predicted":0},{"label":0,"predicted":1}]
        self.assertEqual(mod.confusion(old),{"tp":1,"fn":0,"tn":1,"fp":0})
        self.assertEqual(mod.confusion(new),{"tp":0,"fn":1,"tn":0,"fp":1})
        self.assertEqual(mod.exact_mcnemar_p(2,0),0.5)
if __name__=="__main__":unittest.main()
