"""Canonical PARTIAL event contract for real external archived-source audit."""
import copy
import importlib.util
import json
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
HERE=ROOT/"scripts/research"
doc=json.loads((ROOT/"docs/research/rogue-ai-public-archive-20261124/observed-audit.json").read_text())
spec=importlib.util.spec_from_file_location("rogue_source_event",HERE/"rogue_ai_to_evidence_event.py")
method=importlib.util.module_from_spec(spec);spec.loader.exec_module(method)
fabric_spec=importlib.util.spec_from_file_location("fabric",ROOT/"packages/evidence-fabric/event.py")
fabric=importlib.util.module_from_spec(fabric_spec);fabric_spec.loader.exec_module(fabric)
class ExternalSourceEvent(unittest.TestCase):
  def test_canonical_event_validates_and_retains_source_authority_boundary(self):
    ev=method.build_source_review_event(doc)
    self.assertEqual(fabric.validate(ev),[])
    self.assertEqual(ev["state"],"PARTIAL")
    self.assertIsNone(ev["value"])
    self.assertEqual(ev["method"]["holder"],"csoai")
    self.assertEqual(ev["declared"]["original_source_holder"],"third_party:ROGUE-AI authors")
    self.assertFalse(ev["observed"]["actual_model_inference_by_csoai"])
    self.assertFalse(ev["observed"]["gspc_board_admitted"])
    self.assertFalse(ev["observed"]["external_human_receiver_accepted"])
    self.assertIsNone(ev["signature"])
    self.assertEqual(ev["anchors"]["ots"],"none")
  def test_verdict_partition_retained_without_promoting_no_control(self):
    ev=method.build_source_review_event(doc)
    d=ev["observed"]
    self.assertEqual(d["original_publisher_reproduced_yes"],96)
    self.assertEqual(d["initial_supported_and_final_yes"],32)
    self.assertEqual(d["initial_no_control_but_final_yes"],2)
    self.assertEqual(d["initial_not_reproduced_but_later_yes"],39)
    self.assertEqual(ev["event_id"],fabric.compute_event_id(ev))
  def test_false_authority_and_altered_original_digest_refused(self):
    for change in [
      {"reported_reproduced":108},
      {"csoai_gspc_result_admitted":True},
      {"original_paper_model_sessions_reexecuted":True},
      {"archive_original_bytes_sha256":"0"*64}
    ]:
      copy_=dict(doc);copy_.update(change)
      with self.assertRaises(ValueError):method.build_source_review_event(copy_)
  def test_source_verdict_forgery_refused(self):
    copy_=dict(doc)
    copy_["initial_verdict_by_final_reproduction"]={"supported:yes":96}
    with self.assertRaises(ValueError):method.build_source_review_event(copy_)
if __name__=="__main__":unittest.main()
