"""Offline regression checks for the existing daily census, with mocked network I/O."""
import importlib.util, io, json, os, tempfile, unittest
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
            def index(name, base, limit, log, max_pages=0):
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

    def test_cli_page_budget_bounds_both_indexes_and_keeps_partial_outputs(self):
        with tempfile.TemporaryDirectory() as directory:
            out = Path(directory)
            previous = out / 'previous.jsonl'
            previous.write_text(json.dumps({'host':'previous.example','conformant':False}) + '\n')
            calls = []
            def get(url, timeout=30):
                name = 'cdp' if url.startswith(census.CDP + '?') else 'payai'
                calls.append((name, url))
                payload = {'items':[{'resource':f'https://{name}.example/data'}],
                           'pagination':{'offset':0, 'total':1}}
                return 200, {}, json.dumps(payload).encode()
            def probe(host, url):
                return {'host':host, 'probe_url':url, 'status':None, 'conformant':False}
            argv = ['census', '--out-dir', directory, '--date', '2026-09-21',
                    '--previous', str(previous), '--max-index-pages', '1']
            with patch('sys.argv', argv), patch.object(census, 'get', get), patch.object(census, 'probe', probe), \
                    patch.object(census.urllib.request, 'urlopen', side_effect=AssertionError('offline test')):
                self.assertEqual(census.main(), 0)
            summary = json.loads((out/'summary-2026-09-21.json').read_text())
            diff = json.loads((out/'diff-2026-09-21.json').read_text())
            self.assertEqual([name for name, _ in calls], ['cdp', 'payai'])
            self.assertEqual(summary['hosts_probed'], 2)
            for meta in summary['indexes'].values():
                self.assertFalse(meta['complete'])
                self.assertEqual(meta['walk']['stop'], 'PAGE_BUDGET')
                self.assertEqual(meta['walk']['page_budget'], 1)
            self.assertTrue(summary['partial']); self.assertTrue(diff['partial'])
            self.assertEqual(diff['hosts_dropped'], 0)
            self.assertEqual(diff['detail']['hosts_dropped'], [])
            self.assertFalse((out/'snapshots/conformance-2026-09-21.done').exists())

    def test_completed_snapshot_is_preserved_on_rerun(self):
        for flags in ([], ['--max-index-pages', '1'], ['--max-hosts', '1'],
                      ['--max-index-pages', '1', '--max-hosts', '1']):
            with self.subTest(flags=flags), tempfile.TemporaryDirectory() as directory:
                out = Path(directory)
                (out/'snapshots').mkdir()
                preserved = {out/name: ('accepted ' + name).encode() for name in (
                    'snapshots/conformance-2026-09-21.jsonl', 'snapshots/conformance-2026-09-21.done',
                    'summary-2026-09-21.json', 'diff-2026-09-21.json')}
                for path, data in preserved.items(): path.write_bytes(data)
                argv = ['census', '--out-dir', directory, '--date', '2026-09-21'] + flags
                with patch('sys.argv', argv), patch('sys.stderr', io.StringIO()), \
                        patch.object(census, 'enumerate_index') as index, patch.object(census, 'probe') as probe:
                    if flags:
                        with self.assertRaises(SystemExit) as error:
                            census.main()
                        self.assertEqual(error.exception.code, 2)
                    else:
                        self.assertEqual(census.main(), 0)
                    index.assert_not_called(); probe.assert_not_called()
                for path, data in preserved.items(): self.assertEqual(path.read_bytes(), data)

    def test_negative_cli_page_budget_fails_before_output_or_fetch(self):
        with tempfile.TemporaryDirectory() as directory:
            out = Path(directory) / 'unused'
            argv = ['census', '--out-dir', str(out), '--max-index-pages', '-1']
            with patch('sys.argv', argv), patch('sys.stderr', io.StringIO()), \
                    patch.object(census, 'enumerate_index') as index:
                with self.assertRaises(SystemExit) as error:
                    census.main()
                self.assertEqual(error.exception.code, 2)
                index.assert_not_called()
            self.assertFalse(out.exists())
if __name__ == '__main__': unittest.main()
