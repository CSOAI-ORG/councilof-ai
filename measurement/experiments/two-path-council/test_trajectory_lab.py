#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Regression checks for synthetically controlled trajectory experiment."""
import unittest

from trajectory_lab import run, wilson


class TestTrajectoryLab(unittest.TestCase):
    def test_reproducible_receipt(self):
        a=run(n=1000,seed=31,lengths=(1,4,16))
        b=run(n=1000,seed=31,lengths=(1,4,16))
        self.assertEqual(a,b)

    def test_independent_analytic(self):
        a=run(n=4000,q=.97,rho=0,seed=12,lengths=(1,4,8,16))
        for r in a["results"]:
            if r["mode"]!="independent":
                continue
            self.assertAlmostEqual(r["analytic_clean_independent"],.97**r["length"],places=5)
            self.assertLess(abs(r["clean_first_pass"]-r["analytic_clean_independent"]),.035)
            self.assertGreaterEqual(r["no_escaped_faults"],r["clean_first_pass"])

    def test_perfect_detection_and_recovery(self):
        a=run(n=400,q=.65,rho=.2,detect=1,recover=1,lengths=(8,))
        self.assertTrue(all(r["no_escaped_faults"]==1 for r in a["results"]))
        self.assertTrue(any(r["clean_first_pass"]<1 for r in a["results"]))

    def test_no_detection_means_no_containment(self):
        a=run(n=300,q=.8,rho=.15,detect=0,recover=1,lengths=(8,))
        for r in a["results"]:
            self.assertEqual(r["no_escaped_faults"],r["clean_first_pass"])
            self.assertEqual(r["total_detected_and_recovered_faults"],0)

    def test_negative_controls(self):
        for opts in ({"n":29},{"q":1.3},{"rho":1},{"detect":-0.1},
                     {"recover":1.1},{"lengths":(0,)},{"lengths":(1,1)},
                     {"lengths":()}):
            with self.assertRaises(ValueError):
                run(**opts)

    def test_wilson(self):
        self.assertEqual(wilson(5,10),[0.23659,0.76341])
        for x in (0,10):
            low,high=wilson(x,10)
            self.assertTrue(0<=low<=high<=1)

    def test_no_real_model_claim(self):
        a=run(n=30,lengths=(1,))
        self.assertEqual(a["evidence_state"],"SYNTHETIC")
        self.assertTrue(a["not_live_agent"])
        self.assertTrue(a["not_measured_model_fault_rate"])


if __name__=="__main__":
    unittest.main()
