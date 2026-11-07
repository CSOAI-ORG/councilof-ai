import unittest,tempfile,json
from pathlib import Path
from release_rehearsal import snapshot,verified,rehearse
class RehearsalTests(unittest.TestCase):
 def setUp(self):self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);self.a=self.root/'a';self.b=self.root/'b';self.a.mkdir();self.b.mkdir();(self.a/'index.html').write_text('old fixture');(self.b/'index.html').write_text('new fixture');snapshot(self.a,self.root/'a.json');snapshot(self.b,self.root/'b.json')
 def tearDown(self):self.tmp.cleanup()
 def test_rollback_returns_exact_previous_snapshot(self):r=rehearse(self.root/'a.json',self.root/'b.json',self.root/'run');self.assertEqual(r['before'],r['restored']);self.assertNotEqual(r['before'],r['candidate']);self.assertEqual(r['production_rollbacks'],0)
 def test_interrupted_write_leaves_old_selector(self):self.assertTrue(rehearse(self.root/'a.json',self.root/'b.json',self.root/'run')['interrupted_write_preserved_selection'])
 def test_tampered_asset_rejected(self):
  (self.a/'index.html').write_text('changed')
  with self.assertRaises(ValueError):verified(self.root/'a.json')
 def test_added_file_rejected(self):
  (self.a/'extra').write_text('new')
  with self.assertRaises(ValueError):verified(self.root/'a.json')
 def test_metadata_sidecars_blocked(self):
  (self.a/'._index.html').write_text('metadata')
  with self.assertRaises(ValueError):snapshot(self.a,self.root/'meta.json')
 def test_previous_rehearsal_not_overwritten(self):
  rehearse(self.root/'a.json',self.root/'b.json',self.root/'run')
  with self.assertRaises(ValueError):rehearse(self.root/'a.json',self.root/'b.json',self.root/'run')
 def test_snapshot_does_not_modify_source(self):a=(self.a/'index.html').read_bytes();snapshot(self.a,self.root/'more.json');self.assertEqual(a,(self.a/'index.html').read_bytes())
if __name__=='__main__':unittest.main()
