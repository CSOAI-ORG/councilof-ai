import copy,importlib.util,io,json,sqlite3,tempfile,unittest,zipfile
from pathlib import Path
s=importlib.util.spec_from_file_location('packet',Path(__file__).with_name('inspection_packet.py'));p=importlib.util.module_from_spec(s);s.loader.exec_module(p)
class PacketTests(unittest.TestCase):
 def setUp(self):
  self.source=p.canonical({'asset_count':2,'assets':[{'id':'a','state':'UNMEASURED','symbol':'USD'},{'id':'b','state':'MEASURED','symbol':'USD'}]});self.method=b'# fixture method, never execute\n';self.observer=b'# fixture observer, never execute\n'
  self.observation={'source_sha256':p.digest(self.observer),'state':'OBSERVED','sources':[{'id':'stablecoin-index','url':'https://councilof.ai/fixture.json','state':'FIRST_OBSERVATION','body_sha256':p.digest(self.source),'source_as_of':'2026-09-01','observed_collection_count':2}]}
  self.q={'schema':'csoai.private-source-request/0.1','source_id':'stablecoin-index','source_sha256':p.digest(self.source),'method':'source-consistency/1','method_sha256':p.digest(self.method)};self.q['request_id']=p.digest(p.canonical(self.q));self.q.update(observer_source_sha256=p.digest(self.observer),observer_receipt_sha256=p.digest(p.canonical(self.observation)),source_url='https://councilof.ai/fixture.json',source_as_of='2026-09-01')
  self.q.update(admitted_at='2026-09-18T01:00:00Z',authority='OWNER_AUTHORISED_PRIVATE_SOURCE_CONSISTENCY_ONLY',publication='PRIVATE_UNSIGNED',budget={'new_paid_requests':0,'inference':0,'wallet_actions':0})
  self.delivery={'schema':'csoai.private-evidence-delivery/0.1',**{k:self.q[k] for k in ['request_id','source_sha256','method_sha256','observer_receipt_sha256']},'request_scope_sha256':self.q['request_id'],'signature':None,'signature_state':'NOT_SIGNED','root_state':'NOT_ROOTED','witness_state':'NOT_WITNESSED','paid':False,'public':False,'measurement':{'scope':'RETAINED_SOURCE_STRUCTURE_AND_IDENTITY_CONSISTENCY','instrument':'source-consistency/1','record_count':2,'record_unit':'assets','recorded_state_counts':{'UNMEASURED':1,'MEASURED':1},'unique_record_ids':True,'declared_count':2,'declared_count_agrees':True,'source_as_of':'2026-09-01','model_performance':'NOT_ASSESSED','organisation_compliance':'NOT_ASSESSED','chain_state_verified':False,'signatures_verified':False}}
  self.members={'request.json':p.canonical(self.q),'delivery.json':p.canonical(self.delivery),'observation.json':p.canonical(self.observation),'source.body':self.source,'method.py':self.method,'observer.py':self.observer}
 def mutate_delivery(self,key,value):d=copy.deepcopy(self.delivery);d[key]=value;self.members['delivery.json']=p.canonical(d)
 def mutate_measurement(self,key,value):d=copy.deepcopy(self.delivery);d['measurement'][key]=value;self.members['delivery.json']=p.canonical(d)
 def rejected(self):
  with self.assertRaises(ValueError):p.inspect_members(self.members)
 def test_roundtrip_recounts_but_does_not_authenticate(self):
  raw=p.encode_packet(self.members);r=p.verify_packet(raw,self.q['request_id'],p.digest(raw));self.assertEqual(r['records_recounted'],2);self.assertFalse(r['publisher_authenticated']);self.assertFalse(r['code_executed']);self.assertTrue(r['expected_packet_digest_matched'])
 def test_export_is_deterministic(self):self.assertEqual(p.encode_packet(self.members),p.encode_packet(self.members))
 def test_no_external_digest_is_labelled(self):self.assertFalse(p.verify_packet(p.encode_packet(self.members))['expected_packet_digest_matched'])
 def test_wrong_expected_request(self):
  with self.assertRaises(ValueError):p.verify_packet(p.encode_packet(self.members),'a'*64)
 def test_wrong_expected_packet(self):
  with self.assertRaises(ValueError):p.verify_packet(p.encode_packet(self.members),expected_packet_sha256='0'*64)
 def test_tampered_source(self):self.members['source.body']=b'{}';self.rejected()
 def test_tampered_method(self):self.members['method.py']+=b'# change';self.rejected()
 def test_tampered_observer(self):self.members['observer.py']+=b'# change';self.rejected()
 def test_tampered_observation(self):self.members['observation.json']=b'{}';self.rejected()
 def test_changed_delivery_scope(self):self.mutate_delivery('request_scope_sha256','0'*64);self.rejected()
 def test_changed_request_id(self):self.mutate_delivery('request_id','0'*64);self.rejected()
 def test_changed_output_count(self):self.mutate_measurement('record_count',999);self.rejected()
 def test_changed_status_distribution(self):self.mutate_measurement('recorded_state_counts',{'MEASURED':2});self.rejected()
 def test_dates_not_refreshed_by_export(self):self.mutate_measurement('source_as_of','2099-01-01');self.rejected()
 def test_unknown_not_compliant(self):self.mutate_measurement('organisation_compliance','COMPLIANT');self.rejected()
 def test_cannot_add_signature_validity(self):self.mutate_measurement('signatures_verified',True);self.rejected()
 def test_cannot_add_payment_or_publication(self):
  for key in ['paid','public']:
   self.mutate_delivery(key,True);self.rejected()
 def test_cannot_claim_root(self):self.mutate_delivery('root_state','ROOTED');self.rejected()
 def test_duplicate_json_keys_rejected(self):self.members['request.json']=b'{"schema":1,"schema":2}';self.rejected()
 def test_nonfinite_json_rejected(self):
  with self.assertRaises(ValueError):p.strict_json(b'{"n":NaN}')
 def test_extra_archive_paths_rejected(self):
  raw=io.BytesIO(p.encode_packet(self.members))
  with zipfile.ZipFile(raw,'a') as z:z.writestr('../escape','bad')
  with self.assertRaises(ValueError):p.verify_packet(raw.getvalue())
 def test_changed_manifest_rejected(self):
  raw=p.encode_packet(self.members)
  with zipfile.ZipFile(io.BytesIO(raw)) as z:files={n:z.read(n) for n in z.namelist()}
  m=json.loads(files['manifest.json']);m['files']['source.body']['sha256']='0'*64;files['manifest.json']=p.canonical(m);buf=io.BytesIO()
  with zipfile.ZipFile(buf,'w') as z:
   for n,b in files.items():z.writestr(n,b)
  with self.assertRaises(ValueError):p.verify_packet(buf.getvalue())
 def test_added_attempt_configuration_rejected(self):
  q=copy.deepcopy(self.q);q['attempts']=2;self.members['request.json']=p.canonical(q);self.rejected()
 def test_changed_budget_rejected(self):
  q=copy.deepcopy(self.q);q['budget']['inference']=1;self.members['request.json']=p.canonical(q);self.rejected()
 def test_changed_authority_rejected(self):
  q=copy.deepcopy(self.q);q['authority']='PUBLIC_RELEASE_APPROVED';self.members['request.json']=p.canonical(q);self.rejected()
 def test_readonly_queue_export_and_repeat(self):
  with tempfile.TemporaryDirectory() as td:
   root=Path(td);(root/'assurance/deliveries').mkdir(parents=True);(root/'state/receipts').mkdir(parents=True);(root/'state/blobs').mkdir();(root/'assurance_delivery.py').write_bytes(self.method);(root/'living_observatory.py').write_bytes(self.observer)
   (root/'state/receipts'/(self.q['observer_receipt_sha256']+'.json')).write_bytes(self.members['observation.json']);(root/'state/blobs'/(self.q['source_sha256']+'.body')).write_bytes(self.source);dh=p.digest(self.members['delivery.json']);(root/'assurance/deliveries'/(dh+'.json')).write_bytes(self.members['delivery.json'])
   db=sqlite3.connect(root/'assurance/queue.sqlite');db.execute('CREATE TABLE jobs(id TEXT PRIMARY KEY, request TEXT, state TEXT, result_sha TEXT)');db.execute('INSERT INTO jobs VALUES(?,?,?,?)',(self.q['request_id'],self.members['request.json'].decode(),'DELIVERED_UNSIGNED',dh));db.commit();db.close()
   first=p.export_existing(root,self.q['request_id'],root/'exports');second=p.export_existing(root,self.q['request_id'],root/'exports');self.assertEqual(first['packet_sha256'],second['packet_sha256']);self.assertEqual(first['records_recounted'],2);self.assertFalse(first['new_execution'])
if __name__=='__main__':unittest.main()
