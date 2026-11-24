#!/usr/bin/env python3
"""Offline regression for sparse ERC-8004/A2A discovery.

The real 8004scan source returned a 100-item page with 0 HTTP agent URIs on
2026-11-23. Before this change, discover_a2a() paged until it found N URI
matches, never bounded the source and hung the scheduled feed for 180s.

No network, credentials, signed records or queue files are touched here.
"""
from __future__ import annotations

import io
import json
import sys
import unittest
from contextlib import redirect_stderr
from pathlib import Path
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))
import discover


def page(rows: list[dict], has_more: bool = True):
    return (200, json.dumps({"items": rows, "has_more": has_more}).encode("utf-8"))


class BoundedA2ADiscovery(unittest.TestCase):
    def test_sparse_full_pages_stop_at_declared_budget(self):
        calls = []
        fake_rows = [{"agent_id": f"a{i}", "agent_uri": None} for i in range(100)]

        def fetch(url, timeout):
            calls.append((url, timeout))
            return page(fake_rows)

        with patch.object(discover.c, "http_get", side_effect=fetch), redirect_stderr(io.StringIO()) as output:
            found = discover.discover_a2a(10)

        self.assertEqual(found, [])
        self.assertEqual(len(calls), discover.A2A_SCAN_PAGES)
        self.assertEqual(
            [parse_qs(urlparse(url).query)["offset"][0] for url, _ in calls],
            ["0", "100", "200"],
        )
        self.assertTrue(all(timeout == discover.A2A_HTTP_TIMEOUT for _, timeout in calls))
        self.assertIn("INCOMPLETE", output.getvalue())
        self.assertIn("found 0/10", output.getvalue())

    def test_http_uri_is_discovered_without_scanning_earlier_history(self):
        calls = []
        rows = [{"agent_id": "a1", "agent_uri": "https://example.test/agent-card.json", "chain_id": 1}]
        rows.extend({"agent_id": f"missing-{i}", "agent_uri": None} for i in range(99))

        def fetch(url, timeout):
            calls.append(url)
            return page(rows)

        with patch.object(discover.c, "http_get", side_effect=fetch), redirect_stderr(io.StringIO()) as output:
            found = discover.discover_a2a(1)

        self.assertEqual(len(calls), 1)
        self.assertEqual(len(found), 1)
        self.assertEqual(found[0]["kind"], "a2a-agent")
        self.assertEqual(found[0]["status"], "DISCOVERED")
        self.assertEqual(found[0]["meta"]["card_url"], "https://example.test/agent-card.json")
        self.assertNotIn("INCOMPLETE", output.getvalue())

    def test_source_has_more_false_is_a_real_end_not_budget_exhaustion(self):
        calls = []

        def fetch(url, timeout):
            calls.append(url)
            return page([{"agent_id": f"a{i}"} for i in range(100)], has_more=False)

        with patch.object(discover.c, "http_get", side_effect=fetch), redirect_stderr(io.StringIO()) as output:
            found = discover.discover_a2a(10)

        self.assertEqual(found, [])
        self.assertEqual(len(calls), 1)
        self.assertNotIn("INCOMPLETE", output.getvalue())

    def test_unreachable_preserves_empty_honest_result(self):
        with patch.object(discover.c, "http_get", return_value=(-1, None)) as fetch, redirect_stderr(io.StringIO()) as output:
            found = discover.discover_a2a(10)

        self.assertEqual(found, [])
        self.assertEqual(fetch.call_count, 1)
        self.assertIn("UNREACHABLE", output.getvalue())
        self.assertNotIn("INCOMPLETE", output.getvalue())

    def test_schema_mismatch_is_uncheckable_and_terminates(self):
        with patch.object(discover.c, "http_get", return_value=(200, b'{"items":{}}')) as fetch, redirect_stderr(io.StringIO()) as output:
            found = discover.discover_a2a(10)

        self.assertEqual(found, [])
        self.assertEqual(fetch.call_count, 1)
        self.assertIn("UNCHECKABLE", output.getvalue())


if __name__ == "__main__":
    unittest.main()
