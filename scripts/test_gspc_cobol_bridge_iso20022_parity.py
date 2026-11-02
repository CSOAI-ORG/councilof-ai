#!/usr/bin/env python3
"""
Unit tests for scripts/gspc_cobol_bridge_iso20022_parity.py.
"""

from __future__ import annotations

import json
import unittest
from pathlib import Path

from scripts.gspc_cobol_bridge_iso20022_parity import (
    DEFAULT_HF_SPACE_DIR,
    DEFAULT_OUT_PATH,
    MAX_CAPSULE_BYTES,
    build_cobol_bridge_parity_artifact,
    canonical_json,
    sha256_hex,
    verify_comp3_to_iso20022_decimal,
)


class TestGspcCobolBridgeIso20022Parity(unittest.TestCase):
    def test_n36_suite_and_mcnemar_separation(self) -> None:
        artifact = build_cobol_bridge_parity_artifact()
        self.assertEqual(artifact["schema"], "csoai.cobol-bridge-iso20022-parity-evidence/1.0")
        summary = artifact["summary"]
        self.assertEqual(summary["n_valid"], 36)
        self.assertTrue(summary["meets_n30_statistical_floor"])
        self.assertTrue(summary["all_negative_controls_failed_as_designed"])
        self.assertEqual(summary["arm_b_cobol_bridge_layer0_accuracy"], 1.0)
        self.assertEqual(summary["paired_mcnemar_b_vs_a"]["separation_verdict"], "SEPARATED")
        self.assertLess(summary["paired_mcnemar_b_vs_a"]["exact_two_sided_p"], 1e-6)

    def test_comp3_fixed_point_parity_and_tamper_rejection(self) -> None:
        ok = verify_comp3_to_iso20022_decimal("PIC S9(13)V99 COMP-3", "1250000.50", "1250000.50", "EUR", 2)
        self.assertTrue(ok["parity_holds"])

        tampered = verify_comp3_to_iso20022_decimal("PIC S9(13)V99 COMP-3", "1250000.50", "1250000.51", "EUR", 2)
        self.assertFalse(tampered["parity_holds"])

        wrong_scale = verify_comp3_to_iso20022_decimal("PIC S9(13)V99 COMP-3", "1250000.50", "1250000.5", "EUR", 2)
        self.assertFalse(wrong_scale["parity_holds"])

    def test_sample_capsule_within_3072_bytes_and_honest_surface_status(self) -> None:
        artifact = build_cobol_bridge_parity_artifact()
        cap = artifact["sample_3kb_parity_capsule"]
        self.assertLessEqual(cap["capsule_bytes"], MAX_CAPSULE_BYTES)
        self.assertFalse(cap["writes_board"])
        self.assertFalse(cap["model_training"])
        self.assertIn("HTTP_522", artifact["subject_family"]["honest_surface_status"]["cobolbridge_ai_apex"])

    def test_published_interop_and_hf_space_mirror_match_digest(self) -> None:
        self.assertTrue(DEFAULT_OUT_PATH.exists())
        data = json.loads(DEFAULT_OUT_PATH.read_text(encoding="utf-8"))
        body = dict(data)
        digest = body.pop("evidence_sha256")
        self.assertEqual(sha256_hex(canonical_json(body)), digest)

        hf_mirror = Path(DEFAULT_HF_SPACE_DIR) / DEFAULT_OUT_PATH.name
        self.assertTrue(hf_mirror.exists())
        hf_data = json.loads(hf_mirror.read_text(encoding="utf-8"))
        self.assertEqual(hf_data["evidence_sha256"], digest)


if __name__ == "__main__":
    unittest.main()
