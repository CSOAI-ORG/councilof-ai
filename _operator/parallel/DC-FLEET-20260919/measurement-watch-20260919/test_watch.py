import copy
import datetime as dt
import unittest
import watch

START = dt.datetime(2026, 9, 19, 16, 0, tzinfo=dt.timezone.utc)
END = START + dt.timedelta(hours=24)
AT = START + dt.timedelta(minutes=20)

def manifest():
    value = watch.load_manifest()
    value.update(started_at=START.isoformat(), ends_at=END.isoformat())
    return value

def rows(count=35):
    return [dict(symbol='BTC/USDC', exchange='coinbase', bid=100., ask=100.1,
        observed_at=(START + dt.timedelta(seconds=i * 30)).isoformat()) for i in range(count)]

class WatchTests(unittest.TestCase):
    def test_only_read_only_study(self):
        value = manifest()
        self.assertFalse(value['live_orders_allowed'])
        self.assertEqual(value['real_funds_allocated'], 0)
    def test_before_start_rejected(self):
        with self.assertRaises(ValueError):
            watch.report(manifest(), [], START - dt.timedelta(seconds=1))
    def test_prior_data_rejected(self):
        data = rows(); data[0]['observed_at'] = (START-dt.timedelta(seconds=1)).isoformat()
        with self.assertRaises(ValueError): watch.report(manifest(), data, AT)
    def test_future_data_rejected(self):
        data = rows(); data[-1]['observed_at'] = (AT+dt.timedelta(seconds=1)).isoformat()
        with self.assertRaises(ValueError): watch.report(manifest(), data, AT)
    def test_post_end_data_rejected(self):
        data = rows(); data[-1]['observed_at'] = END.isoformat()
        with self.assertRaises(ValueError): watch.report(manifest(), data, END)
    def test_empty_is_unknown(self):
        result = watch.report(manifest(), [], AT)
        self.assertEqual(result['data_status'], 'NO_DATA')
        self.assertIsNone(result['strategy_groups']['cash_baseline']['normalized_virtual_pnl_total'])
    def test_case_count_and_virtual_scaling(self):
        result = watch.report(manifest(), rows(), AT)
        self.assertEqual(len(result['results']), 48)
        group = result['strategy_groups']['buy_hold_paper']
        case = next(r for r in result['results'] if r['strategy']=='buy_hold_paper' and r['exchange']=='coinbase' and r['symbol']=='BTC/USDC')
        self.assertEqual(group['usable_cases'], 1)
        self.assertEqual(group['normalized_virtual_start_total'], 10)
        self.assertAlmostEqual(group['normalized_virtual_pnl_total'], case['virtual_profit'] / 100)
    def test_tampering_rejected(self):
        receipt = watch.make_receipt(manifest(), rows(), AT)
        receipt['payload']['report']['input_rows'] += 1
        with self.assertRaises(ValueError): watch.verify(receipt, manifest())
    def test_rehashed_forgery_rejected(self):
        receipt = watch.make_receipt(manifest(), rows(), AT)
        receipt['payload']['report']['results'][0]['virtual_profit'] = 900
        receipt['payload_sha256'] = watch.digest(receipt['payload'])
        with self.assertRaises(ValueError): watch.verify(receipt, manifest())
    def test_missing_venue_not_fabricated(self):
        result = watch.report(manifest(), rows(), AT)
        absent = [r for r in result['results'] if r['exchange']=='okx']
        self.assertTrue(all(r['status']=='INSUFFICIENT_DATA' for r in absent))
    def test_stale_end_and_no_promotion(self):
        result = watch.report(manifest(), rows(), END)
        self.assertEqual(result['phase'], 'FINAL_RESEARCH_READOUT')
        self.assertEqual(result['data_status'], 'GAP_AT_WINDOW_END')
        self.assertFalse(result['automatic_live_promotion'])
    def test_exact_replay_does_not_claim_independence(self):
        receipt = watch.make_receipt(manifest(), rows(), AT)
        before = copy.deepcopy(receipt)
        value = watch.verify(receipt, manifest())
        self.assertEqual(value['replay'], 'MATCH')
        self.assertFalse(value['independent_evaluator'])
        self.assertFalse(value['signature_verified'])
        self.assertEqual(receipt, before)
    def test_dashboard_discloses_paper(self):
        text = watch.dashboard(watch.report(manifest(), [], AT), manifest())
        self.assertIn('PAPER ONLY', text)
        self.assertIn('Real money allocated: $0', text)
    def test_unknown_scope_rejected(self):
        data = rows(); data[0]['symbol']='FAKE/USDC'
        with self.assertRaises(ValueError): watch.report(manifest(), data, AT)

if __name__ == '__main__':
    unittest.main(verbosity=2)
