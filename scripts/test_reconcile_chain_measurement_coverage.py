import json
import tempfile
import unittest
from pathlib import Path

from reconcile_chain_measurement_coverage import reconcile

class ReconcileCoverageTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.paths = {name: self.root / (name + ".json") for name in
            ("catalogue", "eth", "eth_ind", "xrpl", "xrpl_ind")}
        self.docs = {
            "catalogue": {"asset_count": 2, "assets": [
                {"id": "a", "symbol": "USDC", "chains": ["Ethereum", "XRPL"]},
                {"id": "b", "symbol": "OTHER", "chains": ["Ethereum"]}]},
            "eth": {"n": 1, "n_measured": 1, "rows": [{"symbol": "USDC",
                "address": "0xAbC", "total_supply_raw": "1000", "decimals": 6, "state": "MEASURED",
                "block": {"hash": "0xblock"}}]},
            "eth_ind": {"all_7_match": True, "block_hash": "0xblock",
                "rows": [{"symbol": "USDC", "decimals_match": True,
                    "total_supply_raw_match": True}]},
            "xrpl": {"n": 1, "n_measured": 1, "rows": [{"symbol": "USDC",
                "issuer_address": "rIssuer", "supply": "250",
                "ledger_hash": "ledger", "ledger_index": 7, "currency_code_matched": "USDC", "supply_state": "MEASURED"}]},
            "xrpl_ind": {"all_16_exact_matches": True,
                "rows": [{"symbol": "USDC", "issuer_address": "rIssuer",
                    "exact_match": True, "primary_supply": "250",
                    "ledger_hash": "ledger", "ledger_index": 7}]}}
        self.save()
    def tearDown(self):
        self.tmp.cleanup()

    def save(self):
        for key, path in self.paths.items():
            path.write_text(json.dumps(self.docs[key]))

    def run_reconcile(self):
        return reconcile(self.paths["catalogue"], self.paths["eth"],
            self.paths["eth_ind"], self.paths["xrpl"], self.paths["xrpl_ind"])

    def test_exact_identity_reads_stay_unadmitted_and_unanchored(self):
        self.save()
        result = self.run_reconcile()
        self.assertEqual(len(result["observations"]), 2)
        self.assertEqual(result["coverage"]["catalogue_identity_bound"], 0)
        for row in result["observations"]:
            self.assertEqual(row["catalogue_join"], "SYMBOL_CHAIN_CANDIDATE_ONLY")
            self.assertEqual(row["admission_state"], "NOT_ADMITTED")
            self.assertEqual(row["signature_state"], "UNSIGNED")
            self.assertEqual(row["anchor_state"], "UNANCHORED")
        self.assertFalse(result["authority"]["signs"])
        self.assertFalse(result["authority"]["executes_transactions"])

    def test_rejects_changed_ethereum_supply_readback(self):
        self.docs["eth_ind"]["rows"][0]["total_supply_raw_match"] = False
        self.save()
        with self.assertRaisesRegex(ValueError, "ETHEREUM_INDEPENDENT_VALUE_MISMATCH"):
            self.run_reconcile()

    def test_rejects_primary_row_marked_unmeasured(self):
        self.docs["eth"]["rows"][0]["state"] = "UNCHECKABLE"
        self.save()
        with self.assertRaisesRegex(ValueError, "ETHEREUM_PRIMARY_OR_INDEPENDENT_GATE_FAILED"):
            self.run_reconcile()

    def test_rejects_wrong_xrpl_ledger_binding(self):
        self.docs["xrpl_ind"]["rows"][0]["ledger_hash"] = "other-ledger"
        self.save()
        with self.assertRaisesRegex(ValueError, "XRPL_LEDGER_HASH_MISMATCH"):
            self.run_reconcile()

    def test_rejects_duplicate_catalogue_ids(self):
        self.docs["catalogue"]["assets"][1]["id"] = "a"
        self.save()
        with self.assertRaisesRegex(ValueError, "DUPLICATE_CATALOGUE_ID"):
            self.run_reconcile()

if __name__ == "__main__":
    unittest.main()
