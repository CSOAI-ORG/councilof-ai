#!/usr/bin/env python3
"""Exact XRPL asset identity must include both symbol and issuer address."""
from __future__ import annotations
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from adapters import xrpl

class XRPLIdentityMatchTests(unittest.TestCase):
    def _collect(self, assets):
        metrics = {"ok": True, "assets": assets, "updatedAt": "2026-09-29T00:00:00Z"}
        with patch.object(xrpl, "fetch_metrics", return_value=metrics):
            return xrpl.collect()

    def _usdc(self, result):
        return next(x for x in result["leaves"] if x["payload"]["symbol"] == "USDC")

    def test_exact_symbol_and_issuer_is_accepted(self):
        addr = next(x["issuer_address"] for x in xrpl.LOCKED_16 if x["symbol"] == "USDC")
        row = self._usdc(self._collect([{"symbol": "USDC", "issuerAddress": addr, "supply": 7}]))
        self.assertEqual(row["payload"]["supply"], 7)
        self.assertNotIn("xrpl.fi_row", row["unmeasured"])

    def test_ticker_collision_with_wrong_issuer_is_rejected(self):
        row = self._usdc(self._collect([{"symbol": "USDC", "issuerAddress": "rWrongIssuer", "supply": 999}]))
        self.assertIsNone(row["payload"]["supply"])
        self.assertIn("xrpl.fi_row", row["unmeasured"])

if __name__ == "__main__":
    unittest.main()
