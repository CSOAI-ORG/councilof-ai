#!/usr/bin/env python3
"""test_watchdog_intake.py — the harness must be proven ABLE TO FAIL.

A coverage harness that can only report success is a lamp, not a measurement. These
tests pin the three properties that make the daily run worth reading:

  1. An endpoint that does not answer is UNREACHABLE — never 0, never "clean".
  2. An endpoint that answers 200 with a body that is NOT the documented shape is
     UNCHECKABLE — a different fact from UNREACHABLE, and never merged with it.
  3. The count grammar holds: n counts SOURCES PROBED, and the three states are
     never summed into a single figure that would read like a score.

Run: python3 scripts/test_watchdog_intake.py
"""
from __future__ import annotations

import json
import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import watchdog_intake as wi  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parents[1]


class FakeGot(dict):
    """A canned fetch result, so the grader is tested without the network.

    grade() consumes the dict shape fetch() returns, so the double must be that
    exact shape — a duck-typed object here would test the wrong contract.
    """

    def __init__(self, transport="ok", status=200, body=b"{}", ctype="application/json", error=None):
        super().__init__(
            transport=transport,
            http_status=status,
            content_type=ctype,
            bytes=len(body),
            body=body,
            error=error,
        )


SPEC_JSON = {
    "id": "t-json", "name": "t", "kind": "advisory-feed",
    "url": "https://example.invalid/x", "method": "GET",
    "expect": "json", "count_path": "items", "grid": ["safety"],
}


class TestUnreachableIsItsOwnState(unittest.TestCase):
    def test_transport_error_is_unreachable_not_zero(self):
        row = wi.grade(SPEC_JSON, FakeGot(transport="error", status=None, body=b"", error="boom"))
        self.assertEqual(row["state"], "UNREACHABLE")
        self.assertIsNone(row["count"], "an unreachable source must never carry a count")
        self.assertNotEqual(row["count"], 0, "0 is a measurement of zero; unreachable is not a measurement")
        self.assertIn("boom", row["error"])

    def test_http_500_is_unreachable(self):
        row = wi.grade(SPEC_JSON, FakeGot(transport="http_error", status=500, body=b"", error="HTTP 500"))
        self.assertEqual(row["state"], "UNREACHABLE")
        self.assertIsNone(row["count"])
        self.assertEqual(row["http_status"], 500)


class TestUncheckableIsNotUnreachable(unittest.TestCase):
    def test_html_where_json_documented_is_uncheckable(self):
        body = b"<!DOCTYPE html><html><body>not json</body></html>"
        row = wi.grade(SPEC_JSON, FakeGot(body=body, ctype="text/html"))
        self.assertEqual(row["state"], "UNCHECKABLE")
        self.assertIsNone(row["count"])
        self.assertIn("not JSON", row["unparseable_reason"])

    def test_json_without_the_documented_path_is_reachable_but_count_absent(self):
        row = wi.grade(SPEC_JSON, FakeGot(body=b'{"other": 5}'))
        self.assertEqual(row["state"], "REACHABLE")
        self.assertIsNone(row["count"])
        self.assertIn("not present", row["unparseable_reason"])


class TestCountGrammar(unittest.TestCase):
    def test_list_terminator_reads_a_real_count(self):
        row = wi.grade(SPEC_JSON, FakeGot(body=b'{"items": [1,2,3]}'))
        self.assertEqual(row["state"], "REACHABLE")
        self.assertEqual(row["count"], 3)

    def test_dict_terminator_reads_its_key_count(self):
        row = wi.grade(SPEC_JSON, FakeGot(body=b'{"items": {"a":1,"b":2}}'))
        self.assertEqual(row["count"], 2)

    def test_scalar_at_path_is_a_value_not_a_count(self):
        row = wi.grade(SPEC_JSON, FakeGot(body=b'{"items": "CVE-2021-44228"}'))
        self.assertEqual(row["count"], "CVE-2021-44228")
        self.assertEqual(row["count_kind"], "value")

    def test_body_digest_is_recorded_for_recomputation(self):
        row = wi.grade(SPEC_JSON, FakeGot(body=b'{"items": [1]}'))
        self.assertEqual(len(row["body_sha256"]), 64)
        self.assertEqual(row["body_sha256"], wi.sha256_hex(b'{"items": [1]}'))


class TestArtifactGrammar(unittest.TestCase):
    def _artifact(self, rows):
        art = {
            "totals": {
                "sources_pinned": len(rows), "sources_probed": len(rows),
                "reachable": sum(1 for r in rows if r["state"] == "REACHABLE"),
                "unreachable": sum(1 for r in rows if r["state"] == "UNREACHABLE"),
                "uncheckable": sum(1 for r in rows if r["state"] == "UNCHECKABLE"),
                "grid_hits": 0,
            },
            "sources": rows,
        }
        return art

    def test_the_three_states_stay_separate(self):
        rows = [
            wi.grade(SPEC_JSON, FakeGot(body=b'{"items":[1]}')),                    # REACHABLE
            wi.grade(SPEC_JSON, FakeGot(transport="error", body=b"", error="x")),   # UNREACHABLE
            wi.grade(SPEC_JSON, FakeGot(body=b"<html>", ctype="text/html")),        # UNCHECKABLE
        ]
        art = self._artifact(rows)
        t = art["totals"]
        self.assertEqual((t["reachable"], t["unreachable"], t["uncheckable"]), (1, 1, 1))
        # No single "score" field may exist that would collapse the three.
        for forbidden in ("score", "rating", "grade", "compliance", "health"):
            self.assertNotIn(forbidden, t, f"totals must not carry a '{forbidden}' field")

    def test_grid_coverage_names_the_estate_axes_a_source_touches(self):
        rows = [wi.grade(SPEC_JSON, FakeGot(body=b'{"items":[1]}'))]
        art = self._artifact(rows)
        self.assertEqual(art["sources"][0]["grid"], ["safety"])


class TestPinnedRegistryIsHonest(unittest.TestCase):
    def test_every_pinned_source_declares_the_fields_a_reader_needs(self):
        required = {"id", "name", "kind", "url", "method", "expect", "count_path", "note"}
        for spec in wi.PINNED:
            missing = required - set(spec)
            self.assertFalse(missing, f"pinned source {spec.get('id')} missing {missing}")

    def test_pinned_ids_are_unique(self):
        ids = [s["id"] for s in wi.PINNED]
        self.assertEqual(len(ids), len(set(ids)), "a duplicate pinned id would silently drop a source")

    def test_unpinned_findings_every_one_states_its_consequence_and_next_step(self):
        self.assertTrue(wi.UNPINNED, "the unpinned list must not be empty — a gap that vanishes is not a gap")
        for u in wi.UNPINNED:
            for field in ("id", "name", "observed", "reason", "consequence", "next"):
                self.assertIn(field, u, f"unpinned finding {u.get('id')} missing {field}")

    def test_pinned_and_unpinned_do_not_overlap(self):
        pinned = {s["id"] for s in wi.PINNED}
        unpinned = {u["id"] for u in wi.UNPINNED}
        self.assertFalse(pinned & unpinned, "a source cannot be both pinned and unpinned")


if __name__ == "__main__":
    unittest.main(verbosity=2)
