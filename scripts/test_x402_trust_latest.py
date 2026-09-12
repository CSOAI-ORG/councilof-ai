#!/usr/bin/env python3
"""latest.json is the newest archived v0.1 catalog snapshot, never v0.2."""
from __future__ import annotations

import json
import os
import unittest
from datetime import datetime

_HERE = os.path.dirname(os.path.abspath(__file__))
_TRUST = os.path.join(os.path.dirname(_HERE), "public", "interop", "x402-trust")


class LatestIsV01Snapshot(unittest.TestCase):
    def test_latest_json_equals_immutable_timestamped_v01_file(self):
        with open(os.path.join(_TRUST, "latest.json"), encoding="utf-8") as f:
            latest = json.load(f)
        stamp = datetime.strptime(latest["as_of"], "%Y-%m-%dT%H:%M:%SZ").strftime("%Y%m%dT%H%M%SZ.json")
        with open(os.path.join(_TRUST, stamp), encoding="utf-8") as f:
            archived = json.load(f)
        self.assertEqual(latest, archived)
        self.assertEqual(latest["kind"], "csoai.x402-catalog-trust-snapshot/0.1")
        counts = latest["counts"]
        self.assertEqual(
            counts["total"],
            counts["challenge_402"]
            + counts["serves_200"]
            + counts.get("alive_needs_input", counts.get("alive_but_needs_input", 0))
            + counts["template_no_reply"]
            + counts["dead_404_or_unreachable"]
            + counts.get("other_error", 0),
        )
        self.assertNotIn("rounds", latest)
        # 8-axis financial wing lives IN counts (MCP x402_trust reads this file).
        self.assertEqual(latest["counts"]["financial_axes"], 8)
        self.assertGreaterEqual(latest["counts"]["financial_probed"], 1)
        self.assertLessEqual(latest["counts"]["financial_probed"], 100)
        self.assertEqual(
            latest["counts"]["financial_total"],
            latest["counts"]["financial_ok"] + latest["counts"]["financial_unreachable"],
        )
        blob = json.dumps(latest["counts"])
        self.assertNotIn("://", blob)
        self.assertNotIn("http", blob.lower())

    def test_v2_round_file_is_not_aliased_as_latest(self):
        with open(os.path.join(_TRUST, "latest.json"), encoding="utf-8") as f:
            latest = json.load(f)
        v2_path = os.path.join(_TRUST, "v2-2026-09-07.json")
        if not os.path.isfile(v2_path):
            self.skipTest("no v2 dated file in this checkout")
        with open(v2_path, encoding="utf-8") as f:
            v2 = json.load(f)
        self.assertNotEqual(latest.get("kind"), v2.get("kind"))
        self.assertEqual(v2.get("kind"), "csoai.x402-catalog-trust-snapshot/0.2")

    def test_llms_files_point_at_latest_and_do_not_freeze_the_pair(self):
        root = os.path.dirname(_HERE)
        url = "https://councilof.ai/interop/x402-trust/latest.json"
        for rel in (
            "scripts/llms/llms.txt.tmpl",
            "scripts/llms/llms-full.txt.tmpl",
            "public/llms.txt",
            "public/llms-full.txt",
        ):
            path = os.path.join(root, rel)
            if not os.path.isfile(path):
                self.skipTest(rel)
            with open(path, encoding="utf-8") as f:
                text = f.read()
            self.assertIn(url, text, rel)
            self.assertNotIn("74/100", text, rel)


if __name__ == "__main__":
    unittest.main()
