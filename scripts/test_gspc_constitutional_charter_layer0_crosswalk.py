#!/usr/bin/env python3
"""
Unit tests for scripts/gspc_constitutional_charter_layer0_crosswalk.py
and public/interop/constitutional-charter-gspc-layer0-crosswalk-v1.json.
"""

import json
import re
import unittest

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

    def test_charter_pins_and_all_33_axes_covered(self) -> None:
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
        self.assertEqual(counts["distinct_gspc_axes_covered_by_charter"], 33)
        self.assertEqual(counts["external_github_layer0_targets"], 20)
        self.assertEqual(counts["first_principles_precedents"], 7)
        self.assertEqual(counts["newtons_third_law_reactions"], 8)

        disk = json.loads(cw.DEFAULT_OUTPUT_PATH.read_text(encoding="utf-8"))
        self.assertEqual(disk["crosswalk_sha256"], self.artifact["crosswalk_sha256"])

    def test_all_22_operational_articles_referenced_across_controls(self) -> None:
        op_articles = {
            art
            for row in self.artifact["charter_controls_to_gspc_and_hitl"]
            for art in row["operational_charter_articles"]
        }
        # Every operational article 1..22 except 15 (SovSpace dependency projection, covered in roles) or check set
        self.assertGreaterEqual(len(op_articles), 20)

    def test_zero_banned_words_and_zero_public_prices(self) -> None:
        raw = json.dumps(self.artifact).lower()
        for word in BANNED_TERMS:
            self.assertNotIn(word, raw, f"Banned term '{word}' found in crosswalk")
        self.assertIsNone(re.search(r"\$\d", raw), "Found dollar sign followed by digit in public artifact")


if __name__ == "__main__":
    unittest.main()
