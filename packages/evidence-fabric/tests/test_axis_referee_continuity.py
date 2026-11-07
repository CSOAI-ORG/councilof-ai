"""Capture freshness is not substantive change; input metadata is not an export policy."""
import copy
import json
import unittest
from test_axis_referee_review import r, raw, index, event, NOW, OLD, compute_event_id

class ContinuityTests(unittest.TestCase):
    def project(self, events, previous=None, idx=None):
        kwargs={} if previous is None else {'previous_event_bytes':raw(previous),'previous_as_of':NOW}
        return r.project(raw(index() if idx is None else idx),raw(events),as_of=NOW,**kwargs)

    def renew(self, old):
        new=copy.deepcopy(old);new['claim']['read_at']=NOW
        new['event_id']=compute_event_id(new);return new

    def modify(self, old, target, key, value):
        new=copy.deepcopy(old);new[target][key]=value;new['event_id']=compute_event_id(new);return new

    def test_capture_only_refresh_is_carried_content(self):
        old=event();new=self.renew(old);result=self.project([new],[old])
        self.assertNotEqual(old['event_id'],new['event_id'])
        self.assertEqual(len(result['comparison']['new_event_ids']),1)
        self.assertEqual(result['content_comparison']['new_content_refs'],[])
        self.assertEqual(result['content_comparison']['carried_content_refs'],[r.content_ref(old)])
        self.assertEqual(result['content_comparison']['refreshed_content_refs'],[r.content_ref(old)])
        self.assertEqual(result['content_comparison']['no_longer_observed_content_refs'],[])

    def test_two_captures_one_content_unit(self):
        old=event();new=self.renew(old);result=self.project([old,new])
        self.assertEqual(result['counts']['unique_event_refs'],2)
        self.assertEqual(result['content_comparison']['unique_current_content_refs'],1)

    def test_absent_baseline_cannot_claim_zero_changes(self):
        delta=self.project([event()])['content_comparison']
        self.assertIsNone(delta['new_content_refs']);self.assertIsNone(delta['carried_content_refs'])

    def test_exact_replay_not_fresh_observation(self):
        delta=self.project([event()],[event()])['content_comparison']
        self.assertEqual(delta['new_content_refs'],[]);self.assertEqual(delta['refreshed_content_refs'],[])

    def test_empty_observation_is_not_resolution(self):
        delta=self.project([],[event()])['content_comparison']
        self.assertEqual(delta['no_longer_observed_content_refs'],[r.content_ref(event())])
        self.assertFalse(delta['no_longer_observed_means_resolved'])

    def test_source_byte_change_remains_a_change(self):
        old=event();new=self.modify(old,'claim','source_sha256','d'*64)
        self.assertEqual(self.project([new],[old])['content_comparison']['new_content_refs'],[r.content_ref(new)])

    def test_method_change_remains_a_change(self):
        old=event();new=self.modify(old,'method','version','2')
        self.assertNotEqual(r.content_ref(new),r.content_ref(old))

    def test_outcome_time_is_not_discarded(self):
        old=event();old['observed']['effect_time']=OLD;old['event_id']=compute_event_id(old)
        new=self.modify(old,'observed','effect_time',NOW)
        self.assertNotEqual(r.content_ref(new),r.content_ref(old))

    def test_state_change_remains_a_change(self):
        old=event();new=copy.deepcopy(old);new['state']='UNCHECKABLE';new['event_id']=compute_event_id(new)
        self.assertNotEqual(r.content_ref(new),r.content_ref(old))

    def test_correction_lineage_is_retained(self):
        old=event();new=copy.deepcopy(old);new['supersedes']={'event_id':old['event_id']};new['event_id']=compute_event_id(new)
        self.assertNotEqual(r.content_ref(new),r.content_ref(old))

    def test_unverified_wrappers_do_not_make_content(self):
        old=event();new=copy.deepcopy(old);new['signature']={'value':'TEST_ONLY'};new['anchors']={'ots':'TEST_ONLY'}
        self.assertEqual(r.content_ref(old),r.content_ref(new))

    def test_axis_routing_change_is_not_hidden(self):
        old=event();new=self.modify(old,'observed','axis_ids',['fixture-1'])
        self.assertNotEqual(r.content_ref(old),r.content_ref(new))

    def test_input_order_does_not_change_projection(self):
        self.assertEqual(self.project([event(1),event(2)])['axis_reviews'],self.project([event(2),event(1)])['axis_reviews'])

    def test_arbitrary_charter_metadata_does_not_escape(self):
        idx=index();idx['charter']['internal_note']='SENTINEL_NEVER_EXPORT'
        result=self.project([event()],idx=idx)
        self.assertNotIn('SENTINEL_NEVER_EXPORT',json.dumps(result))
        self.assertEqual(set(result['source_index']['charter']),{'version','sha256','mapping_kind'})

    def test_nested_snapshot_cannot_bypass_metadata_whitelist(self):
        idx=index();idx['source_snapshot']={'secret':'SENTINEL'}
        with self.assertRaises(ValueError):self.project([event()],idx=idx)

    def test_charter_version_cannot_hide_nested_payload(self):
        for val in ({'secret':'SENTINEL'},None,'','x'*129):
            idx=index();idx['charter']['version']=val
            with self.assertRaises(ValueError):self.project([event()],idx=idx)

    def test_serialized_change_does_not_mutate_canonical_events(self):
        old=event();new=self.renew(old);before=raw([old,new]);self.project([new],[old])
        self.assertEqual(raw([old,new]),before)

    def test_content_key_not_a_semantic_or_authority_claim(self):
        result=self.project([event()],[event()])
        self.assertFalse(result['content_comparison']['semantic_equivalence_established'])
        self.assertEqual(result['renderer_revision'],'axis-referee-review/2')
        self.assertEqual(result['replies'],'HELD');self.assertFalse(result['execution_authorized'])

if __name__=='__main__':unittest.main(verbosity=2)
