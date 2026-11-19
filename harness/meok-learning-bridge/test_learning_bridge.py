"""Offline source/feedback regression tests; no real learner or reviewer is simulated as fact."""
import copy,json,tempfile,shutil,unittest
from pathlib import Path
from unittest.mock import patch
import learning_bridge as b

class LearningTests(unittest.TestCase):
    def setUp(self):
        self.registry,self.cases,self.rev=b._data()
        self.axis='claim-maintenance';self.industry='ai-software'
    def attempt(self,case_id='xp-not-authority',correct=True):
        c=next(c for c in self.cases if c['id']==case_id)
        answer=c['answer'] if correct else next(x for x in c['options'] if x!=c['answer'])
        return {'case_id':case_id,'content_sha256':c['content_sha256'],'answer':answer}
    def grade(self,items,**kw):
        args={'axis':self.axis,'industry':self.industry,'attempts_json':json.dumps(items),'registry_revision':self.rev};args.update(kw)
        return b.practice_feedback(**args)
    def test_all34_roster_and170_source_stages(self):
        cat=b.learning_catalogue();self.assertEqual(cat['canonical_axis_count'],34);self.assertEqual(cat['source_stage_count'],170)
        self.assertEqual(cat['kind_counts'],{'model-comparison':14,'deterministic-facts':9,'measured-subject':11})
    def test_all272_context_pairs_never_imply_coverage(self):
        count=0;mapped=0
        for row in self.registry['rows']:
            for industry,profile in self.registry['industry_profiles'].items():
                packet=b.lesson_packet(row['axis'],industry);count+=1
                intended=row['axis'] in profile['axes'];mapped+=int(intended)
                self.assertEqual(packet['context_mapping'],'PROPOSED_MAPPING' if intended else 'NOT_MAPPED')
                self.assertFalse(any(packet['boundaries'].values()))
                if not intended:
                    with self.assertRaises(ValueError):self.grade([self.attempt()],axis=row['axis'],industry=industry)
        self.assertEqual((count,mapped),(272,107))
    def test_all_original_reading_options(self):
        count=0
        for row in self.registry['rows']:
            industry=row['industry_contexts'][0]
            for option in row['reading_check']['options']:
                out=b.reading_feedback(row['axis'],industry,option['id'],self.rev)
                self.assertEqual(out['correct'],option['id']==row['reading_check']['correct_option']);count+=1
                self.assertFalse(out['completed_on_public_hitl_ledger']);self.assertEqual(out['xp'],0)
        self.assertEqual(count,136)
    def test_source_paths_not_rewritten(self):
        original=json.loads((b.ASSETS/'source-paths.json').read_text())
        for row in self.registry['rows']:
            path=next(p for p in original if p['axis']['id']==row['axis'])
            self.assertEqual(row['path'],path)
    def test_measurement_dates_are_copied_not_refreshed(self):
        cat=b.learning_catalogue();self.assertTrue(cat['measurement_times_not_refreshed'])
        gov=next(r for r in cat['axis_rows'] if r['axis']=='governance');self.assertEqual(gov['measurement_time']['observed_on'],'2026-08-12')
        self.assertNotIn('2026-11-10',json.dumps(gov['measurement_time']))
    def test_global_completion_flags_are_absent(self):
        self.assertFalse(self.registry['legacy_completed_flags_imported'])
        self.assertNotIn('completed',b.lesson_packet()['reading_check'])
    def test_answer_keys_not_in_learner_packet(self):
        packet=b.lesson_packet();self.assertNotIn('correct_option',packet['reading_check'])
        self.assertTrue(all('answer' not in c for c in packet['practice_cases']))
    def test_all_practice_options(self):
        count=0
        for c in self.cases:
            axis=c['axes'][0];row=next(r for r in self.registry['rows'] if r['axis']==axis);industry=row['industry_contexts'][0]
            for answer in c['options']:
                a=self.attempt(c['id']);a['answer']=answer
                out=self.grade([a],axis=axis,industry=industry);count+=1
                self.assertEqual(out['educational_xp'],10 if answer==c['answer'] else 0)
                self.assertFalse(any(out['boundaries'].values()))
        self.assertEqual(count,len(self.cases)*4)
    def test_duplicate_answers_do_not_multiply_xp(self):
        out=self.grade([self.attempt()]*20);self.assertEqual(out['educational_xp'],10);self.assertEqual(out['distinct_attempted'],1)
        self.assertEqual(out['feedback'][0]['attempts_in_request'],20)
    def test_latest_wrong_answer_drops_current_xp(self):
        self.assertEqual(self.grade([self.attempt(),self.attempt(correct=False)])['educational_xp'],0)
    def test_retry_can_show_educational_success_without_grant(self):
        out=self.grade([self.attempt(correct=False),self.attempt()]);self.assertEqual(out['educational_xp'],10);self.assertFalse(any(out['boundaries'].values()))
    def test_no_orb_rank_or_bank_change(self):
        out=self.grade([self.attempt()]);self.assertIsNone(out['orb_rank_awarded']);self.assertFalse(out['orb_bank_progress_changed'])
        inv=b.learning_catalogue()['existing_orb_mooc'];self.assertEqual(len(inv['inventory']),5);self.assertFalse(inv['rank_thresholds_changed'])
    def test_wrong_registry_revision_refused(self):
        for revision in ['', '0'*64, None, True]:
            with self.subTest(revision=revision),self.assertRaises(ValueError):self.grade([self.attempt()],registry_revision=revision)
    def test_stale_reading_revision_refused(self):
        with self.assertRaises(ValueError):b.reading_feedback(self.axis,self.industry,'A','0'*64)
    def test_wrong_case_digest_refused(self):
        a=self.attempt();a['content_sha256']='0'*64
        with self.assertRaises(ValueError):self.grade([a])
    def test_unrelated_case_is_not_cross_axis_credit(self):
        with self.assertRaises(ValueError):self.grade([self.attempt('revision-change')],axis='reserve-attestation',industry='finance-legacy')
    def test_unknown_axis_or_context_refused(self):
        for axis,industry in [('made-up','ai-software'),('governance','all-industries'),('../governance','ai-software'),(True,'ai-software')]:
            with self.assertRaises(ValueError):b.lesson_packet(axis,industry)
    def test_invalid_options_types_refused(self):
        for option in [True,0,None,'a',' A','APPROVED']:
            a=self.attempt();a['answer']=option
            with self.assertRaises(ValueError):self.grade([a])
    def test_personal_names_reports_and_roles_not_accepted(self):
        for key in ['operator','role','report','approve','execution_authority','xp_reward']:
            a=self.attempt();a[key]='injected'
            with self.assertRaises(ValueError):self.grade([a])
    def test_malformed_json_and_duplicate_keys_refused(self):
        for raw in ['{','[] []','{"a":1,"a":2}','NaN','Infinity','null','{}','[null]']:
            with self.assertRaises(ValueError):b.practice_feedback(self.axis,self.industry,raw,self.rev)
    def test_size_and_count_bounds(self):
        with self.assertRaises(ValueError):self.grade([self.attempt()]*21)
        with self.assertRaises(ValueError):b.practice_feedback(self.axis,self.industry,' '*16385,self.rev)
        with self.assertRaises(ValueError):b.strict_json('\ud800')
    def test_empty_history_gives_no_completion(self):
        out=self.grade([]);self.assertEqual(out['educational_xp'],0);self.assertEqual(out['distinct_attempted'],0)
    def test_no_cross_call_state(self):
        first=self.grade([self.attempt()]);first['feedback'][0]['correct']=False
        self.assertEqual(self.grade([])['educational_xp'],0)
        self.assertTrue(self.grade([self.attempt()])['feedback'][0]['correct'])
    def test_training_and_external_handoffs_stay_held(self):
        out=self.grade([self.attempt()]);self.assertEqual(out['training_candidate']['rows_exported_for_training'],0)
        self.assertEqual(out['training_candidate']['state'],'HOLD_PENDING_SEPARATE_REVIEW');self.assertFalse(out['safe_followup']['external_contact_made']);self.assertFalse(out['ras_followup']['request_submitted'])
    def test_safe_eleven_layers_not_gspc_score(self):
        safe=b.learning_catalogue()['safe_reference'];self.assertEqual(len(safe['layers']),11)
        self.assertEqual(safe['charter_status'],'Under development');self.assertFalse(safe['submission_performed'])
    def test_all34_correction_chains_hold_training(self):
        for row in self.registry['rows']:
            d=b.correction_rehearsal(row['axis'],row['industry_contexts'][0]);self.assertTrue(d['stale_revision_rejected']);self.assertFalse(d['human_review_performed']);self.assertEqual(d['training_candidates_admitted'],0)
    def test_tampered_asset_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest=Path(tmp)/'assets';shutil.copytree(b.ASSETS,dest);(dest/'cases.json').write_text('[]')
            with patch.object(b,'ASSETS',dest),self.assertRaises(ValueError):b.learning_catalogue()
    def test_incorrect_case_hash_rejected_even_with_updated_outer_manifest(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest=Path(tmp)/'assets';shutil.copytree(b.ASSETS,dest)
            d=json.loads((dest/'cases.json').read_text());d[0]['answer']='A'
            raw=json.dumps(d).encode();(dest/'cases.json').write_bytes(raw)
            m=json.loads((dest/'manifest.json').read_text());m['files_sha256']['cases.json']=b.hashlib.sha256(raw).hexdigest();(dest/'manifest.json').write_text(json.dumps(m))
            with patch.object(b,'ASSETS',dest),self.assertRaises(ValueError):b.learning_catalogue()
    def test_no_person_appointments_or_industry_partners(self):
        cat=b.learning_catalogue()
        for row in cat['axis_rows']:self.assertEqual(row['named_reviewer'],'NOT_ASSIGNED');self.assertFalse(row['review_service_operating'])
        for profile in cat['industry_profiles'].values():self.assertFalse(profile['actual_customer_or_partner'])
    def test_snapshot_signature_not_claimed(self):
        self.assertFalse(b.learning_catalogue()['signature_verification_performed'])

if __name__=='__main__':unittest.main(verbosity=2)
