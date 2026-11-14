import importlib.util,json,shutil,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('assurance',Path(__file__).with_name('assurance_delivery.py'));a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
class StubObserver:
    SOURCES=(('stablecoin-index','https://councilof.ai/interop/stablecoin-universe-2026-09/index.json','assets'),('nist-rmf','https://airc.nist.gov/',None))
    JSON_SOURCE_IDS={'stablecoin-index'}
    def row_inventory(self,b,s,c):
        rows=json.loads(b)[c];out={}
        for r in rows:
            if str(r['id']) in out:raise ValueError('DUPLICATE_ID')
            out[str(r['id'])]=r
        return out
class DeliveryTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);(self.root/'state/blobs').mkdir(parents=True);(self.root/'assurance').mkdir();(self.root/'assurance/reviewed-source.sha256').write_text(a.digest(Path(a.__file__).read_bytes()))
        self.body=a.canonical({'asset_count':2,'assets':[{'id':'1','symbol':'USD','state':'UNMEASURED'},{'id':'2','symbol':'USD','state':'MEASURED'}]});self.sha=a.digest(self.body);(self.root/'state/blobs'/(self.sha+'.body')).write_bytes(self.body)
        self.report={'state':'OBSERVED','freshness':'CURRENT_WINDOW','retained_report_sha256':'a'*64,'source_sha256':'b'*64,'sources':[{'id':'stablecoin-index','url':StubObserver.SOURCES[0][1],'body_sha256':self.sha,'state':'FIRST_OBSERVATION','source_as_of':'2026-09-01'}]}
        self.p1=patch.object(a,'read_latest',return_value=(StubObserver(),self.report));self.p2=patch.object(a,'observer',return_value=StubObserver());self.p1.start();self.p2.start()
    def tearDown(self):self.p1.stop();self.p2.stop();self.tmp.cleanup()
    def run_one(self):r=a.admit(self.root,'stablecoin-index');a.work(self.root);return r['id']
    def test_roundtrip_is_exact_scope_and_unsigned(self):
        rid=self.run_one();r=a.retrieve(self.root,rid);self.assertEqual(r['state'],'RETRIEVED_UNSIGNED');self.assertEqual(r['evidence']['source_sha256'],self.sha);self.assertEqual(r['evidence']['measurement']['record_count'],2);self.assertIsNone(r['evidence']['signature']);self.assertFalse(r['evidence']['paid'])
    def test_duplicate_admission_is_idempotent(self):
        x=a.admit(self.root,'stablecoin-index');y=a.admit(self.root,'stablecoin-index');self.assertEqual(x['id'],y['id']);self.assertEqual(a.status(self.root)['counts']['QUEUED'],1)
    def test_second_worker_does_not_reexecute_completed(self):self.run_one();self.assertEqual(a.work(self.root)['completed'],[])
    def test_stop_does_not_execute(self):a.admit(self.root,'stablecoin-index');(self.root/'state/STOP').touch();self.assertEqual(a.work(self.root)['state'],'STOPPED')
    def test_method_pin_required(self):a.admit(self.root,'stablecoin-index');(self.root/'assurance/reviewed-source.sha256').write_text('wrong');self.assertEqual(a.work(self.root)['state'],'SOURCE_REVIEW_REQUIRED')
    def test_unknown_source(self):
        with self.assertRaises(ValueError):a.admit(self.root,'https://localhost/')
    def test_document_not_legal_auto_assessment(self):
        with self.assertRaises(ValueError):a.admit(self.root,'nist-rmf')
    def test_unavailable_source(self):
        self.report['sources'][0]['state']='UNAVAILABLE'
        with self.assertRaises(ValueError):a.admit(self.root,'stablecoin-index')
    def test_url_binding(self):
        self.report['sources'][0]['url']='https://attacker.invalid/'
        with self.assertRaises(ValueError):a.admit(self.root,'stablecoin-index')
    def test_tampered_input_before_admit(self):
        (self.root/'state/blobs'/(self.sha+'.body')).write_text('{}')
        with self.assertRaises(ValueError):a.admit(self.root,'stablecoin-index')
    def test_tampered_after_admit_rejected(self):
        r=a.admit(self.root,'stablecoin-index');(self.root/'state/blobs'/(self.sha+'.body')).write_text('{}');a.work(self.root);self.assertEqual(a.retrieve(self.root,r['id'])['state'],'REJECTED')
    def test_tampered_delivery_rejected(self):
        rid=self.run_one();r=a.retrieve(self.root,rid);(self.root/'assurance/deliveries'/(r['delivery_sha256']+'.json')).write_text('{}')
        with self.assertRaises(ValueError):a.retrieve(self.root,rid)
    def test_request_id_path_traversal_rejected(self):
        with self.assertRaises(ValueError):a.retrieve(self.root,'../../private')
    def test_mismatched_method_rejected(self):
        req=a.source_request(self.root,'stablecoin-index');req['method_sha256']='0'*64
        with self.assertRaises(ValueError):a.source_checks(self.root,req)
    def test_declared_count_mismatch_is_visible(self):
        body=a.canonical({'asset_count':99,'assets':[{'id':'1'}]});h=a.digest(body);(self.root/'state/blobs'/(h+'.body')).write_bytes(body);self.report['sources'][0]['body_sha256']=h
        rid=self.run_one();self.assertFalse(a.retrieve(self.root,rid)['evidence']['measurement']['declared_count_agrees'])
    def test_missing_grade_not_zero(self):
        rid=self.run_one();r=a.retrieve(self.root,rid);self.assertEqual(r['evidence']['measurement']['model_performance'],'NOT_ASSESSED')
    def test_invalid_job_limits(self):
        for n in (0,7,True,1.5):
            with self.assertRaises(ValueError):a.work(self.root,n)
    def test_no_false_signature_or_chain_verification(self):
        rid=self.run_one();r=a.retrieve(self.root,rid)['evidence'];self.assertEqual(r['witness_state'],'NOT_WITNESSED');self.assertFalse(r['measurement']['signatures_verified'])
    def test_count_uses_identity_not_ticker(self):self.assertEqual(a.retrieve(self.root,self.run_one())['evidence']['measurement']['record_count'],2)
    def test_missing_record_returns_not_found(self):self.assertEqual(a.retrieve(self.root,'e'*64)['state'],'NOT_FOUND')
if __name__=='__main__':unittest.main()
