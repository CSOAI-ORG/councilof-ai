import copy, hashlib, json, tempfile, unittest
from datetime import datetime,timedelta,timezone
from pathlib import Path
from worker_quality_report import audit,classify,digest,load_json,render_html,utc,verify_candidate_card
NOW=datetime(2026,9,20,5,30,tzinfo=timezone.utc)
def fixture():
    return {'run_id':'fixture','axis':'governance','model_transport':'fixture:1','bank_sha256':'a'*64,'model_manifest_digest':'sha256:'+'b'*64,'finished_at':(NOW-timedelta(hours=1)).isoformat(),'complete':True,'landable_candidate':True,'candidate_file':'card-unsigned.json','detail_code':'COMPLETE_UNSIGNED','instrument':{'allowed_labels':['YES'],'decode':{'max_tokens':64,'seed':0,'temperature':0}},'counts':{'bank_items':2,'attempted':2,'transport_ok':2,'graded_n':2,'correct':1,'parse_errors_excluded':0,'transport_errors_excluded':0}}
class QualityTests(unittest.TestCase):
    def test_graded(self):self.assertEqual(classify(fixture()),'FULLY_GRADED_CANDIDATE')
    def test_zero_correct_not_missing(self):
        r=fixture();r['counts']['correct']=0;self.assertEqual(classify(r),'FULLY_GRADED_CANDIDATE')
    def test_all_unparsed_not_measurement(self):
        r=fixture();r.update(landable_candidate=False,detail_code='ALL_UNPARSED');r['counts'].update(graded_n=0,correct=0,parse_errors_excluded=2);self.assertEqual(classify(r),'NO_GRADED_OUTPUT')
    def test_partial_parsing(self):
        r=fixture();r['counts'].update(graded_n=1,parse_errors_excluded=1);self.assertEqual(classify(r),'PARTLY_GRADED_CANDIDATE')
    def test_missing_counts(self):
        r=fixture();del r['counts'];self.assertEqual(classify(r),'CONTRADICTORY_METADATA')
    def test_boolean_count(self):
        r=fixture();r['counts']['correct']=True;self.assertEqual(classify(r),'CONTRADICTORY_METADATA')
    def test_wrong_denominator(self):
        r=fixture();r['counts']['graded_n']=1;self.assertEqual(classify(r),'CONTRADICTORY_METADATA')
    def test_too_many_correct(self):
        r=fixture();r['counts']['correct']=3;self.assertEqual(classify(r),'CONTRADICTORY_METADATA')
    def test_nonlandable(self):
        r=fixture();r['landable_candidate']=False;self.assertEqual(classify(r),'REQUIRES_REVIEW')
    def test_false_landable(self):
        r=fixture();r['counts'].update(graded_n=0,correct=0,parse_errors_excluded=2);self.assertEqual(classify(r),'CONTRADICTORY_METADATA')
    def test_incomplete(self):
        r=fixture();r['complete']=False;self.assertEqual(classify(r),'INCOMPLETE')
    def test_transport_failure(self):
        r=fixture();r['counts'].update(transport_ok=1,graded_n=1,transport_errors_excluded=1);self.assertEqual(classify(r),'TRANSPORT_INCOMPLETE')
    def test_naive_timestamp(self):
        with self.assertRaises(ValueError):utc('2026-09-20T00:00:00')
    def test_duplicate_json(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'x';p.write_text('{"count":1,"count":0}')
            with self.assertRaises(ValueError):load_json(p)
    def test_nonfinite_json(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'x';p.write_text('{"count":NaN}')
            with self.assertRaises(ValueError):load_json(p)
    def test_root_array_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'x';p.write_text('[]')
            with self.assertRaises(ValueError):load_json(p)
    def test_newline_hash(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'x';p.write_bytes(b'{}\n');self.assertEqual(digest(p,True),hashlib.sha256(b'{}').hexdigest())
class AuditTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);self.configs=self.root/'configs';self.configs.mkdir();self.health=self.root/'health.json';self.health.write_text(json.dumps({'updated_at':NOW.isoformat(),'state':'WAITING','successful_runs':500}));self.output=self.root/'output';self.rundir=self.output/'runs'/'fixture';self.rundir.mkdir(parents=True)
        self.config={'model':'fixture:1','axis':'governance','output_dir':str(self.output),'interval_seconds':86400,'expected_bank_sha256':'a'*64,'expected_model_manifest_digest':'sha256:'+'b'*64,'max_tokens':64,'seed':0,'allowed_labels':['YES']};(self.configs/'a.json').write_text(json.dumps(self.config));self.run=fixture();self.save()
    def tearDown(self):self.tmp.cleanup()
    def save(self):
        (self.rundir/'items.jsonl').write_bytes(b'{"fixture":true}\n')
        self.run['items_sha256']=digest(self.rundir/'items.jsonl')
        body={'status':'UNMEASURED','compute_evidence':{'run_id':self.run['run_id'],
            'bank_sha256':self.run['bank_sha256'],
            'model_manifest_digest':self.run['model_manifest_digest'],
            'items_sha256':self.run['items_sha256']}}
        card_id=hashlib.sha256(json.dumps(body,sort_keys=True,separators=(',',':')).encode()).hexdigest()
        card={'body':body,'id':card_id,'preimage_rule':'sha256(canonical body)','signature':None}
        (self.rundir/self.run['candidate_file']).write_text(json.dumps(card)+'\n')
        self.run['card_sha256']=card_id
        (self.rundir/'run.json').write_text(json.dumps(self.run))
    def report(self):return audit(self.configs,self.health,self.root,NOW)
    def test_waiting_not_outage(self):
        r=self.report();self.assertEqual(r['schedule']['cadence_state'],'WAITING_UNTIL_DUE');self.assertEqual(r['window']['verified_run_records'],1);self.assertEqual(r['process']['reported_completed_counter'],500);self.assertIsNone(r['window']['admitted']);self.assertIsNone(r['window']['published'])
    def test_tampered_artifact(self):
        (self.rundir/'items.jsonl').write_text('altered');r=self.report();self.assertEqual(r['window']['scoreable_candidates'],0);self.assertTrue(r['errors'])
    def test_candidate_body_id_checked_not_wrapper_bytes(self):
        path=self.rundir/self.run['candidate_file']
        self.assertEqual(verify_candidate_card(path,self.run['card_sha256'],self.run),'BODY_ID')
        card=json.loads(path.read_text());card['body']['status']='MEASURED';path.write_text(json.dumps(card))
        r=self.report();self.assertEqual(r['window']['verified_run_records'],0);self.assertTrue(r['errors'])
    def test_legacy_wrapper_hash_is_verified_but_not_scoreable(self):
        path=self.rundir/self.run['candidate_file'];card=json.loads(path.read_text())
        wrapper=json.dumps(card,sort_keys=True,separators=(',',':')).encode()
        self.run['card_sha256']=hashlib.sha256(wrapper).hexdigest()
        (self.rundir/'run.json').write_text(json.dumps(self.run))
        r=self.report();self.assertEqual(r['window']['verified_run_records'],1)
        self.assertEqual(r['window']['scoreable_candidates'],0)
        self.assertEqual(r['window']['legacy_candidate_hash_records'],1)
        self.assertIn('LEGACY_CANDIDATE_HASH_MODE_REQUIRES_REVIEW',r['alerts'])
    def test_old_record(self):
        self.run['finished_at']=(NOW-timedelta(days=2)).isoformat();self.save();self.assertEqual(self.report()['window']['verified_run_records'],0)
    def test_future_record(self):
        self.run['finished_at']=(NOW+timedelta(minutes=1)).isoformat();self.save();self.assertTrue(self.report()['errors'])
    def test_changed_instrument(self):
        self.run['instrument']['decode']['max_tokens']=1024;self.save();self.assertIsNone(self.report()['schedule']['next_due_estimate'])
    def test_outside_workspace(self):
        self.config['output_dir']='/outside-fixture';(self.configs/'a.json').write_text(json.dumps(self.config));self.assertTrue(self.report()['errors'])
    def test_duplicate_job_output(self):
        (self.configs/'b.json').write_text(json.dumps(self.config));r=self.report();self.assertTrue(r['errors']);self.assertEqual(r['window']['verified_run_records'],1)
    def test_stale_heartbeat(self):
        self.health.write_text(json.dumps({'updated_at':(NOW-timedelta(hours=1)).isoformat(),'state':'WAITING'}));self.assertIn('HEARTBEAT_NOT_CURRENT',self.report()['alerts'])
    def test_unparsed_alert(self):
        self.run.update(landable_candidate=False,detail_code='ALL_UNPARSED',candidate_file='card-incomplete.json');self.run['counts'].update(graded_n=0,correct=0,parse_errors_excluded=2);self.save();r=self.report();self.assertEqual(r['window']['scoreable_candidates'],0);self.assertIn('UNPARSED_COMPLETIONS_REQUIRE_REPAIR',r['alerts'])
    def test_html_escape(self):
        r=self.report();r['process']['reported_state']='<script>unsafe</script>';page=render_html(r);self.assertNotIn('<script>',page);self.assertIn('&lt;script&gt;',page)
    def test_no_file_mutation(self):
        before={str(p):p.read_bytes() for p in self.root.rglob('*') if p.is_file()};self.report();self.assertEqual(before,{str(p):p.read_bytes() for p in self.root.rglob('*') if p.is_file()})
if __name__=='__main__':unittest.main()
