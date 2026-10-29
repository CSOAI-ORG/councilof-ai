import copy
import importlib.util
import json
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('revenue_pull', Path(__file__).with_name('pull-revenue-history.py'))
pull = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pull)


def source_day(day, count):
    return {'date': day, 'fetched_at': day + 'T04:00:00Z', 'one_number': {
        'definition': 'distinct outside payers', 'status': 'MEASURED', 'all_time': count,
        'last_30d': count, 'settlements': count, 'self_settlements': 2,
        'zero_value_settlements': 1, 'records_unreadable': 0}}


class Contract(unittest.TestCase):
    def setUp(self):
        self.first = source_day('2026-09-06', 0)
        self.old = {'schema': 'csoai.revenue-history/0.1', 'note': 'A self-settlement is not revenue; absent is recorded as null, never as zero.',
                    'gates': {'0 for 30 days': 'shape or price is wrong'},
                    'days': [{'date': '2026-09-06', 'read_at': '2026-09-06T08:26:16Z',
                              'all_time': 0, 'last_30d': 0, 'settlements': 0,
                              'self_settlements': 2, 'zero_value_settlements': 1,
                              'records_unreadable': 0, 'status': 'MEASURED', 'definition_sha256': 'historic'}]}

    def test_public_schema_preserves_prior_bytes_and_names_missing_days(self):
        original = copy.deepcopy(self.old['days'][0])
        text = '\n'.join(map(json.dumps, [self.first, source_day('2026-09-10', 0), source_day('2026-09-11', 0)]))
        result = pull.build_public(text, self.old)
        self.assertEqual(result['schema'], 'csoai.revenue-history/0.1')
        self.assertEqual(result['days'][0], original)
        self.assertEqual(result['days_recorded'], 3)
        self.assertEqual(result['missing_calendar_days'], ['2026-09-07', '2026-09-08', '2026-09-09'])
        self.assertEqual(result['consecutive_days_at_zero_buyers'], 2)
        self.assertEqual(result['streak_stopped_at'], {'date': '2026-09-09', 'all_time': None, 'kind': 'missing day'})
        self.assertEqual(result['as_of'], '2026-09-11T04:00:00Z')

    def test_published_metric_conflict_fails_closed(self):
        altered = copy.deepcopy(self.old)
        altered['days'][0]['all_time'] = 1
        with self.assertRaisesRegex(ValueError, 'published_day_source_metric_conflict'):
            pull.build_public(json.dumps(self.first), altered)

    def test_missing_prior_source_day_fails_closed(self):
        with self.assertRaisesRegex(ValueError, 'published_day_missing_from_source'):
            pull.build_public(json.dumps(source_day('2026-09-10', 0)), self.old)

    def test_source_duplicate_day_and_bad_count_fail_closed(self):
        with self.assertRaisesRegex(ValueError, 'source_duplicate_date'):
            pull.build_public(json.dumps(self.first)+'\n'+json.dumps(self.first), self.old)
        bad = copy.deepcopy(self.first)
        bad['one_number']['all_time'] = -1
        with self.assertRaisesRegex(ValueError, 'source_count_invalid'):
            pull.build_public(json.dumps(bad), self.old)
        bad = copy.deepcopy(self.first)
        bad['fetched_at'] = '2026-09-07T04:00:00Z'
        with self.assertRaisesRegex(ValueError, 'source_timestamp_invalid'):
            pull.build_public(json.dumps(bad), self.old)

    def test_null_latest_has_unknown_streak(self):
        text = '\n'.join(map(json.dumps, [self.first, source_day('2026-09-07', None)]))
        result = pull.build_public(text, self.old)
        self.assertIsNone(result['consecutive_days_at_zero_buyers'])
        self.assertIsNone(result['days'][-1]['all_time'])


if __name__ == '__main__': unittest.main()
