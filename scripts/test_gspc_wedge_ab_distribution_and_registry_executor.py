#!/usr/bin/env python3
"""Unit tests for gspc_wedge_ab_distribution_and_registry_executor.py."""

from __future__ import annotations

import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

from gspc_wedge_ab_distribution_and_registry_executor import (
    REPO_ROOT,
    REQUIRED_README_URLS,
    build_report,
    check_readme_links,
    verify_mcp_registry_descriptors,
    verify_parity_live_selftest,
)


class TestWedgeABDistributionAndRegistryExecutor(unittest.TestCase):
    def test_required_readme_links_present_in_all_packages(self) -> None:
        report = build_report(repo_root=REPO_ROOT, check_live=False)
        self.assertEqual(report["schema"], "csoai.wedge-ab.distribution-registry-execution/v1")
        self.assertEqual(report["wedge_a_source_parity"]["status"], "MEASURED")
        self.assertTrue(report["wedge_a_source_parity"]["all_package_readmes_contain_required_links"])
        self.assertEqual(len(report["artifact_sha256"]), 64)

    def test_mcp_registry_descriptors_validate(self) -> None:
        res = verify_mcp_registry_descriptors(repo_root=REPO_ROOT)
        self.assertEqual(res["validator_exit_code"], 0)
        self.assertEqual(res["node_test_exit_code"], 0)
        self.assertEqual(res["canonical_descriptor"]["name"], "ai.councilof/gspc")
        self.assertEqual(res["deprecated_side_descriptor"]["name"], "io.github.CSOAI-ORG/gspc")
        self.assertEqual(res["deprecated_side_descriptor"]["declared_status"], "deprecated")

    def test_parity_live_selftest_passes(self) -> None:
        res = verify_parity_live_selftest(repo_root=REPO_ROOT)
        self.assertEqual(res["exit_code"], 0)
        self.assertEqual(res["self_test"], "PASS")

    def test_readme_links_helper(self) -> None:
        res = check_readme_links(REPO_ROOT / "scripts/spray/pypi/csoai-gspc/README.md")
        self.assertTrue(res["all_required_links_present"])
        for u in REQUIRED_README_URLS:
            self.assertTrue(res["links"][u], f"Missing required URL {u}")


if __name__ == "__main__":
    unittest.main()
