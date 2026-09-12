import json
from pathlib import Path
import tempfile
import unittest
from datetime import datetime, timezone
from unittest.mock import patch
import observe

class Observations(unittest.TestCase):
    def test_missing_revenue_is_unknown(self):
        result = observe.revenue_metrics({'status': 'UNAVAILABLE', 'data': None})
        self.assertIsNone(result['settled_usdc_atomic'])
        self.assertIsNone(result['distinct_nonself_payers_30d'])
        self.assertIsNone(result['product_gate_5_distinct_30d'])

    def test_money_units_and_no_inferred_retention(self):
        row = {'status': 'OBSERVED', 'data': {'one_number': {'status': 'MEASURED', 'last_30d': 1, 'settlements': 8}, 'settled_usdc': {'status': 'MEASURED', 'count': 20000, 'excludes_self': True, 'unit': 'USDC atomic (6dp) on Base'}}}
        self.assertEqual(observe.revenue_metrics(row)['settled_usdc'], '0.02')
        self.assertIsNone(observe.revenue_metrics(row)['repeat_payers'])
        row['data']['settled_usdc']['count'] = True
        self.assertIsNone(observe.revenue_metrics(row)['settled_usdc'])
        row['data']['settled_usdc']['count'] = 20000
        row['data']['settled_usdc']['excludes_self'] = False
        self.assertIsNone(observe.revenue_metrics(row)['settled_usdc'])

    def test_failure_preserves_last_good(self):
        first = {'status': 'OBSERVED', 'text_sha256': 'abc', 'observed_at': 'old'}
        state = observe.source_update(None, first)
        failed = observe.source_update(state, {'status': 'UNAVAILABLE', 'error': 'HTTP 503'})
        self.assertEqual(failed['last_good'], first)
        self.assertEqual(failed['latest_attempt']['status'], 'UNAVAILABLE')
        recovered = observe.source_update(failed, dict(first, text_sha256='def'))
        self.assertTrue(recovered['changed'])
        unchanged = observe.source_update(recovered, dict(first, text_sha256='def'))
        self.assertTrue(unchanged['changed'])
        failed_again = observe.source_update(unchanged, {'status': 'UNAVAILABLE'})
        self.assertTrue(failed_again['changed'])

    def test_source_failure_is_not_zero_growth(self):
        with tempfile.TemporaryDirectory() as directory:
            state = Path(directory)
            observe.write_json(state / 'latest.json', {'revenue': {'settled_usdc_atomic': 20000}})
            with patch('observe.fetch', return_value={'status': 'UNAVAILABLE', 'data': None, 'error': 'network'}):
                result = observe.run(state, {'period': {}, 'sources': [], 'events': []})
            self.assertIsNone(result['revenue_change_atomic_since_previous_observation'])
            self.assertIsNone(result['revenue']['settled_usdc'])
            self.assertTrue((state / 'DASHBOARD.md').exists())
            self.assertTrue(result['alerts'])

    def test_deadline_timezone_and_unspecified_time(self):
        event = {'deadline_at': '2026-09-15T21:59:00Z'}
        self.assertEqual(observe.deadline_state(event, datetime(2026, 9, 15, 22, tzinfo=timezone.utc)), 'PASSED')
        self.assertEqual(observe.deadline_state({'date': '2026-09-16'}, datetime(2026, 9, 16, 22, tzinfo=timezone.utc)), 'DUE_DATE_TODAY_TIME_UNSPECIFIED')

if __name__ == '__main__':
    unittest.main()

class CronSafety(unittest.TestCase):
    def test_preserve_unrelated_and_idempotent(self):
        import install
        before = 'HOME=/root\n0 7 * * * /bin/bash /old/revenue.sh\n*/2 * * * * /worker/watchdog.sh\n0 6 * * * /bin/bash /keep.sh\n'
        rendered = install.render_cron(before, 'observer', ['/bin/bash /old/revenue.sh'], '/worker/watchdog.sh')
        self.assertIn('0 6 * * * /bin/bash /keep.sh\n', rendered)
        self.assertIn('# retired by CSOAI observer: 0 7', rendered)
        self.assertIn('OLLAMA_MODELS=/workspace/ollama-models /worker/watchdog.sh', rendered)
        self.assertEqual(install.render_cron(rendered, 'observer', ['/bin/bash /old/revenue.sh'], '/worker/watchdog.sh'), rendered)

class IndexFailures(unittest.TestCase):
    def test_incomplete_read_keeps_historical_result_not_current_absence(self):
        import indexes
        import subprocess
        with tempfile.TemporaryDirectory() as directory:
            state = Path(directory)
            good = {'observed_at': '2026-09-11T00:00:00Z', 'indexes': [{'ours': ['example']}]}
            observe.write_json(state / 'indexes.json', {'status': 'OBSERVED', 'last_good': good})
            with patch('sys.argv', ['indexes.py', '--state', directory, '--now']), patch('indexes.subprocess.run', return_value=subprocess.CompletedProcess([], 2, '', 'incomplete population')):
                indexes.main()
            latest = json.loads((state / 'indexes.json').read_text())
            self.assertEqual(latest['status'], 'UNAVAILABLE')
            self.assertEqual(latest['last_good'], good)
            self.assertIn('incomplete', latest['error'])
