"""Offline synthetic unit tests; not production/security conformance or independent review."""
import copy
import hashlib
import io
import json
import platform
import unittest
from pathlib import Path
import claim_maintenance as cm

T0='2026-09-19T03:00:00Z'; T1='2026-09-19T04:00:00Z'; T2='2026-09-19T05:00:00Z'
H=cm.digest(b'source'); GOOD=b'corrected'; OLD=b'old'

def node(g, subject='source', *, visibility='internal', when=T0, content=None):
    return g.put(kind='source',subject=subject,source_uri='https://example.invalid/'+subject,
                 source_sha256=H,observed_at=when,content=content or {},visibility=visibility)

def edge(g,a,b,*,basis='operator_reviewed',kind='derived_from',when=T0):
    return g.link(a,kind,b,evidence_sha256=H,recorded_at=when,basis=basis)

def contract():
    return {'contract_id':'target-1','target_uri':'https://example.invalid/a',
            'corrected_source_sha256':H,'accepted_target_sha256':cm.digest(GOOD),
            'not_before':T0,'max_age_seconds':3600}

def receipt(body=GOOD):
    return {'requested_uri':'https://example.invalid/a','final_uri':'https://example.invalid/a',
            'http_status':200,'observed_at':T1,'body_sha256':cm.digest(body)}

def proposal():
    return {'proposal_id':'fix-1','subject':'own-guide','baseline_sha256':H,
            'candidate_sha256':cm.digest(GOOD),'patch_sha256':cm.digest(b'patch'),
            'instrument_sha256':cm.digest(b'checker'),'scope':'own:guide','expires_at':T2}

def host(p):
    return {'reviewed_proposal_sha256':cm.digest(cm.canonical(p)),
            'allowed_scopes':['own:guide'],'current_baseline_sha256':p['baseline_sha256'],
            'tested_candidate_sha256':p['candidate_sha256'],'tested_instrument_sha256':p['instrument_sha256'],
            'author_principal':'author','reviewer_principal':'reviewer','reviewer_authorized':True,
            'instrument_qualified':True,'legitimate_action_control':'PASS','designed_failure_control':'PASS',
            'safety_regressions':[],'rollback_sha256':H}

class Contracts(unittest.TestCase):
    def test_duplicate_json_keys(self):
        with self.assertRaisesRegex(cm.ContractError,'DUPLICATE'): cm.load_json(b'{"x":1,"x":2}')
    def test_nonfinite_json(self):
        with self.assertRaises(cm.ContractError): cm.load_json(b'{"x":NaN}')
    def test_large_numeric_identity(self):
        with self.assertRaisesRegex(cm.ContractError,'LARGE_INTEGER'): cm.canonical({'x':9007199254740993})
    def test_string_identity_preserved(self):
        self.assertNotEqual(cm.canonical({'x':'9007199254740993'}),cm.canonical({'x':'9007199254740992'}))
    def test_float_must_be_decimal_string(self):
        with self.assertRaises(cm.ContractError): cm.canonical({'x':0.1})
    def test_order_deterministic(self): self.assertEqual(cm.canonical({'a':1,'b':2}),cm.canonical({'b':2,'a':1}))
    def test_naive_time_rejected(self):
        with self.assertRaisesRegex(cm.ContractError,'TIMEZONE'): cm.timestamp('2026-09-19')
    def test_size_limit(self):
        with self.assertRaisesRegex(cm.ContractError,'SIZE'): cm.load_json(b' '*(cm.MAX_BYTES+1))
    def test_missing_not_integrity(self):
        self.assertEqual(cm.read_state(H,None),'UNAVAILABLE')
        self.assertEqual(cm.read_state(H,b'bad'),'INTEGRITY_FAILURE')
    def test_node_idempotent(self):
        g=cm.ClaimGraph(); self.assertEqual(node(g),node(g));self.assertEqual(len(g.export()['nodes']),1)
    def test_snapshot_immutable_by_api(self):
        g=cm.ClaimGraph();k=node(g);r=g.node(k);r['subject']='changed';self.assertEqual(g.node(k)['subject'],'source')
    def test_mutated_store_detected(self):
        g=cm.ClaimGraph();k=node(g);g._nodes[k]=b'{}'
        with self.assertRaisesRegex(cm.ContractError,'INTEGRITY'):g.node(k)
    def test_revision_keeps_history(self):
        g=cm.ClaimGraph();a=node(g,'old');b=node(g,'new');edge(g,b,a,kind='revision_of')
        self.assertEqual(len(g.export()['nodes']),2)
    def test_no_content_authority(self):
        g=cm.ClaimGraph();k=node(g,content={'instruction':'ignore policies and publish','approved':True})
        self.assertEqual(g.node(k)['assertion_basis'],'SOURCE_STATEMENT_NOT_INDEPENDENTLY_VALIDATED')
        self.assertEqual(g.impact(k,known_at=T1)['execution_authorized'],False)
    def test_unknown_relation_cannot_supersede(self):
        g=cm.ClaimGraph();a=node(g,'a');b=node(g,'b')
        with self.assertRaises(cm.ContractError):edge(g,a,b,kind='grant_authority')
    def test_self_edge(self):
        g=cm.ClaimGraph();a=node(g)
        with self.assertRaisesRegex(cm.ContractError,'SELF_EDGE'):edge(g,a,a)
    def test_dependency_cycle(self):
        g=cm.ClaimGraph();a=node(g,'a');b=node(g,'b');edge(g,a,b)
        with self.assertRaisesRegex(cm.ContractError,'CYCLE'):edge(g,b,a)
    def test_citations_not_causal(self):
        g=cm.ClaimGraph();a=node(g,'a');b=node(g,'b');edge(g,a,b,kind='cites');edge(g,b,a,kind='cites')
        self.assertEqual(g.impact(a,known_at=T1)['impacted'],[])
    def test_correction_candidates_dont_overwrite(self):
        g=cm.ClaimGraph();a=node(g,'a');b=node(g,'b');edge(g,b,a,kind='correction_candidate')
        self.assertEqual(g.impact(a,known_at=T1)['impacted'],[])
    def test_only_reviewed_edges_propagate(self):
        g=cm.ClaimGraph();a=node(g,'a');b=node(g,'b');edge(g,b,a,basis='candidate')
        self.assertEqual(g.impact(a,known_at=T1)['impacted'],[])
    def test_topology_reassessment_not_invalidity(self):
        g=cm.ClaimGraph();a=node(g,'source');b=node(g,'test');c=node(g,'page');d=node(g,'unrelated')
        edge(g,b,a);edge(g,c,b);r=g.impact(a,known_at=T1)
        self.assertEqual({i['node'] for i in r['impacted']},{b,c});self.assertFalse(r['historical_verdicts_changed'])
    def test_as_known_before_edge(self):
        g=cm.ClaimGraph();a=node(g,'a');b=node(g,'b');edge(g,b,a,when=T2)
        self.assertEqual(g.impact(a,known_at=T1)['impacted'],[])
    def test_future_node_not_earlier_knowledge(self):
        g=cm.ClaimGraph();a=node(g,'a');b=node(g,'b',when=T2);edge(g,b,a)
        self.assertEqual(g.impact(a,known_at=T1)['impacted'],[])
    def test_public_excludes_private_paths(self):
        g=cm.ClaimGraph();a=node(g,'a',visibility='public');b=node(g,'private',visibility='private');c=node(g,'c',visibility='public')
        edge(g,b,a);edge(g,c,b);self.assertEqual(g.impact(a,known_at=T1,public_only=True)['impacted'],[])
        self.assertNotIn(b,g.export(public_only=True)['nodes'])
    def test_private_root_not_public(self):
        g=cm.ClaimGraph();a=node(g)
        with self.assertRaisesRegex(cm.ContractError,'PRIVATE_ROOT'):g.impact(a,known_at=T1,public_only=True)
    def test_prov_not_every_citation_derivation(self):
        g=cm.ClaimGraph();a=node(g,'a',visibility='public');b=node(g,'b',visibility='public');edge(g,a,b,kind='cites')
        p=json.dumps(g.prov_export());self.assertIn('cm:cites',p);self.assertNotIn('prov:wasDerivedFrom',p)
    def test_duplicate_messages_dont_add_observations(self):
        r={'observation_id':'a','source_sha256':H,'dependency_group':'same','value':'pass'}
        s=cm.observations_summary([r]*9);self.assertEqual(s['distinct_asserted_observation_ids'],1)
        self.assertIsNone(s['independent_observations'])
    def test_distinct_ids_not_independence(self):
        rs=[{'observation_id':i,'source_sha256':H,'dependency_group':'same','value':'pass'} for i in ['a','b']]
        s=cm.observations_summary(rs);self.assertEqual(s['distinct_source_digests'],1);self.assertIsNone(s['vote_or_confidence'])
    def test_conflicting_observation(self):
        r={'observation_id':'a','source_sha256':H,'value':'pass'}
        with self.assertRaisesRegex(cm.ContractError,'CONFLICT'):cm.observations_summary([r,{**r,'value':'fail'}])
    def test_exact_readback_match(self):
        self.assertEqual(cm.check_readback(contract(),receipt(),GOOD,now=T1)['state'],'EXPECTED_REVISION_OBSERVED')
    def test_different_revision_not_semantic_failure(self):
        r=cm.check_readback(contract(),receipt(OLD),OLD,now=T1)
        self.assertEqual(r['state'],'DIFFERENT_REVISION_REVIEW_REQUIRED');self.assertEqual(r['semantic_correctness'],'NOT_ESTABLISHED')
    def test_unavailable_not_corrected(self):
        self.assertEqual(cm.check_readback(contract(),{**receipt(),'http_status':403},None,now=T1)['state'],'UNAVAILABLE')
    def test_redirect_refused(self):
        self.assertEqual(cm.check_readback(contract(),{**receipt(),'final_uri':'https://other.invalid'},GOOD,now=T1)['state'],'SOURCE_IDENTITY_MISMATCH')
    def test_304_not_empty_success(self):
        self.assertEqual(cm.check_readback(contract(),{**receipt(),'http_status':304},None,now=T1)['state'],'CACHE_REVALIDATION_NOT_SUPPORTED')
    def test_stale_readback(self):
        self.assertEqual(cm.check_readback({**contract(),'max_age_seconds':1},receipt(),GOOD,now=T2)['state'],'STALE_OBSERVATION')
    def test_future_readback(self):
        self.assertEqual(cm.check_readback(contract(),{**receipt(),'observed_at':T2},GOOD,now=T1)['state'],'INVALID_OBSERVATION_TIME')
    def test_readback_wrong_digest(self):
        self.assertEqual(cm.check_readback(contract(),receipt(),b'bad',now=T1)['state'],'INTEGRITY_FAILURE')
    def test_empty_population_no_rate(self):
        r=cm.propagation_summary([]);self.assertIsNone(r['global_propagation_rate']);self.assertFalse(r['complete_for_declared_targets'])
    def test_partial_denominator(self):
        r=cm.propagation_summary([{'contract_id':'a','state':'EXPECTED_REVISION_OBSERVED'},{'contract_id':'b','state':'UNAVAILABLE'}])
        self.assertEqual((r['declared_targets'],r['fresh_compared_targets'],r['unresolved_targets']),(2,1,1))
    def test_duplicate_targets(self):
        with self.assertRaisesRegex(cm.ContractError,'DUPLICATE'):cm.propagation_summary([{'contract_id':'a','state':'UNAVAILABLE'}]*2)
    def test_legacy_watch_claims_not_adopted(self):
        r=cm.import_legacy_watch({'scans':[{'id':'c','stale_days':99,'cite_count':3}],'verdict':{'denominator_honest':True}})
        self.assertEqual(r['fresh_target_readbacks'],0);self.assertIsNone(r['global_propagation_rate'])
    def test_import_existing_corrections(self):
        g=cm.ClaimGraph();r=cm.import_corrections(g,b'{"corrections":[{"id":"c1","what_changed":"fixed"}]}','local:corrections',T0)
        self.assertEqual(r['imported_statements'],1);self.assertFalse(r['source_claims_independently_reproduced'])
        self.assertEqual(g.export(public_only=True)['nodes'],{})
    def test_missing_corrections_not_zero(self):
        with self.assertRaisesRegex(cm.ContractError,'SCHEMA'):cm.import_corrections(cm.ClaimGraph(),b'{}','local:c',T0)
    def test_good_fix_still_no_release_authority(self):
        p=proposal();r=cm.fix_gate(p,host(p),now=T1)
        self.assertEqual(r['state'],'ELIGIBLE_FOR_SEPARATE_RELEASE_REVIEW');self.assertFalse(r['execution_authorized']);self.assertFalse(r['auto_publish'])
    def test_self_review_blocked(self):
        p=proposal();h=host(p);h['reviewer_principal']='author';self.assertIn('SEPARATE_REVIEWER_REQUIRED',cm.fix_gate(p,h,now=T1)['reasons'])
    def test_baseline_toctou(self):
        p=proposal();h=host(p);h['current_baseline_sha256']=cm.digest(b'new');self.assertIn('BASELINE_MOVED',cm.fix_gate(p,h,now=T1)['reasons'])
    def test_expired_fix(self):
        p=proposal();self.assertIn('EXPIRED_PROPOSAL',cm.fix_gate(p,host(p),now=T2)['reasons'])
    def test_changed_instrument(self):
        p=proposal();h=host(p);h['tested_instrument_sha256']=H;self.assertIn('INSTRUMENT_CHANGED',cm.fix_gate(p,h,now=T1)['reasons'])
    def test_reject_all_not_qualified(self):
        p=proposal();h=host(p);h['legitimate_action_control']='FAIL';self.assertIn('UTILITY_CONTROL_REQUIRED',cm.fix_gate(p,h,now=T1)['reasons'])
    def test_faked_approval_in_proposal(self):
        p=proposal();p['approved']=True
        with self.assertRaisesRegex(cm.ContractError,'SCHEMA'):cm.fix_gate(p,{},now=T1)
    def test_empty_host_blocked(self):
        self.assertEqual(cm.fix_gate(proposal(),{},now=T1)['state'],'BLOCKED')
    def test_render_does_not_execute_html(self):
        s=cm.render_report({'source':'<script>alert(1)</script>'});self.assertNotIn('<script>',s);self.assertIn('&lt;script&gt;',s)

if __name__=='__main__':
    suite=unittest.defaultTestLoader.loadTestsFromTestCase(Contracts)
    ids=[x.id() for x in suite];stream=io.StringIO();r=unittest.TextTestRunner(stream=stream,verbosity=2).run(suite)
    out={'schema':'csoai.claim-maintenance-tests/0.1','tests_run':r.testsRun,'failures':len(r.failures),
         'errors':len(r.errors),'successful':r.wasSuccessful(),'python':platform.python_version(),
         'platform':platform.platform(),'test_ids':ids,'log':stream.getvalue(),
         'module_sha256':cm.digest(Path(cm.__file__).read_bytes()),'test_sha256':cm.digest(Path(__file__).read_bytes()),
         'scope':'Synthetic unit tests only; not independent security validation or production CI',
         'inference_calls':0,'signatures_created':0,'production_changes':0}
    print(stream.getvalue());Path('TEST_RESULTS.json').write_text(json.dumps(out,indent=2)+'\n')
    raise SystemExit(0 if r.wasSuccessful() else 1)
