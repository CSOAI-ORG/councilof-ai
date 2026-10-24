#!/usr/bin/env python3
"""test_track.py — fresh / stale / unreachable for track.py. stdlib unittest only.

Run: python3 test_track.py
"""
import io, json, sys, os, unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import track

CLAIM = {
    "schema": "csoai.maintained-claim/0.1",
    "id": "test:claim:board-totals-23-23",
    "assertion": "board totals 23 axes · 23 measured",
    "asserted_values": {"totals.axes": 23, "totals.measured_axes": 23},
    "source": "https://unreachable.invalid/api/gspc",
    "source_fields": ["totals.axes", "totals.measured_axes"],
    "as_of": "2026-10-09T00:00:00Z",
}

def run(argv):
    buf = io.StringIO()
    saved = sys.stdout
    sys.stdout = buf
    try:
        code = track.main(argv)
    finally:
        sys.stdout = saved
    return code, json.loads(buf.getvalue())

class TrackTests(unittest.TestCase):
    def test_fresh_matching_readback_exits_0(self):
        code, res = run(['--claim-json', json.dumps(CLAIM), '--ledger', '',
                         '--observed-json', json.dumps({'totals': {'axes': 23, 'measured_axes': 23}})])
        self.assertEqual(res['state'], 'FRESH')
        self.assertEqual(code, 0)

    def test_stale_drifted_readback_exits_2(self):
        code, res = run(['--claim-json', json.dumps(CLAIM), '--ledger', '',
                         '--observed-json', json.dumps({'totals': {'axes': 24, 'measured_axes': 23}})])
        self.assertEqual(res['state'], 'STALE')
        self.assertEqual(res['reason'], 'readback-no-longer-matches-asserted-values')
        self.assertEqual(code, 2)

    def test_unreachable_source_is_unverifiable_exits_3_never_stale(self):
        code, res = run(['--claim-json', json.dumps(CLAIM), '--ledger', ''])
        self.assertEqual(res['state'], 'UNVERIFIABLE')
        self.assertEqual(res.get('reason'), 'fetch-failed')
        self.assertEqual(code, 3)
        self.assertNotEqual(res['state'], 'STALE')

if __name__ == '__main__':
    unittest.main(verbosity=2)
