"""Synthetic index/events; tests do not establish public release or independence."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from event import build, compute_event_id
spec = importlib.util.spec_from_file_location('axis_review', ROOT/'render/axis_referee_review.py')
r = importlib.util.module_from_spec(spec)
spec.loader.exec_module(r)

NOW = '2026-11-07T03:00:00Z'
OLD = '2026-11-06T03:00:00Z'

def raw(value):
    return json.dumps(value, ensure_ascii=False, allow_nan=False).encode()

def index():
    return {'schema':'csoai.axis-specialist-index/1.0',
            'source_snapshot':'SYNTHETIC_TEST_ONLY',
            'charter':{'sha256':'a'*64,'version':'fixture',
                       'mapping_kind':'REVIEW_CROSS_REFERENCE_NOT_COMPLIANCE'},
            'coverage':{'specialists':34}, 'findings':0,
            'specialists':[{'axis':f'fixture-{i}', 'charter_articles':[1,2],
                            'human_decision':'HOLD', 'may_apply':False,
                            'measurement_status':'UNMEASURED', 'audit_sha256':'b'*64}
                           for i in range(34)]}

def event(n=0, axes=None, read_at=OLD, state='PARTIAL'):
    return build(subject={'kind':'repository','locator':'urn:synthetic:test'},
        claim={'text':f'synthetic observation {n}', 'source_sha256':'c'*64, 'read_at':read_at},
        method={'id':'synthetic-fixture','version':'1','holder':'csoai'},
        declared=None, observed={'axis_ids':axes or ['fixture-0']},
        state=state, value=None, limits=['Synthetic test only; no independent acceptance.'])

class ProjectionTests(unittest.TestCase):
    def project(self, events=None, idx=None, **kwargs):
        return r.project(raw(index() if idx is None else idx),raw([event()] if events is None else events),as_of=NOW,**kwargs)

    def test_all34_rows_preserved_as_held_references(self):
        result=self.project()
        self.assertEqual(result['counts'],{'axis_slots':34,'unique_event_refs':1,'axes_with_observations':1})
        self.assertEqual(len(result['axis_reviews']),34)
        self.assertTrue(all(x['human_decision']=='HOLD' and x['may_apply'] is False for x in result['axis_reviews']))

    def test_not_linked_is_not_pass_or_zero_score(self):
        result=self.project()
        row=next(x for x in result['axis_reviews'] if x['axis']=='fixture-1')
        self.assertEqual(row['review_state'],'NO_LINKED_OBSERVATION')
        self.assertNotIn('score',row)

    def test_inputs_unchanged(self):
        idx,ev=index(),event(); before=(copy.deepcopy(idx),copy.deepcopy(ev))
        self.project([ev],idx)
        self.assertEqual((idx,ev),before)

    def test_existing_measurement_status_never_copied_as_referee_grade(self):
        self.assertTrue(all('measurement_status' not in row for row in self.project()['axis_reviews']))

    def test_duplicate_events_do_not_multiply_evidence(self):
        self.assertEqual(self.project([event(),event()])['counts']['unique_event_refs'],1)

    def test_signature_wrappers_do_not_make_new_observations(self):
        ev=event(); decorated=copy.deepcopy(ev);decorated['signature']={'UNVERIFIED':'fixture'}
        result=self.project([ev,decorated])
        self.assertEqual(result['counts']['unique_event_refs'],1)
        self.assertEqual(result['axis_reviews'][0]['event_refs'][0]['signature_verification'],'NOT_PERFORMED')

    def test_deterministic_replay(self):
        self.assertEqual(self.project(),self.project())

    def test_raw_source_bytes_bound(self):
        result=self.project();self.assertEqual(result['source_index']['sha256'],hashlib.sha256(raw(index())).hexdigest())

    def test_changed_asof_changes_view_not_event_identity(self):
        a=self.project();b=r.project(raw(index()),raw([event()]),as_of='2026-11-08T03:00:00Z')
        self.assertNotEqual(a['projection_id'],b['projection_id'])
        self.assertEqual(a['axis_reviews'],b['axis_reviews'])

    def test_no_baseline_never_invents_new_findings(self):
        comparison=self.project()['comparison']
        self.assertIs(comparison['baseline_available'],False)
        self.assertIsNone(comparison['new_event_ids'])

    def test_carried_new_and_removed_are_distinct(self):
        old=[event(0),event(1)];new=[event(0),event(2)]
        result=self.project(new,previous_event_bytes=raw(old),previous_as_of=OLD)['comparison']
        self.assertEqual(result['carried_event_ids'],[event(0)['event_id']])
        self.assertEqual(result['new_event_ids'],[event(2)['event_id']])
        self.assertEqual(result['no_longer_observed_ids'],[event(1)['event_id']])
        self.assertIs(result['no_longer_observed_means_resolved'],False)

    def test_equal_timestamps_allowed(self):
        self.project(previous_event_bytes=raw([event()]),previous_as_of=NOW)

    def test_same_day_return_to_old_events_keeps_exact_baseline(self):
        a,b=[event(1)],[event(2)]
        result=self.project(a,previous_event_bytes=raw(b),previous_as_of=NOW)['comparison']
        self.assertEqual(result['new_event_ids'],[event(1)['event_id']])
        self.assertEqual(result['no_longer_observed_ids'],[event(2)['event_id']])

    def test_baseline_time_and_bytes_required_together(self):
        for kwargs in ({'previous_event_bytes':b'[]'}, {'previous_as_of':OLD}):
            with self.assertRaises(ValueError):self.project(**kwargs)

    def test_newer_baseline_refused(self):
        with self.assertRaises(ValueError):self.project(previous_event_bytes=raw([]),previous_as_of='2026-11-08T00:00:00Z')

    def test_tampered_event_refused(self):
        ev=event();ev['observed']['axis_ids']=['fixture-1']
        with self.assertRaises(ValueError):self.project([ev])

    def test_unknown_axis_refused(self):
        with self.assertRaises(ValueError):self.project([event(axes=['not-in-roster'])])

    def test_duplicate_axis_refs_refused(self):
        with self.assertRaises(ValueError):self.project([event(axes=['fixture-0','fixture-0'])])

    def test_boolean_authority_cannot_be_truthy_string(self):
        for value in ('false',0,None,True):
            idx=index();idx['specialists'][0]['may_apply']=value
            with self.assertRaises(ValueError):self.project(idx=idx)

    def test_approved_input_index_refused(self):
        idx=index();idx['specialists'][0]['human_decision']='APPROVE'
        with self.assertRaises(ValueError):self.project(idx=idx)

    def test_duplicate_roster_axis_refused(self):
        idx=index();idx['specialists'][1]['axis']='fixture-0'
        with self.assertRaises(ValueError):self.project(idx=idx)

    def test_false_denominator_refused(self):
        idx=index();idx['coverage']['specialists']=35
        with self.assertRaises(ValueError):self.project(idx=idx)

    def test_charter_digest_required(self):
        idx=index();idx['charter']['sha256']='not-hash'
        with self.assertRaises(ValueError):self.project(idx=idx)

    def test_legal_compliance_mapping_not_inferred(self):
        idx=index();idx['charter']['mapping_kind']='COMPLIANCE'
        with self.assertRaises(ValueError):self.project(idx=idx)

    def test_article_bool_and_duplicates_refused(self):
        for articles in ([True],[1,1],[],[-1]):
            idx=index();idx['specialists'][0]['charter_articles']=articles
            with self.assertRaises(ValueError):self.project(idx=idx)

    def test_future_event_refused(self):
        with self.assertRaises(ValueError):self.project([event(read_at='2026-11-08T00:00:00Z')])

    def test_naive_timestamp_refused(self):
        with self.assertRaises(ValueError):self.project([event(read_at='2026-11-06T00:00:00')])

    def test_invalid_source_hash_refused_even_after_rehash(self):
        ev=event();ev['claim']['source_sha256']='z'*64;ev['event_id']=compute_event_id(ev)
        with self.assertRaises(ValueError):self.project([ev])

    def test_claim_text_not_republished(self):
        ev=event();ev['claim']['text']='PRIVATE_SENTINEL';ev['observed']['free_text']='DO_NOT_EXPORT';ev['event_id']=compute_event_id(ev)
        output=json.dumps(self.project([ev]))
        self.assertNotIn('PRIVATE_SENTINEL',output);self.assertNotIn('DO_NOT_EXPORT',output)

    def test_positive_input_is_never_authority_or_independence(self):
        ev=event();ev['observed'].update({'independence_established':True,'execution_authorized':True});ev['event_id']=compute_event_id(ev)
        result=self.project([ev])
        self.assertIs(result['execution_authorized'],False)
        self.assertIs(result['publication_authorized'],False)
        self.assertEqual(result['replies'],'HELD')
        self.assertEqual(result['bft_status'],'NOT_DEMONSTRATED')
        self.assertTrue(all(x['independence_status']=='NOT_ESTABLISHED' for x in result['axis_reviews']))

    def test_unknown_state_refused(self):
        ev=event();ev['state']='PASS';ev['event_id']=compute_event_id(ev)
        with self.assertRaises(ValueError):self.project([ev])

    def test_uncertainty_cannot_carry_score(self):
        ev=event(state='UNCHECKABLE');ev['value']=0;ev['event_id']=compute_event_id(ev)
        with self.assertRaises(ValueError):self.project([ev])

    def test_empty_events_preserve_all_axes(self):
        result=self.project([])
        self.assertEqual(result['counts']['axis_slots'],34)
        self.assertEqual(result['counts']['axes_with_observations'],0)

    def test_duplicate_json_keys_rejected(self):
        with self.assertRaises(ValueError):r.strict_json(b'{"x":1,"x":2}')

    def test_nan_and_oversize_rejected(self):
        for bad in (b'{"x":NaN}', b' '*(r.MAX_BYTES+1)):
            with self.assertRaises(ValueError):r.strict_json(bad)

    def test_missing_event_id_refused(self):
        ev=event();del ev['event_id']
        with self.assertRaises(ValueError):self.project([ev])

if __name__=='__main__':unittest.main(verbosity=2)
