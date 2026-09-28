"""Offline checks for the x402 Bazaar index walk (enumerate_index), mocked network, no sleeps.

Each case is a shape one of the two indexes has actually served (dates in the names). The last class is the must-fail
control: the pre-2026-09-28 stop rule, run on the 28 Sep shape, reports the fully read index incomplete."""
import importlib.util, json, os, unittest
from pathlib import Path
from unittest.mock import patch

SOURCE = Path(os.environ.get('CSOAI_CENSUS_SOURCE', str(Path(__file__).with_name('x402-bazaar-conformance.py'))))
spec = importlib.util.spec_from_file_location('census_enum', SOURCE)
census = importlib.util.module_from_spec(spec)
spec.loader.exec_module(census)


class FakeIndex:
    """served: list of resource URLs the index returns in order. total: int or callable(n_calls) -> int.
    fail: {offset: n_failures}. clamp: serve page-aligned offsets (CDP). stop_serving_at: served list truncated."""

    def __init__(self, served, total, fail=None, clamp=True, bad_offset_at=None):
        self.served, self.total, self.fail, self.clamp = served, total, dict(fail or {}), clamp
        self.bad_offset_at = bad_offset_at
        self.calls = []

    def get(self, url, timeout=30):
        q = dict(kv.split('=') for kv in url.split('?', 1)[1].split('&'))
        limit, offset = int(q['limit']), int(q['offset'])
        self.calls.append(offset)
        if self.fail.get(offset, 0) > 0:
            self.fail[offset] -= 1
            raise OSError('simulated timeout')
        served_at = (offset // limit) * limit if self.clamp else offset
        if self.bad_offset_at is not None and offset == self.bad_offset_at:
            served_at = offset - limit
        page = self.served[served_at:served_at + limit]
        total = self.total(len(self.calls)) if callable(self.total) else self.total
        body = {'items': [{'resource': r} for r in page], 'pagination': {'limit': limit, 'offset': served_at, 'total': total}}
        return 200, {}, json.dumps(body).encode()


def walk(fake, limit=100):
    logs = []
    with patch.object(census, 'get', fake.get):
        items, meta = census.enumerate_index('cdp', 'https://index.example/resources', limit, logs.append, sleep=0)
    return items, meta, logs


def urls(n, prefix='https://h{}.example/r'):
    return [prefix.format(i % 97) + str(i) for i in range(n)]


class EnumerationTests(unittest.TestCase):
    def test_served_one_short_of_reported_total_is_complete(self):
        # 2026-09-28 01:09Z: CDP reported 17,722 and served 17,721. Every served page was read.
        items, meta, _ = walk(FakeIndex(urls(17721), 17722))
        self.assertEqual(len(items), 17721)
        self.assertTrue(meta['complete'])
        self.assertEqual(meta['walk']['stop'], 'EMPTY_PAGE')
        self.assertEqual(meta['walk']['empty_page_offset'], 17800)
        self.assertEqual(meta['walk']['served_minus_reported'], -1)

    def test_served_more_than_reported_total_reads_past_it(self):
        # 2026-09-28 14:0xZ: CDP reported 18,996 and served 19,004 (a page of 4 at offset 19,000).
        items, meta, _ = walk(FakeIndex(urls(19004), 18996))
        self.assertEqual(len(items), 19004)
        self.assertTrue(meta['complete'])
        self.assertEqual(meta['walk']['served_minus_reported'], 8)

    def test_count_ahead_of_served_list_within_one_percent_is_complete(self):
        # 2026-09-28 14:08Z: CDP reported 19,085 while serving an unchanged 19,004 (its count ran ahead of its list).
        # The empty page (19,100) happens to lie past 19,085; at 19,185 it would not, and the read is still whole.
        for reported in (19085, 19185):
            items, meta, _ = walk(FakeIndex(urls(19004), reported))
            self.assertTrue(meta['complete'], reported)
            self.assertEqual(meta['walk']['served_minus_reported'], 19004 - reported)

    def test_empty_page_not_confirmed_is_not_complete(self):
        class Flaky(FakeIndex):
            def get(self, url, timeout=30):
                q = dict(kv.split('=') for kv in url.split('?', 1)[1].split('&'))
                if int(q['offset']) == 200:
                    self.calls.append(200)
                    n = self.calls.count(200)
                    items = [] if n == 1 else [{'resource': 'https://late.example/x'}]
                    return 200, {}, json.dumps({'items': items, 'pagination': {'limit': 100, 'offset': 200, 'total': 250}}).encode()
                return super().get(url, timeout)
        items, meta, _ = walk(Flaky(urls(250), 250))
        self.assertFalse(meta['complete'])
        self.assertEqual(meta['walk']['stop'], 'END_NOT_CONFIRMED')

    def test_index_that_stops_serving_early_is_not_complete(self):
        # an empty page far below the reported total: the index's end is not where its count says
        items, meta, _ = walk(FakeIndex(urls(300), 900))
        self.assertEqual(len(items), 300)
        self.assertFalse(meta['complete'])
        self.assertEqual(meta['walk']['empty_page_offset'], 300)
        self.assertEqual(meta['walk']['served_floor'], 891)

    def test_persistent_page_failure_is_not_complete(self):
        items, meta, logs = walk(FakeIndex(urls(500), 500, fail={200: 99}))
        self.assertFalse(meta['complete'])
        self.assertEqual(meta['walk']['stop'], 'PAGE_FAILED')
        self.assertEqual(meta['walk']['failed_page'], {'offset': 200, 'error': 'OSError'})
        self.assertEqual(len(items), 200)

    def test_transient_page_failure_is_retried(self):
        items, meta, _ = walk(FakeIndex(urls(500), 500, fail={200: 2}))
        self.assertTrue(meta['complete'])
        self.assertEqual(len(items), 500)
        self.assertEqual(meta['walk']['page_retries'], 2)

    def test_offset_advances_by_limit_not_by_page_length(self):
        # CDP 2026-09-28: limit=1000 served 912 at offset 18,000; offset 18,912 was re-served as offset 18,000.
        # Advancing by the page length would re-read that page; advancing by limit never asks an unaligned offset.
        fake = FakeIndex(urls(18912), 18996)
        items, meta, _ = walk(fake, limit=1000)
        self.assertTrue(all(o % 1000 == 0 for o in fake.calls))
        self.assertEqual(len(items), 18912)
        self.assertEqual(len({i['resource'] for i in items}), 18912)
        self.assertTrue(meta['complete'])

    def test_offset_not_honoured_is_not_complete(self):
        items, meta, _ = walk(FakeIndex(urls(500), 500, bad_offset_at=300))
        self.assertFalse(meta['complete'])
        self.assertEqual(meta['walk']['stop'], 'OFFSET_NOT_HONOURED')

    def test_total_growing_during_walk_bounds_the_end(self):
        # the index grew while being walked; the empty page must lie at or past the LARGEST total reported
        items, meta, _ = walk(FakeIndex(urls(1000), lambda n: 900 + 20 * n))
        self.assertFalse(meta['complete'])
        self.assertEqual(meta['walk']['reported_total_max'], 900 + 20 * 11)

    def test_empty_index_without_total_is_not_complete(self):
        class NoTotal(FakeIndex):
            def get(self, url, timeout=30):
                return 200, {}, json.dumps({'items': []}).encode()
        items, meta, _ = walk(NoTotal([], 0))
        self.assertEqual(items, [])
        self.assertFalse(meta['complete'])

    def test_page_guard_stops_an_endless_index(self):
        class Endless(FakeIndex):
            def get(self, url, timeout=30):
                q = dict(kv.split('=') for kv in url.split('?', 1)[1].split('&'))
                o = int(q['offset'])
                return 200, {}, json.dumps({'items': [{'resource': f'https://x.example/{o}'}],
                                            'pagination': {'limit': 100, 'offset': o, 'total': 100}}).encode()
        items, meta, _ = walk(Endless([], 100))
        self.assertFalse(meta['complete'])
        self.assertEqual(meta['walk']['stop'], 'PAGE_GUARD')


class OldRuleControl(unittest.TestCase):
    """Must-fail control: the rule this change replaced, applied to the 2026-09-28 01:09Z shape."""

    def old_enumerate(self, fake, limit=100):
        items, offset, total = [], 0, None
        while True:
            _, _, body = fake.get(f'https://index.example/resources?limit={limit}&offset={offset}')
            d = json.loads(body)
            page = d.get('items') or []
            total = (d.get('pagination') or {}).get('total', total)
            items.extend(page)
            if not page or (total is not None and offset + limit >= total):
                break
            offset += limit
        return items, total is not None and len(items) >= total

    def test_old_rule_marks_the_fully_read_index_partial(self):
        items, complete = self.old_enumerate(FakeIndex(urls(17721), 17722))
        self.assertEqual(len(items), 17721)
        self.assertFalse(complete)  # the 2026-09-28 FAILED_G2_PARTIAL_ENUMERATION

    def test_old_rule_passes_a_count_inflated_by_a_repeated_page(self):
        # a page served twice (18,912 then the re-served aligned page) inflates the count past the total
        served = urls(18912)
        items = [{'resource': r} for r in served] + [{'resource': r} for r in served[18000:18912]]
        self.assertGreaterEqual(len(items), 18996)
        self.assertLess(len({i['resource'] for i in items}), 18996)


if __name__ == '__main__':
    unittest.main()
