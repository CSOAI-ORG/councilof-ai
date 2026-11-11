import copy,json,unittest
from join_contract import join,loads
NOW='2026-11-10T04:00:00Z'
C={'task_id':'synthetic-colour','input_sha256':'a'*64,'label_schema':['RED','BLUE'],'source_snapshot':'2026-11-10T03:00:00Z','dependency_root':'b'*64}
def fixture():
 return [{**copy.deepcopy(C),'component_id':f'expert-{i}','revision':str(i+1)*64,'result_sha256':str(i+3)*64,'probabilities':p,'evidence_kind':'PREDICTION','state':'COMPLETE','valid_until':'2026-11-10T05:00:00Z','dependencies_complete':True,'fault_domain':'shared-admin'} for i,p in enumerate([[.8,.2],[.6,.4]])]
class JoinTests(unittest.TestCase):
 def mutate(self,key,value):
  r=fixture();r[0][key]=value
  with self.assertRaises(ValueError):join(r,C,now=NOW)
 def test_valid(self):
  r=join(fixture(),C,now=NOW);self.assertEqual(r['label'],'RED');self.assertAlmostEqual(r['probabilities'][0],.7)
 def test_no_authority(self):
  r=join(fixture(),C,now=NOW);self.assertFalse(r['authorises_execution']);self.assertFalse(r['gspc_admitted']);self.assertEqual(r['signature_state'],'UNSIGNED')
 def test_same_admin_not_independent(self):
  r=join(fixture(),C,now=NOW);self.assertEqual(r['declared_fault_domains'],1);self.assertEqual(r['independence_status'],'NOT_ESTABLISHED')
 def test_tie_abstains(self):
  r=fixture();r[1]['probabilities']=[.2,.8];self.assertEqual(join(r,C,now=NOW)['state'],'ABSTAIN')
 def test_low_margin_abstains(self):
  r=fixture();r[0]['probabilities']=[.51,.49];r[1]['probabilities']=[.53,.47];self.assertIsNone(join(r,C,now=NOW)['label'])
 def test_wrong_task(self):self.mutate('task_id','other')
 def test_wrong_input(self):self.mutate('input_sha256','c'*64)
 def test_reordered_labels(self):self.mutate('label_schema',['BLUE','RED'])
 def test_changed_dependency(self):self.mutate('dependency_root','c'*64)
 def test_source_change(self):self.mutate('source_snapshot','2026-11-10T02:00:00Z')
 def test_expiry_boundary(self):self.mutate('valid_until',NOW)
 def test_expired(self):self.mutate('valid_until','2026-11-09T00:00:00Z')
 def test_unknown_complete(self):self.mutate('dependencies_complete',None)
 def test_false_complete(self):self.mutate('dependencies_complete',False)
 def test_string_complete(self):self.mutate('dependencies_complete','true')
 def test_integer_complete(self):self.mutate('dependencies_complete',1)
 def test_naive_expiry(self):self.mutate('valid_until','2026-11-10T05:00:00')
 def test_hypothesis_not_observation(self):self.mutate('evidence_kind','OBSERVATION')
 def test_timeout_not_vote(self):self.mutate('state','TIMEOUT')
 def test_partial_not_complete(self):self.mutate('state','PARTIAL')
 def test_unknown_probability(self):self.mutate('probabilities',[None,1])
 def test_nan_probability(self):self.mutate('probabilities',[float('nan'),1])
 def test_boolean_probability(self):self.mutate('probabilities',[True,False])
 def test_infinite_probability(self):self.mutate('probabilities',[float('inf'),0])
 def test_negative_probability(self):self.mutate('probabilities',[-.1,1.1])
 def test_wrong_mass(self):self.mutate('probabilities',[.8,.4])
 def test_wrong_dimension(self):self.mutate('probabilities',[1])
 def test_unpinned_revision(self):self.mutate('revision','latest')
 def test_duplicate_component(self):self.mutate('component_id','expert-1')
 def test_duplicate_receipt(self):self.mutate('result_sha256','4'*64)
 def test_unrecognized_authority_field(self):
  r=fixture();r[0]['execution_authorized']=True
  with self.assertRaises(ValueError):join(r,C,now=NOW)
 def test_missing_field(self):
  r=fixture();del r[0]['valid_until']
  with self.assertRaises(ValueError):join(r,C,now=NOW)
 def test_future_source(self):
  c=copy.deepcopy(C);c['source_snapshot']='2030-01-01T00:00:00Z'
  with self.assertRaises(ValueError):join(fixture(),c,now=NOW)
 def test_strict_json_duplicates(self):
  with self.assertRaises(ValueError):loads(b'{"x":1,"x":2}')
 def test_strict_json_nan_and_overflow(self):
  for x in [b'{"x":NaN}',b'{"x":1e999}']:
   with self.assertRaises(ValueError):loads(x)
 def test_size_bound(self):
  with self.assertRaises(ValueError):loads(b' '*65537)
 def test_max_components(self):
  with self.assertRaises(ValueError):join(fixture()*9,C,now=NOW)
 def test_weight_types(self):
  for w in [[True,1],[float('inf'),1],[0,1],[-1,1],[1]]:
   with self.assertRaises(ValueError):join(fixture(),C,now=NOW,weights=w)
 def test_weight_scaling(self):
  a=join(fixture(),C,now=NOW,weights=[1,2]);b=join(fixture(),C,now=NOW,weights=[10,20]);self.assertEqual(a['probabilities'],b['probabilities'])
 def test_inputs_unchanged(self):
  r=fixture();b=copy.deepcopy(r);join(r,C,now=NOW);self.assertEqual(r,b)
 def test_unchanged_replay(self):self.assertEqual(join(fixture(),C,now=NOW),join(fixture(),C,now=NOW))
 def test_changed_now_not_new_observation(self):
  a=join(fixture(),C,now=NOW);b=join(fixture(),C,now='2026-11-10T04:00:01Z');self.assertEqual(a['inputs'],b['inputs']);self.assertNotEqual(a['review_sha256'],b['review_sha256'])
if __name__=='__main__':unittest.main(verbosity=2)
