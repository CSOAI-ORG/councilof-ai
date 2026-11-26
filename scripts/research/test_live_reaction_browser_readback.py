"""Validate retained ACTUAL Chrome observations without claiming to rerun the browser."""
import hashlib,json,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
P=ROOT/"docs/research/turkish-guard-observed-20261124"
R=json.loads((P/"live-browser-acceptance.json").read_text())
class PublicAcceptanceFacts(unittest.TestCase):
    def test_four_actual_external_hosts_and_viewports(self):
        self.assertEqual(R["schema"],"csoai.real-public-reaction-browser-readback/0.1")
        self.assertTrue(R["real_browser_visited"])
        self.assertTrue(R["all_passed"])
        self.assertEqual(len(R["journeys"]),4)
        ids={(j["host"],j["viewport"]["width"]) for j in R["journeys"]}
        self.assertEqual(ids,{
           ("https://councilof.ai",390),
           ("https://councilof.ai",1280),
           ("https://councilof-ai.pages.dev",390),
           ("https://councilof-ai.pages.dev",1280)})
    def test_exact_public_source_json_pinned(self):
        self.assertEqual(hashlib.sha256((P/"councilos-import.json").read_bytes()).hexdigest(),R["evidence_input_sha256"])
        self.assertEqual(R["evidence_input_sha256"],"221103a2cc7d8592e4dae2a80bd776252684211033f4e72890843b4c6ff81564")
        self.assertEqual(R["actual_observed_case_count"],2)
    def test_rejection_local_only_and_no_browser_failures(self):
        for j in R["journeys"]:
            self.assertEqual(j["status"],200)
            self.assertEqual(j["reaction_panel_count"],1)
            self.assertTrue(j["refusal_control_passed"])
            self.assertTrue(j["local_clear_passed"])
            self.assertFalse(j["horizontal_overflow"])
            self.assertEqual(j["network_requests_during_review"],0)
            self.assertEqual(j["page_errors"],[])
            self.assertTrue(j["passed"])
    def test_real_published_asset_bytes_match_across_hosts(self):
        x=R["observed_public_bundle_identity"]
        self.assertTrue(x["same_exact_asset_bytes"])
        self.assertTrue(x["both_contain_reaction_reviewer"])
        self.assertEqual(len(x["assets"]),2)
        for a in x["assets"]:
            self.assertEqual(a["http"],200)
            self.assertTrue(a["contains_reaction_tag"])
            self.assertEqual(a["bytes"],12207)
            self.assertEqual(a["sha256"],"68df16ab09b0a9d638ec9de98cdbc9526d7da418dc8a46f3949f0e32f206da75")
    def test_live_browser_does_not_imply_external_human_acceptance(self):
        self.assertIs(R["qualified_human_approval"],False)
        self.assertIs(R["independent_external_receiver_acceptance"],False)
        self.assertIs(R["paid_buyer_accepted"],False)
        self.assertIs(R["model_reinference_done_during_browser"],False)
    def test_original_exact_browser_method_pinned(self):
        meth=ROOT/"scripts/research/live_reaction_browser_readback.py"
        self.assertEqual(hashlib.sha256(meth.read_bytes()).hexdigest(),"5bb00225cfe06d80ebdae8b1bf19fd6d1f9edd80496f50dac54929a684ae0cd7")
if __name__=="__main__":unittest.main()
