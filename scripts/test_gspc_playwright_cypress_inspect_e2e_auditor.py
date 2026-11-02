#!/usr/bin/env python3
"""
Unit tests for `scripts/gspc_playwright_cypress_inspect_e2e_auditor.py`.
"""

import json
import unittest

from scripts.gspc_playwright_cypress_inspect_e2e_auditor import (
    OUT_INTEROP,
    OUT_SPACE,
    write_playwright_cypress_inspect_audit_artifacts,
)


class TestGspcPlaywrightCypressInspectE2eAuditor(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.report = write_playwright_cypress_inspect_audit_artifacts()

    def test_browser_devtools_inspect_surface_and_jsonld(self) -> None:
        dev = self.report["browser_devtools_inspect_surface"]
        self.assertEqual(dev["status"], "VERIFIED_BROWSER_DEVTOOLS_INSPECT_READY")
        self.assertEqual(dev["tabs_count"], 7)
        self.assertEqual(dev["panels_count"], 7)
        self.assertGreaterEqual(dev["free_preview_options_count"], 18)
        self.assertEqual(dev["live_inspect_options_count"], 6)
        self.assertTrue(dev["has_jsonld_dataset"])
        self.assertEqual(dev["jsonld_distributions_count"], 6)
        self.assertTrue(dev["has_window_csoai_inspect_api"])
        self.assertTrue(dev["has_live_14_axis_hf_matrix_in_step1"])
        self.assertTrue(dev["has_12_db_watchdog_harness_in_step7"])
        self.assertTrue(dev["has_live_inspector_in_step7"])
        self.assertTrue(dev["responsive_mobile_css_guard"])
        self.assertFalse(dev["public_price_strings_present"])

    def test_playwright_and_cypress_e2e_suites(self) -> None:
        e2e = self.report["playwright_and_cypress_e2e"]
        pw = e2e["playwright_chromium_e2e"]
        self.assertEqual(pw["status"], "PASSED_HEADLESS_CHROMIUM")
        self.assertEqual(pw["tests_passed"], 4)
        self.assertTrue(pw["verifies_window_csoai_inspect"])
        cy = e2e["cypress_e2e_and_cyrus_mehta_exact_mcnemar"]
        self.assertEqual(cy["status"], "VERIFIED")
        self.assertTrue(cy["includes_section_12_my_results_inspector"])
        self.assertEqual(len(cy["cyrus_mehta_exact_conditional_binomial_test"]["applications_verified"]), 4)

    def test_uk_aisi_inspect_ai_and_offline_zip_inspector(self) -> None:
        insp = self.report["uk_aisi_and_offline_zip_inspectors"]
        aisi = insp["uk_aisi_inspect_ai_integration"]
        self.assertEqual(aisi["status"], "VERIFIED_INSPECT_AI_TASK")
        self.assertTrue(aisi["enforces_frozen_bank_sha256"])
        offline = insp["csoai_offline_zip_evidence_inspector"]
        self.assertEqual(offline["status"], "VERIFIED_OFFLINE_ZERO_NETWORK_INSPECTOR")
        self.assertTrue(offline["csp_network_isolation"])
        self.assertEqual(offline["vitest_unit_tests_passed"], 43)
        self.assertEqual(offline["python_unit_tests_passed"], 37)

    def test_all_14_published_artifacts_have_byte_identical_hf_space_mirrors(self) -> None:
        inv = self.report["published_artifact_value_inventory"]
        self.assertEqual(len(inv), 14)
        for row in inv:
            self.assertTrue(row["exists_in_public_interop"], row["filename"])
            self.assertTrue(row["exists_in_hf_space"], row["filename"])
            self.assertTrue(row["byte_identical_mirror"], row["filename"])
            self.assertEqual(len(row["sha256"]), 64)

    def test_written_audit_artifacts_match_between_interop_and_hf_space(self) -> None:
        self.assertTrue(OUT_INTEROP.exists())
        self.assertTrue(OUT_SPACE.exists())
        d1 = json.loads(OUT_INTEROP.read_text(encoding="utf-8"))
        d2 = json.loads(OUT_SPACE.read_text(encoding="utf-8"))
        self.assertEqual(d1["audit_sha256"], d2["audit_sha256"])
        self.assertEqual(len(d1["audit_sha256"]), 64)


if __name__ == "__main__":
    unittest.main()
