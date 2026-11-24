#!/usr/bin/env python3
"""Negative controls for the deterministic synthetic detector-characterisation run."""
import unittest

from simulate_operating_characteristics import trial


class MonteCarloControls(unittest.TestCase):
    def test_same_seed_reproducible(self):
        self.assertEqual(trial(trials=20, seed=51), trial(trials=20, seed=51))

    def test_actual_detection_vs_false_alarm_are_separate(self):
        result = trial(trials=80, seed=1234)
        self.assertLess(result["null_any_alarm_fraction"], 0.5)
        self.assertGreater(result["post_onset_detection_fraction_of_all_trials"], 0.5)
        self.assertLessEqual(result["null_any_alarm_fraction"], 1.0)
        self.assertLessEqual(result["post_onset_detection_fraction_of_all_trials"], 1.0)
        self.assertEqual(result["trials"], 80)

    def test_disclosure_cannot_claim_field_validation(self):
        result = trial(trials=20)
        self.assertEqual(result["evidence_state"], "SYNTHETIC_RANDOM_NORMAL_IID_ONLY")
        self.assertFalse(result["real_world_safety_certified"])
        self.assertFalse(result["independent_lab_validation"])
        self.assertTrue(result["simulation_assumptions"])

    def test_invalid_design_rejected(self):
        for args in ({"trials": 0}, {"length": 18}, {"shift_at": 29}, {"shift_sigma": 0}):
            with self.subTest(args=args), self.assertRaises(ValueError):
                trial(**args)


if __name__ == "__main__":
    unittest.main(verbosity=2)
