#!/usr/bin/env python3
"""Stdlib tests for the catalog-trust financial wing (v2 append)."""
from __future__ import annotations

import importlib.util
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

_HERE = os.path.dirname(os.path.abspath(__file__))
_SPEC = importlib.util.spec_from_file_location(
    "catalog_trust_round_v2", os.path.join(_HERE, "catalog-trust-round-v2.py")
)
ctr = importlib.util.module_from_spec(_SPEC)
assert _SPEC.loader is not None
_SPEC.loader.exec_module(ctr)


class CountsDoctrine(unittest.TestCase):
    def test_counts_reject_urls_and_host_strings(self):
        self.assertTrue(ctr.counts_have_no_hosts({"probed": 3, "ok": 2, "unreachable": 1, "axes": 8}))
        self.assertFalse(ctr.counts_have_no_hosts({"note": "https://evil.example/x"}))
        self.assertFalse(ctr.counts_have_no_hosts({"host": "example.com"}))

    def test_financial_round_counts_only_and_cap(self):
        def fake_fetch(url, timeout=14):
            if "xrpl" in url:
                return 200, "", ""
            if "tesla" in url:
                return 403, "", ""
            return 200, "", ""

        with mock.patch.object(ctr, "fetch", side_effect=fake_fetch):
            rnd = ctr.financial_round()
        self.assertEqual(rnd["source"], "financial-facts")
        self.assertLessEqual(rnd["counts"]["probed"], 100)
        self.assertEqual(rnd["counts"]["axes"], 8)
        self.assertTrue(ctr.counts_have_no_hosts(rnd["counts"]))
        self.assertEqual(rnd["counts"]["probed"], rnd["counts"]["ok"] + rnd["counts"]["unreachable"])

    def test_append_writes_dated_and_latest(self):
        with tempfile.TemporaryDirectory() as td:
            existing = {
                "kind": "csoai.x402-catalog-trust-snapshot/0.2",
                "as_of": "2026-09-07T11:18:20Z",
                "rounds": [{"source": "payai", "counts": {"challenge_402": 61, "total": 100}}],
                "doctrine": "Counts only.",
            }
            Path(td, "latest.json").write_text(json.dumps(existing))
            with mock.patch.object(ctr, "fetch", return_value=(200, "", "")):
                with mock.patch("sys.argv", ["catalog-trust-round-v2.py", "--append-financial", "--out-dir", td]):
                    rc = ctr.main()
            self.assertEqual(rc, 0)
            latest = json.loads(Path(td, "latest.json").read_text())
            sources = [r.get("source") for r in latest["rounds"]]
            self.assertIn("payai", sources)
            self.assertIn("financial-facts", sources)
            fin = next(r for r in latest["rounds"] if r["source"] == "financial-facts")
            self.assertTrue(ctr.counts_have_no_hosts(fin["counts"]))
            dated = list(Path(td).glob("v2-*.json"))
            self.assertTrue(dated)


if __name__ == "__main__":
    unittest.main()
