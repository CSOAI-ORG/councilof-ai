#!/usr/bin/env python3
"""
Unit tests for scripts/gspc_constitutional_charter_layer0_crosswalk.py
and public/interop/constitutional-charter-gspc-layer0-crosswalk-v1.json.
"""

import json
import re
import unittest
from tempfile import TemporaryDirectory
from pathlib import Path
from unittest.mock import patch

try:
    from scripts import gspc_constitutional_charter_layer0_crosswalk as cw
except ImportError:
    import gspc_constitutional_charter_layer0_crosswalk as cw  # type: ignore[no-redef]


BANNED_TERMS = (
    "certified",
    "compliant",
    "non-compliant",
    "unsafe",
    "violated",
    "hacked",
    "greenfield",
    "unicorn",
    "world-class",
    "good-news",
    "powerhouse",
    "superpower",
    "troops",
    "dominate",
)


class TestConstitutionalCharterLayer0Crosswalk(unittest.TestCase):
    def setUp(self) -> None:
        self.artifact = cw.build_master_crosswalk()

    def test_charter_pins_and_registered_axes_covered(self) -> None:
        self.assertEqual(
            self.artifact["schema"],
            "csoai.constitutional-charter-gspc-layer0-crosswalk/1.0",
        )
        pins = self.artifact["pinned_charter_artifacts"]
        self.assertEqual(
            pins["operational_charter_sha256"],
            "3dcf79a7526785324ef15deaa40adabc5e77fbc99c4ebd089309d948c3c3e32e",
        )
        self.assertEqual(pins["operational_charter_articles_count"], 22)
        self.assertEqual(pins["source_52_article_count"], 52)
        self.assertEqual(pins["operational_controls_count"], 16)
        self.assertEqual(pins["held_source_articles"], [19, 42, 48])

        counts = self.artifact["counts"]
        self.assertEqual(counts["outside_in_personas_inspected"], 5)
        self.assertEqual(counts["operational_controls_mapped"], 16)
        registry = json.loads(cw.AXIS_REGISTRY_PATH.read_text())["specialists"]
        self.assertCountEqual(self.artifact["mapped_gspc_axes"], [row["axis"] for row in registry])
        self.assertEqual(counts["distinct_gspc_axes_covered_by_charter"], len(registry))
        self.assertIn("watchdog-ingest", self.artifact["mapped_gspc_axes"])
        self.assertEqual(counts["external_github_layer0_targets"], 20)
        self.assertEqual(counts["first_principles_precedents"], 7)
        self.assertEqual(counts["newtons_third_law_reactions"], 8)

        disk = json.loads(cw.DEFAULT_OUTPUT_PATH.read_text(encoding="utf-8"))
        self.assertEqual(disk, self.artifact)

    def test_missing_historical_bytes_are_not_verified_and_bad_bytes_fail(self):
        with TemporaryDirectory() as directory:
            path = Path(directory) / "historical.json"
            self.assertEqual(cw.historical_profile_summary(path)["source_pin_state"],
                             "HISTORICAL_METADATA_ONLY_ORIGINAL_NOT_AVAILABLE")
            path.write_bytes(b"{}")
            with self.assertRaisesRegex(ValueError, "digest"):
                cw.historical_profile_summary(path)

    def test_equal_count_wrong_axis_or_missing_article_fails(self):
        controls = cw.build_charter_controls_to_gspc_and_hitl_map()
        for row in controls:
            row["gspc_axes"] = ["incorrect-axis" if a == "watchdog-ingest" else a for a in row["gspc_axes"]]
        with patch.object(cw, "build_charter_controls_to_gspc_and_hitl_map", return_value=controls):
            with self.assertRaisesRegex(ValueError, "axis mismatch"):
                cw.build_master_crosswalk()
        controls = cw.build_charter_controls_to_gspc_and_hitl_map()
        for row in controls:
            row["operational_charter_articles"] = [a for a in row["operational_charter_articles"] if a != 15]
        with patch.object(cw, "build_charter_controls_to_gspc_and_hitl_map", return_value=controls):
            with self.assertRaisesRegex(ValueError, "articles differ"):
                cw.build_master_crosswalk()

    def test_all_22_operational_articles_referenced_across_controls(self) -> None:
        op_articles = {
            art
            for row in self.artifact["charter_controls_to_gspc_and_hitl"]
            for art in row["operational_charter_articles"]
        }
        source = json.loads(cw.OPERATIONAL_CHARTER_PATH.read_text())["articles"]
        self.assertEqual(op_articles, {row["article"] for row in source})
        self.assertEqual(self.artifact["counts"]["operational_articles_mapped"], len(op_articles))

    def test_zero_banned_words_and_zero_public_prices(self) -> None:
        raw = json.dumps(self.artifact).lower()
        for word in BANNED_TERMS:
            self.assertNotIn(word, raw, f"Banned term '{word}' found in crosswalk")
        self.assertIsNone(re.search(r"\$\d", raw), "Found dollar sign followed by digit in public artifact")


if __name__ == "__main__":
    unittest.main()
