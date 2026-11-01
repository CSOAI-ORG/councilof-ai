#!/usr/bin/env python3
"""
Unit tests for scripts/gspc_institutional_underwriter_ras_flywheel.py.
"""

from __future__ import annotations

import json
import unittest
from pathlib import Path

from scripts.gspc_institutional_underwriter_ras_flywheel import (
    CANONICAL_33_AXES,
    DEFAULT_HF_SPACE_DIR,
    DEFAULT_OUT_PATH,
    HITL_AND_WATCHDOG_LANES,
    MAX_OBSERVATION_BYTES,
    build_flywheel_artifact,
    canonical_json,
    route_observation_to_hitl_and_watchdog,
    sha256_hex,
)


class TestGspcInstitutionalUnderwriterRasFlywheel(unittest.TestCase):
    def test_underwriter_matrix_ceremony_and_bazaar_counts(self) -> None:
        artifact = build_flywheel_artifact()
        self.assertEqual(artifact["schema"], "csoai.institutional-underwriter-x402-ras-flywheel/1.0")
        self.assertEqual(artifact["counts"]["underwriter_comparison_dimensions"], 6)
        self.assertEqual(artifact["counts"]["external_root_witnesses"], 4)
        self.assertEqual(artifact["counts"]["online_offline_verification_steps"], 7)
        self.assertEqual(artifact["counts"]["sku_manifest_entries"], 25)
        self.assertEqual(artifact["counts"]["x402_described_doors"], 27)
        self.assertEqual(artifact["counts"]["bazaar_and_discovery_indexes"], 5)
        self.assertEqual(artifact["counts"]["hitl_watchdog_routing_lanes"], 6)
        self.assertEqual(artifact["counts"]["canonical_gspc_axes_routed_to_hitl"], 33)

    def test_all_33_axes_route_to_exact_hitl_and_watchdog_lane(self) -> None:
        covered = []
        for lane in HITL_AND_WATCHDOG_LANES:
            for ax in lane["routed_axes"]:
                covered.append(ax)
                res = route_observation_to_hitl_and_watchdog(
                    {
                        "source_origin": "MEOK_4_PERSPECTIVE_HIVE",
                        "axis": ax,
                        "subject": "ollama:qwen3.5:9b",
                    }
                )
                self.assertEqual(res["routed_lane_id"], lane["lane_id"])
                self.assertTrue(res["within_3kb_ceiling"])
                self.assertFalse(res["writes_board"])
                self.assertFalse(res["model_training"])
                self.assertEqual(res["intake_state"], "AWAITING_OPERATOR_REVIEW")
        self.assertEqual(sorted(covered), sorted(CANONICAL_33_AXES))

    def test_3072_byte_capsule_limit_enforced(self) -> None:
        oversized = {
            "source_origin": "RSI_DREAM_SIMULATION",
            "axis": "care",
            "padding": "x" * (MAX_OBSERVATION_BYTES + 100),
        }
        with self.assertRaises(ValueError):
            route_observation_to_hitl_and_watchdog(oversized)

    def test_cobolbridge_and_safe_alliance_lifecycle_present(self) -> None:
        artifact = build_flywheel_artifact()
        cb = artifact["cobolbridge_and_legacy_enterprise_assurance"]
        self.assertEqual(cb["sku_manifest_id"], "cobol-legacy")
        self.assertEqual(len(cb["three_step_remediation_and_ras_integration"]), 3)

        safe = artifact["frozen_to_fluid_safe_and_lfx_bridge"]
        self.assertEqual(
            safe["alliance_control_plugin_9_state_lifecycle"]["states"],
            [
                "DISCOVERED",
                "MEASURED",
                "QUALIFIED",
                "ROUTABLE",
                "AUTHORIZED",
                "EXECUTED",
                "EFFECT_OBSERVED",
                "VERIFIED",
                "CLAIM_CURRENT",
            ],
        )
        self.assertEqual(len(safe["aaif_agentic_commerce_5_recommendations"]), 5)

    def test_published_interop_and_hf_space_mirror_match_digest(self) -> None:
        self.assertTrue(DEFAULT_OUT_PATH.exists())
        data = json.loads(DEFAULT_OUT_PATH.read_text(encoding="utf-8"))
        body = dict(data)
        digest = body.pop("flywheel_sha256")
        self.assertEqual(sha256_hex(canonical_json(body)), digest)

        hf_mirror = Path(DEFAULT_HF_SPACE_DIR) / DEFAULT_OUT_PATH.name
        self.assertTrue(hf_mirror.exists())
        hf_data = json.loads(hf_mirror.read_text(encoding="utf-8"))
        self.assertEqual(hf_data["flywheel_sha256"], digest)


if __name__ == "__main__":
    unittest.main()
