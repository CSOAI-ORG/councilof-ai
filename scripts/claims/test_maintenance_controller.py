import importlib.util, json, subprocess, sys, tempfile, unittest
from pathlib import Path
P=Path(__file__).with_name("maintenance_controller.py")
S=importlib.util.spec_from_file_location("mc",P); mc=importlib.util.module_from_spec(S); S.loader.exec_module(mc)
class T(unittest.TestCase):
    def test_digest_change_triggers_registry_bounded_rerun(self):
        r={"run_id":"r1","observed_changes_requiring_review":[{"claim":"CL-1","kind":"source_digest_differs_from_the_recorded_read"}]}
        p=mc.plan(r); self.assertEqual(p["action"],"REMEASURE_REGISTRY"); self.assertEqual(p["impacted_claims"],["CL-1"]); self.assertEqual(p["remeasurement_scope"],["CL-1"]); self.assertEqual(set(p["assembly_scope"]),set(mc.KNOWN))
    def test_transport_failure_is_not_promoted_to_change(self):
        r={"observed_changes_requiring_review":[{"claim":"CL-1","kind":"source_not_reachable_this_run"}]}
        p=mc.plan(r); self.assertEqual(p["action"],"NO_REMEASUREMENT"); self.assertEqual(len(p["held_for_review"]),1)
    def test_unknown_claim_fails_closed_to_review(self):
        r={"observed_changes_requiring_review":[{"claim":"ZZ-9","kind":"source_digest_differs_from_the_recorded_read"}]}
        p=mc.plan(r); self.assertEqual(p["action"],"NO_REMEASUREMENT"); self.assertEqual(p["held_for_review"][0]["claim"],"ZZ-9")
    def test_carry_forward_round_trip_preserves_measurements(self):
        repo=Path(__file__).resolve().parents[2]
        prior=repo/"public/claims/claimreg-ondo-chainlink-2026-09-22-rev2.json"
        prior_doc=json.loads(prior.read_text())
        with tempfile.TemporaryDirectory() as td:
            td=Path(td); run=td/"run"; out=td/"next.json"
            seeded=mc.seed_carry_forward(prior_doc,run,set())
            self.assertEqual(set(seeded),set(mc.KNOWN))
            cp=subprocess.run([sys.executable,str(repo/"scripts/claims/build_rev2.py"),str(run),str(out),"--prior",str(prior)],cwd=repo,text=True,capture_output=True)
            self.assertEqual(cp.returncode,0,cp.stdout+cp.stderr)
            checked=mc.verify_carry_forward(prior_doc,json.loads(out.read_text()),set())
            self.assertEqual(set(checked),set(mc.KNOWN))
if __name__=="__main__": unittest.main()
