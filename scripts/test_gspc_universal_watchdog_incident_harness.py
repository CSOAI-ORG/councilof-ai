#!/usr/bin/env python3
"""
Unit tests for `scripts/gspc_universal_watchdog_incident_harness.py`.
"""

import json
import unittest
from pathlib import Path

from scripts.gspc_universal_watchdog_incident_harness import (
    CANONICAL_33_AXES,
    CHARTER_V0_1_0_SHA256,
    GLOBAL_WATCHDOG_DATABASES,
    OUT_INTEROP,
    OUT_SPACE,
    WATCHDOG_PREDICATES,
    build_axis_to_watchdog_and_wg_safe_crosswalk,
    build_candidate_axis_34_specification,
    build_daily_gspc_to_wg_safe_signal_capsule,
    build_universal_watchdog_incident_harness_report,
    write_universal_watchdog_artifacts,
)


class TestUniversalWatchdogIncidentHarness(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.report = write_universal_watchdog_artifacts()

    def test_12_global_watchdog_databases_have_n36_probes_and_contamination_wall(self) -> None:
        self.assertEqual(len(GLOBAL_WATCHDOG_DATABASES), 12)
        total_probes = 0
        for db in GLOBAL_WATCHDOG_DATABASES:
            self.assertFalse(db["training_allowed"])
            self.assertEqual(set(db["predicates"].keys()), set(WATCHDOG_PREDICATES))
            self.assertEqual(len(db["probes"]), 3)
            total_probes += len(db["probes"])
        self.assertEqual(total_probes, 36)

    def test_candidate_axis_34_preserves_adr_001_and_has_n36(self) -> None:
        ax34 = build_candidate_axis_34_specification()
        self.assertEqual(ax34["slot_number_candidate"], 34)
        self.assertEqual(ax34["axis_id"], "public-incident-vigilance")
        self.assertEqual(ax34["board_admission_state"], "CANDIDATE_SLOT_MEASURED_IN_WATCHDOG")
        self.assertEqual(ax34["n_databases_measured"], 12)
        self.assertEqual(ax34["n_probes_total"], 36)
        self.assertEqual(ax34["n_valid"], 36)
        self.assertEqual(
            ax34["tally"]["PASS_NATIVE"] + ax34["tally"]["GAP_BRIDGED_BY_CSOAI_LAYER0"],
            36,
        )

    def test_all_33_canonical_axes_map_to_meok_specialists_working_groups_and_wg_safe(self) -> None:
        cw = build_axis_to_watchdog_and_wg_safe_crosswalk()
        self.assertEqual(len(cw), 33)
        self.assertEqual([r["axis"] for r in cw], CANONICAL_33_AXES)
        wg_ids = set()
        lane_ids = set()
        for r in cw:
            self.assertEqual(r["meok_axis_specialist"]["rsi_mode"], "RECOMMENDATION_ONLY")
            self.assertEqual(r["meok_axis_specialist"]["initial_decision"], "HOLD")
            self.assertEqual(r["wg_safe_charter_binding"]["charter_sha256"], CHARTER_V0_1_0_SHA256)
            self.assertGreaterEqual(len(r["ingested_global_watchdog_databases"]), 2)
            wg_ids.add(r["public_watchdog_working_group"]["working_group_id"])
            lane_ids.add(r["hitl_steward_lane"])
        self.assertEqual(
            wg_ids,
            {"governance", "agent-control", "evaluation", "provenance", "runtime", "human-impact", "economy"},
        )
        self.assertEqual(len(lane_ids), 6)

    def test_daily_signal_capsule_is_within_3kb_and_enforces_hitl_gates(self) -> None:
        for ax in ["care", "safety", "effect-binding", "reserve-attestation", "provenance", "claim-maintenance"]:
            built = build_daily_gspc_to_wg_safe_signal_capsule(axis=ax)
            self.assertTrue(built["within_3kb_budget"])
            self.assertLessEqual(built["capsule_bytes"], 3072)
            cap = built["capsule"]
            self.assertEqual(cap["charter_sha256"], CHARTER_V0_1_0_SHA256)
            self.assertFalse(cap["hitl_steward_routing"]["writes_board"])
            self.assertFalse(cap["hitl_steward_routing"]["model_training"])
            self.assertFalse(cap["hitl_steward_routing"]["execution_authority_granted_by_charter"])
            self.assertEqual(cap["meok_specialist_dispatch"]["initial_decision"], "HOLD")

    def test_written_artifacts_match_between_interop_and_hf_space(self) -> None:
        self.assertTrue(OUT_INTEROP.exists())
        self.assertTrue(OUT_SPACE.exists())
        d1 = json.loads(OUT_INTEROP.read_text(encoding="utf-8"))
        d2 = json.loads(OUT_SPACE.read_text(encoding="utf-8"))
        self.assertEqual(d1["harness_sha256"], d2["harness_sha256"])
        self.assertEqual(len(d1["harness_sha256"]), 64)


if __name__ == "__main__":
    unittest.main()
