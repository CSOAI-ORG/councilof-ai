#!/usr/bin/env python3
"""
Unit tests for scripts/gspc_end_to_end_product_and_ux_verifier.py.
"""

from __future__ import annotations

import json
import unittest
from pathlib import Path

from scripts.gspc_end_to_end_product_and_ux_verifier import (
    DEFAULT_HF_SPACE_DIR,
    DEFAULT_OUT_PATH,
    build_end_to_end_audit_artifact,
    canonical_json,
    sha256_hex,
)


class TestGspcEndToEndProductAndUxVerifier(unittest.TestCase):
    def test_all_12_public_products_verified_end_to_end(self) -> None:
        audit = build_end_to_end_audit_artifact()
        self.assertEqual(audit["schema"], "csoai.end-to-end-product-ux-and-pipeline-audit/1.0")
        self.assertEqual(audit["counts"]["public_products_total"], 12)
        self.assertEqual(audit["counts"]["public_products_verified_end_to_end"], 12)
        for p in audit["public_products_end_to_end_matrix"]:
            self.assertEqual(p["status"], "VERIFIED_END_TO_END", p["product_id"])
            self.assertEqual(p["missing_files"], [], p["product_id"])

    def test_my_results_7_tabs_and_10_free_preview_doors(self) -> None:
        audit = build_end_to_end_audit_artifact()
        hub = audit["human_end_user_experience_hub"]
        self.assertEqual(hub["status"], "VERIFIED_END_TO_END")
        self.assertFalse(hub["login_or_email_required"])
        self.assertEqual(hub["tabs_verified"], 7)
        self.assertEqual(hub["free_preview_doors_verified"], 10)
        self.assertTrue(hub["has_top_tier_2026_models"])
        self.assertTrue(hub["has_tinyfish_and_desktop_commander_tab"])
        self.assertTrue(hub["has_interactive_layer0_care_sandbox"])

    def test_all_7_operational_pipelines_and_8_competitor_crosswalks(self) -> None:
        audit = build_end_to_end_audit_artifact()
        self.assertEqual(audit["counts"]["operational_pipelines_total"], 7)
        self.assertEqual(audit["counts"]["operational_pipelines_active"], 7)
        self.assertEqual(audit["counts"]["competitor_reference_systems_benchmarked"], 8)

    def test_published_interop_and_hf_space_mirror_match_digest(self) -> None:
        self.assertTrue(DEFAULT_OUT_PATH.exists())
        data = json.loads(DEFAULT_OUT_PATH.read_text(encoding="utf-8"))
        body = dict(data)
        digest = body.pop("audit_sha256")
        self.assertEqual(sha256_hex(canonical_json(body)), digest)

        hf_mirror = Path(DEFAULT_HF_SPACE_DIR) / DEFAULT_OUT_PATH.name
        self.assertTrue(hf_mirror.exists())
        hf_data = json.loads(hf_mirror.read_text(encoding="utf-8"))
        self.assertEqual(hf_data["audit_sha256"], digest)


if __name__ == "__main__":
    unittest.main()
