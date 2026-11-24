"""Source/custody checks for actual GitHub public effect, not fake human acceptance."""
import hashlib,json,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
REC=json.loads((ROOT/"docs/research/turkish-guard-observed-20261124/actual-github-host-observation.json").read_text())
TEXT=(ROOT/"docs/research/turkish-guard-observed-20261124/actual-github-effect.txt").read_bytes()
METHOD=(ROOT/"scripts/research/verify_actual_github_effect.py").read_bytes()
class ActualHostEffectReceipt(unittest.TestCase):
 def test_original_provider_effect_bytes(self):
  self.assertEqual(len(TEXT),539)
  self.assertEqual(hashlib.sha256(TEXT).hexdigest(),REC["actual_content_sha256"])
  self.assertEqual(REC["actual_content_sha256"],"8064c4586f15d94994701910d81f7564c7a47cba33add3919adbae540bd8597f")
  self.assertIn(b"CSOAI ACTUAL HOST-EFFECT",TEXT)
 def test_provider_commit_and_public_404_negative(self):
  self.assertEqual(REC["git_commit"],"41aa01f1e649eb265125bdc95bcb804d39ed46e7")
  self.assertEqual(REC["actual_public_http_status"],200)
  self.assertEqual(REC["negative_wrong_path_get_status"],404)
  self.assertFalse(REC["rejected_write_marker_found"])
  self.assertFalse(b"UNAUTHORIZED STALE-WRITE NEGATIVE CONTROL" in TEXT)
 def test_current_method_sha_matches_retained_source(self):
  self.assertEqual(hashlib.sha256(METHOD).hexdigest(),REC["method_source_sha256"])
  self.assertEqual(REC["method_source_sha256"],"e8c365f826183fc0847696bf0995cf7192438865a05e9bfdf17da8bc25276352")
 def test_no_gspc_meok_or_person_claim(self):
  self.assertTrue(REC["actual_external_storage_effect_observed"])
  for k in ("live_meok_executor_used","authenticated_human_approval_established",
            "independent_human_receiver_accepted","customer_acceptance_established",
            "gspc_measurement_admitted"):
   self.assertIs(REC[k],False)
 def test_stale_sha_rejection_is_reported_not_independently_issued(self):
  self.assertEqual(REC["stale_update_write"]["claimed_status"],409)
  self.assertEqual(REC["stale_update_write"]["supplied_wrong_blob_sha"],"0"*40)
  self.assertIn("not independently",REC["stale_update_write"]["observed_by"])
if __name__=="__main__":unittest.main()
