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


class TypedDoorCountDrift(unittest.TestCase):
    """A typed count of our own door must agree with the live door, or the card is not 100/100."""

    LIVE = {"mcp_tools": 12, "openapi_paths": 103, "openapi_version": "0.2+8c1863112960"}
    STALE_MCP_ROW = ("| MCP endpoint — **11 HTTP tools** (7 free + 4 x402; "
                     "`verified live tools/list 2026-09-07T05:57Z`) | `POST https://councilof.ai/mcp` |")
    STALE_OPENAPI = "OpenAPI (canonical): GET https://councilof.ai/openapi.json  → version 0.2+6c709613dc31 · 97 paths"

    # The live cards' real neighbours. Each carries a negation word ("No version is pinned", "NOT:")
    # and sits one bare "\n" from the stale row, which is how the first cut of this check exempted
    # every live stale card while a fixture without neighbours stayed green.
    NEIGHBOURS_BEFORE = ("| Methodology DOI | 10.5281/zenodo.21991104 (Zenodo record unavailable since 29 Sep 2026: "
                         "account blocked by Zenodo; appeal pending. Live methodology page (not the deposit's bytes): "
                         "<https://councilof.ai/methodology/>) |\n")
    NEIGHBOURS_AFTER = ("\n| MCP Registry | `io.github.CSOAI-ORG/gspc` — version not pinned here; the registry is the authority |"
                        "\n| npm — MCP server | [`csoai-gspc-mcp`](https://www.npmjs.com/package/csoai-gspc-mcp) — "
                        "`npx -y csoai-gspc-mcp`. No version is pinned here: ask the registry for the current one. |\n")
    OPENAPI_BLOCK_AFTER = "\nNOT: https://councilof.ai/public/openapi.json  (404 — tip 308 not LIVE; cite apex only)\n"

    def test_the_2026_09_14_rows_are_caught_beside_their_real_negated_neighbours(self) -> None:
        body = (self.NEIGHBOURS_BEFORE + self.STALE_MCP_ROW + self.NEIGHBOURS_AFTER
                + self.STALE_OPENAPI + self.OPENAPI_BLOCK_AFTER)
        hits = subject.typed_count_drift(body, self.LIVE)
        self.assertIn("typed MCP tools 11 != live 12", hits)
        self.assertIn("typed OpenAPI paths 97 != live 103", hits)
        self.assertIn("typed OpenAPI version 0.2+6c709613dc31 != live 0.2+8c1863112960", hits)

    def test_rows_that_agree_with_the_live_door_pass(self) -> None:
        body = ("| MCP endpoint — 12 tools, verified 2026-09-14T10:00:00Z | `POST https://councilof.ai/mcp` |\n"
                "OpenAPI: GET https://councilof.ai/openapi.json → version 0.2+8c1863112960 · 103 paths")
        self.assertEqual(subject.typed_count_drift(body, self.LIVE), [])

    def test_historical_sentences_are_exempt(self) -> None:
        self.assertEqual(subject.typed_count_drift("The door was 11 HTTP tools on 7 Sep.", self.LIVE), [])

    def test_an_unreadable_door_skips_its_check_instead_of_failing(self) -> None:
        unknown = {"mcp_tools": None, "openapi_paths": None, "openapi_version": None}
        self.assertEqual(subject.typed_count_drift(self.STALE_MCP_ROW + "\n" + self.STALE_OPENAPI, unknown), [])

    def test_score_card_fails_the_stale_strings_point_on_a_typed_drift(self) -> None:
        text = "---\nlicense: cc-by-4.0\n---\n" + self.STALE_MCP_ROW + "\n"
        _, _, fails = subject.score_card("space", text, [], None, live=self.LIVE)
        self.assertIn("no stale strings", fails)
        _, _, fails_without_live = subject.score_card("space", text, [], None)
        self.assertNotIn("no stale strings", fails_without_live)


if __name__ == "__main__":
    unittest.main()
