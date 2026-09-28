#!/usr/bin/env python3
"""Black-box controls for the off-edge registry census staging command."""
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "stage-registry-census.py"
SOURCE = ROOT / "public" / "interop" / "mcp-registry-2026-09-23" / "census.json"


class StageRegistryCensusTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.public = self.root / "public"
        self.public.mkdir()

    def run_stage(self, *args: str):
        return subprocess.run(
            [sys.executable, str(SCRIPT), "--public-root", str(self.public), *args],
            text=True, capture_output=True, check=False,
        )

    def pointer(self):
        return json.loads((self.public / "interop" / "mcp-registry-latest.json").read_text())

    def test_timestamped_copy_pointer_and_check(self):
        staged = self.run_stage("--input", str(SOURCE))
        self.assertEqual(staged.returncode, 0, staged.stderr)
        pointer = self.pointer()
        self.assertEqual(pointer["servers"], 354)
        self.assertEqual(pointer["version_rows"], 1342)
        self.assertEqual(pointer["source_artifact"], "/interop/mcp-registry-census/2026-09-23T05-25-04Z.json")
        immutable = self.public / pointer["source_artifact"].lstrip("/")
        self.assertEqual(immutable.read_bytes(), SOURCE.read_bytes())
        self.assertEqual(pointer["source_sha256"], hashlib.sha256(immutable.read_bytes()).hexdigest())
        self.assertEqual(self.run_stage("--check").returncode, 0)

    def test_restage_same_bytes_is_idempotent_and_same_timestamp_collision_is_rejected(self):
        self.assertEqual(self.run_stage("--input", str(SOURCE)).returncode, 0)
        before = (self.public / "interop" / "mcp-registry-latest.json").read_bytes()
        self.assertEqual(self.run_stage("--input", str(SOURCE)).returncode, 0)
        self.assertEqual((self.public / "interop" / "mcp-registry-latest.json").read_bytes(), before)
        changed = json.loads(SOURCE.read_text())
        changed["servers"] += 1
        other = self.root / "changed.json"
        other.write_text(json.dumps(changed))
        result = self.run_stage("--input", str(other))
        self.assertEqual(result.returncode, 2)
        self.assertIn("same measurement timestamp has different bytes", result.stderr)
        self.assertEqual((self.public / "interop" / "mcp-registry-latest.json").read_bytes(), before)

    def test_incomplete_measurement_fails_without_replacing_latest(self):
        self.assertEqual(self.run_stage("--input", str(SOURCE)).returncode, 0)
        before = (self.public / "interop" / "mcp-registry-latest.json").read_bytes()
        bad = json.loads(SOURCE.read_text())
        bad["version_read_failures"] = ["io.github.CSOAI-ORG/failure"]
        bad["version_rows"] = None
        candidate = self.root / "incomplete.json"
        candidate.write_text(json.dumps(bad))
        result = self.run_stage("--input", str(candidate))
        self.assertEqual(result.returncode, 2)
        self.assertIn("UNCHECKABLE", result.stderr)
        self.assertEqual((self.public / "interop" / "mcp-registry-latest.json").read_bytes(), before)

    def test_newer_measurement_advances_latest_and_preserves_older_immutable_bytes(self):
        self.assertEqual(self.run_stage("--input", str(SOURCE)).returncode, 0)
        first = self.pointer()
        first_source = self.public / first["source_artifact"].lstrip("/")
        first_bytes = first_source.read_bytes()
        later = json.loads(SOURCE.read_text())
        later["measured_utc"] = "2026-09-24T05:00:00Z"
        later["completed_utc"] = "2026-09-24T05:01:00Z"
        later["servers"] = 355
        later["version_rows"] = 1343
        later["status_counts"] = {"active": 355}
        candidate = self.root / "later.json"
        candidate.write_text(json.dumps(later))
        result = self.run_stage("--input", str(candidate))
        self.assertEqual(result.returncode, 0, result.stderr)
        advanced = self.pointer()
        self.assertEqual(advanced["servers"], 355)
        self.assertEqual(advanced["source_artifact"], "/interop/mcp-registry-census/2026-09-24T05-01-00Z.json")
        self.assertEqual(first_source.read_bytes(), first_bytes)
        self.assertEqual(self.run_stage("--check").returncode, 0)

    def test_check_catches_tampered_source_bytes(self):
        self.assertEqual(self.run_stage("--input", str(SOURCE)).returncode, 0)
        pointer = self.pointer()
        source = self.public / pointer["source_artifact"].lstrip("/")
        source.write_bytes(b"{}")
        result = self.run_stage("--check")
        self.assertEqual(result.returncode, 2)
        self.assertIn("UNCHECKABLE", result.stderr)


if __name__ == "__main__":
    unittest.main()
