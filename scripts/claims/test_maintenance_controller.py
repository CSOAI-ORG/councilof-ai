import importlib.util, json, tempfile, unittest
from pathlib import Path
P=Path(__file__).with_name("maintenance_controller.py")
S=importlib.util.spec_from_file_location("mc",P); mc=importlib.util.module_from_spec(S); S.loader.exec_module(mc)
class T(unittest.TestCase):
    def test_digest_change_triggers_registry_bounded_rerun(self):
        r={"run_id":"r1","observed_changes_requiring_review":[{"claim":"CL-1","kind":"source_digest_differs_from_the_recorded_read"}]}
        p=mc.plan(r); self.assertEqual(p["action"],"REMEASURE_REGISTRY"); self.assertEqual(p["impacted_claims"],["CL-1"]); self.assertEqual(set(p["scope"]),set(mc.KNOWN))
    def test_transport_failure_is_not_promoted_to_change(self):
        r={"observed_changes_requiring_review":[{"claim":"CL-1","kind":"source_not_reachable_this_run"}]}
        p=mc.plan(r); self.assertEqual(p["action"],"NO_REMEASUREMENT"); self.assertEqual(len(p["held_for_review"]),1)
    def test_unknown_claim_fails_closed_to_review(self):
        r={"observed_changes_requiring_review":[{"claim":"ZZ-9","kind":"source_digest_differs_from_the_recorded_read"}]}
        p=mc.plan(r); self.assertEqual(p["action"],"NO_REMEASUREMENT"); self.assertEqual(p["held_for_review"][0]["claim"],"ZZ-9")
if __name__=="__main__": unittest.main()
