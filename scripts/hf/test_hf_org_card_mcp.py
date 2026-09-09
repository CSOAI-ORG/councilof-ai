#!/usr/bin/env python3
"""Offline request/response contract for the HF card's measured MCP tool count.

Run: python3 -B scripts/hf/test_hf_org_card_mcp.py
No HF client, credentials, upload, subprocess, or external HTTP is used.
"""
from __future__ import annotations

import importlib.util
import io
import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError


SCRIPT = Path(__file__).with_name("hf-org-card.py")
spec = importlib.util.spec_from_file_location("hf_org_card_mcp_test_subject", SCRIPT)
assert spec and spec.loader
subject = importlib.util.module_from_spec(spec)
saved_path = sys.path[:]
try:
    spec.loader.exec_module(subject)
finally:
    sys.path[:] = saved_path


def reply(tools: list[dict] | None = None, **result_fields: object) -> dict:
    return {"jsonrpc": "2.0", "id": 1, "result": {
        "resultType": "complete", "ttlMs": 300_000, "cacheScope": "public",
        "tools": tools if tools is not None else [{"name": "fixture_tool"}],
        **result_fields,
    }}


class ToolCountContract(unittest.TestCase):
    def setUp(self) -> None:
        self.http = patch.object(subject.urllib.request, "urlopen").start()
        self.upload = patch.object(subject, "hf_upload", side_effect=AssertionError("upload forbidden")).start()
        self.download = patch.object(subject, "hf_download", side_effect=AssertionError("HF access forbidden")).start()
        self.addCleanup(patch.stopall)

    def response(self, value: object) -> tuple[int | None, str]:
        self.http.return_value = io.BytesIO(json.dumps(value).encode())
        return subject.mcp_tool_count()

    def test_modern_headers_and_metadata_match_one_read_only_request(self) -> None:
        self.assertEqual(self.response(reply()), (1, ""))
        self.http.assert_called_once()
        args, kwargs = self.http.call_args
        request = args[0]
        self.assertEqual(request.full_url, "https://councilof.ai/mcp")
        self.assertEqual(request.get_method(), "POST")
        self.assertEqual(kwargs, {"timeout": 30})
        headers = {key.lower(): value for key, value in request.header_items()}
        self.assertEqual(headers["mcp-protocol-version"], "2026-07-28")
        self.assertEqual(headers["mcp-method"], "tools/list")
        self.assertEqual(headers["content-type"], "application/json")
        self.assertEqual(headers["accept"], "application/json, text/event-stream")
        self.assertNotIn("authorization", headers)
        self.assertNotIn("x-payment", headers)
        self.assertNotIn("mcp-name", headers)
        self.assertEqual(json.loads(request.data), {
            "jsonrpc": "2.0", "id": 1, "method": "tools/list",
            "params": {"_meta": {
                "io.modelcontextprotocol/protocolVersion": "2026-07-28",
                "io.modelcontextprotocol/clientCapabilities": {},
            }},
        })
        self.upload.assert_not_called()
        self.download.assert_not_called()

    def test_count_is_derived_and_empty_is_distinct_from_unreachable(self) -> None:
        for count in (0, 3, 17):
            with self.subTest(count=count):
                tools = [{"name": f"fixture_{i}"} for i in range(count)]
                self.assertEqual(self.response(reply(tools)), (count, ""))

    def test_missing_wrong_or_boolean_id_and_rpc_errors_never_become_counts(self) -> None:
        cases = [None, [], {"result": {"tools": []}},
                 {**reply(), "id": 2}, {**reply(), "id": True},
                 {**reply(), "jsonrpc": "1.0"},
                 {**reply(), "error": {"code": -32020, "message": "mismatch"}}]
        for value in cases:
            with self.subTest(value=value):
                count, reason = self.response(value)
                self.assertIsNone(count)
                self.assertTrue(reason)

    def test_incomplete_or_malformed_results_never_become_counts(self) -> None:
        cases = [
            {"jsonrpc": "2.0", "id": 1, "result": []},
            reply(resultType="input_required"), reply(resultType=None),
            reply(tools="not-list"), reply([{}]), reply([{"name": ""}]),
            reply([{"name": "   "}]), reply([{"name": 42}]), reply(["bad"]),
        ]
        for value in cases:
            with self.subTest(value=value):
                count, reason = self.response(value)
                self.assertIsNone(count)
                self.assertTrue(reason)

    def test_duplicate_names_are_not_counted_as_distinct_tools(self) -> None:
        count, reason = self.response(reply([{"name": "duplicate"}, {"name": "duplicate"}]))
        self.assertIsNone(count)
        self.assertIn("duplicate", reason)

    def test_first_page_is_not_promoted_to_a_total(self) -> None:
        count, reason = self.response(reply(nextCursor="next-page"))
        self.assertIsNone(count)
        self.assertIn("paginated", reason)
        self.http.assert_called_once()  # No hidden unbounded pagination crawl.

    def test_timeout_and_http_errors_remain_unknown_not_zero(self) -> None:
        for error in (TimeoutError("test timeout"), HTTPError(subject.MCP, 406, "not acceptable", {}, None)):
            with self.subTest(error=type(error).__name__):
                self.http.side_effect = error
                count, reason = subject.mcp_tool_count()
                self.assertIsNone(count)
                self.assertIn(type(error).__name__, reason)

    def test_non_json_and_legacy_sse_fail_without_inventing_a_count(self) -> None:
        for payload in (b"<html>not a tool list</html>", b"event: message\ndata: {}\n\n"):
            with self.subTest(payload=payload):
                self.http.return_value = io.BytesIO(payload)
                count, reason = subject.mcp_tool_count()
                self.assertIsNone(count)
                self.assertIn("JSONDecodeError", reason)


if __name__ == "__main__":
    unittest.main()
