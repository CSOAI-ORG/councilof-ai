#!/usr/bin/env python3
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("build_chainlink_ondo_inventory.py")
SPEC = importlib.util.spec_from_file_location("inventory", MODULE_PATH)
inventory = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(inventory)


class InventoryTest(unittest.TestCase):
    def test_parses_and_preserves_boundaries(self):
        link = b'''### Ethereum Mainnet\n| Parameter | Value |\n| Chain ID | `1` |\n| Address | <Address contractUrl="https://example/0x514910771AF9Ca656af840dff83E8264EcF986CA" /> |\n| Name | Chainlink Token |\n| Symbol | LINK |\n| Decimals | 18 |\n'''
        ondo = json.dumps({"timestamp": "2026-09-17T22:31:11Z", "version": {"major": 13}, "tokens": [{"chainId": 1, "address": "0xAcE8E719899F6E91831B18AE746C9A965c2119F1", "name": "Ondo U.S. Dollar Token", "symbol": "USDon", "decimals": 18, "tags": ["ondo"]}]}).encode()
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            (root / "link.md").write_bytes(link)
            (root / "ondo.json").write_bytes(ondo)
            result = inventory.build(root / "link.md", root / "ondo.json", "2026-09-20T00:00:00Z")
        self.assertEqual(result["counts"]["chainlink_rows"], 1)
        self.assertEqual(result["counts"]["ondo_rows"], 1)
        self.assertEqual(result["status"], "MEASURED")
        self.assertIn("safety, solvency, creditworthiness, investment merit or endorsement", result["not_measured"])
        self.assertEqual(result["signature"]["state"], "UNSIGNED")

    def test_rejects_duplicate_ondo_address(self):
        row = {"chainId": 1, "address": "0xAcE8E719899F6E91831B18AE746C9A965c2119F1", "name": "x", "symbol": "x", "decimals": 18}
        with self.assertRaises(ValueError):
            inventory.parse_ondo(json.dumps({"tokens": [row, row]}).encode())


if __name__ == "__main__":
    unittest.main()
