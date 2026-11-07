import contextlib, copy, importlib.util, io, json, sys, tempfile, unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch
HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('chain_engine',HERE/'hourly_loop_engine.py')
e=importlib.util.module_from_spec(spec);spec.loader.exec_module(e)
M=json.loads((HERE/'loops.json').read_text())
L=M['loops'];H=M['review_handoffs']
def rows(changed=('H-05',),bad=()):
    result=[]
    for loop in L:
        ident=loop['id'];row={'id':ident,'state':'INCONCLUSIVE' if ident in bad else 'OBSERVED',
          'delta':'CHANGED' if ident in changed else 'UNCHANGED','observed_at':'2026-09-28T15:00:00Z',
          'fingerprint':e.sha((ident+':content').encode()),'transition_id':e.sha((ident+':transition').encode())}
        row['receipt_hash']=e.sha(e.canonical(row));result.append(row)
    return result
def plan(changed=('H-05',),bad=(),seen=None,handoffs=None):
    return e.plan_review_chain(L,rows(changed,bad),H if handoffs is None else handoffs,seen)
class ChainTests(unittest.TestCase):
    def test_existing_observation_definitions_and_scheduler_unchanged(self):
        before=json.loads((HERE.parent/'before/loops.json').read_text()) if (HERE.parent/'before/loops.json').exists() else M
        self.assertEqual(M['loops'],before['loops']);self.assertEqual(M['scheduler_contract'],before['scheduler_contract'])
    def test_correction_reaches_latency_truth_and_data_room(self):
        p,jobs=plan();self.assertEqual({j['loop_id'] for j in jobs},{'H-05','H-29','H-37','H-38'})
    def test_revenue_reaches_billing_truth_data_without_payment(self):
        p,jobs=plan(('H-07',));self.assertEqual({j['loop_id'] for j in jobs},{'H-07','H-10','H-37','H-38'})
        self.assertTrue(all(j['payment']=='not_performed' for j in jobs))
    def test_distribution_reaches_contract_and_truth_review(self):
        _,jobs=plan(('H-13',));self.assertEqual({j['loop_id'] for j in jobs},{'H-13','H-36','H-37','H-38'})
    def test_census_reaches_own_index_and_materiality_only(self):
        _,jobs=plan(('H-21',));ids={j['loop_id'] for j in jobs}
        self.assertIn('H-25',ids);self.assertIn('H-39',ids);self.assertNotIn('H-26',ids);self.assertNotIn('H-27',ids)
    def test_changed_clock_does_not_change_work_ids(self):
        a=rows();b=copy.deepcopy(a)
        for r in b:r['observed_at']='2026-09-29T21:00:00Z'
        _,a=e.plan_review_chain(L,a,H);_,b=e.plan_review_chain(L,b,H)
        self.assertEqual([j['work_key'] for j in a],[j['work_key'] for j in b])
    def test_restart_deduplicates_existing_queue_keys(self):
        _,first=plan();p,second=plan(seen={j['work_key'] for j in first})
        self.assertEqual(second,[]);self.assertEqual(p['already_queued'],len(first))
    def test_partial_append_restarts_with_only_missing_jobs(self):
        _,first=plan();_,rest=plan(seen={first[0]['work_key']})
        self.assertEqual([j['work_key'] for j in rest],[j['work_key'] for j in first[1:]])
    def test_transition_is_stable_on_unchanged_content(self):
        a=rows()[4];key=e.transition_identity(None,a)
        self.assertEqual(e.transition_identity({'fingerprint':a['fingerprint'],'transition_id':key},a),key)
    def test_real_recurrence_is_not_swallowed_by_deduplication(self):
        a=rows()[4];b={**a,'fingerprint':e.sha(b'changed')}
        aid=e.transition_identity(None,a)
        bid=e.transition_identity({'fingerprint':a['fingerprint'],'transition_id':aid},b)
        aid2=e.transition_identity({'fingerprint':b['fingerprint'],'transition_id':bid},a)
        bid2=e.transition_identity({'fingerprint':a['fingerprint'],'transition_id':aid2},b)
        self.assertEqual(len({aid,bid,aid2,bid2}),4)
    def test_inconclusive_never_creates_transition(self):
        self.assertIsNone(e.transition_identity(None,{'id':'H-05','state':'INCONCLUSIVE','fingerprint':'a'*64}))
    def test_failed_source_cannot_seed_handoffs(self):
        _,jobs=plan(('H-05',),('H-05',));self.assertEqual(jobs,[])
    def test_missing_required_source_holds_consumers(self):
        p,jobs=plan(('H-05',),('H-01',));self.assertEqual([j['loop_id'] for j in jobs],['H-05'])
        self.assertIn('H-29',{j['loop_id'] for j in p['blocked']});self.assertIn('H-38',{j['loop_id'] for j in p['blocked']})
    def test_blocked_review_parent_cannot_be_bypassed(self):
        p,jobs=plan(('H-35',),('H-31',));self.assertEqual(jobs,[])
        self.assertIn('H-37',{j['loop_id'] for j in p['blocked']})
    def test_invalid_parent_fingerprint_holds(self):
        r=rows();next(x for x in r if x['id']=='H-01')['fingerprint']='bad'
        p,jobs=e.plan_review_chain(L,r,H);self.assertEqual([j['loop_id'] for j in jobs],['H-05'])
    def test_downstream_jobs_wait_for_specific_parent_reviews(self):
        _,jobs=plan();by={j['loop_id']:j for j in jobs}
        self.assertEqual(by['H-05']['readiness'],'READY_FOR_REVIEW')
        self.assertEqual(by['H-29']['depends_on_candidate_ids'],[by['H-05']['candidate_id']])
        self.assertEqual(by['H-38']['depends_on_candidate_ids'],[by['H-37']['candidate_id']])
        self.assertEqual(by['H-38']['readiness'],'WAITING_FOR_UPSTREAM_REVIEW')
    def test_two_triggers_join_once_at_same_consumer(self):
        p,jobs=plan(('H-05','H-07'));self.assertEqual(len([j for j in jobs if j['loop_id']=='H-37']),1)
        merged=next(j for j in jobs if j['loop_id']=='H-37');self.assertEqual(set(merged['trigger_transitions']),{'H-05','H-07'})
    def test_summary_never_queues_itself(self):
        _,jobs=plan(tuple(x['id'] for x in L));self.assertNotIn('H-40',{j['loop_id'] for j in jobs})
        self.assertLessEqual(len(jobs),39)
    def test_all_jobs_preserve_authority_and_unknown_cost(self):
        _,jobs=plan(tuple(x['id'] for x in L))
        for j in jobs:
            self.assertEqual(j['state'],'QUEUED_INTERNAL_REVIEW')
            for key in ['execution','publication','signing','payment']:self.assertEqual(j[key],'not_performed')
            self.assertEqual(j['model_training'],'not_authorized');self.assertIsNone(j['cost_authorized'])
    def test_cycle_requires_later_generation_not_recursion(self):
        with self.assertRaises(ValueError):e.review_graph(L,{'H-05':['H-37'],'H-37':['H-05']})
    def test_unknown_handoff_rejected(self):
        with self.assertRaises(ValueError):e.review_graph(L,{'H-05':['H-99']})
    def test_history_does_not_get_rewritten(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/'queue';raw='{"candidate_id":"legacy-entry","state":"QUEUED_INTERNAL_REVIEW"}\n';p.write_text(raw)
            self.assertIn('legacy-entry',e.queued_work_keys(p));self.assertEqual(p.read_text(),raw)
    def test_bad_history_blocks_not_silently_skips(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/'queue';p.write_text('{not json}\n')
            with self.assertRaises(ValueError):e.queued_work_keys(p)
    def test_no_change_produces_no_work(self):
        p,jobs=plan(());self.assertEqual(jobs,[]);self.assertEqual(p['planned'],0)
class DeferredReviewTests(unittest.TestCase):
    def test_soft_handoff_waits_and_resumes_without_losing_trigger(self):
        first,jobs=plan(('H-35',),('H-31',))
        self.assertEqual(jobs,[]);self.assertIn('H-35',first['pending_triggers'])
        second,jobs=e.plan_review_chain(L,rows(()),H,pending=first['pending_triggers'])
        self.assertEqual({j['loop_id'] for j in jobs},{'H-35','H-37','H-38'})
        self.assertEqual(second['pending_triggers'],{})
    def test_pending_survives_an_inconclusive_root(self):
        first,_=plan(('H-35',),('H-31',))
        second,jobs=e.plan_review_chain(L,rows((),('H-35',)),H,pending=first['pending_triggers'])
        self.assertEqual(jobs,[]);self.assertEqual(second['pending_triggers'],first['pending_triggers'])
    def test_later_source_transition_explicitly_supersedes_deferred(self):
        first,_=plan(('H-35',),('H-31',))
        current=rows(('H-35',))
        changed=next(x for x in current if x['id']=='H-35');changed['fingerprint']=e.sha(b'new source');changed['transition_id']=e.sha(b'new transition')
        second,jobs=e.plan_review_chain(L,current,H,pending=first['pending_triggers'])
        self.assertEqual(second['superseded_pending'][0]['loop_id'],'H-35')
        self.assertTrue(all(j['trigger_transitions']['H-35']==changed['transition_id'] for j in jobs))
    def test_malformed_pending_is_not_silently_discarded(self):
        with self.assertRaises(ValueError):e.plan_review_chain(L,rows(),H,pending={'H-35':{'transition_id':'bad'}})
    def test_receipt_summary_failure_does_not_keep_unrelated_work_pending(self):
        p,jobs=plan(('H-05',),('H-15',))
        self.assertEqual(len(jobs),4);self.assertEqual(p['pending_triggers'],{})

class SchedulerReplayTests(unittest.TestCase):
    def test_multitick_loop_chain_with_outage_recovery_and_recurrence(self):
        loops=copy.deepcopy(L)
        for loop in loops:
            if loop['probes']:loop['probes']=[{'kind':'file','path':loop['id']}]
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);mf=root/'manifest.json';mf.write_text(json.dumps({**M,'loops':loops}));state=root/'state'
            def run(tick,variant='A',fail=False):
                def probe(p, **kwargs):
                    bad=fail and p['path']=='H-05'
                    return {'state':'INCONCLUSIVE' if bad else 'OBSERVED','source':p['path'],
                      'sha256':e.sha((p['path']+(variant if p['path']=='H-05' else 'stable')).encode())}
                with patch.object(e,'run_probe',side_effect=probe),patch.object(e,'root_freshness_special'),patch.object(e,'axis_touch',return_value={'state':'FIXTURE'}),patch.object(e,'now',return_value=datetime(2026,9,28,tick,tzinfo=timezone.utc)),patch.object(sys,'argv',['engine','--manifest',str(mf),'--state',str(state)]),contextlib.redirect_stdout(io.StringIO()):e.main()
                return json.loads((state/'latest.json').read_text())
            a=run(1);self.assertEqual(a['deep_candidates_created'],0)
            b=run(2,'B');self.assertEqual(b['deep_candidates_created'],4)
            raw=(state/'deep-candidates.jsonl').read_bytes()
            c=run(3,'B');self.assertEqual(c['deep_candidates_created'],0)
            failed=run(4,'B',True);self.assertEqual(failed['deep_candidates_created'],0)
            self.assertEqual(next(r for r in failed['receipts'] if r['id']=='H-40')['evidence_coverage_state'],'PARTIAL_OBSERVATIONS')
            recovered=run(5,'B');self.assertEqual(recovered['deep_candidates_created'],0)
            self.assertEqual((state/'deep-candidates.jsonl').read_bytes(),raw)
            again=run(6,'A');self.assertEqual(again['deep_candidates_created'],4)
            self.assertTrue((state/'deep-candidates.jsonl').read_bytes().startswith(raw))
            queued=[json.loads(x) for x in (state/'deep-candidates.jsonl').read_text().splitlines()]
            self.assertEqual(len({j['work_key'] for j in queued}),8)
    def test_corrupt_history_fails_before_baseline_write_or_probe(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);mf=root/'manifest.json';mf.write_text(json.dumps(M));state=root/'state';state.mkdir()
            (state/'deep-candidates.jsonl').write_text('broken\n');baseline=state/'loop-state.json';baseline.write_text('{}')
            with patch.object(e,'run_probe') as probe,patch.object(sys,'argv',['e','--manifest',str(mf),'--state',str(state)]),self.assertRaises(ValueError):e.main()
            probe.assert_not_called();self.assertEqual(baseline.read_text(),'{}');self.assertFalse((state/'latest.json').exists())
class DurableEngineTests(unittest.TestCase):
    def scenario(self, change, failed_source=None, crash=False):
        loops=copy.deepcopy(L)
        for loop in loops:
            if loop['probes']:loop['probes']=[{'kind':'file','path':loop['id']}]
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);mf=root/'manifest.json';mf.write_text(json.dumps({**M,'loops':loops}));state=root/'state'
            original=e.atomic_json
            def run(tick,variant='A',fail=False,interrupt=False):
                def probe(p,**kwargs):
                    ident=p['path'];return {'source':ident,'state':'INCONCLUSIVE' if fail and ident==failed_source else 'OBSERVED','sha256':e.sha((ident+(variant if ident==change else 'stable')).encode())}
                def writer(path,value):
                    if interrupt and path.name=='loop-state.json':raise OSError('fixture interrupted before baseline write')
                    original(path,value)
                with patch.object(e,'run_probe',side_effect=probe),patch.object(e,'root_freshness_special'),patch.object(e,'axis_touch',return_value={'state':'FIXTURE'}),patch.object(e,'atomic_json',side_effect=writer),patch.object(e,'now',return_value=datetime(2026,9,28,tick,tzinfo=timezone.utc)),patch.object(sys,'argv',['e','--manifest',str(mf),'--state',str(state)]),contextlib.redirect_stdout(io.StringIO()):e.main()
                return json.loads((state/'latest.json').read_text())
            run(1)
            if crash:
                with self.assertRaises(OSError):run(2,'B',interrupt=True)
                queued=(state/'deep-candidates.jsonl').read_bytes()
                recovered=run(3,'B');self.assertEqual(recovered['deep_candidates_created'],0)
                self.assertEqual((state/'deep-candidates.jsonl').read_bytes(),queued)
                self.assertEqual(len(queued.splitlines()),4)
            else:
                blocked=run(2,'B',fail=True);self.assertEqual(blocked['deep_candidates_created'],0)
                self.assertIn(change,blocked['review_chain']['pending_triggers'])
                recovered=run(3,'B');self.assertEqual(recovered['deep_candidates_created'],3)
                self.assertEqual(recovered['review_chain']['pending_triggers'],{})
    def test_appended_jobs_survive_baseline_write_interruption_without_duplicates(self):
        self.scenario('H-05',crash=True)
    def test_deferred_soft_chain_resumes_in_next_scheduler_run(self):
        self.scenario('H-35','H-31')

if __name__=='__main__':unittest.main()
