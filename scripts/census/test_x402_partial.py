"""Offline regression checks for the existing daily census, with mocked network I/O."""
import importlib.util, json, os, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
SOURCE = Path(os.environ.get('CSOAI_CENSUS_SOURCE', str(Path(__file__).with_name('x402-bazaar-conformance.py'))))
spec = importlib.util.spec_from_file_location('census', SOURCE)
census = importlib.util.module_from_spec(spec)
spec.loader.exec_module(census)
class PartialTests(unittest.TestCase):
    def run_snapshot(self, complete=True, max_hosts=0):
        with tempfile.TemporaryDirectory() as directory:
            out = Path(directory)
            previous = out / 'previous.jsonl'
            previous.write_text(json.dumps({'host':'previous.example','conformant':False}) + '\n')
            def index(name, base, limit, log):
                rows = [{'resource':'https://one.example/data'}, {'resource':'https://two.example/data'}] if name == 'cdp' else []
                return rows, {'resources':len(rows), 'reported_total':len(rows) if complete else 9, 'complete':complete}
            def probe(host, url):
                return {'host':host, 'probe_url':url, 'status':None, 'conformant':False}
            argv = ['census', '--out-dir', directory, '--date', '2026-09-21', '--previous', str(previous)]
            if max_hosts: argv += ['--max-hosts', str(max_hosts)]
            with patch('sys.argv', argv), patch.object(census, 'enumerate_index', index), patch.object(census, 'probe', probe):
                census.main()
            return (json.loads((out/'summary-2026-09-21.json').read_text()),
                    json.loads((out/'diff-2026-09-21.json').read_text()),
                    (out/'snapshots/conformance-2026-09-21.done').exists())
    def test_incomplete_index_is_partial(self):
        summary, _, _ = self.run_snapshot(complete=False)
        self.assertIs(summary['partial'], True)
    def test_incomplete_index_does_not_mark_day_done(self):
        _, _, done = self.run_snapshot(complete=False)
        self.assertFalse(done)
    def test_incomplete_index_does_not_report_departures(self):
        _, diff, _ = self.run_snapshot(complete=False)
        self.assertTrue(diff['partial'])
        self.assertEqual(diff['hosts_dropped'], 0)
        self.assertEqual(diff['detail']['hosts_dropped'], [])
    def test_host_cap_stays_partial(self):
        summary, diff, done = self.run_snapshot(max_hosts=1)
        self.assertTrue(summary['partial']); self.assertTrue(diff['partial']); self.assertFalse(done)
    def test_complete_snapshot_still_finishes(self):
        summary, diff, done = self.run_snapshot()
        self.assertFalse(summary['partial']); self.assertFalse(diff['partial']); self.assertTrue(done)
        self.assertEqual(diff['hosts_dropped'], 1)
if __name__ == '__main__': unittest.main()
