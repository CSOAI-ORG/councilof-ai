import math
import unittest
from scorecard_candidate import score

def row(value, **extras):
    return dict(execution='disabled',symbol='SYNTHETIC',net_return_bps=value,**extras)

class ScorecardTests(unittest.TestCase):
    def test_missing_return_cannot_make_two_hundred_percent(self):
        result=score([row(5,profitable_after_estimated_cost=True),
            {'execution':'disabled','profitable_after_estimated_cost':True}])
        self.assertEqual(result['settled_outcomes'],1)
        self.assertEqual(result['cost_adjusted_win_rate'],1)
        self.assertEqual(result['rejected_outcomes'],1)
    def test_empty_is_unknown(self):
        result=score([])
        self.assertIsNone(result['net_bps_total'])
        self.assertIsNone(result['cost_adjusted_win_rate'])
    def test_nonpaper_data_excluded(self):
        result=score([{'execution':'live','net_return_bps':999},row(-5)])
        self.assertEqual(result['net_bps_total'],-5)
        self.assertEqual(result['excluded_nonpaper_rows'],1)
    def test_invalid_values_rejected(self):
        for value in (None,True,False,math.nan,math.inf,-math.inf,'NaN','bad',{}):
            with self.subTest(value=value):
                self.assertEqual(score([row(value)])['settled_outcomes'],0)
    def test_profit_is_derived_from_numeric_outcome(self):
        result=score([row(-2,profitable_after_estimated_cost=True),
            row(3,profitable_after_estimated_cost=False)])
        self.assertEqual(result['cost_adjusted_win_rate'],.5)
        self.assertEqual(result['inconsistent_profit_flags'],2)
    def test_zero_is_not_a_win(self):
        self.assertEqual(score([row(0)])['cost_adjusted_win_rate'],0)
    def test_strings_with_numeric_returns_supported(self):
        self.assertEqual(score([row('1.25')])['net_bps_total'],1.25)
    def test_unknown_execution_not_scored(self):
        self.assertEqual(score([{'net_return_bps':5}])['settled_outcomes'],0)
    def test_bad_row_is_counted(self):
        self.assertEqual(score([None])['rejected_outcomes'],1)
    def test_result_is_not_money_or_live_authority(self):
        result=score([row(50)])
        self.assertIsNone(result['pnl_in_currency'])
        self.assertFalse(result['eligible_for_live_promotion'])
    def test_input_is_not_changed(self):
        values=[row(2)]; before=[dict(v) for v in values]
        score(values)
        self.assertEqual(values,before)
    def test_original_valid_case_compatible(self):
        result=score([row(12),row(-4)])
        self.assertEqual(result['net_bps_total'],8)
        self.assertEqual(result['cost_adjusted_win_rate'],.5)

if __name__=='__main__': unittest.main(verbosity=2)
