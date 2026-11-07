import copy
import datetime as dt
import unittest
import paper_bots as p
import paper_replay_guard as g

AT = dt.datetime(2026, 9, 19, 16, 15, tzinfo=dt.timezone.utc)

def fixture():
    rows = [dict(symbol='BTC/USDC', exchange='coinbase', bid=100.+i/10,
        ask=100.1+i/10, observed_at=(AT-dt.timedelta(seconds=30*(30-i))).isoformat())
        for i in range(30)]
    payload = dict(as_of=AT.isoformat(), source_sha256=g.source_hash(),
        assumptions=copy.deepcopy(p.ASSUMPTIONS), retained_inputs=rows,
        input_rows=len(rows), input_sha256=p.digest(rows), results=g.compute(rows))
    return g.envelope(payload)

class ReplayGuardTests(unittest.TestCase):
    def test_exact_replay_and_no_authority_claim(self):
        result = g.verify(fixture(), AT)
        self.assertEqual(result['result_replay'], 'MATCH')
        self.assertEqual(result['replayed_cases'], 48)
        self.assertEqual(result['simulated_cases'], 4)
        self.assertFalse(result['signature_verified'])
        self.assertFalse(result['independent_evaluator'])
        self.assertFalse(result['live_execution_allowed'])
    def test_modified_receipt_rejected(self):
        receipt = fixture(); receipt['payload']['input_rows'] += 1
        self.assertEqual(g.verify(receipt, AT)['integrity'], 'UNCHECKABLE')
    def test_rehashed_but_forged_results_rejected(self):
        receipt = fixture(); receipt['payload']['results'][0]['virtual_profit'] = 999
        result = g.verify(g.envelope(receipt['payload']), AT)
        self.assertEqual(result['result_replay'], 'NOT_RUN')
        self.assertIn('recomputed', result['reason'])
    def test_revision_mismatch_rejected(self):
        payload = fixture()['payload']; payload['source_sha256'] = '0'*64
        self.assertIn('revision', g.verify(g.envelope(payload), AT)['reason'])
    def test_assumption_mismatch_rejected(self):
        payload = fixture()['payload']; payload['assumptions']['fee_bps_per_side'] = 0
        self.assertIn('assumptions', g.verify(g.envelope(payload), AT)['reason'])
    def test_wrong_input_digest_rejected(self):
        payload = fixture()['payload']; payload['input_sha256'] = '0'*64
        self.assertIn('digest', g.verify(g.envelope(payload), AT)['reason'])
    def test_future_report_rejected(self):
        result = g.verify(fixture(), AT-dt.timedelta(seconds=6))
        self.assertIn('future', result['reason'])
    def test_future_observation_rejected(self):
        payload = fixture()['payload']
        payload['retained_inputs'][-1]['observed_at'] = (AT+dt.timedelta(seconds=6)).isoformat()
        payload['input_sha256'] = p.digest(payload['retained_inputs'])
        result = g.verify(g.envelope(payload), AT)
        self.assertIn('future-dated', result['reason'])
    def test_untampered_history_not_mistaken_for_live(self):
        result = g.verify(fixture(), AT+dt.timedelta(hours=1))
        self.assertEqual(result['result_replay'], 'MATCH')
        self.assertEqual(result['collector_freshness'], 'STALE')
        self.assertFalse(result['live_execution_allowed'])
    def test_unknown_scope_rejected(self):
        payload = fixture()['payload']; payload['retained_inputs'][0]['symbol'] = 'FAKE/USDC'
        payload['input_sha256'] = p.digest(payload['retained_inputs'])
        self.assertIn('scope', g.verify(g.envelope(payload), AT)['reason'])
    def test_naive_time_rejected(self):
        payload = fixture()['payload']; payload['as_of'] = '2026-09-19T16:15:00'
        self.assertIn('timezone', g.verify(g.envelope(payload), AT)['reason'])
    def test_missing_receipt_rejected(self):
        self.assertEqual(g.verify({}, AT)['integrity'], 'UNCHECKABLE')
    def test_no_inputs_is_not_a_fresh_market(self):
        payload = fixture()['payload']; payload.update(retained_inputs=[], input_rows=0,
            input_sha256=p.digest([]), results=g.compute([]))
        result = g.verify(g.envelope(payload), AT)
        self.assertEqual(result['collector_freshness'], 'UNKNOWN')
        self.assertEqual(result['insufficient_cases'], 48)
    def test_readback_does_not_modify_inputs(self):
        receipt = fixture(); before = copy.deepcopy(receipt)
        g.verify(receipt, AT)
        self.assertEqual(receipt, before)

if __name__ == '__main__':
    unittest.main(verbosity=2)
