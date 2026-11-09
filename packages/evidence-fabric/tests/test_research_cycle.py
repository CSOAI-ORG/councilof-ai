import concurrent.futures,copy,json,os,sys,tempfile,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import research_cycle as C

class ResearchCycleTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);self.cat=self.root/'cat.json';self.obs=self.root/'obs.json'
  self.catalogue={'schema':'council.research-catalogue/1','records':[{'id':'R1','repo':'example/component','commit':'a'*40,'runtime_status':'NOT_RUN'},{'id':'C1','name':'Vendor'}]}
  self.observations=[{'repo':'example/component','observed_commit':'a'*40,'observed_at':'2026-10-30T09:00:00Z','source_url':'https://api.github.com/repos/example/component/commits?per_page=1'}]
  self.save()
 def tearDown(self):self.tmp.cleanup()
 def save(self):self.cat.write_text(json.dumps(self.catalogue));self.obs.write_text(json.dumps(self.observations))
 def run_cycle(self,**kw):return C.build(self.cat,self.obs,self.root/'runs','2026-10-30T10:00:00Z',**kw)
 def test_complete_outputs_and_no_runtime_promotion(self):
  r=self.run_cycle();self.assertEqual(r['state_counts'],{'CONSISTENT':1});self.assertEqual(r['runtime_qualification'],'NOT_RUN');self.assertFalse(r['grants_authority'])
  self.assertEqual(set(x.name for x in Path(r['directory']).iterdir()),C.FILES|{'manifest.json'})
 def test_changed_revision_is_divergent(self):
  self.observations[0]['observed_commit']='b'*40;self.save();self.assertEqual(self.run_cycle()['state_counts'],{'DIVERGENT':1})
 def test_missing_observation_stays_unmeasured(self):
  self.observations=[];self.save();r=self.run_cycle();self.assertEqual(r['state_counts'],{'UNMEASURED':1});ev=C.parse(C.read_regular(r['directory'],'events.jsonl'));self.assertIsNone(ev['value'])
 def test_stale_observation_is_uncheckable(self):
  self.observations[0]['observed_at']='2026-10-28T09:00:00Z';self.save();self.assertEqual(self.run_cycle()['state_counts'],{'UNCHECKABLE':1})
 def test_future_observation_rejected(self):
  self.observations[0]['observed_at']='2026-10-31T09:00:00Z';self.save()
  with self.assertRaisesRegex(ValueError,'later'):self.run_cycle()
 def test_duplicate_observations_rejected(self):
  self.observations*=2;self.save()
  with self.assertRaisesRegex(ValueError,'duplicate observation'):self.run_cycle()
 def test_unknown_observation_rejected(self):
  self.observations[0]['repo']='unknown/component';self.save()
  with self.assertRaisesRegex(ValueError,'unknown'):self.run_cycle()
 def test_source_url_must_bind_repository(self):
  self.observations[0]['source_url']='https://example.invalid/claim';self.save()
  with self.assertRaisesRegex(ValueError,'source mismatch'):self.run_cycle()
 def test_duplicate_catalogue_id_rejected(self):
  self.catalogue['records'][1]['id']='R1';self.save()
  with self.assertRaisesRegex(ValueError,'duplicate record'):self.run_cycle()
 def test_runtime_claim_in_catalogue_rejected(self):
  self.catalogue['records'][0]['runtime_status']='PASS';self.save()
  with self.assertRaisesRegex(ValueError,'runtime'):self.run_cycle()
 def test_identical_run_reused_without_rewriting(self):
  first=self.run_cycle();p=Path(first['directory'])/'manifest.json';before=p.stat().st_mtime_ns
  second=self.run_cycle();self.assertEqual(second['disposition'],'REUSED');self.assertEqual(first['cycle_id'],second['cycle_id']);self.assertEqual(before,p.stat().st_mtime_ns)
 def test_concurrent_identical_run_has_one_creation(self):
  with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(lambda _:self.run_cycle(),range(4)))
  self.assertEqual(sum(r['disposition']=='CREATED' for r in results),1)
 def test_predecessor_is_bound_and_preserved(self):
  first=self.run_cycle();before=C.read_regular(first['directory'],'events.jsonl');prior=C.parse(before)
  self.observations[0]['observed_commit']='b'*40;self.save();second=self.run_cycle(previous=first['directory'],expected_previous=first['manifest_sha256'])
  event=C.parse(C.read_regular(second['directory'],'events.jsonl'));self.assertEqual(event['supersedes'],prior['event_id']);self.assertEqual(event['state'],'DIVERGENT');self.assertEqual(before,C.read_regular(first['directory'],'events.jsonl'))
 def test_parent_without_selected_digest_rejected(self):
  with self.assertRaisesRegex(ValueError,'together'):self.run_cycle(previous='somewhere')
 def test_wrong_manifest_anchor_rejected(self):
  r=self.run_cycle()
  with self.assertRaisesRegex(ValueError,'expected digest'):C.verify(r['directory'],'0'*64)
 def test_missing_file_rejected(self):
  r=self.run_cycle();(Path(r['directory'])/'events.jsonl').unlink()
  with self.assertRaises(OSError):C.verify(r['directory'],r['manifest_sha256'])
 def test_byte_tampering_rejected(self):
  r=self.run_cycle();(Path(r['directory'])/'events.jsonl').write_bytes(b'{}\n')
  with self.assertRaisesRegex(ValueError,'byte mismatch'):C.verify(r['directory'],r['manifest_sha256'])
 def test_rehashed_forged_summary_still_rejected(self):
  r=self.run_cycle();p=Path(r['directory']);data=json.loads((p/'summary.json').read_text());data['state_counts']={'CONSISTENT':999};raw=C.encoded(data);(p/'summary.json').write_bytes(raw)
  manifest=json.loads((p/'manifest.json').read_text());manifest['files']['summary.json']={'sha256':C.sha(raw),'bytes':len(raw)};mr=C.encoded(manifest);(p/'manifest.json').write_bytes(mr)
  with self.assertRaisesRegex(ValueError,'accounting'):C.verify(p,C.sha(mr))
 def test_symlink_selected_file_rejected(self):
  r=self.run_cycle();p=Path(r['directory']);raw=(p/'events.jsonl').read_bytes();outside=self.root/'outside';outside.write_bytes(raw);(p/'events.jsonl').unlink();(p/'events.jsonl').symlink_to(outside)
  with self.assertRaises(OSError):C.verify(p,r['manifest_sha256'])
 def test_duplicate_json_and_nonfinite_rejected(self):
  for raw in [b'{"a":1,"a":2}',b'{"a":NaN}']:
   with self.assertRaises(ValueError):C.parse(raw)
 def test_boolean_age_window_rejected(self):
  with self.assertRaisesRegex(ValueError,'integer'):self.run_cycle(max_age_hours=True)
 def test_negative_control_catches_broken_comparator(self):
  from unittest.mock import patch
  with patch.object(C,'compare',return_value='CONSISTENT'):
   with self.assertRaisesRegex(ValueError,'negative control'):self.run_cycle()
 def test_network_not_needed_and_received_code_not_imported(self):
  from unittest.mock import patch
  with patch('urllib.request.urlopen',side_effect=AssertionError('network')),patch('subprocess.run',side_effect=AssertionError('subprocess')):
   r=self.run_cycle();(Path(r['directory'])/'event.py').write_text('raise AssertionError("received code executed")')
   self.assertEqual(C.verify(r['directory'],r['manifest_sha256'])['state'],'VERIFIED_LOCAL_DERIVATION')
 def test_canonical_events_validate(self):
  r=self.run_cycle();ev=C.parse(C.read_regular(r['directory'],'events.jsonl'));self.assertEqual(C.E.validate(ev),[])
 def test_carriers_keep_same_event_identity_and_no_score(self):
  r=self.run_cycle();p=r['directory'];ev=C.parse(C.read_regular(p,'events.jsonl'));sr=C.parse(C.read_regular(p,'evidence.sarif.json'))['runs'][0]['results'][0]
  attrs={a['key']:a['value'] for a in C.parse(C.read_regular(p,'evaluation.otlp.json'))['resourceLogs'][0]['scopeLogs'][0]['logRecords'][0]['attributes']}
  self.assertEqual(sr['properties']['event_id'],ev['event_id']);self.assertEqual(attrs['csoai.event_id']['stringValue'],ev['event_id']);self.assertNotIn('gen_ai.evaluation.score.value',attrs)
 def test_portable_packet_reconstructs_through_trusted_receiver(self):
  r=self.run_cycle();raw=C.encoded(C.packet(r['directory'],r['manifest_sha256']))
  self.assertEqual(C.verify_packet(raw,r['manifest_sha256'])['events'],1)
 def test_portable_packet_rejects_extra_path(self):
  r=self.run_cycle();p=C.packet(r['directory'],r['manifest_sha256']);p['files']['../escape']='bad'
  with self.assertRaisesRegex(ValueError,'inventory'):C.verify_packet(C.encoded(p),r['manifest_sha256'])
 def test_portable_packet_rejects_changed_payload(self):
  r=self.run_cycle();p=C.packet(r['directory'],r['manifest_sha256']);p['files']['events.jsonl']='{}'
  with self.assertRaisesRegex(ValueError,'byte mismatch'):C.verify_packet(C.encoded(p),r['manifest_sha256'])
 def test_selected_parent_chain_is_verified(self):
  first=self.run_cycle();self.observations[0]['observed_commit']='b'*40;self.save();second=self.run_cycle(previous=first['directory'],expected_previous=first['manifest_sha256'])
  result=C.verify_chain(second['directory'],second['manifest_sha256'],first['directory'],first['manifest_sha256']);self.assertEqual(result['prior_chain'],'SELECTED_PARENT_VERIFIED');self.assertEqual(result['prior_event_links'],1)
 def test_predecessor_cannot_be_later_than_new_evaluation(self):
  first=C.build(self.cat,self.obs,self.root/'runs','2026-10-30T12:00:00Z')
  with self.assertRaisesRegex(ValueError,'predates'):self.run_cycle(previous=first['directory'],expected_previous=first['manifest_sha256'])
 def test_same_capture_with_latest_as_parent_does_not_duplicate(self):
  first=self.run_cycle();second=self.run_cycle(previous=first['directory'],expected_previous=first['manifest_sha256'])
  self.assertEqual(second['cycle_id'],first['cycle_id']);self.assertEqual(second['disposition'],'REUSED')
if __name__=='__main__':unittest.main(verbosity=2)
