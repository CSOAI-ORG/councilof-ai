#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Fail-closed regression checks for the classical 12-around-1 experiment."""
import copy
import unittest
from two_path_council import ARMS, analyse, bootstrap_effects, simulate, validate


class TestTwoPathCouncil(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fixture = simulate(n_tasks=35, seed=42)

    def assertRejected(self, altered):
        with self.assertRaises(ValueError):
            validate(altered)

    def test_four_arms_twelve_votes(self):
        tasks, bank = validate(self.fixture)
        self.assertEqual(len(tasks), 35)
        self.assertEqual(set(tasks["synthetic-00000"]), set(ARMS))
        self.assertEqual(len(bank), 64)

    def test_duplicate_arm_rejected(self):
        self.assertRejected(self.fixture + [copy.deepcopy(self.fixture[0])])

    def test_missing_arm_rejected(self):
        self.assertRejected(self.fixture[:-1])

    def test_truth_change_rejected(self):
        rows = copy.deepcopy(self.fixture)
        rows[0]["truth"] = "0" if rows[0]["truth"] == "1" else "1"
        self.assertRejected(rows)

    def test_bank_change_rejected(self):
        rows = copy.deepcopy(self.fixture)
        rows[0]["bank_commitment"] = "a"*64
        self.assertRejected(rows)

    def test_duplicate_agent_rejected(self):
        rows = copy.deepcopy(self.fixture)
        rows[0]["votes"][1]["agent_id"] = rows[0]["votes"][0]["agent_id"]
        self.assertRejected(rows)

    def test_minimum_sample_gate(self):
        self.assertRejected(simulate(30)[:4*29])

    def test_replay_stable(self):
        a = analyse(self.fixture, origin="synthetic", bootstrap=60)
        b = analyse(self.fixture, origin="synthetic", bootstrap=60)
        self.assertEqual(a, b)
        self.assertEqual(a["evidence_state"], "SYNTHETIC")
        self.assertFalse(a["independent_referee_established"])
        self.assertTrue(a["not_quantum"])
        self.assertEqual(a["n_unique_paired_tasks"], 35)

    def test_report_has_no_private_answers(self):
        report = analyse(self.fixture, origin="synthetic", bootstrap=60)
        self.assertNotIn("synthetic-00000", str(report))
        self.assertNotIn("agent-01", str(report))
        self.assertNotIn("votes", report)

    def test_invalid_rho_rejected(self):
        with self.assertRaises(ValueError):
            simulate(rho=1)

    def test_bootstrap_too_small_rejected(self):
        with self.assertRaises(ValueError):
            bootstrap_effects([[0,0,0,0]], samples=5)

    def test_negative_sampling_correlation_is_not_more_than_12_voters(self):
        report = analyse(simulate(35, rho=0), origin="synthetic", bootstrap=60)
        for arm in ARMS:
            e = report["by_arm"][arm]["effective_voters_variance_approx"]
            if e is not None:
                self.assertLessEqual(e, 12)


if __name__ == "__main__":
    unittest.main()
