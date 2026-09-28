#!/usr/bin/env python3
"""gate_draft.py: a clean draft reaches 100%; each doctored copy (must-fail control) does not.

    python3 -m unittest -v test_gate_draft.py
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gate_draft as gd  # noqa: E402

CLEAN = ("# Note\n\nWe measure public statements against what a server answers, and publish dated records.\n"
         "Source: https://huggingface.co/datasets/csoai/mcp-contract-parity (read 2026-09-28).\n")


class GateDraft(unittest.TestCase):
    def test_clean_passes(self):
        r = gd.gate_text(CLEAN)
        self.assertTrue(r["at_100"], r)
        self.assertEqual(r["notice_banned"], [])
        self.assertEqual(len(r["doctrine"]), gd.N_DOCTRINE, r)
        self.assertTrue(all(v == "PASS" for v in r["doctrine"].values()), r)

    def test_must_fail_banned_words(self):
        # the notice list has no negation escape: a denial still trips it
        for bad in ("This server is certified.", "Book a demo with us.", "It failed the check.",
                    "Our pricing is simple.", "This is not an endorsement."):
            r = gd.gate_text(CLEAN + bad)
            self.assertFalse(r["at_100"], bad)
            self.assertTrue(r["notice_banned"], bad)

    def test_must_fail_public_price(self):
        r = gd.gate_text(CLEAN + "Access costs £120 per month.\n")
        self.assertFalse(r["at_100"])
        self.assertEqual(r["doctrine"].get("doctrine.no_public_prices"), "FAIL")

    def test_must_fail_brand_gate(self):
        r = gd.gate_text(CLEAN + "Built on sovos.\n")
        self.assertFalse(r["at_100"])
        self.assertEqual(r["doctrine"].get("doctrine.brand_gate"), "FAIL")

    def test_must_fail_lf_label(self):
        r = gd.gate_text(CLEAN + "We are an LF member.\n")
        self.assertFalse(r["at_100"])
        self.assertEqual(r["doctrine"].get("doctrine.no_lf_membership_label"), "FAIL")


if __name__ == "__main__":
    unittest.main()
