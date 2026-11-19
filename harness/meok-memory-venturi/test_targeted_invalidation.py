"""Targeted invalidation regression tests; host callbacks are fixtures, not authentication."""
import json
import os
import sqlite3
import tempfile
import threading
import unittest
from dataclasses import replace
from memory_venturi import HostContext, WorkerIdentity, SourceState, Request, RevisionBoundCache, Refused


class TargetedInvalidationTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = os.path.join(self.tmp.name, 'cache.db')
        self.ctx = HostContext('tenant', 'alice', 'policy1', 1000.0)
        self.req = Request(b'fixed-task', ('s',), WorkerIdentity(*(['pinned-fixture'] * 8)))
        self.cache = self.open_cache()

    def open_cache(self):
        return RevisionBoundCache(self.path, resolve=lambda c, ids: {s: SourceState('r1', True) for s in ids},
                                  authorise=lambda c, ids: True, clock=lambda: 100.0)

    def tearDown(self):
        if not self.cache.closed:
            self.cache.close()
        self.tmp.cleanup()

    def run_cache(self, *, compute=None, verify=None, req=None, ctx=None):
        return self.cache.run(ctx or self.ctx, req or self.req,
                              compute=compute or (lambda b, p: b'{}'),
                              verify=verify or (lambda b: isinstance(json.loads(b), dict)))

    def invalidate(self, affected=('s',), tenant='tenant', cache=None):
        return (cache or self.cache).invalidate_from_impact(tenant=tenant, affected=affected, truncated=False)

    def test_targeted_compute_refused(self):
        def compute(body, pins):
            self.invalidate()
            return b'{}'
        with self.assertRaisesRegex(Refused, 'INVALIDATED_DURING_COMPUTE'):
            self.run_cache(compute=compute)
        self.assertEqual(self.cache.count(), 0)

    def test_targeted_hit_refused(self):
        self.run_cache()
        def verify(payload):
            self.invalidate()
            return True
        with self.assertRaisesRegex(Refused, 'INVALIDATED_DURING_LOOKUP'):
            self.run_cache(verify=verify)
        self.assertEqual(self.cache.count(), 0)

    def test_unrelated_source_compute_allowed(self):
        def compute(body, pins):
            self.invalidate(('unrelated',))
            return b'{}'
        self.assertEqual(self.run_cache(compute=compute)['state'], 'FRESH_RESULT')
        self.assertEqual(self.run_cache()['state'], 'REUSED_RESULT')

    def test_other_tenant_compute_allowed(self):
        def compute(body, pins):
            self.invalidate(tenant='other-tenant')
            return b'{}'
        self.assertEqual(self.run_cache(compute=compute)['state'], 'FRESH_RESULT')
        self.assertEqual(self.run_cache()['state'], 'REUSED_RESULT')

    def test_unrelated_warm_hit_preserved(self):
        self.run_cache()
        other = replace(self.req, dependencies=('unrelated',))
        before = self.run_cache(req=other)
        self.assertEqual(self.invalidate()['invalidated'], 1)
        after = self.run_cache(req=other)
        self.assertEqual(after['state'], 'REUSED_RESULT')
        self.assertEqual(before['cache_key'], after['cache_key'])

    def test_epoch_persists_reopen(self):
        old = self.run_cache()['cache_key']
        self.invalidate()
        self.cache.close()
        self.cache = self.open_cache()
        current = self.run_cache()
        self.assertNotEqual(current['cache_key'], old)
        self.assertEqual(current['state'], 'FRESH_RESULT')
        self.assertEqual(self.run_cache()['state'], 'REUSED_RESULT')

    def test_duplicate_impact_deduplicated(self):
        self.invalidate(('s', 's'))
        row = self.cache.db.execute('SELECT epoch FROM cache_source_epochs WHERE tenant=? AND source=?', ('tenant', 's')).fetchone()
        self.assertEqual(row, (1,))

    def test_empty_complete_impact_noop(self):
        before = self.run_cache()
        self.assertEqual(self.invalidate(())['invalidated'], 0)
        after = self.run_cache()
        self.assertEqual(after['state'], 'REUSED_RESULT')
        self.assertEqual(before['cache_key'], after['cache_key'])

    def test_second_connection_invalidation_refused(self):
        second = self.open_cache()
        try:
            def compute(body, pins):
                self.invalidate(cache=second)
                return b'{}'
            with self.assertRaisesRegex(Refused, 'INVALIDATED_DURING_COMPUTE'):
                self.run_cache(compute=compute)
            self.assertEqual(self.cache.count(), 0)
        finally:
            second.close()

    def test_thread_barrier_invalidation_refused(self):
        started, release = threading.Event(), threading.Event()
        outcome = []
        def compute(body, pins):
            started.set()
            if not release.wait(3):
                raise RuntimeError('TEST_BARRIER_TIMEOUT')
            return b'{}'
        def worker():
            try:
                outcome.append(self.run_cache(compute=compute)['state'])
            except Exception as exc:
                outcome.append((type(exc).__name__, str(exc)))
        thread = threading.Thread(target=worker, daemon=True)
        thread.start()
        try:
            self.assertTrue(started.wait(3), 'worker did not reach barrier')
            self.invalidate()
        finally:
            release.set()
            thread.join(3)
        self.assertFalse(thread.is_alive(), 'worker did not finish')
        self.assertEqual(outcome, [('Refused', 'INVALIDATED_DURING_COMPUTE')])
        self.assertEqual(self.cache.count(), 0)

    def test_multiple_dependencies_refused(self):
        def compute(body, pins):
            self.invalidate(('other',))
            return b'{}'
        with self.assertRaisesRegex(Refused, 'INVALIDATED_DURING_COMPUTE'):
            self.run_cache(req=replace(self.req, dependencies=('s', 'other')), compute=compute)

    def test_legacy_schema_additive(self):
        # The unchanged schema is present before candidate construction.
        self.cache.close()
        db = sqlite3.connect(self.path)
        db.execute('DROP TABLE IF EXISTS cache_source_epochs')
        db.execute("INSERT OR REPLACE INTO result_cache VALUES ('legacy','tenant','alice','{}',X'7b7d','legacy-hash',1000,100)")
        db.commit()
        db.close()
        self.cache = self.open_cache()
        self.assertEqual(self.cache.count(), 1, 'constructor must not delete retained rows')
        self.assertEqual(self.run_cache()['state'], 'FRESH_RESULT')
        self.assertEqual(self.run_cache()['state'], 'REUSED_RESULT')


if __name__ == '__main__':
    unittest.main(verbosity=2)
