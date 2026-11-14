import unittest,importlib.util,json,tempfile,hashlib
from pathlib import Path
spec=importlib.util.spec_from_file_location('definitions',Path(__file__).with_name('harness-definition-review.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class DefinitionTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name);d=self.root/m.INPUT;d.mkdir(parents=True);self.records={}
  for name in m.NAMES:
   obj={'schema':'fixture','generated_at':'2026-09-17','sources_bound_to_harness':[{'source':'GSPC board (22 axis slots)','status':'ACTIVE','goal_objects':['assurance']}],'adapters':[{'id':'fixture','source':'fixture source','tick':'daily'}],'canonical_object':['subject','evidence'],'goal_objects':['assurance'],'axes_measured_quotable':15,'sha256':'old'}
   raw=json.dumps(obj).encode();(d/name).write_bytes(raw);self.records[name]={'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw)}
  (d/'manifest.json').write_text(json.dumps({'files':self.records}))
 def tearDown(self):self.temp.cleanup()
 def test_structure_not_discarded(self):
  d=json.loads(m.generate(self.root)['public/interop/master-harness-index-v0.4.json']);self.assertEqual(d['canonical_object'],['subject','evidence']);self.assertEqual(d['sources_bound_to_harness'][0]['goal_objects'],['assurance']);self.assertEqual(d['adapters'][0]['id'],'fixture')
 def test_no_new_execution_or_measurement_is_claimed(self):
  for raw in m.generate(self.root).values():
   d=json.loads(raw);self.assertEqual(d['review']['new_measurements'],0);self.assertFalse(d['review']['permissions_granted']);self.assertIn('NOT_CURRENT_ASSESSMENT',d['sources_bound_to_harness'][0]['status'])
 def test_numeric_headline_is_replaced_with_reference(self):
  d=json.loads(m.generate(self.root)['public/interop/master-harness-index-v0.4.json']);self.assertIsNone(d['axes_measured_quotable']);self.assertNotIn('22 axis',d['sources_bound_to_harness'][0]['source']);self.assertEqual(d['sources_bound_to_harness'][0]['measurement_reference'],'/api/gspc')
 def test_current_values_do_not_claim_old_self_digest(self):self.assertNotIn('sha256',json.loads(m.generate(self.root)['public/interop/master-harness-index-v0.4.json']))
 def test_original_tampering_is_rejected(self):
  (self.root/m.INPUT/m.NAMES[0]).write_text('{}')
  with self.assertRaises(ValueError):m.generate(self.root)
 def test_deterministic_and_no_source_date_reset(self):
  a=m.generate(self.root);self.assertEqual(a,m.generate(self.root));self.assertEqual(json.loads(a['public/interop/master-harness-index-v0.4.json'])['generated_at'],'2026-09-17')
if __name__=='__main__':unittest.main()
