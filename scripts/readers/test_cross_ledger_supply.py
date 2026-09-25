"""Fixture-only tests for cross_ledger_supply.py — no network.

The two proof fixtures are the bytes the live run on 2026-09-25 wrote to
public/interop/cross-ledger-usdc-2026-09-25/ (copied to fixtures/cross_ledger/). Everything else is
a fake transport. Run: python3 -m unittest scripts/readers/test_cross_ledger_supply.py -v
(pytest also collects it).
"""
from __future__ import annotations

import base64
import copy
import json
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import cross_ledger_supply as x  # noqa: E402

FIX = HERE / "fixtures" / "cross_ledger"
ETH = json.loads((FIX / "ethereum-proof.json").read_text())
NOBLE = json.loads((FIX / "noble-proof.json").read_text())

ISSUER_MD = """# USDC contract addresses

## Mainnet

| Blockchain         | USDC Mainnet Address |
| :----------------- | :------------------- |
| Ethereum           | [`0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`](https://etherscan.io/token/0xa0b8) |
| Hedera             | `0.0.456858` |
| Noble              | [`uusdc`](http://mintscan.io/noble/assets) |
| Solana             | [`EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`](https://solscan.io/token/EPjF) |
| Algorand           | [`31566704`](https://explorer.perawallet.app/asset/31566704) |

<Note>
  **The X Layer entry in the mainnet table is Circle-issued native USDC.** X Layer
  also has a separate bridged USDC representation, labeled `USDC.e`.
</Note>

## Testnet

| Blockchain | USDC Testnet Address |
| :--------- | :------------------- |
| Ethereum Sepolia | [`0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`](https://x) |
"""


def abi_string(s: str) -> str:
    b = s.encode()
    return "0x" + (32).to_bytes(32, "big").hex() + len(b).to_bytes(32, "big").hex() + b.ljust(32, b"\0").hex()


class Fake:
    """transport(url, body, headers) -> (status, bytes); routes by URL substring / JSON-RPC method."""

    def __init__(self, routes):
        self.routes = routes
        self.calls = []

    def __call__(self, url, body, headers):
        req = json.loads(body) if body else None
        self.calls.append((url, req))
        for match, fn in self.routes:
            if match(url, req):
                out = fn(url, req)
                if isinstance(out, tuple):
                    return out
                return 200, json.dumps(out).encode()
        return 404, b"no route"


def rpc_result(v):
    return {"jsonrpc": "2.0", "id": 1, "result": v}


def eth_routes(total_supply_override=None, storage_override=None):
    """A node that serves the recorded Ethereum proof fixture."""
    proven = int(ETH["response"]["storageProof"][0]["value"], 16)
    ts = proven if total_supply_override is None else total_supply_override
    hdr = ETH["header"]

    def handle(url, req):
        m, p = req["method"], req["params"]
        if m == "eth_getBlockByNumber":
            return rpc_result(hdr)
        if m == "eth_call":
            data = p[0]["data"]
            if data == x.SEL["symbol"]:
                return rpc_result(abi_string("USDC"))
            if data == x.SEL["name"]:
                return rpc_result(abi_string("USD Coin"))
            if data == x.SEL["decimals"]:
                return rpc_result(hex(6))
            if data == x.SEL["totalSupply"]:
                return rpc_result(hex(ts))
        if m == "eth_getStorageAt":
            slot = int(p[1], 16)
            if storage_override is not None:
                return rpc_result(hex(storage_override.get(slot, 0)))
            return rpc_result(hex(proven if slot == ETH["slot"] else 0))
        if m == "eth_getProof":
            return rpc_result(ETH["response"])
        return rpc_result(None)

    return [(lambda u, r: r is not None and "method" in r and "eth" in r["method"], handle)]


class Primitives(unittest.TestCase):
    def test_keccak_empty_vector(self):
        self.assertEqual(x.keccak256(b"").hex(), "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470")

    def test_rlp_roundtrip(self):
        v = [b"", b"\x01", b"\x80", b"x" * 60, [b"a", [b"b" * 57]]]
        self.assertEqual(x.rlp_decode(x.rlp_encode(v)), v)

    def test_rlp_rejects_trailing_bytes(self):
        with self.assertRaises(x.ProofError):
            x.rlp_decode(x.rlp_encode(b"abc") + b"\x00")

    def test_dec_str_is_exact(self):
        self.assertEqual(x.dec_str(50430781860131977, 6), "50430781860.131977")
        self.assertEqual(x.dec_str(1, 7), "0.0000001")


class EthereumProof(unittest.TestCase):
    def test_header_hash_recomputes_block_hash(self):
        self.assertEqual("0x" + x.header_hash(ETH["header"]).hex(), ETH["block_hash"].lower())

    def test_recorded_eip1186_proof_verifies(self):
        v = x.verify_eip1186(ETH["state_root"], ETH["address"], ETH["response"], ETH["slot"])
        self.assertTrue(v["account_proof_verified"], v)
        self.assertTrue(v["storage_proof_verified"], v)
        self.assertEqual(v["proven_value"], int(ETH["response"]["storageProof"][0]["value"], 16))

    def test_wrong_state_root_fails(self):
        v = x.verify_eip1186("0x" + "11" * 32, ETH["address"], ETH["response"], ETH["slot"])
        self.assertFalse(v["account_proof_verified"])
        self.assertIsNotNone(v["error"])

    def test_tampered_storage_node_fails(self):
        pr = copy.deepcopy(ETH["response"])
        node = pr["storageProof"][0]["proof"][-1]
        pr["storageProof"][0]["proof"][-1] = node[:-2] + ("00" if node[-2:] != "00" else "01")
        v = x.verify_eip1186(ETH["state_root"], ETH["address"], pr, ETH["slot"])
        self.assertTrue(v["account_proof_verified"])
        self.assertFalse(v["storage_proof_verified"])

    def test_claimed_value_that_differs_from_proof_is_caught(self):
        pr = copy.deepcopy(ETH["response"])
        pr["storageProof"][0]["value"] = hex(int(pr["storageProof"][0]["value"], 16) + 1)
        v = x.verify_eip1186(ETH["state_root"], ETH["address"], pr, ETH["slot"])
        self.assertFalse(v["storage_proof_verified"])

    def test_reader_claims_verified_on_the_fixture(self):
        c = x.Client(Fake(eth_routes()), spacing=0)
        row, blob = x.read_ethereum(c, "Ethereum", ETH["address"], max_slot=12)
        self.assertEqual(row["evidence_kind"], "STATE_PROOF_VERIFIED")
        self.assertEqual(row["slot_search"]["matching_slots"], [ETH["slot"]])
        self.assertTrue(row["height"]["header_hash_recomputed"])
        self.assertIsNotNone(blob)

    def test_eth_call_disagreeing_with_proof_falls_back_to_operator_api(self):
        proven = int(ETH["response"]["storageProof"][0]["value"], 16)
        lie = proven + 1   # eth_call and getStorageAt both say proven+1; the proof says proven
        c = x.Client(Fake(eth_routes(total_supply_override=lie, storage_override={ETH["slot"]: lie})), spacing=0)
        row, _ = x.read_ethereum(c, "Ethereum", ETH["address"], max_slot=12)
        self.assertEqual(row["evidence_kind"], "OPERATOR_API")
        self.assertTrue(any("OPERATOR_API" in n for n in row["notes"]))

    def test_no_matching_slot_means_no_proof_claim(self):
        c = x.Client(Fake(eth_routes(storage_override={})), spacing=0)
        row, blob = x.read_ethereum(c, "Ethereum", ETH["address"], max_slot=12)
        self.assertEqual(row["evidence_kind"], "OPERATOR_API")
        self.assertIsNone(blob)

    def test_wrong_symbol_is_rejected(self):
        routes = eth_routes()
        inner = routes[0][1]

        def h(url, req):
            if req["method"] == "eth_call" and req["params"][0]["data"] == x.SEL["symbol"]:
                return rpc_result(abi_string("USDC.e"))
            return inner(url, req)
        c = x.Client(Fake([(routes[0][0], h)]), spacing=0)
        row, _ = x.read_ethereum(c, "Ethereum", ETH["address"])
        self.assertEqual(row["evidence_kind"], "REJECTED")


class NobleProof(unittest.TestCase):
    KEY = bytes.fromhex(NOBLE["key_hex"])

    def test_recorded_ics23_chain_verifies_against_app_hash(self):
        v = x.verify_ics23_chain(NOBLE["proof_ops"], self.KEY, NOBLE["value"].encode(), b"bank", NOBLE["app_hash_h_plus_1"])
        self.assertTrue(v["verified"], v)

    def test_wrong_value_fails(self):
        v = x.verify_ics23_chain(NOBLE["proof_ops"], self.KEY, b"1", b"bank", NOBLE["app_hash_h_plus_1"])
        self.assertFalse(v["verified"])

    def test_wrong_app_hash_fails(self):
        v = x.verify_ics23_chain(NOBLE["proof_ops"], self.KEY, NOBLE["value"].encode(), b"bank", "AB" * 32)
        self.assertFalse(v["verified"])
        self.assertIn("app_hash", v["error"])

    def test_tampered_iavl_proof_fails(self):
        ops = copy.deepcopy(NOBLE["proof_ops"])
        raw = bytearray(base64.b64decode(ops[0]["data"]))
        raw[-1] ^= 0x01
        ops[0]["data"] = base64.b64encode(bytes(raw)).decode()
        v = x.verify_ics23_chain(ops, self.KEY, NOBLE["value"].encode(), b"bank", NOBLE["app_hash_h_plus_1"])
        self.assertFalse(v["verified"])

    def test_swapped_op_order_fails(self):
        ops = list(reversed(NOBLE["proof_ops"]))
        v = x.verify_ics23_chain(ops, self.KEY, NOBLE["value"].encode(), b"bank", NOBLE["app_hash_h_plus_1"])
        self.assertFalse(v["verified"])


class IssuerList(unittest.TestCase):
    def test_parse_mainnet_only(self):
        p = x.parse_issuer_md(ISSUER_MD)
        self.assertEqual(p["rows"]["Ethereum"]["identifier"], "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")
        self.assertEqual(p["rows"]["Hedera"]["identifier"], "0.0.456858")
        self.assertEqual(p["rows"]["Noble"]["identifier"], "uusdc")
        self.assertNotIn("Ethereum Sepolia", p["rows"])
        self.assertTrue(any("USDC.e" in n for n in p["notes"]))

    def test_issuer_list_unreachable_means_no_rows(self):
        c = x.Client(Fake([]), spacing=0)
        doc = x.build(c)
        self.assertEqual(doc["issuer_list_evidence"]["state"], "UNCHECKABLE")
        self.assertEqual(doc["rows"], [])
        self.assertEqual(sorted(doc["missing_core_ledgers_on_issuer_list"]), sorted(x.CORE))


class FailuresAndSums(unittest.TestCase):
    def test_failed_read_is_uncheckable_never_zero(self):
        c = x.Client(Fake([(lambda u, r: True, lambda u, r: (503, b"busy"))]), spacing=0)
        row = x.read_solana(c, "Solana", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")
        self.assertEqual(row["evidence_kind"], "UNCHECKABLE")
        self.assertIsNone(row["supply_base_units"])
        self.assertEqual(row["error"]["status"], 503)

    def test_solana_second_operator_at_other_slot_is_not_comparable(self):
        def h(url, req):
            if "leorpc" in url:
                return rpc_result({"context": {"slot": 11}, "value": {"amount": "999", "decimals": 6}})
            return rpc_result({"context": {"slot": 10}, "value": {"amount": "1000", "decimals": 6}})
        c = x.Client(Fake([(lambda u, r: True, h)]), spacing=0)
        row = x.read_solana(c, "Solana", "mint")
        self.assertEqual(row["evidence_kind"], "OPERATOR_API")
        self.assertEqual(row["two_operators_agree"], "NOT_COMPARABLE")

    def test_stellar_total_sums_every_component(self):
        rec = {"balances": {"authorized": "1.0000001", "authorized_to_maintain_liabilities": "2",
                            "unauthorized": "0"}, "claimable_balances_amount": "3", "liquidity_pools_amount": "4",
               "contracts_amount": "0.0000009"}
        total, parts = x.stellar_total(rec)
        self.assertEqual(format(total, "f"), "10.0000010")
        self.assertEqual(len(parts), 6)

    def test_sum_by_kind_never_mixes_and_skips_uncheckable(self):
        rows = [{"ledger": "a", "evidence_kind": "STATE_PROOF_VERIFIED", "supply_decimal": "1.5"},
                {"ledger": "b", "evidence_kind": "OPERATOR_API", "supply_decimal": "2"},
                {"ledger": "c", "evidence_kind": "OPERATOR_API", "supply_decimal": "3.25"},
                {"ledger": "d", "evidence_kind": "UNCHECKABLE", "supply_decimal": None}]
        s = x.sum_by_kind(rows)
        self.assertEqual(s["STATE_PROOF_VERIFIED"]["sum_usdc_decimal"], "1.5")
        self.assertEqual(s["OPERATOR_API"]["sum_usdc_decimal"], "5.25")
        self.assertIsNone(s["UNCHECKABLE"]["sum_usdc_decimal"])

    def test_document_labels_and_vocabulary(self):
        def route(url, req):
            if url.endswith(".md"):
                return 200, ISSUER_MD.encode()
            return 503, b"down"
        doc = x.build(x.Client(Fake([(lambda u, r: True, route)]), spacing=0))
        self.assertEqual(doc["schema"], "csoai.cross-ledger-supply/0.1")
        self.assertFalse(doc["signed"])
        self.assertTrue(doc["status"].startswith("PILOT"))
        self.assertEqual(doc["arithmetic_sum_of_mixed_evidence_reads"]["label"],
                         "arithmetic sum of mixed-evidence reads, not a measured total")
        self.assertTrue({r["evidence_kind"] for r in doc["rows"]} <= {"UNCHECKABLE"})
        self.assertIn({"circle_label": "Algorand", "identifier": "31566704",
                       "reason": "outside this pilot's scope (no reader wired); not read — not zero, not absent"},
                      doc["listed_not_read"])
        for k in ("reserves", "backing", "redeemability", "issuer solvency", "the value of anything"):
            self.assertIn(k, doc["not_evidence_of"])
        self.assertNotIn("cert" + "if", json.dumps(doc).lower())  # vocabulary guard


if __name__ == "__main__":
    unittest.main()
