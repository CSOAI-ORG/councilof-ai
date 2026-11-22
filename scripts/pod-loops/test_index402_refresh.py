# SPDX-License-Identifier: MIT
"""Offline controls for explicit metadata-only directory refresh. No live calls."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import index402_refresh as m

URL='https://councilof.ai/api/proof?bundle=1'
RID='37594c23-d5c7-4c79-a289-f087af06a7af'

class RefreshTests(unittest.TestCase):
    def setUp(self):
        self.manifest={'resources':[{'url':URL,'method':'GET','description':'Published proof assembly. Verification is free.'}]}
        self.row={'id':RID,'url':URL,'protocol':'x402','name':'Council proof bundle','description':'Expired historical offer.',
                  'provider':'CSOAI Ltd','category':'data','payment_asset':'USDC','payment_network':'Base','status':'active','price_usd':0.01}
        self.rows=[copy.deepcopy(self.row)]
    def plan(self):return m.plan_refresh(self.manifest,self.rows,[URL])
    def test_existing_metadata_selected(self):self.assertEqual(len(self.plan()),1)
    def test_unchanged_description_is_noop(self):
        self.rows[0]['description']=self.manifest['resources'][0]['description'];self.assertEqual(self.plan(),[])
    def test_original_inputs_not_modified(self):
        before=copy.deepcopy((self.manifest,self.rows));self.plan();self.assertEqual((self.manifest,self.rows),before)
    def test_no_price_wallet_or_credentials_payload(self):
        p=self.plan()[0]['payload'];self.assertEqual(set(p),{'url','name','protocol','http_method','description','provider','category','payment_asset','payment_network'})
    def test_preserve_name_provider_category(self):
        p=self.plan()[0]['payload'];self.assertEqual(p['name'],self.row['name']);self.assertEqual(p['provider'],self.row['provider']);self.assertEqual(p['category'],self.row['category'])
    def test_foreign_hostname_cannot_match_substring(self):
        self.assertFalse(m.owned_url('https://example.com/api/?councilof.ai'))
        self.assertFalse(m.owned_url('https://councilof.ai.example.com/api/proof'))
    def test_embedded_credentials_refused(self):self.assertFalse(m.owned_url('https://user:secret@councilof.ai/api/proof'))
    def test_non_https_fragment_and_port_refused(self):
        for u in ['http://councilof.ai/api/proof','https://councilof.ai/api/proof#x','https://councilof.ai:8443/api/proof']:
            self.assertFalse(m.owned_url(u))
    def test_missing_listing_not_created(self):
        self.rows=[]
        with self.assertRaisesRegex(m.RefreshError,'EXISTING_LISTING_MISSING'):self.plan()
    def test_duplicate_listing_refused(self):
        self.rows.append(copy.deepcopy(self.row))
        with self.assertRaisesRegex(m.RefreshError,'AMBIGUOUS'):self.plan()
    def test_duplicate_canonical_route_refused(self):
        self.manifest['resources']*=2
        with self.assertRaisesRegex(m.RefreshError,'AMBIGUOUS'):self.plan()
    def test_unknown_route_refused(self):
        with self.assertRaisesRegex(m.RefreshError,'MANIFEST_URL_MISSING'):m.plan_refresh(self.manifest,self.rows,['https://councilof.ai/api/unknown'])
    def test_no_implicit_all_selection(self):
        with self.assertRaisesRegex(m.RefreshError,'EXACT_SELECTION'):m.plan_refresh(self.manifest,self.rows,[])
    def test_duplicate_selection_refused(self):
        with self.assertRaisesRegex(m.RefreshError,'DUPLICATE_SELECTION'):m.plan_refresh(self.manifest,self.rows,[URL,URL])
    def test_change_limit(self):
        with self.assertRaisesRegex(m.RefreshError,'CHANGE_LIMIT'):m.plan_refresh(self.manifest,self.rows,[URL],11)
    def test_boolean_limit_refused(self):
        with self.assertRaisesRegex(m.RefreshError,'CHANGE_LIMIT'):m.plan_refresh(self.manifest,self.rows,[URL],True)
    def test_non_get_refused(self):
        self.manifest['resources'][0]['method']='POST'
        with self.assertRaisesRegex(m.RefreshError,'UNSUPPORTED_METHOD'):self.plan()
    def test_description_not_truncated(self):
        self.manifest['resources'][0]['description']='x'*501
        with self.assertRaisesRegex(m.RefreshError,'DESCRIPTION_REQUIRED'):self.plan()
    def test_static_price_in_description_refused(self):
        for description in ['Current offer until next month','Only 0.01 USDC','Costs £1 today']:
            self.manifest['resources'][0]['description']=description
            with self.assertRaisesRegex(m.RefreshError,'PRICE_IN_DESCRIPTION'):self.plan()
    def test_malformed_index_not_absence(self):
        with self.assertRaisesRegex(m.RefreshError,'INDEX_SCOPE'):m.plan_refresh(self.manifest,None,[URL])
    def test_index_page_incomplete_fails_closed(self):
        def client(url):return 200,{'total':1,'services':[]},'x'
        with self.assertRaisesRegex(m.RefreshError,'INDEX_INCOMPLETE'):m.read_index(client)
    def test_index_total_unknown_fails_closed(self):
        def client(url):return 200,{'services':[]},'x'
        with self.assertRaisesRegex(m.RefreshError,'TOTAL_UNQUALIFIED'):m.read_index(client)
    def test_index_complete_zero_is_known_empty(self):
        self.assertEqual(m.read_index(lambda url:(200,{'total':0,'services':[]},'x')),[])
    def test_index_reads_actual_remaining_page(self):
        first=[{'id':str(i)} for i in range(200)];calls=[]
        def client(url):
            calls.append(url);return 200,{'total':201,'services':first if len(calls)==1 else [{'id':'last'}]},'x'
        self.assertEqual(len(m.read_index(client)),201);self.assertIn('offset=200',calls[1])
    def test_index_changing_total_refused(self):
        pages=iter([(200,{'total':201,'services':[{'id':str(i)} for i in range(200)]},'x'),(200,{'total':202,'services':[{'id':'last'}]},'x')])
        with self.assertRaisesRegex(m.RefreshError,'INDEX_CHANGED'):m.read_index(lambda url:next(pages))
    def test_pending_is_not_active_confirmation(self):
        p=self.plan()[0];row=dict(self.row,description=p['payload']['description'],status='pending')
        out=m.inspect_after(row,p);self.assertTrue(out['metadata_matches']);self.assertFalse(out['active_listing_confirmed'])
    def test_wrong_identity_not_confirmation(self):
        p=self.plan()[0];row=dict(self.row,id='wrong',description=p['payload']['description'])
        self.assertFalse(m.inspect_after(row,p)['metadata_matches'])
    def test_success_requires_public_readback(self):
        p=self.plan()[0];calls=[]
        def client(url,body=None):
            calls.append((url,body))
            if body is not None:return 201,{'status':'pending'},'post'
            if len(calls)==1:return 200,self.row,'before'
            return 200,dict(self.row,description=p['payload']['description']),'after'
        with tempfile.TemporaryDirectory() as td:r=m.apply_one(p,client,Path(td))
        self.assertEqual(r['state'],'PUBLIC_METADATA_UPDATED');self.assertEqual(len([c for c in calls if c[1] is not None]),1)
    def test_reject_stale_prewrite_before_post(self):
        p=self.plan()[0];calls=[]
        def client(url,body=None):calls.append(body);return 200,dict(self.row,description='Other owner changed this.'),'x'
        with tempfile.TemporaryDirectory() as td:
            with self.assertRaisesRegex(m.RefreshError,'OTHER_WRITER_CHANGED'):m.apply_one(p,client,Path(td))
        self.assertEqual(calls,[None])
    def test_repeated_intent_prevents_second_write(self):
        p=self.plan()[0];calls=[]
        def client(url,body=None):calls.append(body);return 200,self.row,'x'
        with tempfile.TemporaryDirectory() as td:
            out=Path(td);(out/(RID+'.intent.json')).write_text('{}')
            with self.assertRaises(FileExistsError):m.apply_one(p,client,out)
        self.assertEqual(calls,[None])
    def test_timeout_after_submit_stays_unconfirmed(self):
        p=self.plan()[0];calls=[]
        def client(url,body=None):
            calls.append(body)
            if body is not None:raise m.RefreshError('TRANSPORT_OUTCOME_UNCONFIRMED')
            return 200,self.row,'x'
        with tempfile.TemporaryDirectory() as td:r=m.apply_one(p,client,Path(td))
        self.assertEqual(r['state'],'WRITE_OUTCOME_UNCONFIRMED');self.assertEqual(len(calls),2)
    def test_429_is_not_success(self):
        p=self.plan()[0]
        def client(url,body=None):return (429,{'error':'rate limit'},'post') if body is not None else (200,self.row,'before')
        with tempfile.TemporaryDirectory() as td:r=m.apply_one(p,client,Path(td))
        self.assertEqual(r['state'],'NOT_ACCEPTED');self.assertEqual(r['registration_http_status'],429)
    def test_dry_run_has_no_registration_call(self):
        with tempfile.TemporaryDirectory() as td, patch.object(m,'read_manifest',return_value=(self.manifest,'hash')),patch.object(m,'read_index',return_value=self.rows),patch.object(m,'apply_one',side_effect=AssertionError('No write permitted')):
            self.assertEqual(m.main(['--refresh-existing','--only-url',URL,'--out',td]),0)
            self.assertTrue(json.loads((Path(td)/'RESULT.json').read_text())['plan_only'])

class EntryPointTests(unittest.TestCase):
    def load(self):
        import importlib.util
        spec=importlib.util.spec_from_file_location('registration_entrypoint',Path(__file__).with_name('register-402index.py'))
        module=importlib.util.module_from_spec(spec)
        with patch.object(Path,'mkdir',side_effect=AssertionError('Import must not write')):
            spec.loader.exec_module(module)
        return module
    def test_import_has_no_filesystem_write(self):self.assertTrue(callable(self.load().main))
    def test_explicit_refresh_dispatch(self):
        entry=self.load();args=['register-402index.py','--refresh-existing','--only-url',URL,'--out','unused']
        with patch.object(entry.sys,'argv',args),patch.object(m,'main',return_value=0) as refresh:
            self.assertEqual(entry.main(),0);refresh.assert_called_once_with(args[1:])
    def test_default_retains_missing_only_flow(self):
        entry=self.load()
        with tempfile.TemporaryDirectory() as td,patch.object(entry,'OUT',Path(td)),patch.object(entry.sys,'argv',['register-402index.py']),patch.object(entry,'call',return_value=(200,b'{"resources":[]}')) as client,patch.object(entry,'listed',return_value=set()),patch.object(m,'main',side_effect=AssertionError('No refresh without explicit flag')):
            self.assertEqual(entry.main(),0);client.assert_called_once_with(entry.MANIFEST)
            self.assertEqual(json.loads((Path(td)/'LAST.json').read_text())['registered_now'],0)
    def test_other_writer_metadata_change_refused(self):
        t=RefreshTests();t.setUp();plan=t.plan()[0];calls=[]
        def client(url,body=None):calls.append(body);return 200,dict(t.row,provider='New owner-maintained value'),'x'
        with tempfile.TemporaryDirectory() as td:
            with self.assertRaisesRegex(m.RefreshError,'OTHER_WRITER_CHANGED_METADATA'):m.apply_one(plan,client,Path(td))
        self.assertEqual(calls,[None])

if __name__=='__main__':unittest.main()
