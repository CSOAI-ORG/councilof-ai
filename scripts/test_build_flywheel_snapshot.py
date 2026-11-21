import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("snapshot", ROOT / "build_flywheel_snapshot.py")
snapshot = importlib.util.module_from_spec(spec)
spec.loader.exec_module(snapshot)
NOW = datetime(2026, 11, 18, tzinfo=timezone.utc)


class SnapshotTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)

    def write(self, name, data):
        p = self.root / name
        p.write_text(json.dumps(data))
        return p

    def row(self, name, data):
        self.write(name, data)
        return next(r for r in snapshot.build_snapshot(self.root, NOW)["planets"]
                    if r["id"] == next(s[0] for s in snapshot.SOURCES if s[3] == name))

    def test_missing_input_is_visible_and_not_a_zero_or_signed_result(self):
        result = snapshot.build_snapshot(self.root, NOW)
        self.assertEqual(len(result["planets"]), 9)
        self.assertTrue(all(r["source_status"] == "MISSING" and "last_run_iso" not in r
                            and not r["signature_verified"] and not r["admitted"] for r in result["planets"]))
        self.assertIsNone(result["n_citizens"])

    def test_copying_old_measurement_cannot_refresh_it(self):
        p = self.write("pqcbench.json", {"measured_at": "2026-07-30T00:00:00Z"})
        os.utime(p, (NOW.timestamp(), NOW.timestamp()))
        row = next(r for r in snapshot.build_snapshot(self.root, NOW)["planets"] if r["id"] == "pqcbench")
        self.assertEqual(row["freshness"], "STALE")
        self.assertTrue(row["last_run_iso"].startswith("2026-07-30"))

    def test_generated_at_alone_is_not_measurement_time(self):
        r = self.row("pqcbench.json", {"generated_at": NOW.isoformat()})
        self.assertEqual(r["freshness"], "UNKNOWN_TIME")
        self.assertNotIn("last_run_iso", r)

    def test_future_naive_and_bad_time(self):
        for time, expected in [("2027-01-01T00:00:00Z", "FUTURE_DATED"),
                               ("2026-11-18T00:00:00", "UNKNOWN_TIME"), ("bad", "UNKNOWN_TIME")]:
            with self.subTest(time=time):
                self.assertEqual(self.row("pqcbench.json", {"run_at": time})["freshness"], expected)

    def test_freshness_boundary_and_timezone(self):
        for time, expected in [("2026-11-04T00:00:00Z", "WITHIN_WINDOW"),
                               ("2026-11-03T23:59:59Z", "STALE"),
                               ("2026-11-18T01:00:00+01:00", "WITHIN_WINDOW")]:
            with self.subTest(time=time):
                self.assertEqual(self.row("pqcbench.json", {"measured_at": time})["freshness"], expected)

    def test_source_digest_binds_exact_bytes(self):
        raw = '{"n_eff":2.5, "run_at":"2026-11-18T00:00:00Z"}'
        (self.root / "n_eff_diversity_scan.json").write_text(raw)
        row = snapshot.build_snapshot(self.root, NOW)["planets"][1]
        self.assertEqual(row["source_sha256"], hashlib.sha256(raw.encode()).hexdigest())

    def test_untrusted_signatures_and_ready_flags_do_not_promote(self):
        r = self.row("production_ready.json", {"signed": True, "verified": True, "ready": True})
        self.assertFalse(r["signature_verified"])
        self.assertFalse(r["admitted"])
        self.assertIn("not run", r["metric"])

    def test_knowledge_entry_count_is_storage_not_verification(self):
        r = self.row("sov_kb.json", [{"secret": "confidential"}, {"verified": True}])
        self.assertEqual(r["metric"], "2 stored entries")
        self.assertNotIn("confidential", json.dumps(r))

    def test_user_ledger_is_never_exported(self):
        (self.root / "decision_ledger.jsonl").write_text('{"tag":"[SCALE]","kind":"spawn","citizen_id":"private-user"}')
        inputs = self.root / "inputs"
        inputs.mkdir()
        result = snapshot.build_snapshot(inputs, NOW)
        self.assertEqual(result["citizens"], [])
        self.assertNotIn("private-user", json.dumps(result))

    def test_find_best_list_and_dict_use_only_finite_numbers(self):
        for rows in [[{"composite": 0.75}, {"composite": True}, {"composite": "99"}],
                     {"one": {"composite": 0.75}, "bad": {"composite": "99"}}]:
            r = self.row("find_besT_2026-07-30.json", {"results": rows})
            self.assertIn("0.7500", r["metric"])
        self.assertFalse(snapshot.number(float("inf")))
        self.assertFalse(snapshot.number(True))
        self.assertFalse(snapshot.number(10 ** 400))

    def test_provenance_upper_cannot_invent_denominator_or_trials(self):
        r = self.row("provbench-canonical-bound.json", {"canonical": {"rule_of_three_upper": .15}})
        self.assertIn("15%", r["metric"])
        self.assertNotIn("20", r["metric"])
        r = self.row("provbench-canonical-bound.json", {"canonical": {"rule_of_three_upper": 5}})
        self.assertEqual(r["metric"], "Metric not recorded")

    def test_empty_dict_not_a_passing_selftest(self):
        r = self.row("flywheel_daily_latest.json", {})
        self.assertEqual(r["metric"], "Metric not recorded")
        self.assertNotIn("9/9", json.dumps(r))

    def test_malformed_wrong_shape_and_nonfinite_inputs(self):
        for raw, status in [("broken", "INVALID_JSON"), ("[]", "INVALID_SHAPE"), ('{"x":NaN}', "INVALID_JSON")]:
            (self.root / "pqcbench.json").write_text(raw)
            self.assertEqual(snapshot.read_source(self.root, "pqcbench.json")[1], status)

    def test_oversized_and_external_symlink_not_read(self):
        (self.root / "pqcbench.json").write_bytes(b"x" * (snapshot.MAX_INPUT_BYTES + 1))
        self.assertEqual(snapshot.read_source(self.root, "pqcbench.json")[1], "TOO_LARGE")
        (self.root / "pqcbench.json").unlink()
        (self.root / "pqcbench.json").symlink_to(ROOT / "build_flywheel_snapshot.py")
        self.assertEqual(snapshot.read_source(self.root, "pqcbench.json")[1], "OUTSIDE_ROOT")

    def test_nonregular_input_is_not_opened(self):
        (self.root / "pqcbench.json").mkdir()
        self.assertEqual(snapshot.read_source(self.root, "pqcbench.json")[1], "UNREADABLE")

    def test_fixed_time_build_is_reproducible(self):
        self.assertEqual(snapshot.build_snapshot(self.root, NOW), snapshot.build_snapshot(self.root, NOW))

    def test_cli_and_frontend_consume_same_generated_bytes(self):
        self.write("n_eff_diversity_scan.json", {"n_eff": 2.5, "run_at": NOW.isoformat()})
        output = self.root / "snapshot.json"
        subprocess.run([sys.executable, str(ROOT / "build_flywheel_snapshot.py"), "--bench-dir", str(self.root),
                        "--as-of", NOW.isoformat(), "--output", str(output)], check=True, capture_output=True)
        code = """import fs from 'node:fs';
import { readFlywheelSnapshot } from './client/src/lib/flywheelSnapshot.ts';
const v = readFlywheelSnapshot(JSON.parse(fs.readFileSync(process.argv[1], 'utf8')));
if (!v || v.planets.length !== 9 || !v.planets[1].metric.includes('2.5')) process.exit(1);
"""
        subprocess.run(["node", "--input-type=module", "-e", code, str(output)], cwd=ROOT, check=True, capture_output=True)


if __name__ == "__main__":
    unittest.main()
