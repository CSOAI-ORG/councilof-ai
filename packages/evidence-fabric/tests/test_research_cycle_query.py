# SPDX-License-Identifier: Apache-2.0
"""Generic offline controls; synthetic fixtures are never measurements of vendors."""
import copy
import json
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))
import research_cycle as C
import research_cycle_query as Q

ASOF = '2026-11-12T00:00:00Z'


class ResearchQueryTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.cat = {'schema': 'council.research-catalogue/1', 'records': [
            {'id': 'record-' + str(i), 'repo': 'example/component' + str(i),
             'commit': 'a' * 40, 'runtime_status': 'NOT_RUN'} for i in range(4)]}
        self.obs = [
            {'repo': 'example/component0', 'observed_commit': 'a' * 40,
             'observed_at': ASOF, 'source_url': 'https://api.github.com/repos/example/component0/commits?per_page=1'},
            {'repo': 'example/component1', 'observed_commit': 'b' * 40,
             'observed_at': ASOF, 'source_url': 'https://api.github.com/repos/example/component1/commits?per_page=1'},
            {'repo': 'example/component3', 'observed_commit': 'a' * 40,
             'observed_at': '2026-11-09T00:00:00Z',
             'source_url': 'https://api.github.com/repos/example/component3/commits?per_page=1'},
        ]
        (self.root / 'cat.json').write_text(json.dumps(self.cat))
        (self.root / 'obs.json').write_text(json.dumps(self.obs))
        self.built = C.build(self.root / 'cat.json', self.root / 'obs.json', self.root / 'cycles', ASOF)
        self.cycle = Path(self.built['directory'])
        self.digest = self.built['manifest_sha256']
        self.events = [json.loads(line) for line in (self.cycle / 'events.jsonl').read_text().splitlines()]
        self.ids = [e['event_id'] for e in self.events]
        self.scope = list(self.ids)

    def tearDown(self):
        self.tmp.cleanup()

    def search(self, text='repository', **kwargs):
        return Q.query_cycle(self.cycle, self.digest, text, lambda: list(self.scope), **kwargs)

    def rehash_manifest(self):
        p = self.cycle / 'manifest.json'
        m = json.loads(p.read_bytes())
        for name in m['files']:
            b = (self.cycle / name).read_bytes()
            m['files'][name] = {'sha256': C.sha(b), 'bytes': len(b)}
        p.write_bytes(C.encoded(m))
        return C.sha(p.read_bytes())

    def test_native_event_bytes_and_states_are_preserved(self):
        result = self.search(limit=20)
        got = {x['event']['event_id']: x['event'] for x in result['records']}
        self.assertEqual(got, {e['event_id']: e for e in self.events})
        self.assertEqual({e['state'] for e in got.values()},
                         {'CONSISTENT', 'DIVERGENT', 'UNMEASURED', 'UNCHECKABLE'})
        self.assertTrue(all(e['value'] is None for e in got.values()))
        self.assertFalse(result['grants_authority'])
        self.assertFalse(result['execution_allowed'])
        self.assertFalse(result['caller_authenticated_by_adapter'])
        self.assertEqual(result['cycle_as_of'], ASOF)

    def test_hidden_top_results_cannot_starve_visible_match(self):
        ranked = self.search(limit=20)['records']
        self.scope = [ranked[-1]['event']['event_id']]
        r = self.search(limit=1)
        self.assertEqual([x['event']['event_id'] for x in r['records']], self.scope)

    def test_empty_scope_is_not_allow_all(self):
        self.scope = []
        self.assertEqual(self.search()['records'], [])
        self.assertEqual(self.search()['state'], 'NO_VISIBLE_MATCH')

    def test_missing_callback_is_refused(self):
        with self.assertRaises(Q.QueryError):
            Q.query_cycle(self.cycle, self.digest, 'repository', None)

    def test_malformed_scope_values_are_refused(self):
        for raw in [True, 'all', self.ids[0], [self.ids[0], self.ids[0]], ['sha256:' + '0' * 64], [True]]:
            with self.subTest(raw=raw), self.assertRaises(Q.QueryError):
                Q.query_cycle(self.cycle, self.digest, 'repository', lambda: raw)

    def test_revoke_before_delivery_is_refused(self):
        with self.assertRaisesRegex(Q.QueryError, 'visibility changed'):
            self.search(before_delivery=lambda: self.scope.clear())

    def test_final_visibility_recheck(self):
        calls = []
        def visibility():
            calls.append(1)
            return self.ids if len(calls) < 3 else []
        with self.assertRaisesRegex(Q.QueryError, 'visibility changed'):
            Q.query_cycle(self.cycle, self.digest, 'repository', visibility)
        self.assertEqual(len(calls), 3)

    def test_state_filter_precedes_top_k(self):
        r = self.search(states=['UNMEASURED'], limit=1)
        self.assertEqual(len(r['records']), 1)
        self.assertEqual(r['records'][0]['event']['state'], 'UNMEASURED')
        self.assertIsNone(r['records'][0]['event']['value'])

    def test_invalid_state_filters_are_refused(self):
        for states in ['DIVERGENT', ['APPROVED'], [], [True]]:
            with self.subTest(states=states), self.assertRaises(Q.QueryError):
                self.search(states=states)

    def test_wrong_expected_manifest_is_refused(self):
        with self.assertRaises(C.CycleError):
            Q.query_cycle(self.cycle, '0' * 64, 'repository', lambda: self.ids)

    def test_mutated_payload_is_refused(self):
        p = self.cycle / 'events.jsonl'
        p.write_bytes(p.read_bytes() + b' ')
        with self.assertRaises(C.CycleError):
            self.search()

    def test_rehashed_forged_measurement_state_is_refused(self):
        rows = copy.deepcopy(self.events)
        rows[0]['state'] = 'DIVERGENT'
        (self.cycle / 'events.jsonl').write_bytes(b''.join(C.encoded(x) for x in rows))
        changed = self.rehash_manifest()
        with self.assertRaises(C.CycleError):
            Q.query_cycle(self.cycle, changed, 'repository', lambda: self.ids)

    def test_unqualified_reader_revision_is_refused(self):
        p = self.cycle / 'binding.json'
        b = json.loads(p.read_bytes())
        b['implementation_pins']['event.py'] = '0' * 64
        p.write_bytes(C.encoded(b))
        changed = self.rehash_manifest()
        with self.assertRaises(C.CycleError):
            Q.query_cycle(self.cycle, changed, 'repository', lambda: self.ids)

    def test_source_changes_during_query_are_refused(self):
        def change():
            p = self.cycle / 'summary.json'
            p.write_bytes(p.read_bytes() + b' ')
        with self.assertRaises(C.CycleError):
            self.search(before_delivery=change)

    def test_symlink_cycle_is_refused(self):
        link = self.root / 'alias'
        link.symlink_to(self.cycle, target_is_directory=True)
        with self.assertRaises(C.CycleError):
            Q.query_cycle(link, self.digest, 'repository', lambda: self.ids)

    def test_query_bounds_and_k(self):
        for text in [None, 'x' * 4097, '\u00e9' * 2049]:
            with self.subTest(text_type=type(text).__name__), self.assertRaises(Q.QueryError):
                self.search(text=text)
        for limit in [True, 0, -1, 21, '3']:
            with self.subTest(limit=limit), self.assertRaises(Q.QueryError):
                self.search(limit=limit)

    def test_empty_or_unmatched_query_is_explicit(self):
        for text in ['', '---', 'notpresentfoobar']:
            self.assertEqual(self.search(text=text)['state'], 'NO_VISIBLE_MATCH')

    def test_query_is_data_not_shell(self):
        sentinel = self.root / 'should-not-exist'
        self.search(text='$(touch ' + str(sentinel) + ') repository')
        self.assertFalse(sentinel.exists())

    def test_portable_packet_roundtrip(self):
        packet = C.packet(self.cycle, self.digest)
        other = self.root / 'received'
        other.mkdir()
        for name, text in dict(packet['files'], **{'manifest.json': packet['manifest_text']}).items():
            (other / name).write_text(text)
        before = self.search()['records']
        after = Q.query_cycle(other, self.digest, 'repository', lambda: self.ids)['records']
        self.assertEqual(before, after)

    def test_no_network_or_received_code(self):
        (self.cycle / 'untrusted.py').write_text('raise RuntimeError("not executed")')
        with patch.object(socket.socket, 'connect', side_effect=AssertionError('network forbidden')):
            self.assertEqual(self.search()['state'], 'RETRIEVED_REFERENCE')

    def test_scope_file_does_not_accept_symlink(self):
        p = self.root / 'ids.json'
        p.write_text(json.dumps(self.ids))
        alias = self.root / 'ids-alias.json'
        alias.symlink_to(p)
        with self.assertRaises(OSError):
            Q.scope_file(alias)

    def test_cli_roundtrip_requires_explicit_scope(self):
        scope = self.root / 'ids.json'
        scope.write_text(json.dumps(self.ids))
        cmd = [sys.executable, str(HERE / 'research_cycle_query.py'), str(self.cycle),
               '--expected-manifest', self.digest, '--query', 'repository']
        missing = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        self.assertEqual(missing.returncode, 2)
        done = subprocess.run(cmd + ['--allow-events', str(scope)], capture_output=True, text=True, timeout=15)
        self.assertEqual(done.returncode, 0, done.stderr)
        r = json.loads(done.stdout)
        self.assertEqual(r['state'], 'RETRIEVED_REFERENCE')
        self.assertFalse(r['grants_authority'])


if __name__ == '__main__':
    unittest.main()
