#!/usr/bin/env python3
"""Offline adversarial/negative-control suite for the check-standard instrument."""
import copy
from datetime import datetime, timedelta, timezone
import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from check_standard import SCHEMA, assess, digest

NOW = "2026-11-23T09:30:00Z"
START = datetime(2026, 11, 23, 9, 0, tzinfo=timezone.utc)


def utc(t):
    return t.isoformat().replace("+00:00", "Z")


def example(values):
    return {
        "schema": SCHEMA,
        "instrument_id": "test-synthetic-judge-a",
        "measurand": "fixed known-label check-standard response",
        "check_standard_id": "SYNTHETIC_NEVER_REAL_HUMAN",
        "baseline_ref_sha256": hashlib.sha256(b"synthetic-reference-2026-11-23").hexdigest(),
        "calibrated_from": "2026-11-01T00:00:00Z",
        "calibrated_until": "2026-12-01T00:00:00Z",
        "reference_value": 100.0,
        "baseline_sigma": 0.5,
        "cusum_k_sigma": 0.5,
        "cusum_h_sigma": 5.0,
        "shewhart_limit_sigma": 3.0,
        "max_sample_gap_seconds": 120,
        "samples": [
            {
                "measurement_id": f"synthetic-{i:02d}",
                "measured_at": utc(START + timedelta(minutes=i)),
                "observed_at": utc(START + timedelta(minutes=i, seconds=2)),
                "value": value,
                "source_sha256": hashlib.sha256(f"independent-test-fixture-{i}".encode()).hexdigest(),
            }
            for i, value in enumerate(values)
        ],
    }


class CheckStandardTests(unittest.TestCase):
    def state(self, x):
        return assess(x, NOW)["state"]

    def test_zero_drift_is_stable_only_on_the_check_standard(self):
        report = assess(example([100.0] * 12), NOW)
        self.assertEqual(report["state"], "STABLE_ON_CHECK_STANDARD")
        self.assertEqual(report["signals"], [])
        self.assertFalse(report["independent_calibration_verified"])
        self.assertFalse(report["source_signatures_verified"])
        self.assertFalse(report["real_world_safety_certified"])

    def test_single_spike_is_detected_by_shewhart(self):
        vals = [100.0] * 12
        vals[6] = 102.0
        report = assess(example(vals), NOW)
        self.assertEqual(report["state"], "ALARM")
        self.assertIn("SHEWHART_SINGLE_READING", report["signals"][0]["reasons"])

    def test_small_persistent_upward_shift_is_detected_by_cusum(self):
        report = assess(example([100.0] * 5 + [101.0] * 8), NOW)
        self.assertEqual(report["state"], "ALARM")
        self.assertTrue(any("CUSUM_UPWARD_SHIFT" in s["reasons"] for s in report["signals"]))

    def test_small_persistent_downward_shift_is_detected_by_cusum(self):
        report = assess(example([100.0] * 5 + [99.0] * 8), NOW)
        self.assertEqual(report["state"], "ALARM")
        self.assertTrue(any("CUSUM_DOWNWARD_SHIFT" in s["reasons"] for s in report["signals"]))

    def test_an_unexpected_foreign_field_fails_closed(self):
        x = example([100] * 8)
        x["model_approved"] = True
        self.assertEqual(self.state(x), "UNCHECKABLE")

    def test_duplicate_measurement_id_fails(self):
        x = example([100] * 8)
        x["samples"][2]["measurement_id"] = x["samples"][1]["measurement_id"]
        self.assertEqual(self.state(x), "UNCHECKABLE")

    def test_replayed_source_digest_fails_even_with_distinct_id(self):
        x = example([100] * 8)
        x["samples"][2]["source_sha256"] = x["samples"][1]["source_sha256"]
        self.assertEqual(self.state(x), "UNCHECKABLE")

    def test_future_observation_fails(self):
        x = example([100] * 8)
        x["samples"][-1]["observed_at"] = "2026-11-23T09:31:00Z"
        self.assertEqual(self.state(x), "UNCHECKABLE")

    def test_observation_before_measurement_fails(self):
        x = example([100] * 8)
        x["samples"][1]["observed_at"] = "2026-11-23T09:00:00Z"
        self.assertEqual(self.state(x), "UNCHECKABLE")

    def test_reordered_measurement_fails(self):
        x = example([100] * 8)
        x["samples"][3], x["samples"][4] = x["samples"][4], x["samples"][3]
        self.assertEqual(self.state(x), "UNCHECKABLE")

    def test_missing_window_fails(self):
        x = example([100] * 8)
        x["samples"][3]["measured_at"] = "2026-11-23T09:05:00Z"
        x["samples"][3]["observed_at"] = "2026-11-23T09:05:02Z"
        self.assertEqual(self.state(x), "UNCHECKABLE")

    def test_expired_reference_fails(self):
        x = example([100] * 8)
        x["calibrated_until"] = "2026-11-22T00:00:00Z"
        self.assertEqual(self.state(x), "UNCHECKABLE")

    def test_invented_nonfinite_sigma_fails(self):
        x = example([100] * 8)
        x["baseline_sigma"] = float("nan")
        self.assertEqual(self.state(x), "UNCHECKABLE")

    def test_boolean_numeric_fails(self):
        x = example([100] * 8)
        x["samples"][0]["value"] = True
        self.assertEqual(self.state(x), "UNCHECKABLE")

    def test_empty_readings_cannot_be_green(self):
        x = example([])
        self.assertEqual(self.state(x), "UNCHECKABLE")

    def test_unpinned_baseline_fails(self):
        x = example([100] * 8)
        x["baseline_ref_sha256"] = "unknown"
        self.assertEqual(self.state(x), "UNCHECKABLE")

    def test_not_proof_of_independent_sensors(self):
        x = example([100] * 8)
        report = assess(x, NOW)
        self.assertNotIn("independent_sensors_verified", report)
        self.assertEqual(report["evidence_state"], "READ_ONLY_SOURCE_DECLARED_CONTROL")

    def test_input_hash_deterministic_without_authority(self):
        x = example([100] * 8)
        self.assertEqual(digest(x), digest(copy.deepcopy(x)))
        self.assertEqual(len(digest(x)), 64)

    def test_cli_exit_codes_and_machine_readable_json(self):
        p = Path(__file__).with_name("check_standard.py")
        for values, expected in [([100] * 8, 0), ([100] * 5 + [102] * 5, 3)]:
            with self.subTest(exit_code=expected), tempfile.TemporaryDirectory() as root:
                input_file = Path(root) / "check.json"
                input_file.write_text(json.dumps(example(values)))
                result = subprocess.run(
                    [sys.executable, str(p), "--input", str(input_file), "--now", NOW],
                    capture_output=True, text=True, check=False,
                )
                self.assertEqual(result.returncode, expected, result.stderr)
                self.assertIn("state", json.loads(result.stdout))


if __name__ == "__main__":
    unittest.main(verbosity=2)
