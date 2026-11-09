#!/usr/bin/env python3
"""
Unit tests for scripts/gspc_safe_fluid_reverification_engine.py.
"""

from __future__ import annotations

import json
import unittest
from pathlib import Path

from scripts.gspc_safe_fluid_reverification_engine import (
    DEFAULT_HF_SPACE_DIR,
    DEFAULT_OUT_PATH,
    SAFE_RESULT_STATES,
    SAFE_WATCH_STATES,
    build_safe_fluid_daily_signal_artifact,
    canonical_json,
    evaluate_fluid_reverification_capsule,
    sha256_hex,
)


class TestGspcSafeFluidReverificationEngine(unittest.TestCase):
    def test_all_9_domains_33_axes_5_result_states_and_3_watch_states(self) -> None:
        artifact = build_safe_fluid_daily_signal_artifact()
        self.assertEqual(artifact["schema"], "csoai.safe-fluid-reverification-daily-signal/1.0")
        self.assertEqual(artifact["counts"]["sector_atlas_domains_covered"], 9)
        self.assertEqual(artifact["counts"]["canonical_gspc_axes_mapped"], 33)
        self.assertEqual(
            sorted(artifact["states_demonstrated"]["result_states"]),
            sorted(SAFE_RESULT_STATES),
        )
        self.assertEqual(
            sorted(artifact["states_demonstrated"]["watch_states"]),
            sorted(SAFE_WATCH_STATES),
        )
        self.assertLessEqual(artifact["counts"]["max_capsule_bytes"], 3072)

    def test_behavioral_rules_unmeasured_not_discriminating_and_stale_drift(self) -> None:
        # 1. Negative control did not fail -> NOT_DISCRIMINATING
        nd = evaluate_fluid_reverification_capsule(
            "TEST-ND",
            "industry",
            "Education grading",
            "measurer-integrity",
            "Claim text",
            [{"dep_id": "d1", "state": "UNPINNED", "sha256": "none"}],
            negative_control_ran_and_failed=False,
            claim_held_under_test=True,
            n_valid=40,
            dependency_drift_detected=False,
            age_hours=10,
        )
        self.assertEqual(nd["result"]["state"], "NOT_DISCRIMINATING")
        self.assertEqual(nd["watch"]["action_required"], "BOUNDED_RETEST_AND_HITL_REVIEW")

        # 2. n_valid < 30 -> UNMEASURED with null n_valid (never 0)
        unm = evaluate_fluid_reverification_capsule(
            "TEST-UNM",
            "agri",
            "Field robotics",
            "humanoid-deployment",
            "Claim text",
            [{"dep_id": "d2", "state": "UNAVAILABLE", "sha256": "none"}],
            negative_control_ran_and_failed=True,
            claim_held_under_test=True,
            n_valid=16,
            dependency_drift_detected=False,
            age_hours=5,
        )
        self.assertEqual(unm["result"]["state"], "UNMEASURED")
        self.assertIsNone(unm["result"]["n_valid"])

        # 3. Dependency drift -> watch.state == STALE
        stale = evaluate_fluid_reverification_capsule(
            "TEST-STALE",
            "work",
            "Hiring platform",
            "claim-maintenance",
            "Claim text",
            [{"dep_id": "d3", "state": "PINNED", "sha256": "drifted"}],
            negative_control_ran_and_failed=True,
            claim_held_under_test=True,
            n_valid=35,
            dependency_drift_detected=True,
            age_hours=20,
        )
        self.assertEqual(stale["result"]["state"], "PASS")
        self.assertEqual(stale["watch"]["state"], "STALE")
        self.assertEqual(stale["watch"]["action_required"], "BOUNDED_RETEST_AND_HITL_REVIEW")

    def test_published_interop_and_hf_space_mirror_match_digest(self) -> None:
        self.assertTrue(DEFAULT_OUT_PATH.exists())
        data = json.loads(DEFAULT_OUT_PATH.read_text(encoding="utf-8"))
        body = dict(data)
        digest = body.pop("signal_sha256")
        self.assertEqual(sha256_hex(canonical_json(body)), digest)

        hf_mirror = Path(DEFAULT_HF_SPACE_DIR) / DEFAULT_OUT_PATH.name
        self.assertTrue(hf_mirror.exists())
        hf_data = json.loads(hf_mirror.read_text(encoding="utf-8"))
        self.assertEqual(hf_data["signal_sha256"], digest)


if __name__ == "__main__":
    unittest.main()
