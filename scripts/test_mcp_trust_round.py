#!/usr/bin/env python3
"""Stdlib tests for the MCP Trust Board round script (scripts/mcp-trust-round.py).

Network-free: classify() purity, SSE parsing, counts derivation, the
host-leak guard, and the unsigned-card writer (signature must stay null;
body must carry counts only).
"""
from __future__ import annotations

import importlib.util
import json
import os
import tempfile
import unittest
from pathlib import Path

_HERE = os.path.dirname(os.path.abspath(__file__))
_SPEC = importlib.util.spec_from_file_location(
    "mcp_trust_round", os.path.join(_HERE, "mcp-trust-round.py")
)
mtr = importlib.util.module_from_spec(_SPEC)
assert _SPEC.loader is not None
_SPEC.loader.exec_module(mtr)


class Classify(unittest.TestCase):
    def test_unreachable_is_never_fail(self):
        for err in ("TimeoutError", "URLError", "ConnectionResetError"):
            bucket, detail = mtr.classify(-1, {}, None, err)
            self.assertEqual(bucket, "dead_404_or_unreachable")
            self.assertEqual(detail["error_type"], err)

    def test_auth_challenge_is_a_term_sheet(self):
        bucket, detail = mtr.classify(401, {"WWW-Authenticate": 'Bearer realm="mcp"'}, None, None)
        self.assertEqual(bucket, "auth_challenged_401_403")
        self.assertEqual(detail["auth_scheme_family"], "bearer_or_oauth")
        bucket, detail = mtr.classify(403, {}, None, None)
        self.assertEqual(bucket, "auth_challenged_401_403")
        self.assertEqual(detail["auth_scheme_family"], "challenge_no_scheme_header")

    def test_402_is_distinct(self):
        bucket, _ = mtr.classify(402, {}, None, None)
        self.assertEqual(bucket, "x402_challenged_402")

    def test_valid_initialize(self):
        reply = {"jsonrpc": "2.0", "id": 1, "result": {"serverInfo": {"name": "x"}, "capabilities": {}}}
        bucket, _ = mtr.classify(200, {}, reply, None)
        self.assertEqual(bucket, "initialize_ok")

    def test_200_without_mcp_reply_is_alive_not_mcp(self):
        bucket, _ = mtr.classify(200, {}, None, None)
        self.assertEqual(bucket, "alive_not_mcp")

    def test_rate_limit_is_other_error_never_retried(self):
        bucket, detail = mtr.classify(429, {}, None, None)
        self.assertEqual(bucket, "other_error")
        self.assertTrue(detail["rate_limited"])


class Parsing(unittest.TestCase):
    def test_sse_data_line(self):
        sse = 'event: message\ndata: {"jsonrpc":"2.0","id":1,"result":{"serverInfo":{}}}\n\n'
        self.assertEqual(mtr._parse_jsonrpc(sse)["result"]["serverInfo"], {})

    def test_html_is_not_a_reply(self):
        self.assertIsNone(mtr._parse_jsonrpc("<html>nope</html>"))
        self.assertIsNone(mtr._parse_jsonrpc(""))


class Counts(unittest.TestCase):
    ROWS = [
        {"host": "a.example", "bucket": "initialize_ok_tools_listed", "tool_count": 7},
        {"host": "b.example", "bucket": "initialize_ok_tools_listed", "tool_count": 3},
        {"host": "c.example", "bucket": "auth_challenged_401_403", "auth_scheme_family": "bearer_or_oauth"},
        {"host": "d.example", "bucket": "dead_404_or_unreachable", "error_type": "URLError"},
    ]
    ENUM = {"unique_hosts": 4, "registry_rows_seen": 10}

    def test_derived_never_typed(self):
        counts = mtr.derive_counts(self.ROWS, self.ENUM)
        self.assertEqual(counts["total"], 4)
        self.assertEqual(counts["initialize_ok_tools_listed"], 2)
        self.assertEqual(counts["tools_listed_total"], 10)
        self.assertEqual(counts["tools_median_per_answering_server"], 5)
        self.assertEqual(counts["auth_scheme_bearer_or_oauth"], 1)

    def test_host_leak_refuses_publish(self):
        blob = json.dumps(mtr.derive_counts(self.ROWS, self.ENUM))
        self.assertNotIn("a.example", blob)
        self.assertFalse(mtr.counts_have_no_hosts({"leak": "https://a.example"}))
        with self.assertRaises(RuntimeError):
            mtr.derive_counts(self.ROWS + [{"host": "e.example", "bucket": "other_error"}],
                              {"unique_hosts": 4, "registry_rows_seen": 10})


class UnsignedCard(unittest.TestCase):
    def test_signature_stays_null_and_counts_only(self):
        with tempfile.TemporaryDirectory() as td:
            snap = {
                "as_of": "2026-09-11T00:00:00Z",
                "population": "mcp-internet-facing",
                "counts": mtr.derive_counts(Counts.ROWS, Counts.ENUM),
            }
            path = mtr.write_unsigned_card(snap, Path(td))
            card = json.loads(path.read_text())
            self.assertIsNone(card["signature"])
            self.assertEqual(card["alg"], "Ed25519")
            self.assertEqual(card["did_intended"], "did:web:csoai.org#card-attestation-1")
            self.assertEqual(card["body"]["status"], "UNMEASURED")
            self.assertFalse(card["body"]["writes_board"])
            self.assertEqual(card["id"], __import__("hashlib").sha256(
                json.dumps(card["body"], sort_keys=True, separators=(",", ":")).encode()
            ).hexdigest())
            self.assertNotIn("a.example", json.dumps(card))


if __name__ == "__main__":
    unittest.main()
