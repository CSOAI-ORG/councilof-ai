import contextlib, copy, importlib.util, io, json, sys, tempfile, unittest
from datetime import datetime,timezone
from pathlib import Path
from unittest.mock import patch
HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('audit_engine',HERE/'hourly_loop_engine.py');e=importlib.util.module_from_spec(spec);spec.loader.exec_module(e)
spec=importlib.util.spec_from_file_location('handoff_audit',HERE/'review_chain_audit.py');a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)

def fixture():
    manifest=json.loads((HERE/'loops.json').read_text());loops=manifest['loops']
    for loop in loops:
        if loop['probes']:loop['probes']=[{'kind':'file','path':loop['id']}]
    with tempfile.TemporaryDirectory() as tmp:
        root=Path(tmp);mf=root/'manifest.json';mf.write_text(json.dumps(manifest));state=root/'state'
        for hour in [1,2]:
            def probe(p,**kwargs):
                content=p['path']+('changed' if p['path']=='H-05' and hour==2 else 'stable')
                return {'state':'OBSERVED','source':p['path'],'sha256':e.sha(content.encode())}
            with patch.object(e,'run_probe',side_effect=probe),patch.object(e,'root_freshness_special'),patch.object(e,'axis_touch',return_value={'state':'FIXTURE'}),patch.object(e,'now',return_value=datetime(2026,9,28,hour,tzinfo=timezone.utc)),patch.object(sys,'argv',['e','--state',str(state),'--manifest',str(mf)]),contextlib.redirect_stdout(io.StringIO()):e.main()
        return json.loads((state/'latest.json').read_text()),[json.loads(s) for s in (state/'deep-candidates.jsonl').read_text().splitlines()],manifest

def rehash(r):
    r['content_hash']=a.sha(a.canonical({k:v for k,v in r.items() if k!='content_hash'}))

def rehash_receipt(r,row):
    row['receipt_hash']=a.sha(a.canonical({k:v for k,v in row.items() if k!='receipt_hash'}));rehash(r)

class ReadbackTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):cls.base=fixture()
    def setUp(self):self.r,self.q,self.m=copy.deepcopy(self.base)
    def audit(self):return a.audit_review_chain(self.r,self.q,self.m)
    def fail(self,code):
        with self.assertRaisesRegex(a.AuditError,code):self.audit()
    def amend_job(self,index,**updates):
        job=self.r['review_chain']['jobs'][index];job.update(updates)
        for q in self.q:
            if q['candidate_id']==job['candidate_id']:q.update(updates)
        rehash(self.r);return job
    def test_genuine_engine_fixture_verifies(self):
        result=self.audit();self.assertEqual(result['jobs_checked'],4);self.assertEqual(len(result['ready_for_review']),1);self.assertEqual(len(result['waiting_for_upstream_review']),3)
        self.assertFalse(result['completion']['work_executed']);self.assertIsNone(result['completion']['reviews_completed'])
    def test_outer_digest_mutation_rejected(self):self.r['observed_loops']=0;self.fail('REPORT_DIGEST_MISMATCH')
    def test_receipt_mutation_rejected_even_after_outer_rehash(self):self.r['receipts'][0]['name']='changed';rehash(self.r);self.fail('RECEIPT_DIGEST_MISMATCH')
    def test_merkle_mismatch_rejected(self):self.r['hourly_merkle_root']='a'*64;rehash(self.r);self.fail('MERKLE_BINDING_MISMATCH')
    def test_queue_missing_current_job_rejected(self):self.q.pop();self.fail('QUEUE_RECORD_MISSING_OR_DUPLICATED')
    def test_queue_duplicate_current_job_rejected(self):self.q.append(copy.deepcopy(self.q[0]));self.fail('QUEUE_RECORD_MISSING_OR_DUPLICATED')
    def test_queue_conflicting_body_rejected(self):self.q[0]['reason']='other';self.fail('QUEUE_REPORT_MISMATCH')
    def test_authority_cannot_be_fabricated_with_rehash(self):self.amend_job(0,execution='performed');self.fail('JOB_AUTHORITY_MISMATCH')
    def test_customer_approval_not_inferred_from_queue(self):self.amend_job(0,state='COMPLETED');self.fail('JOB_AUTHORITY_MISMATCH')
    def test_wrong_action_rejected(self):self.amend_job(0,action='execute_trade');self.fail('JOB_ACTION_MISMATCH')
    def test_wrong_work_id_rejected(self):self.amend_job(0,work_key='a'*64);self.fail('WORK_ID_MISMATCH')
    def test_wrong_source_receipt_rejected(self):self.amend_job(0,source_receipt_hash='b'*64);self.fail('JOB_SOURCE_MISMATCH')
    def test_parent_review_cannot_be_removed(self):self.amend_job(1,depends_on_candidate_ids=[]);self.fail('PARENT_REVIEW_MISMATCH')
    def test_waiting_cannot_be_claimed_ready(self):self.amend_job(1,readiness='READY_FOR_REVIEW');self.fail('READINESS_MISMATCH')
    def test_reordered_jobs_cannot_bypass_parent(self):
        self.r['review_chain']['jobs'].reverse();job=self.r['review_chain']['jobs'][0];job.update(depends_on_candidate_ids=[],readiness='READY_FOR_REVIEW')
        self.q=copy.deepcopy(self.r['review_chain']['jobs']);rehash(self.r);self.fail('REVIEW_ORDER_MISMATCH')
    def test_foreign_trigger_rejected(self):self.amend_job(0,trigger_transitions={'H-05':'a'*64});self.fail('INVALID_TRIGGER')
    def test_foreign_graph_rejected(self):self.m['review_handoffs']['H-05'].append('H-38');self.fail('GRAPH_ID_MISMATCH')
    def test_false_counts_rejected_after_rehash(self):self.r['changed_loops']+=1;rehash(self.r);self.fail('REPORTED_COUNT_MISMATCH')
    def test_legacy_queue_preserved_not_promoted(self):
        self.q.insert(0,{'candidate_id':'legacy','state':'QUEUED_INTERNAL_REVIEW'});raw=a.canonical(self.q)
        result=self.audit();self.assertEqual(result['legacy_queue_records'],1);self.assertEqual(a.canonical(self.q),raw)
    def test_duplicate_json_keys_rejected(self):
        with self.assertRaisesRegex(a.AuditError,'DUPLICATE_JSON_KEY'):a.strict_json(b'{"state":1,"state":2}')
    def test_nonfinite_json_rejected(self):
        with self.assertRaisesRegex(a.AuditError,'NONFINITE_JSON'):a.strict_json(b'{"x":NaN}')
    def test_oversize_input_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/'x';p.write_bytes(b'x'*20)
            with self.assertRaisesRegex(a.AuditError,'INPUT_TOO_LARGE'):a.read_bounded(p,10)
    def test_read_path_changes_no_bytes_and_calls_no_probe(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp);mf=p/'loops.json';mf.write_text(json.dumps(self.m));(p/'engine.lock').touch();(p/'latest.json').write_text(json.dumps(self.r));(p/'deep-candidates.jsonl').write_text(''.join(json.dumps(j)+'\n' for j in self.q))
            before={f.name:f.read_bytes() for f in p.iterdir()}
            with patch.object(e,'run_probe') as network:result=a.audit_paths(p,mf)
            network.assert_not_called();self.assertEqual(result['jobs_checked'],4);self.assertEqual(before,{f.name:f.read_bytes() for f in p.iterdir()})
    def test_missing_input_does_not_create_new_state(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/'absent'
            with self.assertRaises(OSError):a.audit_paths(p,p/'loops.json')
            self.assertFalse(p.exists())
    def test_invalid_content_returns_fail_closed_cli(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp);(p/'engine.lock').touch();(p/'latest.json').write_text('{}');(p/'deep-candidates.jsonl').write_text('');(p/'loops.json').write_text(json.dumps(self.m))
            with patch.object(sys,'argv',['audit','--state',str(p),'--manifest',str(p/'loops.json')]),contextlib.redirect_stdout(io.StringIO()) as output:code=a.main()
            self.assertEqual(code,2);self.assertEqual(json.loads(output.getvalue())['state'],'HOLD_UNCHECKABLE')
if __name__=='__main__':unittest.main()
