#!/usr/bin/env python3
"""Offline fail-closed tests for erc8004_census.py."""
from __future__ import annotations

import unittest
from unittest.mock import patch

import erc8004_census as census

TOPIC = "ab" * 32
HASH_A = "0x" + "11" * 32
HASH_B = "0x" + "22" * 32


def chain(rpcs=("a", "b"), chain_id=8453):
    return {"chain": "test", "chain_id": chain_id, "rpcs": list(rpcs),
            "floor_block": 10, "baseline": 0}


def handler(config):
    def call(rpc, method, params, timeout=60):
        endpoint = config[rpc]
        if method in endpoint.get("raise", set()):
            raise RuntimeError(f"{rpc} refused {method}")
        if method == "eth_chainId":
            return hex(endpoint.get("chain_id", 8453))
        if method == "eth_getBlockByNumber":
            tag = params[0]
            if tag == "finalized" and endpoint.get("no_finalized"):
                raise RuntimeError("finalized unsupported")
            if tag == "safe" and endpoint.get("no_safe"):
                raise RuntimeError("safe unsupported")
            return {"number": "0xa", "hash": endpoint.get("hash", HASH_A)}
        if method == "eth_getCode":
            return "0x6000" if endpoint.get("code", True) else "0x"
        if method == "eth_getLogs":
            if endpoint.get("logs_error"):
                raise RuntimeError("getLogs unavailable")
            return endpoint.get("logs", [])
        raise AssertionError(method)
    return call


class CensusSecurityTests(unittest.TestCase):
    def run_row(self, config, **kwargs):
        with patch.object(census, "rpc_call", side_effect=handler(config)):
            return census.census_chain(chain(tuple(config)), TOPIC, "2026-09-12T00:00:00Z",
                                       delay=0, **kwargs)

    def test_wrong_chain_endpoint_is_rejected_and_fallback_scans(self):
        row = self.run_row({"a": {"chain_id": 1}, "b": {"chain_id": 8453}})
        self.assertEqual(row["status"], "MEASURED")
        self.assertEqual(row["to_block_hash"], HASH_A)
        self.assertEqual(row["rpc_segments"][0]["rpc"], "b")

    def test_absence_requires_every_fallback_to_succeed(self):
        row = self.run_row({"a": {"code": False}, "b": {"code": False}})
        self.assertEqual(row["status"], "NO_DEPLOYMENT_FOUND")
        mixed = self.run_row({"a": {"code": False}, "b": {"raise": {"eth_chainId"}}})
        self.assertEqual(mixed["status"], "UNCHECKABLE")

    def test_safe_tag_is_used_without_latest_fallback(self):
        row = self.run_row({"a": {"no_finalized": True}, "b": {"chain_id": 1}})
        self.assertEqual(row["status"], "MEASURED")
        self.assertEqual(row["finality_tag"], "safe")

    def test_no_finality_tag_is_uncheckable(self):
        row = self.run_row({
            "a": {"no_finalized": True, "no_safe": True},
            "b": {"no_finalized": True, "no_safe": True},
        })
        self.assertEqual(row["status"], "UNCHECKABLE")

    def test_fallback_must_reproduce_pinned_block_hash(self):
        row = self.run_row({
            "a": {"hash": HASH_A, "logs_error": True},
            "b": {"hash": HASH_B},
        })
        self.assertEqual(row["status"], "UNCHECKABLE")
        self.assertIn("pinned", row["reason"])

    def test_malformed_log_never_counts(self):
        row = self.run_row({
            "a": {"logs": [{"address": census.IDENTITY_REGISTRY,
                              "topics": ["0x" + TOPIC], "blockNumber": "0xb"}]},
            "b": {"chain_id": 1},
        })
        self.assertEqual(row["status"], "UNCHECKABLE")
        self.assertIsNone(row["registrations"])


if __name__ == "__main__":
    unittest.main()
