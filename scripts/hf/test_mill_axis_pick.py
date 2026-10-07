"""mill_axis_pick: M-P1-5. Run: python3 -m unittest discover -s scripts/hf -p test_mill_axis_pick.py"""
import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mill_axis_pick import ROTATION, pick_axes, round_index  # noqa: E402

T0 = datetime(2026, 10, 7, 0, 29, tzinfo=timezone.utc)
ROUNDS = [T0 + timedelta(hours=6 * i) for i in range(12)]


class AxisPickTest(unittest.TestCase):
    def test_the_old_api_gspc_shape_falls_back_to_the_clock_and_walks_every_axis(self):
        # /api/gspc axes never carried measured_models / n_models / models_measured: the old picker
        # read 0 for every axis and returned governance,safety every round.
        doc = {"axes": [{"slug": a} for a in ROTATION]}
        picks = [pick_axes(doc, t)[0] for t in ROUNDS]
        self.assertTrue(all("clock fallback" in pick_axes(doc, t)[1] for t in ROUNDS))
        self.assertEqual({a for p in picks[:6] for a in p}, set(ROTATION))
        for a, b in zip(picks, picks[1:]):
            self.assertNotEqual(a, b)
            self.assertFalse(a == ["governance", "safety"] and b == ["governance", "safety"])

    def test_by_axis_picks_the_least_covered_and_never_two_rounds_of_governance_safety(self):
        doc = {"by_axis": {"governance": 60, "safety": 55, "provenance": 9, "continuity": 12, "conformance": 20,
                           "openness": 30, "machinery-conformity": 3, "care": 40, "cross-reality": 3,
                           "detector-interop": 3, "art5-safeguard": 4, "gspc-safety": 21}}
        picks = [pick_axes(doc, t)[0] for t in ROUNDS[:4]]
        # affect is absent (0), then the three axes at 3: the window, two per round, one step per round.
        self.assertEqual({a for p in picks for a in p},
                         {"affect", "machinery-conformity", "cross-reality", "detector-interop"})
        for p in picks:
            self.assertEqual(len(p), 2)
            self.assertNotIn("governance", p)
            self.assertNotIn("safety", p)
        self.assertNotEqual(picks[0], picks[1])

    def test_swarm_and_jail_are_never_picked(self):
        doc = {"by_axis": {a: 100 for a in ROTATION}}
        for t in ROUNDS:
            for d in (doc, None):
                axes, _ = pick_axes(d, t)
                self.assertNotIn("swarm", axes)
                self.assertNotIn("jail", axes)

    def test_bad_counts_rank_as_zero_and_never_crash(self):
        doc = {"by_axis": {"governance": "many", "safety": True, "provenance": -3}}
        axes, why = pick_axes(doc, T0)
        self.assertEqual(len(axes), 2)
        self.assertIn("by_axis", why)

    def test_round_index_steps_once_per_six_hours(self):
        self.assertEqual(round_index(ROUNDS[1]) - round_index(ROUNDS[0]), 1)
        self.assertEqual(round_index(ROUNDS[4]) - round_index(ROUNDS[0]), 4)


if __name__ == "__main__":
    unittest.main()
