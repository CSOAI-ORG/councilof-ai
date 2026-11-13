#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Unit and doctrine regression tests for the 12-Industry ArtCraft & Permissionless Public Scanner Engine."""
from __future__ import annotations

import json
from pathlib import Path
import sys
import unittest

PACKAGE = Path(__file__).resolve().parents[1]
if str(PACKAGE) not in sys.path:
    sys.path.insert(0, str(PACKAGE))

import event as E  # noqa: E402
import industry_artcraft_engine as IAE  # noqa: E402


class IndustryArtcraftEngineTests(unittest.TestCase):
    def test_twelve_industries_and_36_subjects_scan_cleanly(self) -> None:
        scan = IAE.run_permissionless_industry_scan()
        self.assertEqual(scan["schema"], "csoai.industry-artcraft-engine/1.0")
        self.assertEqual(scan["totals"]["industries_covered"], 12)
        self.assertEqual(scan["totals"]["craft_modules_active"], 12)
        self.assertEqual(scan["totals"]["public_subjects_indexed"], 36)
        self.assertEqual(scan["totals"]["positive_controls_consistent"], 36)
        self.assertEqual(scan["totals"]["negative_controls_diverged"], 36)
        self.assertEqual(scan["totals"]["oscal_observations_emitted"], 36)
        self.assertEqual(scan["totals"]["ciso_assistant_controls_emitted"], 36)
        self.assertEqual(scan["totals"]["ocsf_2004_findings_emitted"], 36)
        self.assertEqual(scan["totals"]["iwm_19_byte_coordinates_emitted"], 36)
        self.assertEqual(scan["totals"]["etsi_en_304_223_principles_mapped"], 13)
        self.assertEqual(scan["totals"]["light_12around1_fault_states_survived"], 9867)
        self.assertEqual(scan["totals"]["temporal_triad_3around1_score"], "20/20")
        self.assertEqual(scan["receipt_verification"]["verdict"], "VALID")

    def test_zero_login_inspector_enforces_unmeasured_null_rule(self) -> None:
        res = IAE.inspect_any_industry_subject(
            industry_id="ind_06_biotech_clinical_pharma_health",
            subject_id="urn:csoai:test:unmeasured-clinical-subject",
            locator="https://councilof.ai/verify",
            payload={"measured_value": 0.99},
            state_override="UNMEASURED",
        )
        ev = res["evidence_event"]
        self.assertEqual(ev["state"], "UNMEASURED")
        self.assertIsNone(ev["value"])
        self.assertEqual(E.validate(ev), [])
        ciso_ctrl = res["carriers"]["ciso_assistant"]["applied_controls"][0]
        self.assertIsNone(ciso_ctrl["measured_value"])
        oscal_props = {
            p["name"]: p["value"]
            for p in res["carriers"]["oscal_1_1_2"]["assessment-results"]["results"][0]["observations"][0]["props"]
        }
        self.assertNotIn("csoai_measured_value", oscal_props)
        self.assertEqual(res["receipt_verification"]["verdict"], "VALID")

    def test_no_forbidden_certification_claims_in_index(self) -> None:
        scan = IAE.run_permissionless_industry_scan()
        dumped = json.dumps(scan).lower()
        for banned in ("certified by csoai", "compliance status", "pass mark", "overall_rating"):
            self.assertNotIn(banned, dumped)


if __name__ == "__main__":
    unittest.main()
