#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Negative controls: specific weakened private copies must fail assertions."""
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


class ImporterMutationTests(unittest.TestCase):
    def detected(self, preimage, weakened, target):
        source = (ROOT / "ingest/nemo_guardrails_in.py").read_text(encoding="utf-8")
        self.assertEqual(source.count(preimage), 1, "review changed mutation preimage")
        with tempfile.TemporaryDirectory(prefix="nemo-recount-mutant-") as folder:
            root = Path(folder)
            (root / "ingest").mkdir()
            (root / "tests").mkdir()
            shutil.copyfile(ROOT / "event.py", root / "event.py")
            shutil.copyfile(ROOT / "tests/test_nemo_guardrails_strict.py",
                            root / "tests/test_nemo_guardrails_strict.py")
            (root / "ingest/nemo_guardrails_in.py").write_text(
                source.replace(preimage, weakened), encoding="utf-8")
            run = subprocess.run(
                [sys.executable, "-B", "-m", "unittest", "-v",
                 "test_nemo_guardrails_strict.StrictTraceTests." + target],
                cwd=root / "tests", capture_output=True, text=True, timeout=20)
        output = run.stdout + run.stderr
        self.assertNotEqual(run.returncode, 0, "weakened implementation escaped")
        self.assertIn("AssertionError", output)
        self.assertIn("FAILED (failures=", output)
        self.assertNotIn("ImportError", output)
        self.assertNotIn("SyntaxError", output)

    def test_unknown_label_fallback_mutation_is_detected(self):
        self.detected(
            'return "block" if label in BLOCKING_DECISIONS else None',
            'return "block" if label in BLOCKING_DECISIONS else "allow"',
            "test_error_unknown_and_nonstring_are_not_allow")

    def test_missing_expectation_default_mutation_is_detected(self):
        self.detected(
            'expected_action = _action(turn.get("expected_action"))',
            'expected_action = _action(turn.get("expected_action", "allow"))',
            "test_missing_expected_action_is_not_default_allow")

    def test_control_report_mutation_is_detected(self):
        self.detected(
            '"expected": "DIVERGENT" if matches else "CONSISTENT",\n                      "got": ctl_relation}',
            '"expected": "DIVERGENT",\n                      "got": "DIVERGENT"}',
            "test_negative_control_reports_actual_divergent_to_consistent")


if __name__ == "__main__":
    unittest.main(verbosity=2)
