#!/usr/bin/env python3
"""Offline classification checks for the settlement ledger."""

import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from settlement_ledger import KNOWN_EXTERNAL_TRANSACTIONS, classify_transfer


class SettlementClassificationTest(unittest.TestCase):
    def test_known_fulfilled_transaction_is_external_revenue(self):
        tx = next(iter(KNOWN_EXTERNAL_TRANSACTIONS))
        self.assertEqual(classify_transfer("0x111", 20_000, tx), "EXTERNAL_CUSTOMER")

    def test_price_match_without_receipt_is_unattributed(self):
        self.assertEqual(classify_transfer("0x111", 10_000, "0xunknown"), "UNATTRIBUTED_SKU_MATCH")

    def test_internal_wallet_wins_over_price_match(self):
        self.assertEqual(
            classify_transfer("0x4db7aafbe797a39cd6cc4e7aa64d970f7f6e02b7", 20_000, "0xunknown"),
            "SELF_TEST",
        )


if __name__ == "__main__":
    unittest.main()
