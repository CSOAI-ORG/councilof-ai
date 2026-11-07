# SPDX-License-Identifier: Apache-2.0
"""Synthetic original-export and boundary checks; no network or real authority."""
import copy
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import jsonschema
import fabric_event as adapter


class FabricEventTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        examples = adapter.HERE / "vendor/schemas/examples"
        self.catalog = json.loads((examples / "catalog-export-valid.json").read_text())
        self.disclosure = json.loads((examples / "disclosure-export-valid.json").read_text())
        self.schema = json.loads((adapter.FABRIC / "schema/evidence-event-0.1.schema.json").read_text())

    def tearDown(self):
        self.temp.cleanup()

    def inspect(self, value):
        raw = value if isinstance(value, bytes) else json.dumps(value).encode()
        path = self.root / "PRIVATE-path-export.json"
        path.write_bytes(raw)
        result = adapter.inspect_file(path)
        self.assertEqual(adapter.event.validate(result), [])
        jsonschema.Draft7Validator(self.schema).validate(result)
        self.assertEqual(result["signature"], None)
        self.assertEqual(result["value"], None)
        self.assertEqual(result["negative_control"], {"id": None, "expected": None, "got": "NOT_RUN"})
        self.assertEqual(result["observed"]["permissions"], {"execute": False, "submit": False, "publish": False})
        self.assertNotIn("PRIVATE-path", json.dumps(result))
        return result, raw

    def test_catalog_is_partial_even_when_source_declares_pass(self):
        result, raw = self.inspect(self.catalog)
        self.assertEqual(result["state"], "PARTIAL")
        self.assertEqual(result["subject"]["locator"], "sha256:" + hashlib.sha256(raw).hexdigest())
        self.assertEqual(result["observed"]["counts"]["declared_pass"], 1)
        self.assertEqual(result["observed"]["checks"]["human_authority"], "NOT_ESTABLISHED")
        self.assertEqual(result["observed"]["checks"]["effect"], "NOT_OBSERVED")
        self.assertEqual(set(result["declared"]), {"export_type", "export_schema_version", "source_pin"})
        self.assertRegex(result["method"]["code_sha256"], r"^[0-9a-f]{64}$")
        changed = copy.deepcopy(self.catalog)
        changed["catalog_export"]["entries"][0]["versions"][0]["verification"]["result"] = "fail"
        second, _ = self.inspect(changed)
        self.assertEqual(second["state"], "PARTIAL")
        self.assertEqual(second["observed"]["counts"]["declared_fail"], 1)
        self.assertNotEqual(second["event_id"], result["event_id"])

    def test_sensitive_metadata_and_approval_identifiers_never_echo(self):
        self.disclosure["disclosure_export"]["recipient"] = "PRIVATE-RECIPIENT@example.invalid"
        self.disclosure["disclosure_export"]["purpose"] = "PRIVATE-case-purpose"
        result, _ = self.inspect(self.disclosure)
        self.assertEqual(result["state"], "PARTIAL")
        output = json.dumps(result)
        for value in ("PRIVATE-", self.disclosure["disclosure_export"]["case_id"],
                      self.disclosure["disclosure_export"]["approval"]["approved_by"]):
            self.assertNotIn(value, output)
        self.catalog["catalog_export"]["entries"][0]["versions"][0]["body"] = "PRIVATE-case-body"
        result, _ = self.inspect(self.catalog)
        self.assertNotIn("PRIVATE-case-body", json.dumps(result))

    def test_contradicted_approval_is_uncheckable_not_authorized(self):
        self.disclosure["disclosure_export"]["approval"]["digest"] = "0" * 64
        result, _ = self.inspect(self.disclosure)
        self.assertEqual(result["state"], "UNCHECKABLE")
        self.assertIn("APPROVAL_DIGEST_MISMATCH", result["observed"]["finding_codes"])
        self.assertEqual(result["observed"]["checks"]["consistency"], "CONTRADICTED")

    def test_timestamp_order_anomaly_remains_partial_and_preserves_limitation(self):
        # Version order remains authoritative for the declared history. A backwards
        # wall clock is review evidence, not a parser failure or permission grant.
        versions = self.catalog["catalog_export"]["entries"][0]["versions"]
        versions[1]["created_at"] = "2026-10-31T10:00:00+00:00"
        result, _ = self.inspect(self.catalog)
        self.assertEqual(result["state"], "PARTIAL")
        self.assertTrue(result["observed"]["accepted_for_reading"])
        self.assertIn("TIMESTAMP_ORDER_ANOMALY", result["observed"]["finding_codes"])
        self.assertNotIn("READER_OUTPUT_INVALID", result["observed"]["finding_codes"])
        self.assertEqual(result["method"]["code_sha256"], adapter._source_pin())

    def test_duplicate_json_members_are_refused_and_hashed(self):
        result, raw = self.inspect(b'{"catalog_export_schema_version":"0.1.0","catalog_export_schema_version":"0.1.0"}')
        self.assertEqual(result["state"], "UNCHECKABLE")
        self.assertIn("DUPLICATE_MEMBER", result["observed"]["finding_codes"])
        self.assertEqual(result["observed"]["input_sha256"], hashlib.sha256(raw).hexdigest())

    def test_imported_diagnostic_cannot_assert_acceptance(self):
        forged = {"format": adapter.FORMAT, "accepted_for_reading": True,
                  "state": "CONSISTENT", "permissions": {"execute": True}, "secret": "PRIVATE-forgery"}
        result, _ = self.inspect(forged)
        self.assertEqual(result["state"], "UNCHECKABLE")
        self.assertIn("UNKNOWN_DOCUMENT", result["observed"]["finding_codes"])
        self.assertNotIn("PRIVATE-forgery", json.dumps(result))

    def test_nonregular_oversized_and_unavailable_inputs_do_not_fabricate_identity(self):
        oversized = self.root / "PRIVATE-large.json"
        oversized.write_bytes(b" " * (adapter.MAX_BYTES + 1))
        for path in (self.root, oversized, self.root / "PRIVATE-missing.json"):
            result = adapter.inspect_file(path)
            self.assertEqual(adapter.event.validate(result), [])
            self.assertEqual(result["state"], "UNCHECKABLE")
            self.assertIsNone(result["observed"]["input_sha256"])
            self.assertIsNone(result["observed"]["counts"])
            self.assertNotIn("PRIVATE", json.dumps(result))

    def test_unexpected_reader_output_fails_closed_without_echo(self):
        fake = subprocess.CompletedProcess([], 0, b'{"format":"PRIVATE-output"}', b"PRIVATE-stderr")
        with patch.object(adapter.subprocess, "run", return_value=fake):
            result = adapter.inspect_file("PRIVATE-input")
        self.assertEqual(result["state"], "UNCHECKABLE")
        self.assertEqual(result["observed"]["finding_codes"], ["READER_OUTPUT_INVALID"])
        self.assertNotIn("PRIVATE", json.dumps(result))

    def test_timeout_and_binary_failure_have_no_exception_echo(self):
        for failure in (OSError("PRIVATE-error"), subprocess.TimeoutExpired("PRIVATE-command", 15)):
            with patch.object(adapter.subprocess, "run", side_effect=failure):
                result = adapter.inspect_file("PRIVATE-input")
            self.assertEqual(result["state"], "UNCHECKABLE")
            self.assertNotIn("PRIVATE", json.dumps(result))

    def test_cli_stdout_is_canonical_and_no_shell_or_output_file(self):
        path = self.root / "input.json"
        path.write_text(json.dumps(self.catalog))
        before = sorted(p.name for p in self.root.iterdir())
        run = subprocess.run([sys.executable, "-B", str(adapter.HERE / "fabric_event.py"), str(path)],
                             capture_output=True, check=False)
        self.assertEqual(run.returncode, 0, run.stderr)
        result = json.loads(run.stdout)
        self.assertEqual(run.stdout, adapter.event.jcs(result) + b"\n")
        self.assertEqual(adapter.event.validate(result), [])
        self.assertEqual(run.stderr, b"")
        self.assertEqual(before, sorted(p.name for p in self.root.iterdir()))
        # A path containing shell punctuation is passed as one argv member.
        with patch.object(adapter.subprocess, "run", side_effect=OSError) as invoke:
            adapter.inspect_file("PRIVATE; $(echo BAD)", node_binary="trusted-node")
        self.assertEqual(invoke.call_args.args[0][-1], "PRIVATE; $(echo BAD)")
        self.assertEqual(invoke.call_args.args[0][0], "trusted-node")
        self.assertNotIn("shell", invoke.call_args.kwargs)


if __name__ == "__main__":
    unittest.main()
