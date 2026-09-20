#!/usr/bin/env python3
from __future__ import annotations

import unittest

from instrument import CONTROLS, FIXED_NOW, Verifier, exercise, fixture, qualify


class EffectBindingInstrumentTests(unittest.TestCase):
    def test_valid_authorization_is_accepted(self):
        auth, request = fixture(1)
        self.assertTrue(Verifier().authorize(
            auth,
            target="tool-x",
            required_scope="records:read",
            challenge_id="tool-x-challenge-1",
            outbound_request=request,
            now=FIXED_NOW,
        ))

    def test_reference_verifier_refuses_every_attack(self):
        for control in CONTROLS:
            with self.subTest(control=control):
                self.assertTrue(exercise(control, 1, Verifier()))

    def test_each_control_detects_its_synthetic_breakage(self):
        for control in CONTROLS:
            with self.subTest(control=control):
                self.assertFalse(exercise(control, 1, Verifier(defect=control)))

    def test_qualification_remains_pre_measurement(self):
        result = qualify(10)
        self.assertEqual(result["status"], "INSTRUMENT_QUALIFIED")
        self.assertEqual(result["axis_status"], "UNMEASURED")
        self.assertEqual(result["totals"]["reference_attacks_refused"], 50)
        self.assertEqual(result["totals"]["synthetic_breakages_detected"], 50)
        self.assertFalse(result["measurement_gate"]["may_mark_axis_measured"])

    def test_invalid_trial_count_fails_closed(self):
        with self.assertRaises(ValueError):
            qualify(0)


if __name__ == "__main__":
    unittest.main()
