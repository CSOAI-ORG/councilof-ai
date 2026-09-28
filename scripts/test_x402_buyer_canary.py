"""Tests for scripts/x402-buyer-canary.py — the classification is the whole instrument, so pin it."""
import importlib.util
import os
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("canary", os.path.join(HERE, "x402-buyer-canary.py"))
canary = importlib.util.module_from_spec(spec)
spec.loader.exec_module(canary)


class Classify(unittest.TestCase):
    def test_fast_402_with_header_is_in_time(self):
        self.assertEqual(canary.classify(402, 0.4, True, {"x402Version": 2}), "CHALLENGE_402_FAST")

    def test_slow_402_is_not_in_time(self):
        self.assertEqual(canary.classify(402, 5.0, True, {}), "CHALLENGE_402_SLOW")
        self.assertNotIn("CHALLENGE_402_SLOW", canary.IN_TIME)

    def test_402_without_payment_required_header_is_its_own_class(self):
        self.assertEqual(canary.classify(402, 0.2, False, {}), "NO_PAYMENT_HEADER")

    def test_preview_only_unmeasured_200_is_a_correct_answer_not_a_miss(self):
        body = {"preview_only": True, "state": "UNMEASURED"}
        self.assertEqual(canary.classify(200, 0.9, False, body), "PREVIEW_ONLY_200")
        self.assertIn("PREVIEW_ONLY_200", canary.IN_TIME)

    def test_a_plain_200_is_unexpected_never_counted_in_time(self):
        self.assertEqual(canary.classify(200, 0.1, False, {"state": "ESCROW_PARITY_READ"}), "UNEXPECTED_STATUS")
        self.assertEqual(canary.classify(200, 0.1, False, {"preview_only": True, "state": "INDEXED"}), "UNEXPECTED_STATUS")
        self.assertEqual(canary.classify(500, 0.1, False, None), "UNEXPECTED_STATUS")

    def test_no_answer_is_timeout_or_error_never_a_status(self):
        self.assertEqual(canary.classify(None, canary.TIMEOUT_S, False, None), "TIMEOUT")
        self.assertEqual(canary.classify(None, 0.1, False, None), "ERROR")


class Summarize(unittest.TestCase):
    def test_a_door_is_in_time_only_when_every_probe_is(self):
        rows = [
            {"url": "a", "class": "CHALLENGE_402_FAST"},
            {"url": "a", "class": "CHALLENGE_402_FAST"},
            {"url": "b", "class": "CHALLENGE_402_FAST"},
            {"url": "b", "class": "TIMEOUT"},  # the flagship hang: 1 bad probe of 2 is a miss
            {"url": "c", "class": "PREVIEW_ONLY_200"},
        ]
        s = canary.summarize(rows)
        self.assertEqual(s["doors"], 3)
        self.assertEqual(s["doors_in_time"], 2)
        self.assertEqual(s["doors_not_in_time"], ["b"])


if __name__ == "__main__":
    unittest.main()
