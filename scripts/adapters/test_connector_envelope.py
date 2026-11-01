"""Connector envelope validator: the passing shape, and the controls that must fail.

Run: python3 -m pytest scripts/adapters/test_connector_envelope.py -q
 or: python3 -m unittest discover -s scripts/adapters -p test_connector_envelope.py
"""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE.parent))

from adapters import connector_envelope as ce  # noqa: E402

SHA = "d" * 64


def measured(**over):
    source = {"connector": "unit-test", "url": "https://example.org/api"}
    subject = {"kind": "model", "id": "unit:model", "revision": None}
    env = {
        "schema": ce.SCHEMA,
        "source": source,
        "subject": subject,
        "measurement_kind": "model-comparison",
        "artifact": {"sha256": SHA, "bytes": 10, "path": "x/card.json"},
        "observed_at": "2026-09-14T00:00:00Z",
        "license": "UNCHECKABLE",
        "provenance": {"producer": "scripts/adapters/test_connector_envelope.py", "producer_revision": "UNCHECKABLE"},
        "lifecycle_state": "MEASURED",
        "measurement": {"value": 0.5, "n": 30},
        "error": None,
        "idempotency_key": ce.idempotency_key(source, subject, "model-comparison", SHA),
        "writes_board": False,
    }
    env.update(over)
    return env


def rekey(env):
    env["idempotency_key"] = ce.idempotency_key(
        env["source"], env["subject"], env["measurement_kind"], env["artifact"].get("sha256")
    )
    return env


class PassingShapes(unittest.TestCase):
    def test_measured_envelope_passes(self):
        self.assertEqual(ce.validate(measured()), [])

    def test_indexed_envelope_passes(self):
        self.assertEqual(ce.validate(measured(lifecycle_state="INDEXED", measurement=None)), [])

    def test_error_envelope_without_bytes_passes(self):
        env = measured(lifecycle_state="UNCHECKABLE", measurement=None,
                       error={"code": "SOURCE_DOWN", "detail": "503"})
        env["artifact"] = {"sha256": None, "bytes": None, "url": "https://example.org/api"}
        self.assertEqual(ce.validate(rekey(env)), [])

    def test_key_is_order_independent_and_ignores_provenance_and_time(self):
        a = measured()
        b = measured(observed_at="2027-01-01T00:00:00Z",
                     provenance={"producer": "other", "producer_revision": "UNCHECKABLE"})
        b["source"] = {"url": a["source"]["url"], "connector": a["source"]["connector"]}
        self.assertEqual(ce.validate(b), [])
        self.assertEqual(a["idempotency_key"], b["idempotency_key"])


class FailingControls(unittest.TestCase):
    """Each control must fail, and fail for its own reason: a validator that passes these is broken."""

    def assertFailsWith(self, env, fragment):
        errs = ce.validate(env)
        self.assertTrue(errs, "control unexpectedly passed")
        self.assertTrue(any(fragment in e for e in errs), f"{fragment!r} not in {errs}")

    def test_measured_without_artifact_hash(self):
        env = measured()
        env["artifact"]["sha256"] = None
        self.assertFailsWith(rekey(env), "MEASURED requires an artifact hash")

    def test_missing_artifact_hash_field(self):
        env = measured()
        del env["artifact"]["sha256"]
        self.assertFailsWith(env, "artifact.sha256: required")

    def test_measured_with_error(self):
        self.assertFailsWith(measured(error={"code": "TIMEOUT", "detail": "x"}), "error envelope carries a measurement value")

    def test_error_envelope_with_measurement_in_error_state(self):
        env = measured(lifecycle_state="QUARANTINED", error={"code": "TIMEOUT", "detail": "x"})
        self.assertFailsWith(env, "error envelope carries a measurement value")

    def test_bad_idempotency_key(self):
        self.assertFailsWith(measured(idempotency_key="sha256:" + "0" * 64), "idempotency_key: does not match")

    def test_key_changes_when_artifact_changes(self):
        env = measured()
        env["artifact"]["sha256"] = "e" * 64
        self.assertFailsWith(env, "idempotency_key: does not match")

    def test_malformed_idempotency_key(self):
        self.assertFailsWith(measured(idempotency_key=SHA), "idempotency_key: must be sha256:")

    def test_unknown_lifecycle_state(self):
        self.assertFailsWith(measured(lifecycle_state="CERTIFIED"), "lifecycle_state: unknown")

    def test_unknown_measurement_kind(self):
        self.assertFailsWith(rekey(measured(measurement_kind="vibes")), "measurement_kind: unknown")

    def test_indexed_carrying_a_value(self):
        self.assertFailsWith(measured(lifecycle_state="INDEXED"), "INDEXED must not carry a measurement value")

    def test_measured_without_value(self):
        self.assertFailsWith(measured(measurement=None), "MEASURED requires a measurement value")

    def test_error_in_a_non_error_state(self):
        self.assertFailsWith(measured(lifecycle_state="INDEXED", measurement=None,
                                      error={"code": "X_Y", "detail": ""}), "cannot be INDEXED")

    def test_writes_board_true(self):
        self.assertFailsWith(measured(writes_board=True), "writes_board")

    def test_local_time_rejected(self):
        self.assertFailsWith(measured(observed_at="2026-09-14T00:00:00+01:00"), "observed_at")

    def test_unknown_field_rejected(self):
        self.assertFailsWith(measured(score=1), "unknown field 'score'")

    def test_not_an_object(self):
        self.assertEqual(ce.validate([]), ["envelope: not a JSON object"])


class SchemaAndValidatorAgree(unittest.TestCase):
    """The schema file and the reference validator must name the same vocabulary."""

    def setUp(self):
        self.schema = json.loads((ROOT / ce.SCHEMA_PATH).read_text())

    def test_required_fields(self):
        self.assertEqual(set(self.schema["required"]), set(ce.REQUIRED))

    def test_lifecycle_states(self):
        self.assertEqual(set(self.schema["properties"]["lifecycle_state"]["enum"]), ce.LIFECYCLE_STATES)

    def test_measurement_kinds_match_gspc_types(self):
        self.assertEqual(set(self.schema["properties"]["measurement_kind"]["enum"]), ce.MEASUREMENT_KINDS)
        types_ts = (ROOT / "functions/api/_gspc_types.ts").read_text()
        for kind in ce.MEASUREMENT_KINDS:
            self.assertIn(f'"{kind}"', types_ts)

    def test_schema_const(self):
        self.assertEqual(self.schema["properties"]["schema"]["const"], ce.SCHEMA)
        self.assertEqual(self.schema["$id"], "https://councilof.ai/schema/connector-envelope-v0.json")


class Cli(unittest.TestCase):
    def run_cli(self, *args):
        return subprocess.run([sys.executable, str(HERE / "connector_envelope.py"), *args],
                              capture_output=True, text=True)

    def test_cli_fails_closed(self):
        with tempfile.TemporaryDirectory() as d:
            good = Path(d) / "good.json"
            bad = Path(d) / "bad.jsonl"
            empty = Path(d) / "empty.jsonl"
            good.write_text(json.dumps(measured()))
            bad.write_text(json.dumps(measured()) + "\n" + json.dumps(measured(lifecycle_state="NOPE")) + "\n")
            empty.write_text("")
            self.assertEqual(self.run_cli(str(good)).returncode, 0)
            self.assertEqual(self.run_cli(str(bad)).returncode, 1)
            self.assertEqual(self.run_cli(str(empty)).returncode, 2)
            self.assertEqual(self.run_cli().returncode, 2)




class FiniteMeasurementControls(unittest.TestCase):
    """Non-finite Python floats are not JSON numeric measurement values."""

    def test_nonfinite_numeric_values_fail_in_each_measured_state(self):
        for state in ("MEASURED", "SIGNED", "ROOTED"):
            for value in (float("nan"), float("inf"), float("-inf")):
                with self.subTest(state=state, value=repr(value)):
                    errors = ce.validate(measured(
                        lifecycle_state=state, measurement={"value": value, "n": 30}
                    ))
                    self.assertTrue(any("measurement.value" in e for e in errors), errors)

    def test_finite_numeric_extremes_and_existing_scalar_types_stay_valid(self):
        for value in (0, -1, 0.5, 1e308, -1e308, True, False, "NaN", "Infinity"):
            with self.subTest(value=value):
                self.assertEqual(ce.validate(measured(measurement={"value": value, "n": 30})), [])

    def test_nonfinite_cli_inputs_are_invalid_and_never_counted_as_valid(self):
        with tempfile.TemporaryDirectory() as tmp:
            for index, value in enumerate((float("nan"), float("inf"), float("-inf"))):
                for suffix in (".json", ".jsonl"):
                    with self.subTest(value=repr(value), suffix=suffix):
                        path = Path(tmp) / (str(index) + suffix)
                        path.write_text(json.dumps(measured(
                            measurement={"value": value, "n": 30}
                        )) + "\n", encoding="utf-8")
                        result = subprocess.run(
                            [sys.executable, str(HERE / "connector_envelope.py"), str(path)],
                            capture_output=True, text=True, check=False,
                        )
                        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
                        self.assertIn("measurement.value", result.stdout)
                        self.assertIn("0/1 envelopes valid", result.stdout)
                        self.assertNotIn("Traceback", result.stderr)

    def test_invalid_member_of_a_batch_cannot_produce_a_success_exit(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "mixed.jsonl"
            path.write_text(
                json.dumps(measured()) + "\n" +
                json.dumps(measured(measurement={"value": float("nan"), "n": 30})) + "\n",
                encoding="utf-8",
            )
            result = subprocess.run(
                [sys.executable, str(HERE / "connector_envelope.py"), str(path)],
                capture_output=True, text=True, check=False,
            )
            self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
            self.assertIn("1/2 envelopes valid", result.stdout)


if __name__ == "__main__":
    unittest.main()
