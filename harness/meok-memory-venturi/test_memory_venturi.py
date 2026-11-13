import json, os, tempfile, unittest
from dataclasses import replace
from memory_venturi import *

class CacheTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.path=os.path.join(self.tmp.name,'cache.db')
        self.now=100.0; self.allowed=True; self.states={'s':SourceState('r1',True),'other':SourceState('o1',True)}
        self.ctx=HostContext('tenant','alice','p1',1000.0)
        self.worker=WorkerIdentity(*['model','m1','tok1','a1','rt1','prompt1','sampling1','v1'])
        self.req=Request(b'{"question":"x"}',('s',),self.worker)
        self.calls=0
        self.cache=self.newcache()
    def newcache(self):
        return RevisionBoundCache(self.path,resolve=lambda c,ids:{x:self.states[x] for x in ids if x in self.states},
                                  authorise=lambda c,ids:self.allowed,clock=lambda:self.now)
    def tearDown(self):
        if not self.cache.closed:self.cache.close()
        self.tmp.cleanup()
    def compute(self,body,pins):
        self.calls+=1;return canonical({'request':body.decode(),'pins':pins})
    def runit(self,req=None,ctx=None,compute=None,verify=None):
        return self.cache.run(ctx or self.ctx,req or self.req,compute=compute or self.compute,verify=verify or (lambda b:isinstance(json.loads(b),dict)))
    def test_same_request_hits(self):
        a=self.runit();b=self.runit();self.assertEqual(b['state'],'REUSED_RESULT');self.assertEqual(a['payload'],b['payload']);self.assertEqual(self.calls,1)
    def test_source_correction_misses(self):
        a=self.runit();self.states['s']=SourceState('r2',True);b=self.runit();self.assertEqual(self.calls,2);self.assertNotEqual(a['payload'],b['payload'])
    def test_source_retirement_refused(self):
        self.runit();self.states['s']=SourceState('r1',False)
        with self.assertRaisesRegex(Refused,'SOURCE_NOT_CURRENT'):self.runit()
    def test_access_revoked_on_hit(self):
        self.runit();self.allowed=False
        with self.assertRaisesRegex(Refused,'ACCESS_DENIED'):self.runit()
    def test_missing_source_refused(self):
        self.runit();del self.states['s']
        with self.assertRaisesRegex(Refused,'SOURCE_SNAPSHOT_INCOMPLETE'):self.runit()
    def test_tenant_isolation(self):
        self.runit();self.runit(ctx=replace(self.ctx,tenant='other'));self.assertEqual(self.calls,2)
    def test_principal_isolation(self):
        self.runit();self.runit(ctx=replace(self.ctx,principal='bob'));self.assertEqual(self.calls,2)
    def test_policy_epoch_separation(self):
        self.runit();self.runit(ctx=replace(self.ctx,policy_epoch='p2'));self.assertEqual(self.calls,2)
    def test_each_worker_revision_changes_key(self):
        self.runit()
        for name in vars(self.worker):self.runit(req=replace(self.req,worker=replace(self.worker,**{name:'new'})))
        self.assertEqual(self.calls,9)
    def test_near_match_not_reused(self):
        self.runit();self.runit(req=replace(self.req,body=b'{"question":"X"}'));self.assertEqual(self.calls,2)
    def test_ttl_expiry(self):
        self.runit();self.now=161;self.runit();self.assertEqual(self.calls,2)
    def test_context_expiry(self):
        self.runit();self.now=1000
        with self.assertRaisesRegex(Refused,'HOST_CONTEXT_EXPIRED'):self.runit()
    def test_no_incomplete_dependency_closure(self):
        with self.assertRaisesRegex(Refused,'COVERAGE_INCOMPLETE'):self.runit(req=replace(self.req,dependency_closure_complete=False))
    def test_no_implicit_replay_of_stochastic_output(self):
        with self.assertRaisesRegex(Refused,'REPLAY_NOT_PERMITTED'):self.runit(req=replace(self.req,deterministic_or_explicit_replay=False))
    def test_duplicate_dependencies(self):
        with self.assertRaisesRegex(Refused,'INVALID_DEPENDENCIES'):self.runit(req=replace(self.req,dependencies=('s','s')))
    def test_sources_changed_midcompute(self):
        def f(body,pins):self.states['s']=SourceState('r2',True);return b'{}'
        with self.assertRaisesRegex(Refused,'CHANGED_DURING_COMPUTE'):self.runit(compute=f)
        self.assertEqual(self.cache.count(),0)
    def test_access_revoked_midcompute(self):
        def f(body,pins):self.allowed=False;return b'{}'
        with self.assertRaisesRegex(Refused,'ACCESS_DENIED'):self.runit(compute=f)
        self.assertEqual(self.cache.count(),0)
    def test_validation_failure_not_cached(self):
        with self.assertRaisesRegex(Refused,'RESULT_NOT_VERIFIED'):self.runit(verify=lambda b:False)
        self.assertEqual(self.cache.count(),0)
    def test_tampered_payload_recomputed(self):
        self.runit();self.cache.db.execute('UPDATE result_cache SET payload=?',(b'{}',));self.cache.db.commit()
        b=self.runit();self.assertTrue(b['corruption_rejected']);self.assertEqual(self.calls,2)
    def test_persistence_reopen(self):
        a=self.runit();self.cache.close();self.cache=self.newcache();b=self.runit();self.assertEqual(b['payload'],a['payload']);self.assertEqual(self.calls,1)
    def test_truncated_impact_flushes_tenant(self):
        self.runit();self.runit(req=replace(self.req,dependencies=('other',)));self.runit(ctx=replace(self.ctx,tenant='other'))
        r=self.cache.invalidate_from_impact(tenant='tenant',affected=('s',),truncated=True)
        self.assertEqual(r['invalidated'],2);self.assertEqual(self.cache.count(),1)
    def test_full_impact_is_selective(self):
        self.runit();self.runit(req=replace(self.req,dependencies=('other',)))
        r=self.cache.invalidate_from_impact(tenant='tenant',affected=('s',),truncated=False);self.assertEqual(r['invalidated'],1)
        self.assertEqual(self.runit(req=replace(self.req,dependencies=('other',)))['state'],'REUSED_RESULT')
    def test_lost_invalidation_still_refuses_stale_source(self):
        self.runit();self.states['s']=SourceState('new',True);b=self.runit();self.assertEqual(b['state'],'FRESH_RESULT')
    def test_truncated_invalidation_midcompute(self):
        def f(body,pins):self.cache.invalidate_from_impact(tenant='tenant',affected=(),truncated=True);return b'{}'
        with self.assertRaisesRegex(Refused,'INVALIDATED_DURING_COMPUTE'):self.runit(compute=f)
    def test_rejects_non_bytes_output(self):
        with self.assertRaisesRegex(Refused,'INVALID_RESULT_BYTES'):self.runit(compute=lambda b,p:'text')
    def test_rejects_oversized_result(self):
        with self.assertRaisesRegex(Refused,'INVALID_RESULT_BYTES'):self.runit(compute=lambda b,p:b'x'*(MAX_PAYLOAD+1))
    def test_invalid_input_domains(self):
        for ttl in (True,0,-1,float('nan'),float('inf'),86401):
            with self.subTest(ttl=ttl),self.assertRaises(Refused):self.runit(req=replace(self.req,ttl_seconds=ttl))
    def test_source_change_during_hit_verification(self):
        self.runit()
        def verify(b):self.states['s']=SourceState('new',True);return True
        with self.assertRaisesRegex(Refused,'CHANGED_DURING_LOOKUP'):self.runit(verify=verify)
    def test_actual_capacity(self):
        self.cache.max_entries=2
        for i in range(4):self.runit(req=replace(self.req,body=str(i).encode()))
        self.assertEqual(self.cache.count(),2)
    def test_no_authority_or_training_grant(self):
        x=self.runit()
        self.assertFalse(x['authority_reused']);self.assertFalse(x['training_performed']);self.assertFalse(x['canonical_gspc_admission'])

    def test_unhashable_dependency_refused(self):
        with self.assertRaisesRegex(Refused,'INVALID_DEPENDENCIES'):
            self.runit(req=replace(self.req,dependencies=([],)))
    def test_shorter_ttl_has_distinct_key(self):
        self.runit();self.now=102
        out=self.runit(req=replace(self.req,ttl_seconds=1))
        self.assertEqual(out['state'],'FRESH_RESULT')
    def test_truncated_invalidation_during_hit_validation(self):
        self.runit()
        def verify(b):
            self.cache.invalidate_from_impact(tenant='tenant',affected=(),truncated=True)
            return True
        with self.assertRaisesRegex(Refused,'INVALIDATED_DURING_LOOKUP'):
            self.runit(verify=verify)
    def test_closed_cache_invalidations_refused(self):
        self.cache.close()
        with self.assertRaisesRegex(Refused,'CACHE_CLOSED'):
            self.cache.invalidate_from_impact(tenant='tenant',affected=(),truncated=True)

if __name__=='__main__':unittest.main(verbosity=2)
