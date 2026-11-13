"""Dependency-bound correction controls. Synthetic changes never edit live sources."""
import copy,json,unittest
from unittest.mock import patch
import learning_bridge as b

class ScopedLearningTests(unittest.TestCase):
    def setUp(self):
        self.r,self.c,self.global_rev=b._data();self.axis='claim-maintenance';self.industry='ai-software'
        self.row=next(r for r in self.r['rows'] if r['axis']==self.axis)
        self.local=b._scope_revision(self.r,self.c,self.row,self.industry)
        self.case=next(c for c in self.c if c['id']=='xp-not-authority')
        self.attempt={'case_id':self.case['id'],'content_sha256':self.case['content_sha256'],'answer':self.case['answer']}
    def grade(self,revision=None,axis=None,industry=None):
        return b.practice_feedback(axis or self.axis,industry or self.industry,json.dumps([self.attempt]),revision or self.local)
    def changed(self,r=None,c=None):
        return patch.object(b,'_data',return_value=(r or self.r,c or self.c,'f'*64))
    def test_scoped_and_current_legacy_both_accepted(self):
        self.assertEqual(self.grade()['binding_kind'],'SCOPED_LESSON')
        self.assertEqual(self.grade(self.global_rev)['binding_kind'],'LEGACY_REGISTRY')
    def test_packet_keeps_two_distinct_bindings(self):
        p=b.lesson_packet();self.assertEqual(p['registry_revision'],self.global_rev)
        self.assertEqual(p['lesson_revision'],self.local);self.assertNotEqual(self.local,self.global_rev)
    def test_unrelated_axis_change_preserves_local(self):
        r=copy.deepcopy(self.r);next(x for x in r['rows'] if x['axis']=='reserve-attestation')['task']+=' changed'
        with self.changed(r=r):self.assertEqual(self.grade()['educational_xp'],10)
    def test_unrelated_case_change_preserves_local(self):
        c=copy.deepcopy(self.c);next(x for x in c if x['id']=='safeguard-drift')['facts']+=' changed'
        with self.changed(c=c):self.assertEqual(self.grade()['educational_xp'],10)
    def test_retrieval_timestamp_alone_is_not_lesson_correction(self):
        r=copy.deepcopy(self.r);r['board_read_at']='2099-01-01T00:00:00Z'
        with self.changed(r=r):self.assertEqual(self.grade()['educational_xp'],10)
    def test_legacy_global_rejected_after_unrelated_change(self):
        with self.changed(),self.assertRaises(ValueError):self.grade(self.global_rev)
    def test_own_axis_task_change_rejects(self):
        r=copy.deepcopy(self.r);next(x for x in r['rows'] if x['axis']==self.axis)['task']+=' changed'
        with self.changed(r=r),self.assertRaises(ValueError):self.grade()
    def test_own_reading_key_change_rejects(self):
        r=copy.deepcopy(self.r);next(x for x in r['rows'] if x['axis']==self.axis)['reading_check']['correct_option']='different'
        with self.changed(r=r),self.assertRaises(ValueError):self.grade()
    def test_relevant_case_change_rejects(self):
        c=copy.deepcopy(self.c);next(x for x in c if x['id']=='revision-change')['facts']+=' corrected'
        with self.changed(c=c),self.assertRaises(ValueError):self.grade()
    def test_context_mapping_change_rejects(self):
        r=copy.deepcopy(self.r);r['industry_profiles'][self.industry]['title']+=' corrected'
        with self.changed(r=r),self.assertRaises(ValueError):self.grade()
    def test_removed_mapping_refuses_even_fresh_token(self):
        r=copy.deepcopy(self.r);r['industry_profiles'][self.industry]['axes'].remove(self.axis)
        token=b._scope_revision(r,self.c,self.row,self.industry)
        with self.changed(r=r),self.assertRaises(ValueError):self.grade(token)
    def test_safe_policy_revision_change_rejects(self):
        r=copy.deepcopy(self.r);r['safe']['source_revision']='0'*40
        with self.changed(r=r),self.assertRaises(ValueError):self.grade()
    def test_cross_axis_replay_refused(self):
        with self.assertRaises(ValueError):self.grade(axis='governance')
    def test_cross_context_replay_refused(self):
        with self.assertRaises(ValueError):self.grade(industry='finance-legacy')
    def test_code_version_change_rejects(self):
        with patch.object(b,'VERSION','next-revision'),self.assertRaises(ValueError):self.grade()
    def test_reordered_json_has_same_scope_digest(self):
        row=dict(reversed(list(self.row.items())))
        self.assertEqual(b._scope_revision(self.r,self.c,row,self.industry),self.local)
    def test_no_authority_from_valid_token(self):
        out=self.grade();self.assertFalse(any(out['boundaries'].values()));self.assertEqual(out['training_candidate']['rows_exported_for_training'],0)
    def test_new_cases_fill_eleven_layers_without_editor_approval(self):
        out=b.learning_catalogue();coverage=out['safe_practice_coverage']
        self.assertEqual(len(out['practice_case_ids']),8);self.assertEqual(coverage['layers_with_draft_case'],11)
        self.assertFalse(coverage['human_editorial_approval'])
    def test_all_practice_remains_original_synthetic_and_pending(self):
        for c in self.c:
            self.assertEqual(c['human_editor_review'],'PENDING');self.assertFalse(c['uses_gspc_evaluation_rows'])
    def test_invalid_token_prefix_not_enough(self):
        for token in ['lesson-v1:','lesson-v1:'+'0'*64,'lesson-v2:'+self.local.split(':')[1]]:
            with self.assertRaises(ValueError):self.grade(token)

if __name__=='__main__':unittest.main(verbosity=2)
