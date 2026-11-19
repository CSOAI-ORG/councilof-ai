"""Synthetic byte/identity controls; no hidden source retrieval or real authority."""
import copy,datetime,hashlib,json,subprocess,sys,unittest
from pathlib import Path
from join_contract import digest,join
from receive_artifacts import receive,review_json,review_current_json,evidence_json
from test_join_contract import fixture,C,NOW


def prepared():
    artifacts=[];pins=[]
    for r in fixture():
        p={k:v for k,v in r.items() if k!='result_sha256'}
        raw=json.dumps(p,sort_keys=True,separators=(',',':')).encode()
        artifacts.append(raw);pins.append({'component_id':p['component_id'],'revision':p['revision'],
                                          'result_sha256':hashlib.sha256(raw).hexdigest()})
    return artifacts,pins


def req():
    a,p=prepared()
    return {'context':copy.deepcopy(C),'now':NOW,'pins':p,'artifact_json':[b.decode() for b in a]}


class ReceiverTests(unittest.TestCase):
    def test_actual_bytes_accepted(self):
        a,p=prepared();r=receive(a,p,C,now=NOW)
        self.assertEqual(r['join']['label'],'RED');self.assertEqual(len(r['artifact_manifest']),2)
    def test_wrong_bytes_rejected(self):
        a,p=prepared();a[0]+=b' '
        with self.assertRaisesRegex(ValueError,'DIGEST_MISMATCH'):receive(a,p,C,now=NOW)
    def test_changed_probability_rejected(self):
        a,p=prepared();a[0]=a[0].replace(b'0.8',b'0.7')
        with self.assertRaisesRegex(ValueError,'DIGEST_MISMATCH'):receive(a,p,C,now=NOW)
    def test_wrong_external_pin_rejected(self):
        a,p=prepared();p[0]['result_sha256']='0'*64
        with self.assertRaisesRegex(ValueError,'DIGEST_MISMATCH'):receive(a,p,C,now=NOW)
    def test_wrong_pin_identity(self):
        a,p=prepared();p[0]['component_id']='another'
        with self.assertRaisesRegex(ValueError,'IDENTITY_MISMATCH'):receive(a,p,C,now=NOW)
    def test_wrong_pin_revision(self):
        a,p=prepared();p[0]['revision']='8'*64
        with self.assertRaisesRegex(ValueError,'IDENTITY_MISMATCH'):receive(a,p,C,now=NOW)
    def test_self_asserted_digest_not_an_artifact_field(self):
        a,p=prepared();x=json.loads(a[0]);x['result_sha256']='1'*64;a[0]=json.dumps(x).encode();p[0]['result_sha256']=hashlib.sha256(a[0]).hexdigest()
        with self.assertRaisesRegex(ValueError,'ARTIFACT_SHAPE'):receive(a,p,C,now=NOW)
    def test_rehash_does_not_bypass_stale_context(self):
        a,p=prepared();x=json.loads(a[0]);x['dependency_root']='9'*64;a[0]=json.dumps(x).encode();p[0]['result_sha256']=hashlib.sha256(a[0]).hexdigest()
        with self.assertRaisesRegex(ValueError,'CONTEXT_MISMATCH'):receive(a,p,C,now=NOW)
    def test_duplicate_json_key_rejected_after_hash(self):
        a,p=prepared();a[0]=a[0][:-1]+b',"state":"COMPLETE"}';p[0]['result_sha256']=hashlib.sha256(a[0]).hexdigest()
        with self.assertRaisesRegex(ValueError,'DUPLICATE_JSON_KEY'):receive(a,p,C,now=NOW)
    def test_nonobject_artifact(self):
        a,p=prepared();a[0]=b'[]';p[0]['result_sha256']=hashlib.sha256(a[0]).hexdigest()
        with self.assertRaisesRegex(ValueError,'ARTIFACT_SHAPE'):receive(a,p,C,now=NOW)
    def test_pin_fields_strict(self):
        a,p=prepared();p[0]['trusted']=True
        with self.assertRaisesRegex(ValueError,'PIN_SHAPE'):receive(a,p,C,now=NOW)
    def test_pin_types(self):
        for value in [True,None,{},'latest']:
            a,p=prepared();p[0]['revision']=value
            with self.assertRaises(ValueError):receive(a,p,C,now=NOW)
    def test_missing_pins(self):
        a,p=prepared()
        with self.assertRaisesRegex(ValueError,'PIN_COUNT'):receive(a,[],C,now=NOW)
    def test_not_bytes(self):
        a,p=prepared();a[0]=a[0].decode()
        with self.assertRaisesRegex(ValueError,'ARTIFACT_SIZE'):receive(a,p,C,now=NOW)
    def test_oversize(self):
        a,p=prepared();a[0]=b' '*65537
        with self.assertRaisesRegex(ValueError,'ARTIFACT_SIZE'):receive(a,p,C,now=NOW)
    def test_empty_input(self):
        with self.assertRaisesRegex(ValueError,'ARTIFACT_COUNT'):receive([],[],C,now=NOW)
    def test_json_interface(self):
        r=review_json(json.dumps(req()));self.assertEqual(r['join']['label'],'RED')
    def test_request_fields(self):
        r=req();r['url']='https://not-fetched.invalid'
        with self.assertRaisesRegex(ValueError,'REQUEST_SHAPE'):review_json(json.dumps(r))
    def test_artifact_is_not_a_path(self):
        r=req();r['artifact_json'][0]='/private/file'
        with self.assertRaises(ValueError):review_json(json.dumps(r))
    def test_request_not_text(self):
        with self.assertRaisesRegex(ValueError,'REQUEST_TEXT_REQUIRED'):review_json({})
    def test_unpaired_surrogate(self):
        r=req();r['artifact_json'][0]='\ud800'
        with self.assertRaisesRegex(ValueError,'ARTIFACT_ENCODING'):review_json(json.dumps(r))
    def test_request_bound(self):
        with self.assertRaisesRegex(ValueError,'SIZE_BOUND'):review_json(' '*65537)
    def test_claims_not_promoted(self):
        r=review_json(json.dumps(req()));self.assertFalse(r['authorises_execution']);self.assertFalse(r['pins_authenticated']);self.assertFalse(r['source_truth_established'])
    def test_canonical_event_is_partial(self):
        r=evidence_json(json.dumps(req()));e=r['event'];self.assertEqual(e['schema'],'csoai.evidence-event/0.1');self.assertEqual(e['state'],'PARTIAL');self.assertIsNone(e['value']);self.assertIsNone(e['signature']);self.assertEqual(e['negative_control']['got'],'NOT_RUN')
    def test_event_references_verified_manifest(self):
        r=evidence_json(json.dumps(req()));self.assertEqual(r['event']['claim']['source_sha256'],r['receiver']['artifact_manifest_sha256']);self.assertEqual(r['event']['observed']['receiver_sha256'],r['receiver']['receiver_sha256'])
    def test_no_prediction_score_masquerading_as_measurement(self):
        e=evidence_json(json.dumps(req()))['event'];self.assertIsNone(e['value']);self.assertNotIn('probabilities',e['observed'])
    def test_failed_receipt_emits_no_event(self):
        r=req();r['artifact_json'][1]+=' '
        with self.assertRaises(ValueError):evidence_json(json.dumps(r))
    def test_abstention_remains_partial(self):
        r=req();x=json.loads(r['artifact_json'][1]);x['probabilities']=[.2,.8];r['artifact_json'][1]=json.dumps(x);r['pins'][1]['result_sha256']=hashlib.sha256(r['artifact_json'][1].encode()).hexdigest()
        out=evidence_json(json.dumps(r));self.assertEqual(out['receiver']['join']['state'],'ABSTAIN');self.assertEqual(out['event']['state'],'PARTIAL')
    def test_result_detached_from_context(self):
        c=copy.deepcopy(C);r=join(fixture(),c,now=NOW);before=copy.deepcopy(r);c['label_schema'][0]='CHANGED';self.assertEqual(r,before)
    def test_digest_survives_caller_mutation(self):
        c=copy.deepcopy(C);r=join(fixture(),c,now=NOW);c['label_schema'].append('NEW');self.assertEqual(r['review_sha256'],digest({k:v for k,v in r.items() if k!='review_sha256'}))
    def test_enormous_integer_is_invalid_probability(self):
        a=fixture();a[0]['probabilities']=[10**1000,0]
        with self.assertRaisesRegex(ValueError,'PROBABILITIES'):join(a,C,now=NOW)
    def test_enormous_integer_is_invalid_weight(self):
        with self.assertRaisesRegex(ValueError,'WEIGHTS'):join(fixture(),C,now=NOW,weights=[10**1000,1])
    def test_inputs_preserved(self):
        r=req();before=copy.deepcopy(r);evidence_json(json.dumps(r));self.assertEqual(before,r)
    def test_exact_replay(self):self.assertEqual(evidence_json(json.dumps(req())),evidence_json(json.dumps(req())))
    def test_cli_valid(self):
        p=Path(__file__).with_name('receive_artifacts.py');r=subprocess.run([sys.executable,'-B',str(p)],input=json.dumps(req()),capture_output=True,text=True,timeout=5)
        self.assertEqual(r.returncode,0,r.stderr);self.assertEqual(json.loads(r.stdout)['event']['state'],'PARTIAL')
    def test_cli_late_failure_no_partial_output(self):
        p=Path(__file__).with_name('receive_artifacts.py');q=req();q['artifact_json'][1]+=' ';r=subprocess.run([sys.executable,'-B',str(p)],input=json.dumps(q),capture_output=True,text=True,timeout=5)
        self.assertNotEqual(r.returncode,0);self.assertEqual(r.stdout,'')

    def live_request(self, expired=False):
        r=req();r.pop('now');now=datetime.datetime.now(datetime.timezone.utc)
        source=(now-datetime.timedelta(hours=2)).isoformat()
        expiry=(now+datetime.timedelta(hours=-1 if expired else 1)).isoformat()
        r['context']['source_snapshot']=source
        for i,text in enumerate(r['artifact_json']):
            x=json.loads(text);x['source_snapshot']=source;x['valid_until']=expiry
            r['artifact_json'][i]=json.dumps(x);r['pins'][i]['result_sha256']=hashlib.sha256(r['artifact_json'][i].encode()).hexdigest()
        return r
    def test_receiver_utc_mode(self):
        result=review_current_json(json.dumps(self.live_request()));self.assertEqual(result['clock_mode'],'RECEIVER_UTC')
    def test_live_request_clock_rejected(self):
        r=self.live_request();r['now']='2000-01-01T00:00:00Z'
        with self.assertRaisesRegex(ValueError,'REQUEST_CLOCK_FORBIDDEN'):review_current_json(json.dumps(r))
    def test_live_expiry_checked(self):
        with self.assertRaisesRegex(ValueError,'EXPIRED_RESULT'):review_current_json(json.dumps(self.live_request(expired=True)))
    def test_replay_clock_explicit(self):
        self.assertEqual(review_json(json.dumps(req()))['clock_mode'],'CALLER_SUPPLIED_REPLAY')
    def test_live_event_clock_explicit(self):
        e=evidence_json(json.dumps(self.live_request()),current=True)['event'];self.assertEqual(e['observed']['clock_mode'],'RECEIVER_UTC')
    def test_live_receiver_digest_valid(self):
        r=review_current_json(json.dumps(self.live_request()));self.assertEqual(r['receiver_sha256'],digest({k:v for k,v in r.items() if k!='receiver_sha256'}))

if __name__=='__main__':unittest.main(verbosity=2)
