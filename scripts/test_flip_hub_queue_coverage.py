#!/usr/bin/env python3
"""Focused tests for the Hub queue's subject and partial-coverage states."""

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import flip_hub_queue as queue  # noqa: E402


class CoverageStateTests(unittest.TestCase):
    def test_subject_card_is_measured(self):
        row = {"status": "MEASURED", "card_id": "subject", "measured_axes": {}}
        self.assertEqual(queue.coverage_state(row), "MEASURED")

    def test_axis_card_is_partial(self):
        row = {
            "status": "UNMEASURED",
            "card_id": "",
            "measured_axes": {"safety": {"status": "MEASURED", "card_id": "axis"}},
        }
        self.assertEqual(queue.coverage_state(row), "PARTIALLY_MEASURED")

    def test_empty_row_is_unmeasured(self):
        self.assertEqual(queue.coverage_state({"status": "UNMEASURED"}), "UNMEASURED")

    def test_summary_partitions_population(self):
        rows = [
            {"status": "MEASURED", "card_id": "subject"},
            {"status": "UNMEASURED", "measured_axes": {"care": {"status": "MEASURED", "card_id": "axis"}}},
            {"status": "UNMEASURED"},
        ]
        result = queue.summary(rows, 0)
        self.assertEqual(result["kind"], "csoai.hub-queue/0.3")
        self.assertEqual(result["coverage_counts"], {
            "MEASURED": 1,
            "PARTIALLY_MEASURED": 1,
            "UNMEASURED": 1,
        })
        self.assertEqual(sum(result["coverage_counts"].values()), result["n"])
        self.assertEqual(result["n_models_with_measured_axes"], 1)
        self.assertEqual(result["n_measured_axes"], 1)


if __name__ == "__main__":
    unittest.main()
