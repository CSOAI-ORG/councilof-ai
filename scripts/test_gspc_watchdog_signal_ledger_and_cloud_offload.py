#!/usr/bin/env python3
"""Unit tests for gspc_watchdog_signal_ledger_and_cloud_offload.py."""
from __future__ import annotations

import json
import re
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from gspc_watchdog_signal_ledger_and_cloud_offload import (
    OUT_PATH,
    build_watchdog_signal_ledger,
    main,
    sha256_canonical,
)

BANNED_RE = re.compile(
    r"\b(certif\w*|compliant|non-compliant|unsafe|violated|hacked|bft|sovereign|failed|fails|price|pricing|discount|demo)\b|\$\s?\d",
    re.IGNORECASE,
)


class TestWatchdogSignalLedgerAndCloudOffload(unittest.TestCase):
    def test_board_counts_and_slot_34_gate(self) -> None:
        doc = build_watchdog_signal_ledger()
        b = doc["gspc_board_boundary"]
        self.assertEqual(b["declared_slots"], 33)
        self.assertEqual(b["measured_axes"], 23)
        self.assertEqual(b["unmeasured_axes"], 10)
        self.assertEqual(b["model_comparison_axes"]["total"], 14)
        self.assertEqual(b["model_comparison_axes"]["separated"], 0)
        self.assertEqual(b["model_comparison_axes"]["tie"], 7)
        self.assertEqual(b["model_comparison_axes"]["untested"], 7)

    def test_five_provenance_records_seven_states_and_six_safe_states(self) -> None:
        doc = build_watchdog_signal_ledger()
        self.assertEqual(len(doc["data_provenance_records"]), 5)
        self.assertEqual(len(doc["case_governed_views"]), 3)
        self.assertEqual(
            doc["feed_health_states"],
            ["CURRENT", "PARTIAL", "STALE", "UNAVAILABLE", "RESTRICTED", "PAUSED", "RETIRED"],
        )
        self.assertEqual(
            doc["wg_safe_crosswalk"]["states"],
            ["NOT_MAPPED", "MAPPED_INTERNAL", "HUMAN_APPROVED", "SUBMITTED", "ACKNOWLEDGED", "SUPERSEDED"],
        )
        self.assertEqual(len(doc["meok_human_qualification"]["initial_qualified_functions"]), 3)

    def test_artifact_sha256_and_zero_banned_words(self) -> None:
        main()
        loaded = json.loads(OUT_PATH.read_text(encoding="utf-8"))
        recorded = loaded.pop("artifact_sha256")
        self.assertEqual(recorded, sha256_canonical(loaded))
        raw_text = OUT_PATH.read_text(encoding="utf-8")
        self.assertIsNone(BANNED_RE.search(raw_text))


if __name__ == "__main__":
    unittest.main()
