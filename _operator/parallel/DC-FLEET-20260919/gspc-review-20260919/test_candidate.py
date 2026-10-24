"""Offline regression tests, not live-trading acceptance."""
import contextlib
import hashlib
import importlib.util
import io
import itertools
import unittest
with contextlib.redirect_stdout(io.StringIO()):
    import review_scoring as r
spec=importlib.util.spec_from_file_location('review_snapshot.candidate_scoring',
    r.HERE/'candidate_scoring.py')
candidate=importlib.util.module_from_spec(spec)
spec.loader.exec_module(candidate)

class RepresentativeRegression(unittest.TestCase):
    def test_confidence_uses_selected_representative_for_all_six_orders(self):
        outputs=[]
        for rows in itertools.permutations([r.low,r.high,r.other]):
            value=candidate.score_swarm(rows,r.CostEstimate(entry_fee_bps=25))
            outputs.append((value.allowed,value.calibrated_confidence))
        self.assertEqual(set(outputs),{(True,.9)})
    def test_unique_proposals_preserve_baseline(self):
        rows=r.pair(); costs=r.CostEstimate(entry_fee_bps=25)
        self.assertEqual(candidate.score_swarm(rows,costs).model_dump(),
                         r.score_swarm(rows,costs).model_dump())
    def test_explicit_stop_controls_remain_rejections(self):
        for risk in [r.RiskState(kill_switch=True),r.RiskState(stale_data=True)]:
            self.assertFalse(candidate.score_swarm(r.pair(),r.CostEstimate(),risk).allowed)
    def test_original_snapshot_is_unchanged(self):
        for name,expected in r.manifest['sha256'].items():
            self.assertEqual(hashlib.sha256((r.HERE/name).read_bytes()).hexdigest(),expected)
    @unittest.expectedFailure
    def test_outstanding_missing_costs_must_not_qualify(self):
        # A deliberate unresolved acceptance condition, not a passed safety gate.
        self.assertFalse(candidate.score_swarm(r.pair(),r.CostEstimate()).allowed)

if __name__=='__main__':
    unittest.main(verbosity=2)
