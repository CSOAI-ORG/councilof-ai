"""Tests for cross_ledger_xl.py (the daily top-20% loop) — no network.

Negative controls the brief requires, each with its positive twin so a test cannot pass vacuously:
  * a forged storage proof must fail (fake node serving the real 2026-09-25 Base JPMD proof, then lying);
  * a reordered deployment list is not a change (and a real removal IS one, by name);
  * an operator-API value is never labelled STATE_PROOF_VERIFIED (EVM without proof, XRPL, Tron; plus
    the ladder check demotes a mislabelled row);
  * PARTIAL reads are never totalled.
Run: python3 -m unittest scripts/readers/test_cross_ledger_xl.py -v
"""
from __future__ import annotations

import copy
import json
import sys
import time
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1]))
from scripts.readers import cross_ledger_xl as x  # noqa: E402
from scripts.readers import cross_ledger_supply as base  # noqa: E402

FIX = HERE / "fixtures" / "cross_ledger"
REG = x.load_registry()
SLOTS = x.funds.slot_candidates(REG["evm_slot_candidates"])


def abi_str(s: str) -> str:
    b = s.encode()
    return "0x" + (32).to_bytes(32, "big").hex() + len(b).to_bytes(32, "big").hex() + b.hex().ljust(64, "0")


def u256(n: int) -> str:
    return "0x" + n.to_bytes(32, "big").hex()


class FakeEvmNode:
    """Serves one pinned Base block from the real JPMD proof fixture. `lie_supply` makes the node report
    a different totalSupply and storage value (with the honest proof nodes); `corrupt_node` flips a byte in
    the account proof; `no_proof` makes eth_getProof unavailable."""

    def __init__(self, lie_supply: int | None = None, corrupt_node: bool = False, no_proof: bool = False):
        self.b = json.loads((FIX / "base-JPMD-proof.json").read_text())
        self.true = int(self.b["response"]["storageProof"][0]["value"], 16)
        self.supply = lie_supply if lie_supply is not None else self.true
        self.corrupt, self.no_proof = corrupt_node, no_proof

    def __call__(self, url, body, headers):
        req = json.loads(body)
        self.http_calls = getattr(self, "http_calls", 0) + 1
        if isinstance(req, list):   # JSON-RPC batch: answer each call as a single call would be answered
            out = [dict(json.loads(self(url, json.dumps(r).encode(), headers)[1]), id=r["id"]) for r in req]
            self.http_calls -= len(req)
            return 200, json.dumps(out).encode()
        m, p = req["method"], req["params"]
        n = self.b["block_number"]
        if m == "eth_chainId":
            res = hex(self.b["chain_id"])
        elif m == "eth_blockNumber":
            res = hex(n + REG["ledgers"]["base"]["pin_lag"])
        elif m == "eth_getBlockByNumber":
            res = dict(self.b["header"], hash=self.b["block_hash"])
        elif m == "eth_call":
            sel = p[0]["data"]
            res = {x.base.SEL["symbol"]: abi_str("JPMD"), x.base.SEL["name"]: abi_str("JPMD"),
                   x.base.SEL["decimals"]: u256(2), x.base.SEL["totalSupply"]: u256(self.supply)}[sel]
        elif m == "eth_getStorageAt":
            res = u256(self.supply if int(p[1], 16) == int(self.b["slot"], 16) else 0)
        elif m == "eth_getProof":
            if self.no_proof:
                return 200, json.dumps({"jsonrpc": "2.0", "id": 1, "error": {"code": -32601, "message": "method not found"}}).encode()
            r = copy.deepcopy(self.b["response"])
            if self.supply != self.true:
                r["storageProof"][0]["value"] = hex(self.supply)   # the lie is in the claimed value, not the nodes
            if self.corrupt:
                node = r["accountProof"][-1]
                r["accountProof"][-1] = node[:-2] + ("00" if node[-2:] != "00" else "01")
            res = r
        elif m == "eth_getCode":
            res = "0x6080"
        else:
            raise AssertionError(m)
        return 200, json.dumps({"jsonrpc": "2.0", "id": 1, "result": res}).encode()


def read_fake(node) -> dict:
    c = base.Client(transport=node, spacing=0)
    row, _ = x.read_evm_x(c, REG["ledgers"]["base"], SLOTS, "base", "JPMD", "Base", FakeEvmNode().b["address"])
    return row


class ForgedProof(unittest.TestCase):
    def test_honest_node_verifies(self):   # positive twin
        row = read_fake(FakeEvmNode())
        self.assertEqual(row["evidence_kind"], "STATE_PROOF_VERIFIED", row["notes"])
        self.assertEqual(x.ladder_violations([row]), [])

    def test_forged_supply_with_honest_nodes_fails(self):
        node = FakeEvmNode(lie_supply=FakeEvmNode().true + 1)
        row = read_fake(node)
        self.assertNotEqual(row["evidence_kind"], "STATE_PROOF_VERIFIED")
        self.assertEqual(row["evidence_kind"], "STATE_PROOF_RECORDED")
        self.assertNotEqual(row["proof"]["proven_value"], node.supply)

    def test_corrupted_proof_node_fails(self):
        row = read_fake(FakeEvmNode(corrupt_node=True))
        self.assertNotEqual(row["evidence_kind"], "STATE_PROOF_VERIFIED")
        self.assertFalse(row["proof"]["account_proof_verified"])

    def test_direct_verifier_rejects_forged_leaf(self):
        b = json.loads((FIX / "base-JPMD-proof.json").read_text())
        r = copy.deepcopy(b["response"])
        leaf = r["storageProof"][0]["proof"][-1]
        r["storageProof"][0]["proof"][-1] = leaf[:-2] + ("00" if leaf[-2:] != "00" else "01")
        v = base.verify_eip1186(b["state_root"], b["address"], r, int(b["slot"], 16))
        self.assertFalse(v["account_proof_verified"] and v["storage_proof_verified"] and v["proven_value"] == 100100000)


class BatchedSlotSweep(unittest.TestCase):
    def _read(self, node):
        c = x.new_client(SLOTS)
        c.t = node
        row, _ = x.read_evm_x(c, REG["ledgers"]["base"], SLOTS, "base", "JPMD", "Base", node.b["address"])
        return row

    def test_batch_gives_same_verdicts_in_few_requests(self):
        honest = FakeEvmNode()
        row = self._read(honest)
        self.assertEqual(row["evidence_kind"], "STATE_PROOF_VERIFIED", row["notes"])
        self.assertLess(honest.http_calls, 40)   # the 70-slot sweep is 2 batches (discovery + reading block), not 140 calls
        forged = FakeEvmNode(lie_supply=FakeEvmNode().true + 1)
        self.assertNotEqual(self._read(forged)["evidence_kind"], "STATE_PROOF_VERIFIED")


class OperatorApiNeverVerified(unittest.TestCase):
    def test_evm_without_proof_is_operator_api(self):
        row = read_fake(FakeEvmNode(no_proof=True))
        self.assertEqual(row["evidence_kind"], "OPERATOR_API")

    def test_xrpl_is_operator_api(self):
        def t(url, body, headers):
            return 200, json.dumps({"result": {"status": "success", "ledger_index": 100, "ledger_hash": "AB" * 32,
                                               "obligations": {"524C555344000000000000000000000000000000": "123.45"}}}).encode()
        c = base.Client(transport=t, spacing=0)
        row = x.read_xrpl_x(c, REG["ledgers"]["xrpl"], "RLUSD", "XRPL", "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De")
        self.assertEqual(row["evidence_kind"], "OPERATOR_API")
        self.assertEqual(row["supply_decimal"], "123.45")
        self.assertEqual(row["two_operators_agree"], "true")

    def test_tron_is_operator_api(self):
        def t(url, body, headers):
            j = json.loads(body)
            if url.endswith("/wallet/getblock"):
                return 200, json.dumps({"blockID": "00" * 32, "block_header": {"raw_data": {"number": 7}}}).encode()
            out = {"symbol()": abi_str("USDT")[2:], "decimals()": u256(6)[2:], "totalSupply()": u256(10 ** 12)[2:]}[j["function_selector"]]
            return 200, json.dumps({"result": {"result": True}, "constant_result": [out]}).encode()
        c = base.Client(transport=t, spacing=0)
        row = x.read_tron(c, REG["ledgers"]["tron"], "USDT", "Tron", "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t")
        self.assertEqual(row["evidence_kind"], "OPERATOR_API")
        self.assertEqual(float(row["supply_decimal"]), 1000000.0)

    def test_ladder_check_demotes_mislabelled_row(self):
        rows = [{"ledger": "tron", "product": "USDT", "deployment_id": "T", "evidence_kind": "STATE_PROOF_VERIFIED",
                 "supply_base_units": "5", "proof": None, "notes": []}]
        self.assertEqual(len(x.ladder_violations(rows)), 1)
        x.enforce_ladder(rows)
        self.assertEqual(rows[0]["evidence_kind"], "OPERATOR_API")


def dep(asset, ledger, ident, supply, kind="OPERATOR_API"):
    return {"asset_key": asset, "product": asset.upper(), "ledger": ledger, "deployment_id": ident,
            "evidence_kind": kind, "supply_decimal": supply}


def day(deps, syms, parity=None):
    return {"date": "d", "deployments": deps, "selection": {"selected": [{"symbol": s} for s in syms]},
            "assets": {k: {"parity_state": v} for k, v in (parity or {}).items()}}


class ReorderIsNotChange(unittest.TestCase):
    D = [dep("usdt", "ethereum", "0xAA", "100"), dep("usdt", "tron", "T1", "50"), dep("usdc", "base", "0xBB", "7")]

    def test_reordered_is_no_change(self):
        a = day(self.D, ["USDT", "USDC"])
        b = day(list(reversed(copy.deepcopy(self.D))), ["USDC", "USDT"])
        ch = x.changes(a, b, 0.01)
        self.assertEqual(ch["membership"], {"deployments_added": [], "deployments_removed": [],
                                            "selection_entered": [], "selection_left": []})
        self.assertEqual(ch["supply_deltas_over_threshold"]["items"], [])
        self.assertEqual(ch["evidence_kind_changes"], [])

    def test_case_of_address_is_not_change(self):
        b = copy.deepcopy(self.D)
        b[0]["deployment_id"] = "0xaa"
        self.assertEqual(x.changes(day(self.D, []), day(b, []), 0.01)["membership"]["deployments_added"], [])

    def test_removal_is_named(self):   # positive twin
        ch = x.changes(day(self.D, ["USDT"]), day(self.D[:2], ["USDT", "RLUSD"]), 0.01)
        self.assertEqual(ch["membership"]["deployments_removed"], ["usdc|USDC|base|0xbb"])
        self.assertEqual(ch["membership"]["selection_entered"], ["RLUSD"])

    def test_delta_threshold_separate_from_membership(self):
        b = copy.deepcopy(self.D)
        b[0]["supply_decimal"] = "100.5"   # +0.5% under threshold
        b[1]["supply_decimal"] = "60"      # +20% over
        ch = x.changes(day(self.D, []), day(b, []), 0.01)
        self.assertEqual([d["deployment"] for d in ch["supply_deltas_over_threshold"]["items"]], ["usdt|USDT|tron|t1"])
        self.assertEqual(ch["membership"]["deployments_added"], [])

    def test_duplicate_is_counted_as_multiset(self):
        b = self.D + [copy.deepcopy(self.D[0])]
        self.assertEqual(x.changes(day(self.D, []), day(b, []), 0.01)["membership"]["deployments_added"], ["usdt|USDT|ethereum|0xaa"])


class PartialNeverTotalled(unittest.TestCase):
    def r(self, ledger, kind, sup):
        return {"product": "USDY", "ledger": ledger, "evidence_kind": kind, "supply_decimal": sup}

    def test_unreadable_row_makes_partial(self):
        t = x.product_totals([self.r("ethereum", "STATE_PROOF_VERIFIED", "10"), self.r("sui", "UNCHECKABLE", None)], [])
        self.assertEqual(t["USDY"]["total_state"], "PARTIAL")
        self.assertIsNone(t["USDY"]["sum_by_evidence_kind"])

    def test_listed_not_read_makes_partial(self):
        t = x.product_totals([self.r("ethereum", "OPERATOR_API", "10")], [{"product": "USDY", "label": "Tempo"}])
        self.assertEqual(t["USDY"]["total_state"], "PARTIAL")
        self.assertIsNone(t["USDY"]["sum_by_evidence_kind"])

    def test_rejected_row_makes_partial(self):
        t = x.product_totals([self.r("ethereum", "OPERATOR_API", "10"), self.r("bsc", "REJECTED", "3")], [])
        self.assertEqual(t["USDY"]["total_state"], "PARTIAL")

    def test_complete_sums_per_kind_only(self):   # positive twin
        t = x.product_totals([self.r("ethereum", "STATE_PROOF_VERIFIED", "10"), self.r("bsc", "OPERATOR_API", "2.5"),
                              self.r("arbitrum", "OPERATOR_API", "1")], [])
        self.assertEqual(t["USDY"]["total_state"], "COMPLETE")
        self.assertEqual(t["USDY"]["sum_by_evidence_kind"], {"STATE_PROOF_VERIFIED": "10", "OPERATOR_API": "3.5"})


class Selection(unittest.TestCase):
    def test_quintile_and_owner_named(self):
        c = [{"symbol": f"S{i}", "name": f"S{i}", "source_id": str(i), "value_usd": 1000 - i, "value_source": "a"} for i in range(11)]
        c.append({"symbol": "BENJI", "name": "Franklin", "source_id": "b", "value_usd": 1, "value_source": "a"})
        sel = x.select(c, REG)
        self.assertEqual(sel["k"], 3)   # ceil(0.2 * 12)
        self.assertEqual([s["symbol"] for s in sel["selected"] if s["why"] == "top_quintile"], ["S0", "S1", "S2"])
        owner = {s["symbol"]: s for s in sel["selected"] if s["why"] == "owner_named"}
        self.assertIn("BENJI", owner)
        self.assertIsNone(owner["JPMD"]["value_usd_for_selection"])   # no value invented

    def test_zero_or_missing_value_not_ranked(self):
        c = [{"symbol": "A", "name": "A", "source_id": "1", "value_usd": None, "value_source": "a"},
             {"symbol": "B", "name": "B", "source_id": "2", "value_usd": 0, "value_source": "a"}]
        self.assertEqual(x.select(c, REG)["frame_n"], 0)


class Parsers(unittest.TestCase):
    def test_md_table_mainnet_only(self):
        md = ("## Mainnet\n| Blockchain | Addr |\n| :-- | :-- |\n| Ethereum | [`0xAB`](u) |\n"
              "## Testnet\n| Ethereum Sepolia | [`0xCD`](u) |\n")
        rows = x.parse_md_table(md, {"section": "Mainnet", "label_col": 0, "id_col": 1, "product": "USDC"})
        self.assertEqual([(r["label"], r["identifier"]) for r in rows], [("Ethereum", "0xAB")])

    def test_tether_sections_live_and_deprecated(self):
        il = REG["assets"]["usdt"]["issuer_list"]
        lines = ["ERC20 Token via Ethereum, Avalanche, Cosmos, Celo and Kaia Blockchain", "Ethereum Network",
                 "USD₮ contract address:", "https://etherscan.io/token/0xdac17f958d2ee523a2206206994597c13d831ec7",
                 "TRC20 Token via Tron Blockchain", "USD₮ contract address:", "https://tronscan.org/#/token20/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
                 "Deprecated Asset Protocols:", "ERC20 Token via Ethereum Blockchain", "EUR₮ contract address:",
                 "https://etherscan.io/token/0xC581b735A1688071A1746c968e0798D642EDE491"]
        live, depr = x.parse_tether_sections(lines, il)
        self.assertEqual([(r["label"], r["identifier"]) for r in live],
                         [("Ethereum", "0xdac17f958d2ee523a2206206994597c13d831ec7"), ("Tron", "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t")])
        self.assertEqual([(r["product"], r["label"], r["issuer_says"]) for r in depr], [("EURT", "Ethereum", "deprecated")])


class Politeness(unittest.TestCase):
    def test_one_request_per_host_per_interval(self):
        lim = x.HostLimiter(0.3)
        t0 = time.monotonic()
        lim.wait("https://a.example/x")
        lim.wait("https://b.example/x")          # other host: no wait
        t1 = time.monotonic()
        lim.wait("https://a.example/y")          # same host: waits
        t2 = time.monotonic()
        self.assertLess(t1 - t0, 0.1)
        self.assertGreaterEqual(t2 - t0, 0.29)


class OperatorBudget(unittest.TestCase):
    def test_same_operator_different_chains_share_a_budget(self):
        self.assertEqual(x.HostLimiter.key("https://eth.drpc.org"), x.HostLimiter.key("https://base.drpc.org/"))
        self.assertNotEqual(x.HostLimiter.key("https://eth.drpc.org"), x.HostLimiter.key("https://rpc.mevblocker.io"))

    def test_failed_operator_hands_over_to_next(self):
        calls = {"n": 0}
        honest = FakeEvmNode()

        def t(url, body, headers):
            if "publicnode" in url:
                calls["n"] += 1
                return 429, b'{"error":"rate limit"}'
            return honest(url, body, headers)
        c = base.Client(transport=t, spacing=0)
        lc = dict(REG["ledgers"]["base"], rpc=[["https://base-rpc.publicnode.com", "PublicNode"], ["https://mainnet.base.org", "Coinbase"]])
        row, _ = x.read_evm_x(c, lc, SLOTS, "base", "JPMD", "Base", honest.b["address"])
        self.assertNotEqual(row["evidence_kind"], "UNCHECKABLE")


class TamperControls(unittest.TestCase):
    def test_three_controls_reject(self):
        from cryptography.hazmat.primitives.asymmetric import ed25519
        k = ed25519.Ed25519PrivateKey.generate()
        art = "ab" * 32
        c = x.canon({"artifact": {"sha256": art}, "n": 1})
        sig = k.sign(c).hex()
        ctl = x.tamper_controls(k.public_key(), sig, c, art)
        self.assertEqual(len(ctl), 3)
        self.assertTrue(all(v == "rejected (control holds)" for v in ctl.values()), ctl)
        k.public_key().verify(bytes.fromhex(sig), c)   # positive twin: the genuine one verifies


if __name__ == "__main__":
    unittest.main()
