#!/usr/bin/env python3
"""Offline regression for transient HF-Jobs OIDC board signing errors."""
import unittest

from sign_financial_runs import BoardSignHTTPError
from sign_mill_cards import SIGN_RETRY_DELAYS, sign_via_oidc_with_retry


class TransientSignerTests(unittest.TestCase):
    def test_retries_only_transient_and_preserves_exact_payload(self):
        body = {"model": "test/model", "n": 30}
        seen, delays = [], []
        def signer(candidate):
            self.assertIs(candidate, body)
            seen.append(candidate)
            if len(seen) < 3:
                raise BoardSignHTTPError(503 if len(seen) == 1 else 504)
            return ("signature", "a" * 64)
        self.assertEqual(sign_via_oidc_with_retry(body, signer, delays.append),
                         ("signature", "a" * 64))
        self.assertEqual(len(seen), 3)
        self.assertEqual(delays, list(SIGN_RETRY_DELAYS[:2]))

    def test_transient_exhaustion_fails_closed(self):
        calls, delays = [], []
        def signer(_):
            calls.append(1)
            raise BoardSignHTTPError(503)
        with self.assertRaises(BoardSignHTTPError):
            sign_via_oidc_with_retry({}, signer, delays.append)
        self.assertEqual(len(calls), len(SIGN_RETRY_DELAYS) + 1)
        self.assertEqual(delays, list(SIGN_RETRY_DELAYS))

    def test_authorisation_rejection_is_not_retried(self):
        calls, delays = [], []
        def signer(_):
            calls.append(1)
            raise BoardSignHTTPError(403)
        with self.assertRaises(BoardSignHTTPError):
            sign_via_oidc_with_retry({}, signer, delays.append)
        self.assertEqual(len(calls), 1)
        self.assertEqual(delays, [])

    def test_other_invariant_failure_is_not_retried(self):
        calls, delays = [], []
        def signer(_):
            calls.append(1)
            raise RuntimeError("returned payload digest mismatch")
        with self.assertRaisesRegex(RuntimeError, "digest mismatch"):
            sign_via_oidc_with_retry({}, signer, delays.append)
        self.assertEqual(len(calls), 1)
        self.assertEqual(delays, [])


if __name__ == "__main__":
    unittest.main()
