#!/usr/bin/env python3
"""Restart and contract tests for the cursor-preserving Hub census."""

from __future__ import annotations

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

_SPEC = importlib.util.spec_from_file_location(
    "hub_census",
    Path(__file__).with_name("hub_census.py"),
)
hub_census = importlib.util.module_from_spec(_SPEC)
assert _SPEC.loader is not None
_SPEC.loader.exec_module(hub_census)

GSPC_STATE = hub_census.GSPC_STATE
LISTING_STATE = hub_census.LISTING_STATE
collect = hub_census.collect
load_seen = hub_census.load_seen
restart_test = hub_census.restart_test
synthetic_hub_opener = hub_census.synthetic_hub_opener


class HubCensusRestartTests(unittest.TestCase):
    def test_page_aligned_restart_is_unique(self) -> None:
        opener = synthetic_hub_opener(total=20_000, page_size=1000)
        with tempfile.TemporaryDirectory() as tmp:
            report = restart_test(
                Path(tmp),
                total=10_000,
                split=5_000,
                page_size=1000,
                opener=opener,
                live=False,
            )
            self.assertTrue(report["ok"])
            self.assertEqual(report["unique_ids"], 10_000)
            self.assertEqual(report["total"], 10_000)
            self.assertEqual(report["pages_first"], 5)
            self.assertGreater(report["pages_second"], report["pages_first"])
            self.assertEqual(report["weights_downloaded"], 0)
            self.assertEqual(report["gpu_inference"], 0)
            self.assertEqual(report["status_all"], GSPC_STATE)

    def test_mid_page_restart_refetches_and_dedups(self) -> None:
        opener = synthetic_hub_opener(total=8_000, page_size=1000)
        out = Path(tempfile.mkdtemp())
        first = collect(
            out,
            limit=2_500,
            page_size=1000,
            resume=False,
            opener=opener,
        )
        self.assertEqual(first["state"]["n_written"], 2_500)
        self.assertEqual(first["state"]["pages_done"], 2)
        cursor = json.loads((out / "cursor.json").read_text())
        self.assertTrue(cursor["next_url"])
        self.assertIn("cursor=", cursor["next_url"])
        second = collect(
            out,
            limit=6_000,
            page_size=1000,
            resume=True,
            opener=opener,
        )
        ids = load_seen(out / "listings.jsonl")
        self.assertEqual(second["state"]["n_written"], 6_000)
        self.assertEqual(len(ids), 6_000)
        self.assertGreater(second["state"]["n_duplicate_skipped"], 0)
        rows = [
            json.loads(line)
            for line in (out / "listings.jsonl").read_text().splitlines()
            if line
        ]
        self.assertTrue(all(r["listing_state"] == LISTING_STATE for r in rows))
        self.assertTrue(all(r["gspc_state"] == GSPC_STATE for r in rows))
        self.assertTrue(all(r["artefact_manifest_digest"] is None for r in rows))
        self.assertEqual(second["summary"]["n_measured"], 0)

    def test_delta_stops_at_overlapping_watermark(self) -> None:
        opener = synthetic_hub_opener(total=50, page_size=10)
        with tempfile.TemporaryDirectory() as tmp:
            result = collect(
                Path(tmp),
                mode="delta",
                since="2026-09-01T00:00:00Z",
                overlap_hours=1,
                page_size=10,
                resume=False,
                opener=opener,
            )
            self.assertEqual(result["state"]["complete_reason"], "delta-watermark")
            self.assertEqual(result["state"]["n_written"], 0)
            self.assertEqual(result["summary"]["status_all"], GSPC_STATE)


if __name__ == "__main__":
    unittest.main()
