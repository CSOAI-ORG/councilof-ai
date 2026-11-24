"""Ensure the pilot's real-evidence claims reproduce the retained measured denominators."""
import json,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
P=ROOT/"docs/research/turkish-guard-observed-20261124"
HTML=(ROOT/"public/pilots/agent-authority/index.html").read_text()
T=json.loads((P/"record.json").read_text())
M=json.loads((P/"protectai-paired-english-observation.json").read_text())
N=json.loads((P/"notinject-summary.json").read_text())
E=json.loads((P/"actual-github-host-observation.json").read_text())
class ActualProductClaims(unittest.TestCase):
 def test_actual_source_matches_metrics_in_marketing(self):
  self.assertEqual(T["rows"],3372)
  self.assertEqual(T["confusion"],{"tp":255,"fn":62,"tn":2768,"fp":287})
  self.assertIn("<strong>62</strong>",HTML)
  self.assertIn("<strong>287</strong>",HTML)
  self.assertIn("<strong>239</strong>",HTML)
  self.assertEqual(T["source_declared_subsets"]["task_instruction"]["fp"],239)
  self.assertEqual(M["n"],116)
  self.assertEqual(M["baseline_confusion"]["tp"],41)
  self.assertEqual(M["tested_confusion"]["tp"],22)
  self.assertIn("<strong>41/60</strong>",HTML)
  self.assertIn("<strong>22/60</strong>",HTML)
  self.assertEqual(N["total_benign"],339)
  self.assertEqual(N["false_alarms"],13)
  self.assertIn("<strong>13 false alarms among 339</strong>",HTML)
 def test_actual_public_provider_effect_and_negative_response(self):
  self.assertEqual(E["actual_public_http_status"],200)
  self.assertEqual(E["stale_update_write"]["claimed_status"],409)
  self.assertIn("<strong>200</strong>",HTML)
  self.assertIn("<strong>409</strong>",HTML)
  self.assertIn("not</strong> a qualified MEOK",HTML)
 def test_actual_before_old_fixture_and_source_links(self):
  self.assertLess(HTML.index('id="measured-20261124"'),HTML.index('id="evidence"'))
  self.assertIn('href="/dashboard/?tab=evidence-learning"',HTML)
  self.assertIn("https://github.com/CSOAI-ORG/councilof-ai/tree/master/docs/research/turkish-guard-observed-20261124",HTML)
  self.assertIn("older 20 November HITL experiment uses synthetic fixtures",HTML)
  self.assertIn("you must send it using your mail application",HTML.lower())
 def test_never_infers_human_or_buyer_acceptance_from_scores(self):
  self.assertIs(T["gspc_measurement_admitted"],False)
  self.assertIs(M["external_receiving_party_accepted"],False)
  self.assertIs(E["independent_human_receiver_accepted"],False)
  self.assertIn("No customer acceptance or payment is claimed",HTML)
  self.assertIn('name="robots" content="noindex,follow"',HTML)
if __name__=="__main__":unittest.main()
