# SPDX-License-Identifier: MIT
import copy
import datetime as dt
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import csoai_read as c

REV='a'*40
class Tests(unittest.TestCase):
    def setUp(self):
        self.at=dt.datetime.now(dt.timezone.utc).isoformat()
        self.row={'population':'stablecoins','subject_id':'fixture','claim':{'id':'fixture','name':'SYNTHETIC'},'entity_id':'fixture','state':'CLAIM_CAPTURED'}
        self.row['content_sha256']=c.sha(c.encoded({k:self.row[k] for k in ('population','subject_id','claim')}))
        self.doc={'schema':'csoai.claim-population-slice/0.1','as_of':self.at,'run_id':'20260923T010000Z','count':1,'coverage':'PARTIAL_WINDOW','population':'stablecoins','unique_entities':1,'records':[self.row]}
    def population_fixture(self):
        base=c.HF_BASE+REV+'/claim-capture/'
        rel='runs/'+self.doc['run_id']+'/populations/stablecoins.json'
        # Deliberately pretty JSON so output cannot silently be normalized.
        raw=json.dumps(self.doc,indent=2).encode()+b'\n'
        info={'path':rel,'as_of':self.doc['as_of'],'count':self.doc['count'],'coverage':self.doc['coverage'],'unique_entities':self.doc['unique_entities'],'sha256':c.sha(raw)}
        manifest={'schema':'csoai.claim-capture-release/0.1','run_id':self.doc['run_id'],'files':{rel:{'bytes':len(raw),'sha256':c.sha(raw)}},'populations':{'stablecoins':info}}
        mraw=c.encoded(manifest)
        pointer={'schema':'csoai.claim-capture-pointer/0.1','hf_commit':REV,'run_id':self.doc['run_id'],'release_url':base+'release.json','release_sha256':c.sha(mraw)}
        return {c.CAPTURE_POINTER:c.encoded(pointer),base+'release.json':mraw,base+rel:raw},base+rel
    def operations_fixture(self):
        base=c.HF_BASE+REV+'/operations/claim-maintenance/releases/'+'b'*64+'/'
        doc={'schema':'csoai.overnight-status/0.2','as_of':self.at,'status':'DEGRADED','sources':{'fixture':{'as_of':self.at,'state':'STALE'}}}
        raw=c.encoded(doc)
        m={'schema':'csoai.operations-release/0.1','as_of':self.at,'files':{'status.json':{'sha256':c.sha(raw),'bytes':len(raw)}}};mraw=c.encoded(m)
        p={'schema':'csoai.operations-pointer/0.1','hf_commit':REV,'release_sha256':c.sha(mraw),'manifest_url':base+'manifest.json','status_url':base+'status.json','as_of':self.at}
        return {c.OPERATIONS_POINTER:c.encoded(p),base+'manifest.json':mraw,base+'status.json':raw},base
    def test_population_and_three_reads(self):
        fx,url=self.population_fixture();calls=[]
        def f(u):calls.append(u);return fx[u]
        r,raw=c.read_population(fetcher=f);self.assertEqual(r['records'],1);self.assertEqual(raw,fx[url]);self.assertEqual(len(calls),3)
    def test_operations_degraded_preserved(self):
        fx,_=self.operations_fixture();r,_=c.read_operations(fetcher=fx.__getitem__);self.assertEqual(r['reported_operational_state'],'DEGRADED');self.assertEqual(r['producer_observations']['fixture']['state'],'STALE')
    def test_payload_tamper(self):
        fx,url=self.population_fixture();fx[url]+=b' '
        with self.assertRaises(c.EvidenceError):c.read_population(fetcher=fx.__getitem__)
    def test_manifest_tamper(self):
        fx,_=self.population_fixture();fx[c.HF_BASE+REV+'/claim-capture/release.json']+=b' '
        with self.assertRaises(c.EvidenceError):c.read_population(fetcher=fx.__getitem__)
    def test_record_digest_rejected_even_rehashed_manifest(self):
        self.row['claim']['name']='altered';fx,_=self.population_fixture()
        with self.assertRaises(c.EvidenceError):c.read_population(fetcher=fx.__getitem__)
    def test_duplicated_id(self):
        self.doc['records'].append(copy.deepcopy(self.row));self.doc['count']=2;fx,_=self.population_fixture()
        with self.assertRaises(c.EvidenceError):c.read_population(fetcher=fx.__getitem__)
    def test_wrong_count(self):
        self.doc['count']=2;fx,_=self.population_fixture()
        with self.assertRaises(c.EvidenceError):c.read_population(fetcher=fx.__getitem__)
    def test_version_not_entity(self):
        second=copy.deepcopy(self.row);second['subject_id']='fixture@2';second['content_sha256']=c.sha(c.encoded({k:second[k] for k in ('population','subject_id','claim')}));self.doc['records'].append(second);self.doc['count']=2
        fx,_=self.population_fixture();r,_=c.read_population(fetcher=fx.__getitem__);self.assertEqual(r['unique_entities'],1);self.assertEqual(r['records'],2)
    def test_wrong_entity_count(self):
        self.doc['unique_entities']=2;fx,_=self.population_fixture()
        with self.assertRaises(c.EvidenceError):c.read_population(fetcher=fx.__getitem__)
    def test_no_inferred_payment_or_signature(self):
        fx,_=self.population_fixture();r,_=c.read_population(fetcher=fx.__getitem__)
        for key in ('payment_made','signature_checked','bitcoin_chain_checked','merkle_inclusion_checked','source_truth_checked','remote_code_executed'):self.assertFalse(r[key])
    def test_unknown_population(self):
        with self.assertRaises(c.EvidenceError):c.read_population('unknown',fetcher=lambda _:self.fail('no request'))
    def test_foreign_url(self):
        with self.assertRaises(c.EvidenceError):c.checked_url('https://example.invalid/x')
    def test_mutable_artifact(self):
        with self.assertRaises(c.EvidenceError):c.checked_url(c.HF_BASE+'main/claim-capture/snapshot.json')
    def test_revision_swap(self):
        with self.assertRaises(c.EvidenceError):c.checked_url(c.HF_BASE+REV+'/claim-capture/release.json','c'*40)
    def test_path_traversal(self):
        with self.assertRaises(c.EvidenceError):c.checked_url(c.HF_BASE+REV+'/claim-capture/../secret')
    def test_percent_encoding(self):
        with self.assertRaises(c.EvidenceError):c.checked_url(c.HF_BASE+REV+'/claim-capture/%2e%2e/secret')
    def test_query_not_allowed(self):
        with self.assertRaises(c.EvidenceError):c.checked_url(c.CAPTURE_POINTER+'?token=x')
    def test_duplicate_json(self):
        with self.assertRaises(c.EvidenceError):c.strict_json(b'{"a":1,"a":2}')
    def test_html_is_not_json(self):
        with self.assertRaises(c.EvidenceError):c.strict_json(b'<html>oops</html>')
    def test_nan_rejected(self):
        with self.assertRaises(c.EvidenceError):c.strict_json(b'{"a":NaN}')
    def test_future_rejected(self):
        with self.assertRaises(c.EvidenceError):c.freshness('2099-01-01T00:00:00Z',6)
    def test_timezone_required(self):
        with self.assertRaises(c.EvidenceError):c.freshness('2026-09-23T01:00:00',6)
    def test_stale_retained(self):self.assertEqual(c.freshness('2000-01-01T00:00:00Z',6)['state'],'STALE_FOR_CONSUMER')
    def test_boolean_length_rejected(self):
        with self.assertRaises(c.EvidenceError):c.equal_bytes(b'x',c.sha(b'x'),True)
    def test_exact_output_bytes(self):
        fx,url=self.population_fixture();r,raw=c.read_population(fetcher=fx.__getitem__)
        with tempfile.TemporaryDirectory() as d,patch.object(c,'read_population',return_value=(r,raw)):
            out=Path(d)/'new';self.assertEqual(c.main(['population','--output',str(out)]),0);self.assertEqual((out/'artifact.json').read_bytes(),fx[url])
    def test_existing_directory_not_overwritten(self):
        fx,_=self.population_fixture();r,raw=c.read_population(fetcher=fx.__getitem__)
        with tempfile.TemporaryDirectory() as d,patch.object(c,'read_population',return_value=(r,raw)):
            with self.assertRaises(FileExistsError):c.main(['population','--output',d])
if __name__=='__main__':unittest.main(verbosity=2)
