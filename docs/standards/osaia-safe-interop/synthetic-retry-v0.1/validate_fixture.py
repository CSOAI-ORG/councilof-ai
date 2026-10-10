import json,unittest
from pathlib import Path
HERE=Path(__file__).parent
def load(name):return json.loads((HERE/name).read_text())
def check(a,c,e):
    attempts=a['attempts'];obs=a['observations'];ops=c['provider_operations']
    assert len({x['id'] for x in attempts})==len(attempts)==e['attempts']
    assert len({x['id'] for x in obs})==len(obs)==e['observations']
    assert len({x['id'] for x in ops})==len(ops)==e['provider_operations']
    assert all(t['action_id']==a['logical_action']['id'] for t in attempts)
    assert all(o['attempt_id'] in {t['id'] for t in attempts} for o in obs)
    assert a['findings'][1]['supersedes']==a['findings'][0]['id']
    assert a['findings'][0]['external_effect_status']=='unknown'
    ev={x['id'] for x in c['evidence']}
    assert all(o['evidence_ref'] in ev for o in obs)
    assert all(x in ev for x in a['findings'][1]['basis'] if x in ('RCPT1','SINK1'))
    assert 'RCPT1' in ev and 'SINK1' in ev
    assert len({v for op in ops for v in op['effect_refs']})==e['synthetic_effects']
    assert c['custody']['external_effect_not_established_by_custody_alone'] is True
    return True
class Tests(unittest.TestCase):
 def setUp(self):
    self.a=load('scenario-input.json');self.c=load('verification-context.json');self.e=load('expected-output.json')
 def test_links_and_correction(self):self.assertTrue(check(self.a,self.c,self.e))
 def test_cannot_infer_two_executions(self):
    self.c['provider_operations'].append(dict(self.c['provider_operations'][0],id='OP2'))
    with self.assertRaises(AssertionError):check(self.a,self.c,self.e)
 def test_missing_effect_receipt(self):
    self.c['evidence']=[v for v in self.c['evidence'] if v['id']!='RCPT1']
    with self.assertRaises(AssertionError):check(self.a,self.c,self.e)
 def test_orphaned_observation(self):
    self.a['observations'][0]['attempt_id']='NO-SUCH-ATTEMPT'
    with self.assertRaises(AssertionError):check(self.a,self.c,self.e)
if __name__=='__main__':unittest.main()
