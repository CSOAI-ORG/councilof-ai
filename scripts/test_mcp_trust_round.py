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


class RoundDiff(unittest.TestCase):
    SNAP_COUNTS = {"total": 4, "initialize_ok_tools_listed": 2, "auth_challenged_401_403": 1,
                   "dead_404_or_unreachable": 1}

    def _snap(self, as_of, counts=None, partial=False):
        return {"as_of": as_of, "population": "mcp-internet-facing",
                "counts": counts or dict(self.SNAP_COUNTS), "partial": partial}

    def test_first_round_writes_no_diff(self):
        with tempfile.TemporaryDirectory() as td:
            self.assertIsNone(mtr.write_diff(self._snap("2026-09-11T00:00:00Z"), Path(td), "2026-09-11"))

    def test_second_round_derives_bucket_deltas(self):
        with tempfile.TemporaryDirectory() as td:
            out = Path(td)
            prev = self._snap("2026-09-04T00:00:00Z")
            (out / "2026-09-04.json").write_text(json.dumps(prev))
            cur_counts = dict(self.SNAP_COUNTS, total=6, initialize_ok_tools_listed=4)
            name = mtr.write_diff(self._snap("2026-09-11T00:00:00Z", counts=cur_counts), out, "2026-09-11")
            diff = json.loads((out / name).read_text())
            self.assertEqual(diff["state"], "MEASURED")
            self.assertEqual(diff["bucket_deltas"]["total"], 2)
            self.assertEqual(diff["bucket_deltas"]["initialize_ok_tools_listed"], 2)
            self.assertEqual(diff["bucket_deltas"]["auth_challenged_401_403"], 0)
            self.assertIn("UNCHECKABLE", diff["hosts_added"])  # rows never published
            self.assertNotIn("note", diff)

    def test_unreadable_previous_is_uncheckable_never_rebased(self):
        with tempfile.TemporaryDirectory() as td:
            out = Path(td)
            (out / "2026-09-04.json").write_text("{corrupt")
            name = mtr.write_diff(self._snap("2026-09-11T00:00:00Z"), out, "2026-09-11")
            diff = json.loads((out / name).read_text())
            self.assertEqual(diff["state"], "UNCHECKABLE")
            self.assertIn("never silently rebased", diff["reason"])

    def test_partial_previous_suppresses_population_claims(self):
        with tempfile.TemporaryDirectory() as td:
            out = Path(td)
            (out / "2026-09-04.json").write_text(json.dumps(self._snap("2026-09-04T00:00:00Z", partial=True)))
            name = mtr.write_diff(self._snap("2026-09-11T00:00:00Z"), out, "2026-09-11")
            diff = json.loads((out / name).read_text())
            self.assertIn("PARTIAL", diff["note"])

    def test_cap_change_is_disclosed_never_silent(self):
        with tempfile.TemporaryDirectory() as td:
            out = Path(td)
            prev = self._snap("2026-09-04T00:00:00Z")
            prev["enumeration"] = {"cap": 500}
            (out / "2026-09-04.json").write_text(json.dumps(prev))
            cur = self._snap("2026-09-11T00:00:00Z")
            cur["enumeration"] = {"cap": 20}
            name = mtr.write_diff(cur, out, "2026-09-11")
            diff = json.loads((out / name).read_text())
            self.assertIn("cap changed (500 -> 20)", diff["note"])

    def test_same_cap_pair_carries_no_note(self):
        with tempfile.TemporaryDirectory() as td:
            out = Path(td)
            prev = self._snap("2026-09-04T00:00:00Z")
            prev["enumeration"] = {"cap": 500}
            (out / "2026-09-04.json").write_text(json.dumps(prev))
            cur = self._snap("2026-09-11T00:00:00Z")
            cur["enumeration"] = {"cap": 500}
            name = mtr.write_diff(cur, out, "2026-09-11")
            diff = json.loads((out / name).read_text())
            self.assertNotIn("note", diff)


if __name__ == "__main__":
    unittest.main()
