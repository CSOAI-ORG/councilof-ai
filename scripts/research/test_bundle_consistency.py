"""Cross-check reusable evidence manifest against actual source records and release receipts."""
import json,hashlib,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
P=ROOT/"docs/research/turkish-guard-observed-20261124"
MAN=json.loads((P/"evidence-bundle-manifest.json").read_text())
class ReusableBundleTruth(unittest.TestCase):
 def test_model_subjects_and_actual_results(self):
  models={x["name"]:x for x in MAN["sources"] if x["kind"]=="model"}
  self.assertIn("protectai/deberta-v3-base-prompt-injection-v2",models)
  self.assertEqual(models["protectai/deberta-v3-base-prompt-injection-v2"]["weights_sha256"],"f0ea7f239f765aedbde7c9e163a7cb38a79c5b8853d3f76db5152172047b228c")
  pair=json.loads((P/"protectai-paired-english-observation.json").read_text())
  self.assertEqual(pair["tested_confusion"]["tp"],22)
  self.assertEqual(pair["baseline_confusion"]["tp"],41)
 def test_observations_from_source_retain_exact_bytes(self):
  for row in MAN["observations"]:
   file=ROOT/row["source"]
   self.assertTrue(file.exists())
   if "original_bytes_sha256" in row:
    self.assertEqual(hashlib.sha256(file.read_bytes()).hexdigest(),row["original_bytes_sha256"])
 def test_real_browser_and_two_owner_devices_not_independent_human(self):
  browser=json.loads((P/"live-browser-acceptance.json").read_text())
  self.assertTrue(browser["all_passed"])
  self.assertEqual(len(browser["journeys"]),4)
  self.assertEqual(browser["observed_public_bundle_identity"]["assets"][0]["sha256"],MAN["public_deployment"]["verified_asset_sha256"])
  other=json.loads((P/"second-owner-machine-readback.json").read_text())
  self.assertTrue(other["all_match"])
  self.assertFalse(other["independent_human_reviewer"])
  self.assertEqual(MAN["independent_receiver_acceptance"],"NOT_ESTABLISHED")
 def test_permissions_and_protection_claims_stay_unqualified(self):
  self.assertIn("NOT_MEASUREMENT_ADMITTED",MAN["status"])
  self.assertEqual(MAN["gspc_event_candidate_state"],"PARTIAL_UNSIGNED_NOT_ADMITTED")
  self.assertEqual(MAN["human_approval"],"NOT_ESTABLISHED")
  self.assertEqual(MAN["defense_effectiveness_claim"],"NOT_ESTABLISHED")
  self.assertIn("CANDIDATE",MAN["public_deployment"]["one_click_observed_cases"])
 def test_no_unverifiable_raw_text_republication(self):
  self.assertIn("raw text excluded",MAN["rights"]["turkish_dataset"])
  self.assertIn("source text excluded",MAN["rights"]["english_prompt_injection_dataset"])
if __name__=="__main__":unittest.main()
