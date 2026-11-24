#!/usr/bin/env python3
"""Offline adversarial and model-boundary checks for synthetic assurance twin."""
from dataclasses import replace
import math
import json
import subprocess
from pathlib import Path
import sys
import tempfile
import unittest

from fault_twin import Scenario, simulate, sweep, correlated_failure_probability


class AssuranceTwinTests(unittest.TestCase):
    def check(self, **updates):
        return simulate(replace(Scenario(), **updates))

    def test_permitted_case_synthetic_only(self):
        x = self.check()
        self.assertEqual(x["state"], "SIMULATED_PERMITTED_EFFECT_WITH_SYNTHETIC_RECEIPT")
        self.assertFalse(x["actual_recipient_effect_verified"])
        self.assertFalse(x["actual_human_authority_verified"])
        self.assertFalse(x["production_policy_mutated"])

    def test_missing_authority_blocks(self):
        x = self.check(authority_valid=False)
        self.assertFalse(x["effect_in_simulation"])
        self.assertEqual(x["state"], "SIMULATED_NO_EFFECT")

    def test_expired_authority_blocks(self):
        self.assertFalse(self.check(authority_fresh=False)["effect_in_simulation"])

    def test_wrong_scope_blocks_if_executor_checks(self):
        self.assertFalse(self.check(scope_matches=False)["effect_in_simulation"])

    def test_wrong_scope_breaches_if_executor_check_disabled(self):
        x = self.check(scope_matches=False, executor_checks_scope=False)
        self.assertEqual(x["state"], "SIMULATED_CONTROL_BREACH")
        self.assertTrue(x["prohibited_effect_in_simulation"])

    def test_revoked_authority_blocks_if_executor_checks(self):
        self.assertFalse(self.check(authority_revoked=True)["effect_in_simulation"])

    def test_revocation_bypass_is_control_breach(self):
        x = self.check(authority_revoked=True, executor_checks_revocation=False)
        self.assertEqual(x["state"], "SIMULATED_CONTROL_BREACH")

    def test_replayed_action_blocks(self):
        x = self.check(replayed_idempotency_key=True)
        self.assertFalse(x["effect_in_simulation"])
        self.assertIn("REPLAY_BLOCKED_IN_SIMULATION", x["warnings"])
        self.assertNotIn("SIMULATED_FALSE_REFUSAL", x["warnings"])

    def test_replay_control_failure_is_breach(self):
        x = self.check(replayed_idempotency_key=True, executor_checks_replay=False)
        self.assertEqual(x["state"], "SIMULATED_CONTROL_BREACH")

    def test_no_effect_attempt_not_a_successful_effect(self):
        x = self.check(effect_attempted=False)
        self.assertFalse(x["effect_in_simulation"])
        self.assertEqual(x["state"], "SIMULATED_NO_EFFECT")

    def test_self_issued_receipt_is_not_independent(self):
        x = self.check(recipient_independent=False)
        self.assertEqual(x["state"], "SIMULATED_EFFECT_UNCHECKABLE")
        self.assertIn("SIMULATED_RECEIPT_NOT_INDEPENDENT", x["warnings"])

    def test_missing_receiver_readback_not_success(self):
        x = self.check(recipient_observed=False)
        self.assertEqual(x["state"], "SIMULATED_EFFECT_UNCHECKABLE")

    def test_stale_measurement_cannot_promote(self):
        x = self.check(measurement_fresh=False)
        self.assertEqual(x["state"], "SIMULATED_EFFECT_UNCHECKABLE")
        self.assertIn("SIMULATED_MEASUREMENT_STALE", x["warnings"])

    def test_mismatch_and_fake_receipt_does_not_hide_breach(self):
        x = self.check(scope_matches=False, executor_checks_scope=False, recipient_independent=False)
        self.assertEqual(x["state"], "SIMULATED_CONTROL_BREACH")
        self.assertFalse(x["actual_recipient_effect_verified"])

    def test_untyped_input_rejected(self):
        with self.assertRaises(TypeError):
            simulate({"authority_valid": True})
        with self.assertRaises(TypeError):
            simulate(replace(Scenario(), authority_valid=1))

    def test_sweep_exhaustive_accounting(self):
        x = sweep()
        self.assertEqual(x["total_cases"], 1024)
        self.assertEqual(sum(x["counts"].values()), 1024)
        self.assertFalse(x["actual_human_authority_verified"])
        self.assertFalse(x["actual_recipient_effect_verified"])

    def test_sweep_deterministic(self):
        self.assertEqual(sweep(), sweep())

    def test_independent_three_barrier_probability(self):
        x = correlated_failure_probability(0.05, 0, 3)
        self.assertAlmostEqual(x["independent_only_all_fail_probability"], 0.000125)
        self.assertAlmostEqual(x["mixture_all_fail_probability"], 0.000125)

    def test_common_cause_overwhelms_independent_only(self):
        x = correlated_failure_probability(0.05, 0.02, 3)
        self.assertAlmostEqual(x["mixture_all_fail_probability"], 0.0201225)
        self.assertGreater(x["ratio_mixture_to_independent"], 100)
        self.assertFalse(x["production_safety_certified"])

    def test_common_cause_at_one(self):
        self.assertEqual(correlated_failure_probability(0.9, 1, 12)["mixture_all_fail_probability"], 1.0)

    def test_invalid_probabilities_rejected(self):
        for p, q, n in [(float("nan"), 0.1, 2), (0.1, float("inf"), 2),
                        (-1, 0, 2), (0.1, 1.2, 2), (0.1, 0.1, 0),
                        (True, 0.1, 2), (0.1, False, 2)]:
            with self.subTest(params=(p,q,n)), self.assertRaises(ValueError):
                correlated_failure_probability(p, q, n)

    def test_exhaustive_all_simulated_cases_cannot_verify_actual_effect(self):
        x = sweep()
        self.assertTrue(x["not_a_field_probability_distribution"])
        self.assertEqual(x["total_cases"], 2 ** x["number_of_binary_factors"])

    def test_cli_produces_synthetic_only_receipt(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "twin.json"
            r = subprocess.run([sys.executable, str(Path(__file__).with_name("fault_twin.py")),
                                "--output", str(path)], capture_output=True, text=True, check=False)
            self.assertEqual(r.returncode, 0, r.stderr)
            x = json.loads(path.read_text())
            self.assertEqual(x["sweep"]["total_cases"], 1024)
            self.assertFalse(x["sweep"]["actual_recipient_effect_verified"])
            self.assertIn("SYNTHETIC", x["sweep"]["evidence_state"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
