import base64,datetime as dt,hashlib,importlib.util,unittest
from pathlib import Path
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.serialization import Encoding,PublicFormat
s=importlib.util.spec_from_file_location('review',Path(__file__).with_name('review_admission.py'));m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
class ReviewTest(unittest.TestCase):
 def setUp(self):
  # Ephemeral fixture-only keys, never written or used as a production identity.
  self.keys={k:Ed25519PrivateKey.generate() for k in ('review','consent')};self.registry={'reviewers':{k:{'active':True,'public_key':base64.b64encode(v.public_key().public_bytes(Encoding.Raw,PublicFormat.Raw)).decode(),'roles':['independent-evaluator','release-reviewer'] if k=='review' else ['consent-custodian'],'affiliation':'fixture-independent'} for k,v in self.keys.items()},'protocols':{'fixture-study':{'sha256':'a'*64,'status':'APPROVED'}},'approved_holdout_releases':['fixture-heldout']};self.now=dt.datetime(2026,9,18,tzinfo=dt.timezone.utc);self.raw=b'fixture human event, not a real participant'
  c={'sample_id':'sample-1','protocol_sha256':'a'*64,'state':'ACTIVE','receipt_id':'consent-1','observed_at':'2026-09-16T00:00:00Z','expires_at':'2026-10-01T00:00:00Z'}
  self.p={'schema':'csoai.human-evidence-event/0.1','event_id':'fixture-event','study_id':'fixture-study','protocol_sha256':'a'*64,'sample_id':'sample-1','role':'participant','system_revision':'r1','system_owner_id':'fixture-vendor','observation_sha256':hashlib.sha256(self.raw).hexdigest(),'observed_at':'2026-09-17T00:00:00Z','expires_at':'2026-10-01T00:00:00Z','consent':self.sign(c,'consent')}
 def sign(self,p,k='review'):return {'payload':p,'signer':k,'signature':base64.b64encode(self.keys[k].sign(m.canonical(p))).decode()}
 def event(self):return m.human_event(self.sign(self.p),self.registry,self.raw,self.now)
 def test_fixture_valid(self):self.assertEqual(self.event()['admission'],'REVIEWED_SCOPED_EVIDENCE')
 def test_unknown_reviewer(self):
  self.registry['reviewers']={}
  with self.assertRaises(ValueError):self.event()
 def test_tamper(self):
  e=self.sign(self.p);e['payload']={**self.p,'sample_id':'changed'}
  with self.assertRaises(ValueError):m.human_event(e,self.registry,self.raw,self.now)
 def test_wrong_evidence(self):
  with self.assertRaises(ValueError):m.human_event(self.sign(self.p),self.registry,b'changed',self.now)
 def test_revoked(self):
  self.registry['revoked_events']=['fixture-event']
  with self.assertRaises(ValueError):self.event()
 def test_expired(self):
  self.p['expires_at']='2026-09-17T01:00:00Z'
  with self.assertRaises(ValueError):self.event()
 def test_missing_protocol(self):
  self.registry['protocols']={}
  with self.assertRaises(ValueError):self.event()
 def test_no_independence(self):
  self.registry['reviewers']['review']['affiliation']='fixture-vendor'
  with self.assertRaises(ValueError):self.event()
 def test_false_consent(self):
  self.p['consent']=self.sign({**self.p['consent']['payload'],'state':'WITHDRAWN'},'consent')
  with self.assertRaises(ValueError):self.event()
 def test_raw_personal_fields_rejected(self):
  self.p['email']='fixture@example.invalid'
  with self.assertRaises(ValueError):self.event()
 def test_duplicate_marble_does_not_inflate(self):r=self.event();self.assertEqual(m.human_cups([r,r])['participant']['admitted_observations'],1)
 def test_empty_cups_not_zero_trust(self):self.assertEqual(m.human_cups([])['participant']['state'],'NO_ADMITTED_EVIDENCE')
 def proposal(self):return {'schema':'csoai.model-improvement-review/0.1','candidate_owner_id':'fixture-vendor','reviewed_at':'2026-09-17T00:00:00Z','expires_at':'2026-10-01T00:00:00Z','train_item_sha256':['b'*64],'evaluation_item_sha256':['c'*64,'d'*64],'holdout_release_id':'fixture-heldout','baseline_correct':1,'candidate_correct':2,'graded':2,'safety_regressions':[],'reproducibility':'INDEPENDENTLY_REPLAYED','rollback_digest':'e'*64}
 def test_promotion_never_automatic(self):self.assertFalse(m.promotion_review(self.sign(self.proposal()),self.registry,self.now)['auto_promote'])
 def test_contamination(self):
  p=self.proposal();p['train_item_sha256']=['c'*64]
  with self.assertRaises(ValueError):m.promotion_review(self.sign(p),self.registry,self.now)
 def test_regression(self):
  p=self.proposal();p['safety_regressions']=['fixture-safety-loss']
  with self.assertRaises(ValueError):m.promotion_review(self.sign(p),self.registry,self.now)
 def test_denominator(self):
  p=self.proposal();p['graded']=999
  with self.assertRaises(ValueError):m.promotion_review(self.sign(p),self.registry,self.now)
 def test_holdout_custody(self):
  self.registry['approved_holdout_releases']=[]
  with self.assertRaises(ValueError):m.promotion_review(self.sign(self.proposal()),self.registry,self.now)
if __name__=='__main__':unittest.main()
