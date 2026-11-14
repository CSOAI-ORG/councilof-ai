"""Synthetic retained-input integration tests. No external calls or credentials."""
import copy
import json
import tempfile
import unittest
from pathlib import Path
import claim_maintenance as cm
import run_retained as rr

T0 = '2026-09-19T03:00:00Z'
T1 = '2026-09-19T04:00:00Z'
URI = 'https://example.invalid/corrections'
TARGET = 'https://example.invalid/guide'

class RetainedIntegration(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source = b'{"corrections":[{"id":"c1","what_changed":"wording corrected"}]}'
        self.body = b'expected corrected guide'
        self.put('source.body', self.source)
        self.put('source.receipt.json', self.rec(URI, self.source))
        self.put('target.body', self.body)
        self.put('target.receipt.json', self.rec(TARGET, self.body))
        self.contract = {'contract_id': 'guide-one', 'target_uri': TARGET,
                         'corrected_source_sha256': cm.digest(self.source),
                         'accepted_target_sha256': cm.digest(self.body),
                         'not_before': T0, 'max_age_seconds': 3600}
        self.bundle = {'schema': rr.SCHEMA, 'run_as_of': T1,
                       'source': {'uri': URI, 'body_file': 'source.body', 'receipt_file': 'source.receipt.json'},
                       'targets': [{'contract': self.contract, 'body_file': 'target.body', 'receipt_file': 'target.receipt.json'}]}
    def put(self, name, value):
        (self.root / name).write_bytes(value if isinstance(value, bytes) else json.dumps(value).encode())
    def rec(self, uri, body):
        return {'requested_uri': uri, 'final_uri': uri, 'observed_at': T0,
                'http_status': 200, 'body_sha256': cm.digest(body), 'body_bytes': len(body), 'complete_body': True}
    def run_review(self): return rr.review(self.bundle, self.root)
    def target_receipt(self, **changes):
        r = self.rec(TARGET, self.body); r.update(changes); self.put('target.receipt.json', r)
    def test_realistic_retained_import_and_exact_readback(self):
        r = self.run_review(); self.assertEqual(r['import']['imported_statements'], 1)
        self.assertEqual(r['readbacks'][0]['state'], 'EXPECTED_REVISION_OBSERVED')
        self.assertEqual(r['network_calls'], 0); self.assertFalse(r['execution_authorized'])
    def test_no_targets_never_means_everyone_updated(self):
        self.bundle['targets'] = []; r = self.run_review()
        self.assertFalse(r['propagation']['complete_for_declared_targets'])
        self.assertIsNone(r['propagation']['global_propagation_rate'])
    def test_source_capture_must_be_complete(self):
        r = self.rec(URI, self.source); r['complete_body'] = False; self.put('source.receipt.json', r)
        with self.assertRaisesRegex(cm.ContractError, 'INCOMPLETE_CAPTURE'): self.run_review()
    def test_source_digest_tamper(self):
        self.put('source.body', self.source.replace(b'c1', b'c2'))
        with self.assertRaisesRegex(cm.ContractError, 'INTEGRITY_FAILURE'): self.run_review()
    def test_source_identity_mismatch(self):
        r = self.rec(URI, self.source); r['final_uri'] = TARGET; self.put('source.receipt.json', r)
        with self.assertRaisesRegex(cm.ContractError, 'SOURCE_IDENTITY_MISMATCH'): self.run_review()
    def test_source_future_observation(self):
        r = self.rec(URI, self.source); r['observed_at'] = '2026-09-20T00:00:00Z'; self.put('source.receipt.json', r)
        with self.assertRaisesRegex(cm.ContractError, 'SOURCE_OBSERVATION_IN_FUTURE'): self.run_review()
    def test_duplicate_source_ids_rejected(self):
        source = b'{"corrections":[{"id":"c1"},{"id":"c1"}]}'
        self.put('source.body', source); self.put('source.receipt.json', self.rec(URI, source))
        with self.assertRaisesRegex(cm.ContractError, 'DUPLICATE_CORRECTION_ID'): self.run_review()
    def test_source_binding_cannot_be_arbitrary(self):
        self.contract['corrected_source_sha256'] = 'f' * 64
        with self.assertRaisesRegex(cm.ContractError, 'CORRECTION_SOURCE_NOT_BOUND'): self.run_review()
    def test_target_partial_capture_never_matches(self):
        self.target_receipt(complete_body=False)
        self.assertEqual(self.run_review()['readbacks'][0]['state'], 'INCOMPLETE_CAPTURE')
    def test_target_capture_length_checked(self):
        self.target_receipt(body_bytes=len(self.body) + 1)
        self.assertEqual(self.run_review()['readbacks'][0]['state'], 'CAPTURE_LENGTH_MISMATCH')
    def test_target_tamper_never_matches(self):
        self.target_receipt(body_sha256='f' * 64)
        self.assertEqual(self.run_review()['readbacks'][0]['state'], 'INTEGRITY_FAILURE')
    def test_different_revision_not_automatically_false(self):
        changed = b'another legitimate revision'; self.put('target.body', changed)
        self.put('target.receipt.json', self.rec(TARGET, changed))
        r = self.run_review()['readbacks'][0]
        self.assertEqual(r['state'], 'DIFFERENT_REVISION_REVIEW_REQUIRED')
        self.assertEqual(r['semantic_correctness'], 'NOT_ESTABLISHED')
    def test_stale_target_observation(self):
        self.contract['max_age_seconds'] = 30
        self.assertEqual(self.run_review()['readbacks'][0]['state'], 'STALE_OBSERVATION')
    def test_unavailable_target_never_zero_success(self):
        self.target_receipt(http_status=503); self.bundle['targets'][0]['body_file'] = None
        r = self.run_review(); self.assertEqual(r['readbacks'][0]['state'], 'UNAVAILABLE')
        self.assertEqual(r['propagation']['unresolved_targets'], 1)
    def test_duplicate_target_contracts_rejected(self):
        self.bundle['targets'].append(copy.deepcopy(self.bundle['targets'][0]))
        with self.assertRaisesRegex(cm.ContractError, 'DUPLICATE_PROPAGATION_TARGET'): self.run_review()
    def test_outside_path_refused(self):
        self.bundle['source']['body_file'] = '../outside'
        with self.assertRaisesRegex(cm.ContractError, 'INPUT_PATH_ESCAPE'): self.run_review()
    def test_symlink_refused(self):
        (self.root / 'source-link').symlink_to(self.root / 'source.body')
        self.bundle['source']['body_file'] = 'source-link'
        with self.assertRaisesRegex(cm.ContractError, 'INPUT_SYMLINK_REFUSED'): self.run_review()
    def test_source_size_bounded(self):
        self.put('large', b'x' * (cm.MAX_BYTES + 1))
        with self.assertRaisesRegex(cm.ContractError, 'INPUT_SIZE_LIMIT'): rr.read_local(self.root, 'large')
    def test_requested_targets_bounded(self):
        self.bundle['targets'] = [self.bundle['targets'][0]] * 33
        with self.assertRaisesRegex(cm.ContractError, 'TARGET_BOUND_EXCEEDED'): self.run_review()
    def test_source_content_cannot_grant_permissions(self):
        self.bundle['approved'] = True
        with self.assertRaisesRegex(cm.ContractError, 'BUNDLE_SCHEMA'): self.run_review()
    def test_inputs_unchanged(self):
        before = {p.name: p.read_bytes() for p in self.root.iterdir()}
        self.run_review(); self.assertEqual(before, {p.name: p.read_bytes() for p in self.root.iterdir()})
    def test_projection_is_internal_unsigned(self):
        r = self.run_review(); self.assertEqual(r['data_visibility'], 'INTERNAL')
        self.assertEqual(r['signature_state'], 'UNSIGNED'); self.assertFalse(r['publication_authorized'])
        self.assertFalse(r['receipt_origin_authenticated'])

if __name__ == '__main__': unittest.main()
