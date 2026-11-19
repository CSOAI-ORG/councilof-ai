import copy,json,tempfile,unittest
from pathlib import Path
import evidence_review as e
NOW='2026-11-04T12:00:00+00:00'
def source(**kw):
 d={'url':'https://github.com/asago-ai/midojo/issues/190','label':'Owned source fixture','retrieved_at':'2026-11-04T11:00:00+00:00','availability':'AVAILABLE','raw_sha256':'a'*64,'metadata':{'title':'Example source','state':'open','updated_at':'2026-11-03T11:00:00Z'}};d.update(kw);return d
PLAN={'opportunities':[{'id':'RH-01','priority':'P0','area':'Red Hat / asago','opening':'Missing evidence','acceptance':'No false grade','gate':'Maintainer review','sources':'https://github.com/asago-ai/midojo/issues/190'}]}
def build(rows=None,prev=None,now=NOW):return e.build(rows if rows is not None else [source()],PLAN,now,prev)
class ReviewTests(unittest.TestCase):
 def test_no_previous_no_invented_growth(self):
  r=build();self.assertEqual(r['comparison'],'UNAVAILABLE_NO_BASELINE');self.assertEqual(r['counts']['changed_records'],0);self.assertEqual(r['findings'][0]['kind'],'BASELINE_OBSERVATION')
 def test_repeated_reads_not_new_evidence(self):
  a=build();s=source(retrieved_at='2026-11-04T11:30:00Z');s['metadata']['updated_at']='2026-11-04T11:20:00Z';b=build([s],a)
  self.assertEqual(a['sources'][0]['revision_id'],b['sources'][0]['revision_id']);self.assertEqual(b['findings'],[])
 def test_raw_format_change_not_substantive(self):
  a=build();b=build([source(raw_sha256='b'*64)],a);self.assertEqual(b['findings'],[])
 def test_duplicate_location_is_not_two_sources(self):
  r=build([source(),source()]);self.assertEqual(r['counts']['unique_source_locations'],1)
 def test_latest_same_location_wins_not_input_order(self):
  late=source(retrieved_at='2026-11-04T11:30:00Z');late['metadata']['state']='closed'
  self.assertEqual(build([source(),late])['sources'],build([late,source()])['sources'])
 def test_same_time_conflict_refused(self):
  s=source();s['metadata']['state']='closed'
  with self.assertRaises(ValueError):build([source(),s])
 def test_true_merge_only_means_source_merge(self):
  s=source();s['metadata'].update(merged=True,state='closed',merge_sha='b'*40)
  r=build([s]);self.assertEqual(r['sources'][0]['status'],'SOURCE_MERGED_NOT_DEPLOYMENT');self.assertEqual(r['counts']['integrations_closed'],0)
 def test_closed_unmerged_not_adopted(self):
  s=source();s['metadata'].update(merged=False,state='closed');self.assertEqual(build([s])['sources'][0]['status'],'CLOSED_UNMERGED')
 def test_truthy_merge_rejected(self):
  for x in ['true',1,None]:
   s=source();s['metadata']['merged']=x
   with self.assertRaises(ValueError):build([s])
 def test_source_failure_not_zero_activity(self):
  s=source(availability='UNAVAILABLE',metadata=None,raw_sha256=None,failure_kind='TIMEOUT');r=build([s]);self.assertEqual(r['sources'][0]['status'],'VISIBILITY_GAP');self.assertIsNone(r['sources'][0]['metadata']);self.assertEqual(r['counts']['unavailable'],1)
 def test_lost_visibility_not_source_regression(self):
  a=build();b=build([source(availability='UNAVAILABLE')],a);self.assertEqual(b['findings'][0]['kind'],'VISIBILITY_CHANGED')
 def test_recovery_is_visibility_not_measurement(self):
  a=build([source(availability='UNAVAILABLE')]);b=build(prev=a);self.assertEqual(b['findings'][0]['kind'],'VISIBILITY_CHANGED')
 def test_stale_read_not_current_even_when_merged(self):
  s=source(retrieved_at='2026-11-01T12:00:00Z');s['metadata']['merged']=True;self.assertEqual(build([s])['sources'][0]['status'],'STALE_OBSERVATION')
 def test_unobserved_previous_source_not_disappeared(self):
  r=build([],build());self.assertEqual(r['findings'][0]['kind'],'NOT_OBSERVED_THIS_RUN')
 def test_changed_head_reported_without_auto_closing(self):
  old=source();old['metadata']['head_sha']='b'*40;a=build([old]);s=source();s['metadata']['head_sha']='c'*40;b=build([s],a);self.assertEqual(b['findings'][0]['kind'],'SOURCE_CHANGED');self.assertEqual(b['findings'][0]['review_state'],'PENDING_HUMAN_REVIEW')
 def test_tampered_previous_report_refused(self):
  a=build();a['counts']['integrations_closed']=10
  with self.assertRaises(ValueError):build(prev=a)
 def test_future_source_refused(self):
  with self.assertRaises(ValueError):build([source(retrieved_at='2026-11-05T11:00:00Z')])
 def test_naive_timestamp_refused(self):
  with self.assertRaises(ValueError):build([source(retrieved_at='2026-11-04T11:00:00')])
 def test_missing_and_zero_remain_distinct(self):
  r=build([]);self.assertEqual(r['counts']['unique_source_locations'],0);self.assertEqual(r['sources'],[]);self.assertIsNone(r['controlled_reproduction'])
 def test_no_credential_urls_or_unknown_hosts(self):
  for url in ['http://github.com/r','https://a:b@github.com/r','https://github.com/r?token=x','https://evil.invalid/x','javascript:alert(1)']:
   with self.assertRaises(ValueError):build([source(url=url)])
 def test_unknown_source_fields_do_not_leak(self):
  s=source();s['metadata']['token']='PRIVATE';s['private_prompt']='PRIVATE';self.assertNotIn('PRIVATE',json.dumps(build([s])))
 def test_duplicate_plan_ids_refused(self):
  p=copy.deepcopy(PLAN);p['opportunities']*=2
  with self.assertRaises(ValueError):e.build([source()],p,NOW)
 def test_full_round_trip_and_exact_old_bytes(self):
  with tempfile.TemporaryDirectory() as t:
   out=Path(t)/'a';r=build();e.write_pack(r,out);before=(out/'report.json').read_bytes();self.assertEqual(e.verify_pack(out)['state'],'BYTES_AND_PROJECTIONS_MATCH')
   s=source();s['metadata']['state']='closed';e.write_pack(build([s],r),Path(t)/'b');self.assertEqual((out/'report.json').read_bytes(),before)
 def test_existing_output_never_overwritten(self):
  with tempfile.TemporaryDirectory() as t:
   out=Path(t)/'a';e.write_pack(build(),out)
   with self.assertRaises(FileExistsError):e.write_pack(build(),out)
 def test_changed_report_fails_verifier(self):
  with tempfile.TemporaryDirectory() as t:
   out=Path(t)/'a';e.write_pack(build(),out);p=out/'report.json';p.write_bytes(p.read_bytes()+b' ')
   with self.assertRaises(ValueError):e.verify_pack(out)
 def test_duplicate_json_keys_refused(self):
  with tempfile.TemporaryDirectory() as t:
   p=Path(t)/'a.json';p.write_text('{"a":1,"a":2}')
   with self.assertRaises(ValueError):e.read(p)
 def test_symlink_input_refused(self):
  with tempfile.TemporaryDirectory() as t:
   p=Path(t)/'a.json';p.write_text('{}');q=Path(t)/'b.json';q.symlink_to(p)
   with self.assertRaises(OSError):e.read(q)
 def test_finite_json_only(self):
  with self.assertRaises(ValueError):e.digest({'value':float('nan')})
 def test_no_report_grants_authority(self):
  r=build();self.assertEqual(r['signature_status'],'UNSIGNED');self.assertEqual(r['grants_authority'],False);self.assertTrue(r['review_only'])
 def test_pack_is_not_an_issuer_attestation(self):
  with tempfile.TemporaryDirectory() as t:
   out=Path(t)/'a';e.write_pack(build(),out);self.assertFalse(e.verify_pack(out)['issuer_authenticated'])
class AddedReviewTests(unittest.TestCase):
 def test_new_observation_field_is_not_claimed_as_upstream_change(self):
  a=build();s=source();s['metadata']['content_sha256']='b'*64;b=build([s],a)
  self.assertEqual(b['findings'][0]['kind'],'OBSERVATION_COVERAGE_CHANGED');self.assertEqual(b['counts']['changed_records'],0)

 def test_changed_issue_body_is_a_material_source_change(self):
  old=source();old['metadata']['content_sha256']='a'*64;prior=build([old]);new=source();new['metadata']['content_sha256']='b'*64
  result=build([new],prior);self.assertEqual(result['findings'][0]['kind'],'SOURCE_CHANGED')
 def test_nested_metadata_is_not_exported(self):
  s=source();s['metadata']['title']={'secret':'PRIVATE'}
  with self.assertRaises(ValueError):build([s])
 def test_invalid_content_digest_refused(self):
  s=source();s['metadata']['content_sha256']='not-a-digest'
  with self.assertRaises(ValueError):build([s])
 def test_reproduction_baseline_count_must_match_rows(self):
  p=Path(__file__).parent/'fixtures/midojo-reproduction.json';d=json.loads(p.read_text());d['baseline']['passed']=12
  with self.assertRaises(ValueError):e.build([source()],PLAN,NOW,reproduction=d)
 def test_reproduction_duplicate_cases_refused(self):
  p=Path(__file__).parent/'fixtures/midojo-reproduction.json';d=json.loads(p.read_text());d['candidate']['checks'][1]['case']=d['candidate']['checks'][0]['case']
  with self.assertRaises(ValueError):e.build([source()],PLAN,NOW,reproduction=d)
 def test_reproduction_truthy_result_refused(self):
  p=Path(__file__).parent/'fixtures/midojo-reproduction.json';d=json.loads(p.read_text());d['candidate']['checks'][0]['satisfied']=1
  with self.assertRaises(ValueError):e.build([source()],PLAN,NOW,reproduction=d)

if __name__=='__main__':unittest.main(verbosity=2)
