"""Offline checks of the current scorecard; no accounts or network clients."""
import runpy
import unittest
from pathlib import Path

TARGET = Path('/Users/nicholas/clawd/councilof-ai-work/condor/scripts/paper_scorecard.py')
SCORE = runpy.run_path(str(TARGET), run_name='scorecard_offline_review')['score']

def row(value, flag=None):
    result = {'execution': 'disabled', 'symbol': 'SYNTHETIC', 'net_return_bps': value}
    if flag is not None:
        result['profitable_after_estimated_cost'] = flag
    return result

class ScorecardIntegrationTests(unittest.TestCase):
    def test_missing_return_cannot_inflate_win_rate(self):
        result = SCORE([row(5, True), {'execution': 'disabled',
            'profitable_after_estimated_cost': True}])
        self.assertEqual(result['settled_outcomes'], 1)
        self.assertEqual(result['cost_adjusted_win_rate'], 1.0)
    def test_wins_come_from_returns_not_declared_flags(self):
        result = SCORE([row(5, False), row(-2, True), row(0, True)])
        self.assertEqual(result['cost_adjusted_win_rate'], round(1/3, 4))
    def test_positive_outcome_needs_no_flag(self):
        self.assertEqual(SCORE([row(1)])['cost_adjusted_win_rate'], 1.0)
    def test_empty_remains_unknown(self):
        self.assertIsNone(SCORE([])['cost_adjusted_win_rate'])
    def test_live_outcomes_excluded(self):
        live = {'execution': 'live', 'symbol': 'SYNTHETIC',
                'net_return_bps': 999, 'profitable_after_estimated_cost': True}
        result = SCORE([row(12, True), row(-4, False), live])
        self.assertEqual(result['settled_outcomes'], 2)
        self.assertEqual(result['net_bps_total'], 8)
        self.assertEqual(result['cost_adjusted_win_rate'], 0.5)
    def test_existing_authority_gate_preserved(self):
        result = SCORE([row(100, True)] * 40)
        self.assertEqual(result['execution'], 'disabled')
        self.assertFalse(result['eligible_for_live_promotion'])
        gate = result['promotion_gate']
        self.assertEqual(gate['minimum_settled_outcomes'], 30)
        self.assertTrue(gate['requires_positive_aggregate_net_bps'])
        self.assertTrue(gate['requires_independent_evidence_groups'])
        self.assertTrue(gate['requires_transaction_time_authorization'])
    def test_source_rows_not_modified(self):
        rows = [row(1, True), row(-1, False)]
        before = [dict(value) for value in rows]
        SCORE(rows)
        self.assertEqual(rows, before)

if __name__ == '__main__':
    unittest.main(verbosity=2)
