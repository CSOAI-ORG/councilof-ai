import copy
import datetime as dt
import math
import unittest
from unittest.mock import patch
import paper_bots as p

START=dt.datetime(2026,9,19,16,0,tzinfo=dt.timezone.utc)
def rows(prices=None, count=40):
    prices = prices if prices is not None else [100.] * count
    return [dict(observed_at=(START+dt.timedelta(seconds=30*i)).isoformat(),
        symbol='BTC/USDC', exchange='coinbase', bid=price, ask=price+0.1)
        for i,price in enumerate(prices)]

class PaperTests(unittest.TestCase):
    def test_insufficient_stays_unknown(self):
        result=p.replay(rows(count=29),'momentum_paper')
        self.assertIsNone(result['virtual_profit'])
        self.assertEqual(result['status'],'INSUFFICIENT_DATA')
    def test_cash_baseline_unchanged(self):
        result=p.replay(rows(),'cash_baseline')
        self.assertEqual(result['virtual_profit'],0)
        self.assertEqual(result['simulated_fill_count'],0)
    def test_flat_hold_loses_spread_and_costs(self):
        result=p.replay(rows(),'buy_hold_paper')
        self.assertLess(result['virtual_profit'],0)
        self.assertGreater(result['fees_on_simulated_fills'],0)
        self.assertGreater(result['virtual_asset_units'],0)
    def test_fills_only_after_signal(self):
        for strategy in p.STRATEGIES:
            result=p.replay(rows([100+i for i in range(40)]),strategy)
            for fill in result['fills']:
                self.assertLess(p.timestamp(fill['signal_at']),p.timestamp(fill['fill_at']))
    def test_final_signal_not_backfilled(self):
        result=p.replay(rows([100.]*39+[110.]),'momentum_paper')
        self.assertEqual(result['simulated_fill_count'],0)
    def test_prefix_fills_causal(self):
        data=rows([100+i for i in range(40)])
        short=p.replay(data[:30],'momentum_paper')['fills']
        long=p.replay(data,'momentum_paper')['fills']
        self.assertEqual(short,[f for f in long if f['fill_at']<=data[29]['observed_at']])
    def test_gap_cancels_pending_signal(self):
        data=rows([100.]*5+[110.]*35)
        for row in data[6:]:
            row['observed_at']=(p.timestamp(row['observed_at'])+dt.timedelta(minutes=5)).isoformat()
        result=p.replay(data,'momentum_paper')
        self.assertEqual(result['simulated_fill_count'],0)
        self.assertEqual(result['gap_count'],1)
    def test_no_negative_cash_or_shorting(self):
        data=rows([100+10*math.sin(i) for i in range(300)])
        for strategy in p.STRATEGIES:
            result=p.replay(data,strategy)
            self.assertGreaterEqual(result['virtual_cash'],0)
            self.assertGreaterEqual(result['virtual_asset_units'],0)
            self.assertFalse(result['live_execution_allowed'])
    def test_bad_data_excluded(self):
        for invalid in (None,True,0,-1,math.nan,math.inf,'100'):
            data=rows(count=30)
            data[0]['bid']=invalid
            result=p.replay(data,'buy_hold_paper')
            self.assertEqual(result['valid_observations'],29)
            self.assertIsNone(result['virtual_profit'])
    def test_crossed_book_excluded(self):
        data=rows(count=30); data[0]['ask']=99
        self.assertEqual(p.replay(data,'cash_baseline')['valid_observations'],29)
    def test_duplicate_timestamp_quarantined(self):
        data=rows(count=30); data.append(copy.deepcopy(data[0]))
        result=p.replay(data,'cash_baseline')
        self.assertEqual(result['valid_observations'],29)
        self.assertEqual(result['duplicate_timestamps'],1)
    def test_no_naive_timestamps(self):
        with self.assertRaises(ValueError): p.timestamp('2026-09-19T16:00:00')
    def test_unknown_strategy_rejected(self):
        with self.assertRaises(ValueError): p.replay(rows(),'live_buy')
    def test_changed_assumptions_rejected(self):
        settings=dict(p.ASSUMPTIONS,fee_bps_per_side=0)
        with self.assertRaises(ValueError): p.replay(rows(),'buy_hold_paper',settings)
    def test_inputs_not_modified(self):
        data=rows(); before=copy.deepcopy(data)
        p.replay(data,'buy_hold_paper')
        self.assertEqual(data,before)

if __name__=='__main__': unittest.main(verbosity=2)
