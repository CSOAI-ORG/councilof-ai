#!/usr/bin/env python3
"""
Unit tests for scripts/gspc_permissionless_s1_ipo_measurement_bulletin.py
and public/interop/s1-ipo-measurement-readiness-v1.json.
"""

import json
import re
import unittest

try:
    from scripts import gspc_permissionless_s1_ipo_measurement_bulletin as s1_mod
except ImportError:
    import gspc_permissionless_s1_ipo_measurement_bulletin as s1_mod  # type: ignore[no-redef]


BANNED_TERMS = (
    "certify",
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


class TestPermissionlessS1IpoMeasurementBulletin(unittest.TestCase):
    def setUp(self) -> None:
        self.artifact = s1_mod.build_readiness_artifact()

    def test_schema_and_every_axis_mapped(self) -> None:
        self.assertEqual(self.artifact["schema"], "csoai.s1-ipo-measurement-readiness/1.0")
        # DERIVED, never typed: the count summarises the list the artifact carries, so
        # declaring another axis maps it here instead of breaking the build on a frozen
        # number. The check is not weakened - the count must still agree with the list.
        mapped = self.artifact["mapped_gspc_axes"]
        self.assertEqual(self.artifact["counts"]["distinct_gspc_axes_referenced"], len(mapped))
        self.assertGreater(len(mapped), 0)
        self.assertEqual(len(set(mapped)), len(mapped), "each axis is mapped once")

        disk = json.loads(s1_mod.DEFAULT_OUTPUT_PATH.read_text(encoding="utf-8"))
        self.assertEqual(disk["artifact_sha256"], self.artifact["artifact_sha256"])

    def test_bulletins_are_permissionless_and_verifiable(self) -> None:
        bulletins = self.artifact["permissionless_signal_bulletins"]
        self.assertEqual(len(bulletins), 4)
        for b in bulletins:
            self.assertFalse(b["permission_required"])
            self.assertIn("curl -sS https://councilof.ai/", b["verify_command"])

    def test_zero_banned_words_and_zero_public_prices(self) -> None:
        raw = json.dumps(self.artifact).lower()
        for word in BANNED_TERMS:
            self.assertNotIn(word, raw, f"Banned term '{word}' found in artifact")
        self.assertIsNone(re.search(r"\$\d", raw), "Found dollar sign followed by digit in public artifact")


if __name__ == "__main__":
    unittest.main()
