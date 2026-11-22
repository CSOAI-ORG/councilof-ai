import unittest
from dataclasses import replace
from memory_venturi import *

class RefreshTests(unittest.TestCase):
    def setUp(self):
        self.allowed=True;self.now=100.;self.calls=0;self.revision='r1';self.current=True
        self.ctx=HostContext('tenant','reviewer','p1',1000.)
        self.req=Request(b'fixture',('source',),WorkerIdentity(*['none','m1','t1','a1','r1','p1','s1','v1']))
        self.cache=RevisionBoundCache(':memory:',clock=lambda:self.now,
            authorise=lambda c,ids:self.allowed and c.tenant=='tenant' and c.principal=='reviewer',
            resolve=lambda c,ids:{x:SourceState(self.revision,self.current) for x in ids})
    def tearDown(self):self.cache.close()
    def compute(self,b,p):self.calls+=1;return canonical({'pins':p,'body':b.decode()})
    def runit(self,**kw):
        return self.cache.run(kw.pop('ctx',self.ctx),kw.pop('req',self.req),compute=kw.pop('compute',self.compute),verify=kw.pop('verify',lambda b:True),**kw)
    def test_refresh_replaces_and_next_read_reuses(self):
        first=self.runit();fresh=self.runit(force_refresh=True);hit=self.runit()
        self.assertEqual(fresh['state'],'FRESH_RESULT');self.assertEqual(hit['state'],'REUSED_RESULT')
        self.assertEqual(first['payload'],hit['payload']);self.assertEqual(self.calls,2)
    def test_force_false_preserves_hit(self):
        self.runit();self.runit(force_refresh=False);self.assertEqual(self.calls,1)
    def test_invalid_refresh_mode_fails_closed(self):
        for flag in (1,0,None,'true',[]):
            with self.subTest(flag=flag),self.assertRaisesRegex(Refused,'INVALID_REFRESH_MODE'):self.runit(force_refresh=flag)
        self.assertEqual(self.calls,0)
    def test_revoke_before_refresh(self):
        self.runit();self.allowed=False
        with self.assertRaisesRegex(Refused,'ACCESS_DENIED'):self.runit(force_refresh=True)
        self.assertEqual(self.calls,1)
    def test_revoke_during_refresh(self):
        def compute(b,p):self.allowed=False;return b'{}'
        with self.assertRaisesRegex(Refused,'ACCESS_DENIED'):self.runit(force_refresh=True,compute=compute)
        self.assertEqual(self.cache.count(),0)
    def test_revision_during_refresh(self):
        def compute(b,p):self.revision='r2';return b'{}'
        with self.assertRaisesRegex(Refused,'SOURCE_CHANGED_DURING_COMPUTE'):self.runit(force_refresh=True,compute=compute)
        self.assertEqual(self.cache.count(),0)
    def test_context_expiry_during_refresh(self):
        def compute(b,p):self.now=1001.;return b'{}'
        with self.assertRaisesRegex(Refused,'HOST_CONTEXT_EXPIRED'):self.runit(force_refresh=True,compute=compute)
        self.assertEqual(self.cache.count(),0)
    def test_refresh_validation_failure_not_retained(self):
        with self.assertRaisesRegex(Refused,'RESULT_NOT_VERIFIED'):self.runit(force_refresh=True,verify=lambda b:False)
        self.assertEqual(self.cache.count(),0)
    def test_incomplete_graph_still_refused(self):
        with self.assertRaisesRegex(Refused,'DEPENDENCY_COVERAGE_INCOMPLETE'):
            self.runit(force_refresh=True,req=replace(self.req,dependency_closure_complete=False))
    def test_stochastic_replay_still_refused(self):
        with self.assertRaisesRegex(Refused,'REPLAY_NOT_PERMITTED'):
            self.runit(force_refresh=True,req=replace(self.req,deterministic_or_explicit_replay=False))
    def test_wrong_identity_still_refused(self):
        for k in ('tenant','principal'):
            with self.subTest(key=k),self.assertRaisesRegex(Refused,'ACCESS_DENIED'):
                self.runit(force_refresh=True,ctx=replace(self.ctx,**{k:'other'}))
    def test_truncated_invalidation_during_refresh(self):
        def compute(b,p):self.cache.invalidate_from_impact(tenant='tenant',affected=(),truncated=True);return b'{}'
        with self.assertRaisesRegex(Refused,'INVALIDATED_DURING_COMPUTE'):self.runit(force_refresh=True,compute=compute)
        self.assertEqual(self.cache.count(),0)
    def test_retirement_still_refused(self):
        self.current=False
        with self.assertRaisesRegex(Refused,'SOURCE_NOT_CURRENT'):self.runit(force_refresh=True)
    def test_no_authority_or_training_granted(self):
        r=self.runit(force_refresh=True)
        for k in ('authority_reused','training_performed','canonical_gspc_admission'):self.assertIs(r[k],False)
    def test_aba_with_new_generation_misses(self):
        a=self.runit();self.revision='r2';self.runit(force_refresh=True);self.revision='r3'
        r=self.runit();self.assertEqual(r['state'],'FRESH_RESULT');self.assertNotEqual(a['payload'],r['payload'])

if __name__=='__main__':unittest.main()
