#!/usr/bin/env python3
"""TUI-6 growth artefacts: paid-step pointer + seller-side door + census copy."""
from __future__ import annotations

import json
import os
import unittest

_HERE = os.path.dirname(os.path.abspath(__file__))
_REPO = os.path.dirname(_HERE)
_TRUST = os.path.join(_REPO, "public/interop/x402-trust")


class Tui6GrowthArtefacts(unittest.TestCase):
    def test_latest_json_names_paid_step_and_copies_census(self):
        with open(os.path.join(_TRUST, "latest.json"), encoding="utf-8") as f:
            latest = json.load(f)
        with open(os.path.join(_TRUST, "settlement-census-counts.json"), encoding="utf-8") as f:
            census = json.load(f)
        self.assertEqual(latest["paid_step"]["mcp"], "commission_card")
        self.assertEqual(latest["paid_step"]["feed"], "https://councilof.ai/api/eunomia-data?feed=1")
        self.assertEqual(latest["paid_step"]["href"], "https://councilof.ai/api/x402")
        self.assertEqual(
            latest["settlement_census"]["take_and_refuse"],
            census["counts"]["take_and_refuse"],
        )
        self.assertEqual(
            latest["settlement_census"]["take_and_refuse_pct"],
            census["counts"]["take_and_refuse_pct"],
        )
        counts = latest.get("counts")
        if counts is None:
            counts = next(r["counts"] for r in latest["rounds"] if r.get("source") == "payai")
        int_parts = [v for k, v in counts.items() if k != "total" and isinstance(v, int)]
        self.assertEqual(counts["total"], sum(int_parts))
        self.assertIn("challenge_402", counts)
        self.assertIn("dead_404_or_unreachable", counts)

    def test_seller_side_json_sells_commission_card(self):
        with open(os.path.join(_TRUST, "seller-side.json"), encoding="utf-8") as f:
            doc = json.load(f)
        self.assertEqual(doc["sold_as"], "commission_card")
        self.assertIn("request-attestation", doc["paid_step"])
        self.assertIn("a certificate", doc["never"])

    def test_trust_index_html_has_one_paid_step_line(self):
        html = open(os.path.join(_TRUST, "index.html"), encoding="utf-8").read()
        self.assertIn('data-paid-step="x402"', html)
        self.assertIn("/api/x402", html)
        self.assertIn("commission_card", html)


if __name__ == "__main__":
    unittest.main()
