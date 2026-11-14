"""The exact watcher repair, isolated from network and repository outputs."""
import contextlib
import importlib.util
import io
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

SOURCE = Path(os.environ.get('CSOAI_WATCHER_UNDER_TEST', str(Path(__file__).resolve().parents[1] / 'watch_corrections.py')))

class WatcherInventory(unittest.TestCase):
    def setUp(self):
        spec = importlib.util.spec_from_file_location('watcher_candidate', SOURCE)
        self.m = importlib.util.module_from_spec(spec); spec.loader.exec_module(self.m)
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.m.OUT = Path(self.temp.name) / 'inventory.json'
    def call(self, source):
        with patch.object(self.m, 'fetch_corrections', return_value=source), contextlib.redirect_stdout(io.StringIO()):
            return self.m.main()
    def test_age_not_staleness(self):
        row = self.m.scan_one_correction({'id':'c','date':'2026-09-17T00:00:00Z'})
        self.assertNotIn('stale_days',row); self.assertIn('age_since_first_observation_days',row)
    def test_zero_readbacks(self):
        self.assertEqual(self.m.scan_one_correction({'id':'c'})['citer_readbacks_completed'],0)
    def test_propagation_unknown(self):
        self.assertEqual(self.m.scan_one_correction({'id':'c'})['propagation_state'],'NOT_CHECKED')
    def test_declared_target_not_rechecked(self):
        self.assertEqual(self.m.scan_one_correction({'id':'c','fix_requires':['https://example.invalid']})['fix_requires'][0]['state'],'KNOWN')
    def test_missing_collection_error(self): self.assertEqual(self.call({}),2)
    def test_wrong_collection_error(self): self.assertEqual(self.call({'corrections':'bad'}),2)
    def test_invalid_row_error(self): self.assertEqual(self.call({'corrections':['bad']}),2)
    def test_invalid_target_list_error(self): self.assertEqual(self.call({'corrections':[{'id':'c','fix_requires':'bad'}]}),2)
    def test_unavailable_nonzero(self):
        with patch.object(self.m, 'fetch_corrections', side_effect=OSError('synthetic')), contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(self.m.main(),2)
    def test_empty_not_global_propagation(self):
        self.assertEqual(self.call({'corrections':[]}),0); result=json.loads(self.m.OUT.read_text())
        self.assertEqual(result['schema'],'csoai.correction-inventory/0.2')
        self.assertIsNone(result['verdict']['global_propagation_rate'])
    def test_future_age_not_negative(self):
        self.assertIsNone(self.m.scan_one_correction({'id':'c','date':'2999-01-01T00:00:00Z'})['age_since_first_observation_days'])
    def test_source_unchanged(self):
        before=SOURCE.read_bytes();self.call({'corrections':[]});self.assertEqual(before,SOURCE.read_bytes())

if __name__=='__main__': unittest.main()
