from copy import deepcopy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec=importlib.util.spec_from_file_location('programme_gate',Path(__file__).with_name('programme_gate.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class ProgrammeTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
        self.task={'id':'R01','phase':'P1','lane':'release','title':'Fixture task','deliverable':'Fixture artifact',
                   'acceptance':'Fixture assertions','reuse':'Fixture existing source','collision_group':'release',
                   'depends_on':[],'required_approvals':[],'priority':'P0','completion_scope':'PRIVATE','evidence':[]}
        self.plan={'schema':m.SCHEMA,'phases':[{'id':'P1'}],'lanes':[{'id':'release'},{'id':'research'}],'tasks':[self.task]}
    def tearDown(self): self.tmp.cleanup()
    def evidence(self,body=None):
        raw=json.dumps(body or {'state':'PASS'}).encode();(self.root/'receipt.json').write_bytes(raw)
        return {'path':'receipt.json','sha256':hashlib.sha256(raw).hexdigest(),
                'assertions':[{'path':['state'],'equals':'PASS'}],'scope_note':'Fixture local test only'}
    def test_no_evidence_means_planned_not_done(self):
        r=m.project(self.plan,self.root,{});self.assertEqual(r['tasks'][0]['state'],'READY_PRIVATE_PLAN_ONLY');self.assertEqual(r['executed_by_this_command'],0)
    def test_valid_receipt_only_evidences_its_scope(self):
        self.task['evidence']=[self.evidence()];r=m.project(self.plan,self.root,{});self.assertEqual(r['tasks'][0]['state'],'EVIDENCED_SCOPE');self.assertFalse(r['production_ready'])
    def test_tamper_not_a_pass(self):
        self.task['evidence']=[self.evidence()];(self.root/'receipt.json').write_text('{}');self.assertEqual(m.project(self.plan,self.root,{})['tasks'][0]['state'],'EVIDENCE_INVALID')
    def test_missing_receipt_not_a_pass(self):
        self.task['evidence']=[self.evidence()];(self.root/'receipt.json').unlink();self.assertEqual(m.project(self.plan,self.root,{})['tasks'][0]['state'],'EVIDENCE_INVALID')
    def test_assertion_must_match(self):
        self.task['evidence']=[self.evidence({'state':'FAILED'})];self.assertEqual(m.project(self.plan,self.root,{})['tasks'][0]['state'],'EVIDENCE_INVALID')
    def test_approval_false_holds_public_action(self):
        self.task['required_approvals']=['publish'];self.assertEqual(m.project(self.plan,self.root,{'policy':{'publish':False}})['tasks'][0]['state'],'AUTHORITY_HELD')
    def test_missing_approval_is_not_yes(self):
        self.task['required_approvals']=['sign'];self.assertEqual(m.project(self.plan,self.root,{})['tasks'][0]['state'],'AUTHORITY_HELD')
    def test_string_approval_is_not_boolean_true(self):
        self.task['required_approvals']=['publish'];self.assertEqual(m.project(self.plan,self.root,{'publish':'true'})['tasks'][0]['state'],'AUTHORITY_HELD')
    def test_does_not_grant_authority_even_when_readiness_true(self):
        self.task['required_approvals']=['publish'];r=m.project(self.plan,self.root,{'publish':True});self.assertFalse(r['grants_authority']);self.assertFalse(r['production_ready'])
    def test_dependency_needs_evidence_not_readiness(self):
        self.plan['tasks'].append({**deepcopy(self.task),'id':'R02','depends_on':['R01']});r=m.project(self.plan,self.root,{});self.assertEqual(r['tasks'][1]['state'],'DEPENDENCY_BLOCKED')
    def test_dependency_unlocks_on_matching_receipt(self):
        self.task['evidence']=[self.evidence()];self.plan['tasks'].append({**deepcopy(self.task),'id':'R02','evidence':[],'depends_on':['R01']});r=m.project(self.plan,self.root,{});self.assertEqual(r['tasks'][1]['state'],'READY_PRIVATE_PLAN_ONLY')
    def test_duplicate_task_rejected(self):
        self.plan['tasks'].append(deepcopy(self.task))
        with self.assertRaises(ValueError):m.validate(self.plan)
    def test_unknown_dependency_rejected(self):
        self.task['depends_on']=['R99']
        with self.assertRaises(ValueError):m.validate(self.plan)
    def test_cycle_rejected(self):
        self.task['depends_on']=['R02'];self.plan['tasks'].append({**deepcopy(self.task),'id':'R02','depends_on':['R01']})
        with self.assertRaises(ValueError):m.validate(self.plan)
    def test_path_traversal_rejected(self):
        self.task['evidence']=[{**self.evidence(),'path':'../private.json'}]
        with self.assertRaises(ValueError):m.validate(self.plan)
    def test_absolute_path_rejected(self):
        self.task['evidence']=[{**self.evidence(),'path':'/etc/passwd'}]
        with self.assertRaises(ValueError):m.validate(self.plan)
    def test_symlink_receipt_rejected(self):
        e=self.evidence();(self.root/'other.json').write_bytes((self.root/'receipt.json').read_bytes());(self.root/'receipt.json').unlink();(self.root/'receipt.json').symlink_to(self.root/'other.json');self.assertFalse(m.verify_receipt(e,self.root)[0])
    def test_duplicate_json_key_rejected(self):
        p=self.root/'bad.json';p.write_text('{"a":1,"a":2}')
        with self.assertRaises(ValueError):m.load_json(p)
    def test_parallel_selection_never_two_writers_for_group(self):
        self.plan['tasks'].append({**deepcopy(self.task),'id':'R02','lane':'research'});r=m.project(self.plan,self.root,{});self.assertEqual(len(r['suggested_parallel_private_tasks']),1)
    def test_independent_lanes_can_run_in_parallel(self):
        self.plan['tasks'].append({**deepcopy(self.task),'id':'R02','lane':'research','collision_group':'research'});r=m.project(self.plan,self.root,{});self.assertEqual(len(r['suggested_parallel_private_tasks']),2)
    def test_real_programme_has_valid_dependency_graph(self):
        candidates=[Path(__file__).with_name('CSOAI_EXECUTION_BACKLOG_2026-09-18.json'),Path(__file__).resolve().parents[2]/'docs/operations/GSPC_EXECUTION_PROGRAMME_2026-09-18.json']
        p=next((p for p in candidates if p.exists()),None)
        self.assertIsNotNone(p,'Real programme fixture required')
        self.assertEqual(sum(map(len,m.validate(m.load_json(p)))),65)

if __name__=='__main__':unittest.main()
