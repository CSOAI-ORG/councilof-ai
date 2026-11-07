import contextlib,copy,importlib.util,io,json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('candidate_engine',HERE/'hourly_loop_engine.py'); e=importlib.util.module_from_spec(spec);spec.loader.exec_module(e)
class Response:
    def __init__(self,body,status=200):self.body=body;self.status=status;self.headers={};self.read_sizes=[]
    def __enter__(self):return self
    def __exit__(self,*a):return False
    def read(self,n=-1):self.read_sizes.append(n);return self.body if n<0 else self.body[:n]
GOOD={'state':'OBSERVED','fingerprint':'a'*64}
class SnapshotDependencyTests(unittest.TestCase):
    def test_snapshot_reuse_one_network_acquisition(self):
        b=e.HttpSnapshotBatch();s={'url':'https://example.invalid/x'}
        with patch.object(e.urllib.request,'urlopen',return_value=Response(b'first')) as call:
            a=e.http_probe(s,snapshots=b);c=e.http_probe(s,snapshots=b)
        self.assertEqual(call.call_count,1);self.assertEqual(a,c);self.assertEqual(b.fetch_count,1)
    def test_separate_runs_do_not_share_cache(self):
        with patch.object(e.urllib.request,'urlopen',side_effect=[Response(b'a'),Response(b'b')]) as call:
            a=e.http_probe({'url':'https://e.invalid'});b=e.http_probe({'url':'https://e.invalid'})
        self.assertEqual(call.call_count,2);self.assertNotEqual(a['sha256'],b['sha256'])
    def test_allowed_status_is_applied_per_consumer(self):
        b=e.HttpSnapshotBatch()
        with patch.object(e.urllib.request,'urlopen',return_value=Response(b'offer',402)) as call:
            a=e.http_probe({'url':'https://e.invalid','allowed_status':[402]},snapshots=b)
            c=e.http_probe({'url':'https://e.invalid','allowed_status':[200]},snapshots=b)
        self.assertEqual(call.call_count,1);self.assertEqual(a['state'],'OBSERVED');self.assertEqual(c['state'],'INCONCLUSIVE')
    def test_mutating_one_receipt_does_not_mutate_snapshot(self):
        b=e.HttpSnapshotBatch()
        with patch.object(e.urllib.request,'urlopen',return_value=Response(b'raw')):
            a=e.http_probe({'url':'https://e.invalid'},snapshots=b);a['sha256']='bad'
            c=e.http_probe({'url':'https://e.invalid'},snapshots=b)
        self.assertEqual(c['sha256'],e.sha(b'raw'));self.assertNotIn('_body',c)
    def test_failed_read_not_retried_within_batch(self):
        b=e.HttpSnapshotBatch()
        with patch.object(e.urllib.request,'urlopen',side_effect=TimeoutError('fixture')) as call:
            for _ in range(3):r=e.http_probe({'url':'https://e.invalid'},snapshots=b)
        self.assertEqual(call.call_count,1);self.assertEqual(r['state'],'INCONCLUSIVE')
    def test_oversize_is_inconclusive_and_not_retained(self):
        b=e.HttpSnapshotBatch();r=Response(b'x'*(e.MAX_HTTP_BYTES+1))
        with patch.object(e.urllib.request,'urlopen',return_value=r):v=e.http_probe({'url':'https://e.invalid'},snapshots=b)
        self.assertEqual(v['state'],'INCONCLUSIVE');self.assertEqual(b.retained_bytes,0);self.assertEqual(r.read_sizes,[e.MAX_HTTP_BYTES+1])
    def test_cumulative_snapshot_budget_fails_closed(self):
        b=e.HttpSnapshotBatch(max_bytes=5)
        with patch.object(e.urllib.request,'urlopen',side_effect=[Response(b'1234'),Response(b'5678')]):
            a=e.http_probe({'url':'https://e.invalid/1'},snapshots=b);c=e.http_probe({'url':'https://e.invalid/2'},snapshots=b)
        self.assertEqual(a['state'],'OBSERVED');self.assertEqual(c['reason'],'snapshot_batch_budget_exceeded');self.assertEqual(b.retained_bytes,4)
    def test_snapshot_budget_rejects_boolean_and_negative(self):
        for v in [True,-1,'32']:
            with self.subTest(v=v),self.assertRaises(ValueError):e.HttpSnapshotBatch(v)
    def test_axis_derived_fields_bind_exact_hashed_body(self):
        body=json.dumps({'axes':[{'axis':'a','status':'MEASURED'}]}).encode();later=b'{"axes":[]}'
        with patch.object(e.urllib.request,'urlopen',side_effect=[Response(body),Response(later)]) as call:r=e.axis_touch()
        self.assertEqual(call.call_count,1);self.assertEqual(r['sha256'],e.sha(body));self.assertEqual(r['axis_count'],1)
    def test_axis_reuses_prior_same_run_observation(self):
        b=e.HttpSnapshotBatch();body=b'{"axes":[]}'
        with patch.object(e.urllib.request,'urlopen',return_value=Response(body)) as call:
            a=e.http_probe({'url':'https://councilof.ai/api/gspc'},snapshots=b);r=e.axis_touch(snapshots=b)
        self.assertEqual(call.call_count,1);self.assertEqual(r['sha256'],a['sha256'])
    def test_bad_axis_shape_is_unknown_not_empty_success(self):
        for body in [b'{}',b'{"axes":[false]}',b'{"axes":null}',b'not-json']:
            with self.subTest(body=body),patch.object(e.urllib.request,'urlopen',return_value=Response(body)):
                r=e.axis_touch();self.assertEqual(r['state'],'INCONCLUSIVE');self.assertIsNone(r['axis_count'])
    def test_root_freshness_uses_same_digest_bearing_snapshot(self):
        b=e.HttpSnapshotBatch();body=b'{"as_of":"2026-09-22T00:00:00Z"}'
        with patch.object(e.urllib.request,'urlopen',side_effect=[Response(body),Response(b'{"as_of":"2099-01-01T00:00:00Z"}')]) as call:
            p=e.http_probe({'url':'https://councilof.ai/root.json'},snapshots=b);r={'id':'H-01'};e.root_freshness_special(r,snapshots=b)
        self.assertEqual(call.call_count,1);self.assertEqual(r['freshness_source_sha256'],p['sha256']);self.assertEqual(r['source_as_of'],'2026-09-22T00:00:00Z')
    def test_root_missing_time_is_explicitly_inconclusive(self):
        with patch.object(e.urllib.request,'urlopen',return_value=Response(b'{}')):r={'id':'H-01'};e.root_freshness_special(r)
        self.assertEqual(r['freshness_state'],'INCONCLUSIVE')
    def test_root_without_timezone_is_not_fresh(self):
        with patch.object(e.urllib.request,'urlopen',return_value=Response(b'{"as_of":"2026-09-28T00:00:00"}')):r={'id':'H-01'};e.root_freshness_special(r)
        self.assertEqual(r['freshness_state'],'INCONCLUSIVE')
    def test_failed_upstream_fingerprint_is_not_observed(self):
        r=e.classify_loop({'depends_on':['A']},[],{'A':{**GOOD,'state':'INCONCLUSIVE'}})
        self.assertEqual(r,('INCONCLUSIVE',['A']))
    def test_own_success_does_not_override_failed_dependency(self):
        state,blocked=e.classify_loop({'depends_on':['A']},[{'state':'OBSERVED'}],{'A':{**GOOD,'state':'INCONCLUSIVE'}})
        self.assertEqual(state,'INCONCLUSIVE');self.assertEqual(blocked,['A'])
    def test_transitive_failure_stays_inconclusive(self):
        s,_=e.classify_loop({'depends_on':['A']},[],{'A':{**GOOD,'state':'INCONCLUSIVE'}})
        t,b=e.classify_loop({'depends_on':['B']},[],{'B':{**GOOD,'state':s}})
        self.assertEqual(t,'INCONCLUSIVE');self.assertEqual(b,['B'])
    def test_missing_or_malformed_dependency_never_passes(self):
        for v in [None,{}, {'state':'OBSERVED','fingerprint':'x'}, {'state':'OBSERVED','fingerprint':'G'*64}]:
            with self.subTest(v=v):self.assertEqual(e.classify_loop({'depends_on':['A']},[],{'A':v})[0],'INCONCLUSIVE')
    def test_empty_unobserved_leaf_does_not_pass(self):self.assertEqual(e.classify_loop({},[],{})[0],'INCONCLUSIVE')
    def test_good_dependency_and_probe_pass(self):self.assertEqual(e.classify_loop({'depends_on':['A']},[{'state':'OBSERVED'}],{'A':GOOD}),('OBSERVED',[]))
    def test_existing_manifest_is_dependency_ordered(self):e.validate_loop_plan(json.loads((HERE/'loops.json').read_text())['loops'])
    def test_bad_plan_rejected_before_io(self):
        base=json.loads((HERE/'loops.json').read_text())['loops']
        bad=[]
        x=copy.deepcopy(base);x[1]['id']=x[0]['id'];bad.append(x)
        x=copy.deepcopy(base);x[0]['depends_on']=['H-02'];bad.append(x)
        x=copy.deepcopy(base);x[0]['depends_on']=['missing'];bad.append(x)
        x=copy.deepcopy(base);x[1]['depends_on']=['H-01','H-01'];bad.append(x)
        x=copy.deepcopy(base);x[1]['depends_on']='H-01';bad.append(x)
        with patch.object(e.urllib.request,'urlopen') as call:
            for x in bad:
                with self.subTest(x=x[0]),self.assertRaises(ValueError):e.validate_loop_plan(x)
        call.assert_not_called()
    def test_complete_mock_run_fetches_19_not_30(self):
        report,calls=run_fixture(e)
        self.assertEqual(report['observed_loops'],40);self.assertEqual(calls,19);self.assertEqual(report['acquisition']['http_requests'],19)
        self.assertNotIn('_snapshots',json.dumps(report));self.assertEqual(report['execution'],'disabled')
    def test_inconclusive_root_blocks_dependents_and_candidates(self):
        report,_=run_fixture(e,fail_root=True,seed_success=True)
        rows={r['id']:r for r in report['receipts']}
        self.assertEqual(rows['H-01']['state'],'INCONCLUSIVE');self.assertEqual(rows['H-29']['state'],'INCONCLUSIVE');self.assertEqual(rows['H-40']['state'],'INCONCLUSIVE')
        self.assertIn('H-01',rows['H-29']['blocked_dependencies']);self.assertEqual(report['execution'],'disabled')

def run_fixture(mod,fail_root=False,seed_success=False):
    manifest=json.loads((HERE/'loops.json').read_text()); statuses={p['url']:(p.get('allowed_status') or [200])[0] for l in manifest['loops'] for p in l.get('probes',[]) if p.get('kind')=='http'}
    calls=[]
    def response(request,**kwargs):
        url=request.full_url;calls.append(url)
        if fail_root and url=='https://councilof.ai/root.json':raise TimeoutError('root-fixture')
        obj=({'as_of':'2026-09-22T00:00:00Z'} if url.endswith('/root.json') else {'axes':[{'axis':'a','status':'MEASURED'}]} if url.endswith('/api/gspc') else {'fixture_url':url})
        return Response(json.dumps(obj).encode(),statuses.get(url,200))
    def local(spec):return {'kind':spec['kind'],'source':spec.get('path') or spec.get('pattern'),'state':'OBSERVED','sha256':'a'*64}
    with tempfile.TemporaryDirectory() as t:
        state=Path(t)/'state'; mf=Path(t)/'manifest.json';mf.write_text(json.dumps(manifest))
        if seed_success:
            state.mkdir();baseline={l['id']:{'state':'OBSERVED','fingerprint':'0'*64,'observed_at':'fixture-prior'} for l in manifest['loops']};(state/'loop-state.json').write_text(json.dumps(baseline))
        with patch.object(mod.urllib.request,'urlopen',side_effect=response),patch.object(mod,'file_probe',side_effect=local),patch.object(mod,'glob_probe',side_effect=local),patch.object(mod,'corrections_content_id',return_value=('b'*64,None)),patch.object(mod,'archive_signed_corrections',return_value=Path('/fixture')),patch('sys.argv',['engine','--manifest',str(mf),'--state',str(state)]),contextlib.redirect_stdout(io.StringIO()):
            mod.main()
        report=json.loads((state/'latest.json').read_text());report['_fixture_candidates']=[json.loads(l) for l in (state/'deep-candidates.jsonl').read_text().splitlines()] if (state/'deep-candidates.jsonl').exists() else []
        if fail_root and hasattr(mod,'classify_loop'):
            assert all(c['loop_id'] not in ['H-01','H-29','H-40'] for c in report['_fixture_candidates'])
        return report,len(calls)
if __name__=='__main__':unittest.main(verbosity=2)
