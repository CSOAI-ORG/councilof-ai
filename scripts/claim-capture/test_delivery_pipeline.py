import unittest
import claim_capture as cc
import delivery_pipeline as dp

def row(value,identity='1',population='protocols'):
 claim={'id':identity,'tvl':value};core={'population':population,'subject_id':identity,'claim':claim}
 return dict(core,content_sha256=cc.sha(cc.encoded(core)))
def snapshot(rows,full=True,status='OK'):
 return {'run_id':'test','records':rows,'sources':[{'source':'protocols','coverage':'COMPLETE_UPSTREAM_RESPONSE' if full else 'PARTIAL_WINDOW','status':status}]}
class Tests(unittest.TestCase):
 def test_replay_is_unchanged(self):
  a=snapshot([row(100)]);r=dp.changes_between(a,a);self.assertEqual(r['counts'],{'UNCHANGED':1});self.assertEqual(r['events'],[])
 def test_drift_is_not_a_correction(self):
  r=dp.changes_between(snapshot([row(100)]),snapshot([row(120)]));e=r['events'][0];self.assertFalse(e['correction_asserted']);self.assertEqual(e['review_state'],'UNREVIEWED');self.assertEqual(e['numeric_deltas']['tvl']['difference'],20)
 def test_small_change_not_material(self):
  e=dp.changes_between(snapshot([row(100)]),snapshot([row(101)]))['events'][0];self.assertFalse(e['material_review_candidate'])
 def test_partial_sample_cannot_delete(self):
  r=dp.changes_between(snapshot([row(100)]),snapshot([],False));self.assertFalse(r['events'])
 def test_failed_source_cannot_delete(self):
  r=dp.changes_between(snapshot([row(100)]),snapshot([],True,'ERROR'));self.assertFalse(r['events'])
 def test_absence_is_not_delisting(self):
  r=dp.changes_between(snapshot([row(100)]),snapshot([]));self.assertFalse(r['events'][0]['delisting_asserted'])
 def test_new_is_not_changed(self):
  r=dp.changes_between(None,snapshot([row(100)]));self.assertEqual(r['counts'],{'NEW_OBSERVATION':1});self.assertFalse(r['events'])
 def test_secret_guard(self):
  with self.assertRaises(ValueError):dp.safe_for_publication(('hf_'+'x'*30).encode())
 def test_duplication_changes_merkle_root(self):
  self.assertNotEqual(cc.merkle_root([b'a',b'b',b'c']),cc.merkle_root([b'a',b'b',b'c',b'c']))
 def test_all_proofs_for_odd_trees(self):
  for n in range(1,35):
   leaves=[str(i).encode() for i in range(n)];root=cc.merkle_root(leaves).hex()
   for i in range(n):self.assertTrue(cc.verify_inclusion(leaves[i],cc.inclusion(leaves,i),root))
if __name__=='__main__':unittest.main(verbosity=2)
