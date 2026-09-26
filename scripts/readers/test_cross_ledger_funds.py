"""Fixture-only tests for cross_ledger_funds.py — no network.

Proof fixtures are the bytes the live run on 2026-09-25 wrote to public/interop/cross-ledger-*-2026-09-25/
(copied to fixtures/cross_ledger/). The issuer-page fixtures are page_lines() of, and a verbatim byte
slice of, the real pages fetched on 2026-09-25 (source sha256 inside each fixture). Only the
REJECTED test uses a fake transport, and it fakes nothing the real endpoints do not return.
Run: python3 -m unittest scripts/readers/test_cross_ledger_funds.py -v
"""
from __future__ import annotations

import copy
import json
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1]))
from scripts.readers import cross_ledger_funds as f  # noqa: E402
from scripts.readers import cross_ledger_supply as base  # noqa: E402

FIX = HERE / "fixtures" / "cross_ledger"
REG = json.loads((HERE / "cross_ledger_assets.json").read_text())


def load(name: str) -> dict:
    return json.loads((FIX / name).read_text())


class Erc7201(unittest.TestCase):
    def test_openzeppelin_erc20_namespace(self):
        # the value OpenZeppelin Contracts v5 ERC20Upgradeable declares as ERC20StorageLocation
        self.assertEqual(hex(f.erc7201_slot("openzeppelin.storage.ERC20")),
                         "0x52c63247e1f47db19d5ce0460030c497f067ca4cebf71ba98eeadabe20bace00")

    def test_candidate_set_is_declared_not_guessed(self):
        c = f.slot_candidates(REG["evm_slot_candidates"])
        self.assertEqual(len(c), 65 + 5)
        self.assertEqual(c[53], (53, "53"))
        self.assertEqual(c[-3][1], "erc7201(openzeppelin.storage.ERC20)+2")


class Proofs(unittest.TestCase):
    def _check(self, blob):
        slot = int(blob["slot"], 16)
        v = base.verify_eip1186(blob["state_root"], blob["address"], blob["response"], slot)
        return v

    def test_jpmd_base_erc7201_slot_proof_verifies(self):
        b = load("base-JPMD-proof.json")
        self.assertEqual(b["slot_name"], "erc7201(openzeppelin.storage.ERC20)+2")
        v = self._check(b)
        self.assertTrue(v["account_proof_verified"] and v["storage_proof_verified"], v)
        self.assertEqual(v["proven_value"], 100100000)
        self.assertEqual("0x" + base.header_hash(b["header"]).hex(), b["block_hash"].lower())

    def test_ibenji_bsc_slot53_proof_verifies(self):
        b = load("bsc-iBENJI-proof.json")
        self.assertEqual(b["slot_name"], "53")
        v = self._check(b)
        self.assertTrue(v["storage_proof_verified"], v)
        self.assertEqual("0x" + base.header_hash(b["header"]).hex(), b["block_hash"].lower())

    def test_tampered_value_fails(self):
        b = copy.deepcopy(load("base-JPMD-proof.json"))
        sp = b["response"]["storageProof"][0]
        sp["value"] = hex(int(sp["value"], 16) + 1)
        v = self._check(b)
        self.assertFalse(v["storage_proof_verified"])

    def test_wrong_state_root_fails(self):
        b = copy.deepcopy(load("bsc-iBENJI-proof.json"))
        b["state_root"] = "0x" + "11" * 32
        self.assertFalse(self._check(b)["account_proof_verified"])


class IssuerPages(unittest.TestCase):
    def test_franklin_page_parses_to_13_fund_tokens(self):
        fx = load("franklin-benji-contracts.lines.json")
        il = REG["assets"]["benji"]["issuer_list"]
        rows = f.parse_labelled_role_blocks(fx["lines"], il["header_regex"], il["token_role"])
        got = [(r["product"], r["label"]) for r in rows]
        self.assertEqual(len(rows), 13)
        self.assertIn(("BENJI", "Aptos"), got)
        self.assertIn(("iBENJI", "BNB Smart Chain"), got)
        self.assertNotIn(("BENJI", "BNB Smart Chain"), got)  # the issuer lists iBENJI there, not BENJI
        eth = next(r for r in rows if r["product"] == "BENJI" and r["label"] == "Ethereum")
        self.assertEqual(eth["identifier"], "0x3DDc84940Ab509C11B20B76B466933f40b750dc9")
        self.assertIn("Transfer Agent Module", eth["modules"])  # modules kept, never read as supply
        for r in rows:
            self.assertIn(r["label"], REG["assets"]["benji"]["label_to_ledger"])

    def test_jpm_regex_on_real_slice(self):
        fx = load("jpm-coin-link.slice.json")
        rows = f.parse_html_regex(fx["slice"].encode(), REG["assets"]["jpmd"]["issuer_list"]["regex"], "JPMD")
        self.assertEqual([(r["label"], r["identifier"]) for r in rows],
                         [("Base", "0x7e0aedc93d9f898be835a44bfca3842e52416b82")])


class Sums(unittest.TestCase):
    def test_products_and_kinds_never_mix(self):
        rows = [
            {"product": "BENJI", "ledger": "ethereum", "evidence_kind": "STATE_PROOF_VERIFIED", "supply_decimal": "1.5"},
            {"product": "BENJI", "ledger": "stellar", "evidence_kind": "OPERATOR_API", "supply_decimal": "2"},
            {"product": "iBENJI", "ledger": "ethereum", "evidence_kind": "STATE_PROOF_VERIFIED", "supply_decimal": "10"},
            {"product": "BENJI", "ledger": "aptos", "evidence_kind": "UNCHECKABLE", "supply_decimal": None},
        ]
        s = f.sum_by_product_kind(rows)
        self.assertEqual(s["BENJI"]["STATE_PROOF_VERIFIED"]["sum_decimal"], "1.5")
        self.assertEqual(s["BENJI"]["OPERATOR_API"]["sum_decimal"], "2")
        self.assertEqual(s["iBENJI"]["STATE_PROOF_VERIFIED"]["sum_decimal"], "10")
        self.assertIsNone(s["BENJI"]["UNCHECKABLE"]["sum_decimal"])


def abi_string(s: str) -> str:
    b = s.encode()
    return "0x" + (32).to_bytes(32, "big").hex() + len(b).to_bytes(32, "big").hex() + b.ljust(32, b"\0").hex()


class Rejected(unittest.TestCase):
    def test_symbol_mismatch_records_no_supply_against_product(self):
        blk = load("bsc-iBENJI-proof.json")["header"]

        def t(url, body, headers):
            req = json.loads(body)
            m, p = req["method"], req["params"]
            if m == "eth_chainId":
                res = hex(56)
            elif m == "eth_blockNumber":
                res = blk["number"]
            elif m == "eth_getBlockByNumber":
                res = blk
            elif m == "eth_call":
                d = p[0]["data"]
                res = {base.SEL["symbol"]: abi_string("iBENJI"), base.SEL["name"]: abi_string("x"),
                       base.SEL["decimals"]: hex(18), base.SEL["totalSupply"]: hex(5)}[d]
            else:
                res = "0x0"
            return 200, json.dumps({"jsonrpc": "2.0", "id": 1, "result": res}).encode()
        c = base.Client(transport=t, spacing=0)
        row, blob = f.read_evm(c, REG["ledgers"]["bsc"], f.slot_candidates(REG["evm_slot_candidates"]),
                               "bsc", "BENJI", "BNB Smart Chain", "0x3d0a2A3a30a43a2C1C4b92033609245E819ae6a6")
        self.assertEqual(row["evidence_kind"], "REJECTED")
        self.assertIsNone(blob)
        s = f.sum_by_product_kind([row])
        self.assertIsNone(s["BENJI"]["REJECTED"]["sum_decimal"])


if __name__ == "__main__":
    unittest.main()
