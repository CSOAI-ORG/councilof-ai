import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from types import SimpleNamespace

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
spec = importlib.util.spec_from_file_location('indexes', HERE / 'indexes.py')
indexes = importlib.util.module_from_spec(spec)
spec.loader.exec_module(indexes)

class IndexSelectionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.reader = Path(self.temp.name) / 'reader.py'
        self.reader.write_text("""
INDEXES = [('PayAI', 'https://pay.example'), ('Other', 'https://other.example')]
def route_key(value): return value.split('?')[0]
def reading(name, url, timeout):
    if name == 'Other': raise RuntimeError('unwanted index was contacted')
    return {'index': name, 'ours': [{'resource':'https://councilof.ai/api/a'}], 'absence_determinate': False}
""")

    def test_selected_index_only_and_live_manifest(self):
        manifest = {'status': 'OBSERVED', 'data': {'resources': [
            {'url': 'https://councilof.ai/api/a'},
            {'url': 'https://councilof.ai/api/b'}]}, 'sha256': 'fixture-hash'}
        with patch.object(indexes, 'fetch', return_value=manifest) as fetch:
            result = indexes.collect(self.reader, ['PayAI'])
        self.assertEqual([r['index'] for r in result['indexes']], ['PayAI'])
        self.assertEqual(result['indexes'][0]['manifest_indexed'], 1)
        self.assertIsNone(result['indexes'][0]['manifest_missing'])
        self.assertEqual(result['indexes'][0]['manifest_unseen_in_read'], ['https://councilof.ai/api/b'])
        self.assertEqual(result['manifest_sha256'], 'fixture-hash')
        fetch.assert_called_once_with('https://councilof.ai/.well-known/x402.json')

    def test_unknown_index_fails_before_manifest_or_index_request(self):
        with patch.object(indexes, 'fetch') as fetch:
            with self.assertRaises(ValueError):
                indexes.collect(self.reader, ['Typo'])
            fetch.assert_not_called()

    def test_no_selection_only_contacts_payai(self):
        manifest = {'status': 'OBSERVED', 'data': {'resources': [{'url':'https://councilof.ai/api/a'}]}, 'sha256': 'x'}
        with patch.object(indexes, 'fetch', return_value=manifest):
            result = indexes.collect(self.reader)
        self.assertEqual([r['index'] for r in result['indexes']], ['PayAI'])

    def test_scheduled_selection_has_own_state_and_child_arguments(self):
        state = Path(self.temp.name) / 'state'
        calls = []
        def run(cmd, **kwargs):
            calls.append(cmd)
            return SimpleNamespace(returncode=0, stdout='{"status":"OBSERVED","indexes":[]}', stderr='')
        with patch.object(indexes.subprocess, 'run', side_effect=run):
            with patch.object(sys, 'argv', ['indexes.py', '--state', str(state), '--reader', str(self.reader)]):
                indexes.main()
            with patch.object(sys, 'argv', ['indexes.py', '--state', str(state), '--reader', str(self.reader), '--index', 'Other']):
                indexes.main()
        outputs = list(state.glob('indexes*.json'))
        self.assertEqual(len(outputs), 2)
        self.assertFalse((state / 'indexes.json').exists())
        self.assertEqual(calls[0][-2:], ['--index', 'PayAI'])
        self.assertEqual(calls[1][-2:], ['--index', 'Other'])

    def test_failed_selected_scan_retains_its_last_good_observation(self):
        state = Path(self.temp.name) / 'state'
        def run_good(cmd, **kwargs):
            return SimpleNamespace(returncode=0, stdout='{"status":"OBSERVED","indexes":[{"index":"PayAI"}]}', stderr='')
        def run_failed(cmd, **kwargs):
            return SimpleNamespace(returncode=1, stdout='', stderr='source unavailable')
        argv = ['indexes.py', '--state', str(state), '--reader', str(self.reader), '--index', 'PayAI', '--now']
        with patch.object(sys, 'argv', argv):
            with patch.object(indexes.subprocess, 'run', side_effect=run_good):
                indexes.main()
            with patch.object(indexes.subprocess, 'run', side_effect=run_failed):
                indexes.main()
        reports = list(state.glob('indexes-*.json'))
        self.assertEqual(len(reports), 1)
        report = json.loads(reports[0].read_text())
        self.assertEqual(report['status'], 'UNAVAILABLE')
        self.assertEqual(report['last_good']['indexes'], [{'index': 'PayAI'}])
        self.assertIn('source unavailable', report['error'])

    def test_selected_scan_does_not_contact_index_again_inside_cooldown(self):
        state = Path(self.temp.name) / 'state'
        argv = ['indexes.py', '--state', str(state), '--reader', str(self.reader), '--index', 'PayAI']
        with patch.object(sys, 'argv', argv):
            with patch.object(indexes.subprocess, 'run', return_value=SimpleNamespace(returncode=0, stdout='{"status":"OBSERVED","indexes":[]}', stderr='')) as run:
                indexes.main()
                indexes.main()
        self.assertEqual(run.call_count, 1)

if __name__ == '__main__':
    unittest.main()
