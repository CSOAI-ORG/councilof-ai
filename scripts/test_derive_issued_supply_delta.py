import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import derive_issued_supply_delta as delta

class IssuedSupplyDeltaTests(unittest.TestCase):
    def test_ethereum_exact_contract_and_raw_units(self):
        old = {"rows": [{"symbol":"USDC","address":"0xAbC","state":"MEASURED","total_supply_raw":"123","decimals":2,"block":{"number":10}}]}
        new = {"rows": [{"symbol":"USDC","address":"0xabc","state":"MEASURED","total_supply_raw":"150","decimals":2,"block":{"number":20}}]}
        out = delta.derive_pair("ethereum", old, new)["rows"][0]
        self.assertEqual(out["old_value"], "1.23")
        self.assertEqual(out["new_value"], "1.5")
        self.assertEqual(out["delta"], "0.27")
        self.assertEqual(out["old_ledger"], 10)
        self.assertEqual(out["new_ledger"], 20)

    def test_xrpl_joins_symbol_and_issuer(self):
        old = {"rows": [{"symbol":"USD","issuer_address":"rA","supply_state":"MEASURED","supply":"10","ledger_index":1}]}
        new = {"rows": [{"symbol":"USD","issuer_address":"rA","supply_state":"MEASURED","supply":"12.5","ledger_index":2}]}
        out = delta.derive_pair("xrpl", old, new)["rows"][0]
        self.assertEqual(out["delta"], "2.5")
        self.assertEqual(out["delta_percent"], "25.0000")

    def test_ticker_or_symbol_without_exact_prior_identity_rejected(self):
        old = {"rows": [{"symbol":"USD","issuer_address":"rWrong","supply_state":"MEASURED","supply":"10"}]}
        new = {"rows": [{"symbol":"USD","issuer_address":"rRight","supply_state":"MEASURED","supply":"12"}]}
        with self.assertRaisesRegex(ValueError, "missing in prior"):
            delta.derive_pair("xrpl", old, new)

    def test_duplicate_identity_rejected(self):
        row = {"symbol":"USD","issuer_address":"rA","supply_state":"MEASURED","supply":"10"}
        with self.assertRaisesRegex(ValueError, "duplicate"):
            delta.derive_pair("xrpl", {"rows":[row,row]}, {"rows":[row]})

    def test_unmeasured_rows_never_become_zero(self):
        old = {"rows": [{"symbol":"USD","issuer_address":"rA","supply_state":"UNMEASURED","supply":None}]}
        new = {"rows": [{"symbol":"USD","issuer_address":"rA","supply_state":"MEASURED","supply":"12"}]}
        with self.assertRaisesRegex(ValueError, "not MEASURED"):
            delta.derive_pair("xrpl", old, new)

if __name__ == "__main__":
    unittest.main()
