"""Offline publisher-order regressions; fake SDK only, no network or credentials.

Run: python3 -B -m unittest discover -s scripts/hf -p 'test_publish_kaggle_preflight.py' -v
"""
import contextlib
import copy
import importlib.util
import io
import json
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location(
    'kaggle_publisher_under_test', Path(__file__).with_name('publish_kaggle_cards.py'))
PUBLISHER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PUBLISHER)
REF = 'fixture-owner/example'
FILES = [{'name': 'rows.csv', 'bytes': 42}, {'name': 'README.md', 'bytes': 80}]
META = dict(title='Example', subtitle='', description='Before', isPrivate=False,
            keywords=[], licenses=[], collaborators=[], data=[],
            expectedUpdateFrequency=None, userSpecifiedSources=[])


class PreflightTests(unittest.TestCase):
    def run_publisher(self, *, inventories=None, complete=True, current=None,
                      publish=True, after_metadata=None):
        before = copy.deepcopy(META)
        proposed = dict(before, description='After')
        trace, writes, status = [], [], []
        inventory_reads = list(inventories if inventories is not None else [FILES, FILES])
        metadata_reads = [copy.deepcopy(current if current is not None else before),
                          copy.deepcopy(after_metadata if after_metadata is not None else proposed)]

        class Response:
            def __init__(self, info): self.info = info
            def to_json(self, ignore_defaults=False):
                return json.dumps({'info': self.info})

        class FakeApi:
            def authenticate(self): trace.append('authenticate_fake')
            def build_kaggle_client(self):
                return contextlib.nullcontext(types.SimpleNamespace(datasets=types.SimpleNamespace(
                    dataset_api_client=types.SimpleNamespace(get_dataset_metadata=self.get_metadata))))
            def get_metadata(self, request):
                trace.append('metadata')
                return Response(metadata_reads.pop(0))
            def dataset_list_files(self, ref, page_token=None, page_size=200):
                trace.append('files')
                value = inventory_reads.pop(0)
                if isinstance(value, Exception): raise value
                return types.SimpleNamespace(
                    files=[types.SimpleNamespace(name=f['name'], total_bytes=f['bytes']) for f in value],
                    next_page_token=None)
            def dataset_metadata_update(self, ref, folder):
                trace.append('write')
                writes.append(ref)

        fake_modules = {name: types.ModuleType(name) for name in (
            'kaggle', 'kaggle.api', 'kaggle.api.kaggle_api_extended',
            'kagglesdk', 'kagglesdk.datasets', 'kagglesdk.datasets.types',
            'kagglesdk.datasets.types.dataset_api_service')}
        fake_modules['kaggle.api.kaggle_api_extended'].KaggleApi = FakeApi
        fake_modules['kagglesdk.datasets.types.dataset_api_service'].ApiGetDatasetMetadataRequest = types.SimpleNamespace
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            folder = root / 'example'; folder.mkdir()
            (root / 'manifest.json').write_text(json.dumps([
                {'status': 'PREVIEW', 'folder': 'example', 'ref': REF}]))
            (folder / 'before.json').write_text(json.dumps(
                {'metadata': before, 'files': FILES, 'files_complete': complete}))
            (folder / 'dataset-metadata.json').write_text(json.dumps(proposed))
            args = ['publish_kaggle_cards.py', '--preview', str(root)]
            if publish: args.append('--publish')
            error = None
            with patch.dict(sys.modules, fake_modules), patch.object(sys, 'argv', args), \
                    patch.object(PUBLISHER.time, 'sleep'), contextlib.redirect_stdout(io.StringIO()):
                try: PUBLISHER.main()
                except (ValueError, RuntimeError) as exc: error = exc
            receipt = root / 'publication-receipt.jsonl'
            if receipt.exists(): status = [json.loads(line)['status'] for line in receipt.read_text().splitlines()]
        return types.SimpleNamespace(error=error, writes=writes, trace=trace, status=status)

    def test_size_change_is_rejected_before_write(self):
        changed = [dict(f, bytes=f['bytes'] + 1) for f in FILES]
        result = self.run_publisher(inventories=[changed, changed])
        self.assertIsInstance(result.error, ValueError)
        self.assertEqual(result.writes, [])
        self.assertEqual(result.status, [])

    def test_renamed_file_is_rejected_before_write(self):
        changed = [dict(FILES[0], name='replacement.csv'), FILES[1]]
        result = self.run_publisher(inventories=[changed, changed])
        self.assertIsInstance(result.error, ValueError)
        self.assertEqual(result.writes, [])

    def test_missing_file_is_rejected_before_write(self):
        result = self.run_publisher(inventories=[FILES[:1], FILES[:1]])
        self.assertIsInstance(result.error, ValueError)
        self.assertEqual(result.writes, [])

    def test_added_file_is_rejected_before_write(self):
        changed = FILES + [{'name': 'extra.csv', 'bytes': 10}]
        result = self.run_publisher(inventories=[changed, changed])
        self.assertIsInstance(result.error, ValueError)
        self.assertEqual(result.writes, [])

    def test_incomplete_inventory_is_rejected_before_write(self):
        for complete in (False, None, 'true', 1):
            with self.subTest(complete=complete):
                result = self.run_publisher(complete=complete)
                self.assertIsInstance(result.error, ValueError)
                self.assertEqual(result.writes, [])

    def test_inventory_read_error_does_not_follow_a_write(self):
        result = self.run_publisher(inventories=[RuntimeError('fixture listing unavailable')])
        self.assertIsInstance(result.error, RuntimeError)
        self.assertEqual(result.writes, [])
        self.assertEqual(result.status, [])

    def test_valid_publish_checks_files_first_and_keeps_postcheck(self):
        result = self.run_publisher(inventories=[list(reversed(FILES)), FILES])
        self.assertIsNone(result.error)
        self.assertEqual(result.writes, [REF])
        self.assertLess(result.trace.index('files'), result.trace.index('write'))
        self.assertGreater(result.trace.index('files', result.trace.index('write')), result.trace.index('write'))
        self.assertEqual(result.status, ['UPDATED_PENDING_VERIFICATION', 'PUBLISHED_VERIFIED'])

    def test_postwrite_drift_stays_pending_not_verified(self):
        result = self.run_publisher(inventories=[FILES, FILES[:1]])
        self.assertIsInstance(result.error, ValueError)
        self.assertEqual(result.writes, [REF])
        self.assertEqual(result.status, ['UPDATED_PENDING_VERIFICATION'])

    def test_metadata_conflict_does_not_write(self):
        result = self.run_publisher(current=dict(META, subtitle='Changed elsewhere'))
        self.assertIsInstance(result.error, ValueError)
        self.assertEqual(result.writes, [])
        self.assertNotIn('files', result.trace)

    def test_already_present_has_no_write(self):
        result = self.run_publisher(current=dict(META, description='After'))
        self.assertIsNone(result.error)
        self.assertEqual(result.writes, [])
        self.assertEqual(result.status, ['ALREADY_PRESENT_VERIFIED'])

    def test_metadata_readback_mismatch_stays_pending(self):
        result = self.run_publisher(after_metadata=dict(META, description='Unexpected'))
        self.assertIsInstance(result.error, ValueError)
        self.assertEqual(result.writes, [REF])
        self.assertEqual(result.status, ['UPDATED_PENDING_VERIFICATION'])

    def test_preview_does_not_write_or_fetch_inventory(self):
        result = self.run_publisher(publish=False, inventories=[])
        self.assertIsNone(result.error)
        self.assertEqual(result.writes, [])
        self.assertNotIn('files', result.trace)
        self.assertEqual(result.status, ['PREVIEW'])


if __name__ == '__main__':
    unittest.main()
