# SPDX-License-Identifier: Apache-2.0
"""Focused regression controls for the existing OpenShell canonical importer."""
import importlib.util
import hashlib
import ast
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location("openshell_ingest_boundaries", Path(__file__).resolve().parents[1] / "ingest/openshell_in.py")
I = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(I)


class WitnessBoundary(unittest.TestCase):
    def ingest(self, rows):
        raw = json.dumps({"adapter": {"version": "0.2.1"}, "inputs": {"policy_sha256": "b" * 64}, "rows": rows}).encode()
        return I.ingest(raw, read_at="2026-11-06T00:00:00Z", control="DIVERGENT", subject="urn:example:synthetic-boundary")

    @staticmethod
    def row(kind="file", witness=None, number=1):
        return {"row": number, "kind": kind, "comparison": "HELD", "attempt": {"path": "/root/private"},
                "declared": {"effect": "denied_by_policy"}, "enforcer": {}, "witness": witness}

    def test_unknown_witness_cannot_be_promoted_by_held_label(self):
        witnesses = [{"kind": "file"}, {"kind": "file", "result": "unknown"}, {"kind": "file", "result": False},
                     {"kind": "egress", "left": "false"}, {"kind": "egress", "left": None},
                     {"kind": "syscall", "result": {}}, {"left": False}]
        for witness in witnesses:
            with self.subTest(witness=witness):
                row = self.row(witness.get("kind", "file"), witness)
                self.assertEqual(self.ingest([row])[0]["state"], "UNMEASURED")

    def test_known_typed_outcomes_remain_eligible(self):
        for kind, witness in (("file", {"kind": "file", "result": "EACCES"}),
                              ("syscall", {"kind": "syscall", "result": "EPERM"}),
                              ("egress", {"kind": "egress", "left": False})):
            with self.subTest(kind=kind):
                self.assertEqual(self.ingest([self.row(kind, witness)])[0]["state"], "CONSISTENT")

    def test_current_import_method_is_pinned_separately_from_historical_source(self):
        raw = json.dumps({"adapter": {"name": "openshell-declared-vs-observed", "version": "0.2.0"},
                          "rows": [self.row("file", {"kind": "file", "result": "EACCES"})]}).encode()
        event = I.ingest(raw, read_at="2026-11-06T00:00:00Z", control="DIVERGENT", subject="urn:example:historical")
        pins = {"evidence-fabric/openshell_witness.py": hashlib.sha256(I._HELPER_PATH.read_bytes()).hexdigest(),
                "evidence-fabric/ingest/openshell_in.py": hashlib.sha256(Path(I.__file__).read_bytes()).hexdigest()}
        self.assertEqual(event[0]["method"]["code_sha256"], hashlib.sha256(I.E.jcs(pins)).hexdigest())
        self.assertEqual(event[0]["method"]["version"], "0.2.1")
        self.assertEqual(event[0]["observed"]["source_adapter_declared"]["version"], "0.2.0")

    def test_cross_kind_witness_does_not_authenticate_row(self):
        row = self.row("file", {"kind": "egress", "left": False})
        self.assertEqual(self.ingest([row])[0]["state"], "UNMEASURED")

    def test_duplicate_or_missing_row_id_refuses_whole_import(self):
        row = self.row("file", {"kind": "file", "result": "EACCES"})
        for rows in ([row, dict(row)], [row, dict(row, comparison="DIVERGED")],
                     [dict(row, row=None)], [dict(row, row=True)], [dict(row, row=0)], [dict(row, row="1")]):
            with self.subTest(rows=rows), self.assertRaises(ValueError):
                self.ingest(rows)

    def test_missing_canonical_helper_fails_closed(self):
        with patch.object(I, "_WITNESS_OUTCOME", None), patch.object(I, "_HELPER_PATH", Path("/nonexistent/canonical-helper.py")):
            with self.assertRaisesRegex(RuntimeError, "Canonical OpenShell witness helper unavailable"):
                self.ingest([self.row("file", {"kind": "file", "result": "EACCES"})])

    def test_cli_rejects_later_duplicate_without_partial_events_or_private_error(self):
        row = self.row("file", {"kind": "file", "result": "EACCES"})
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "PRIVATE-name.json"
            path.write_text(json.dumps({"rows": [row, dict(row)]}))
            run = subprocess.run([sys.executable, str(Path(I.__file__)), str(path), "--read-at",
                                  "2026-11-06T00:00:00Z", "--control", "DIVERGENT"], capture_output=True, text=True)
            self.assertEqual(run.returncode, 2)
            self.assertEqual(run.stdout, "")
            self.assertNotIn("PRIVATE", run.stderr)
            self.assertNotIn("Traceback", run.stderr)

    def test_malformed_comparison_refuses_whole_batch_without_partial_events(self):
        valid = self.row("file", {"kind": "file", "result": "EACCES"})
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "PRIVATE-comparison.json"
            for comparison in ([], {}, None, True, 1):
                with self.subTest(comparison=comparison):
                    rows = [valid, dict(valid, row=2, comparison=comparison)]
                    with self.assertRaisesRegex(ValueError, "comparison labels must be strings"):
                        self.ingest(rows)
                    path.write_text(json.dumps({"rows": rows}))
                    run = subprocess.run([sys.executable, str(Path(I.__file__)), str(path), "--read-at",
                                          "2026-11-06T00:00:00Z", "--control", "DIVERGENT"], capture_output=True, text=True)
                    self.assertEqual(run.returncode, 2)
                    self.assertEqual(run.stdout, "")
                    self.assertNotIn("PRIVATE", run.stderr)
                    self.assertNotIn("Traceback", run.stderr)
        absent = dict(valid)
        del absent["comparison"]
        for row in (absent, dict(valid, comparison="UNKNOWN")):
            self.assertEqual(self.ingest([row])[0]["state"], "UNMEASURED")

    def test_generated_package_import_works_offline_without_harness(self):
        source_root = Path(__file__).resolve().parents[1]
        builder = ast.parse((source_root / "pypi/build_pkg.py").read_text())
        modules = next(ast.literal_eval(node.value) for node in builder.body
                       if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == "MODULES" for t in node.targets))
        self.assertIn("openshell_witness.py", modules)
        # Exercise the actual generator's rewrite function without invoking its
        # release metadata/build side effects in a sparse source checkout.
        rewrite_node = next(node for node in builder.body if isinstance(node, ast.FunctionDef) and node.name == "rewrite")
        namespace = {"re": re, "PKG": "csoai_evidence_fabric"}
        exec(compile(ast.Module(body=[rewrite_node], type_ignores=[]), "build_pkg.py", "exec"), namespace)
        with tempfile.TemporaryDirectory() as directory:
            package = Path(directory) / "src/csoai_evidence_fabric"
            (package / "ingest").mkdir(parents=True)
            (package / "__init__.py").write_text("")
            (package / "ingest/__init__.py").write_text("")
            for path in ("event.py", "openshell_witness.py", "ingest/openshell_in.py"):
                (package / path).write_text(namespace["rewrite"]((source_root / path).read_text()))
            report = json.dumps({"adapter": {"version": "0.2.0"}, "rows": [self.row("file", {"kind": "file"})]})
            program = ("import json,sys; from csoai_evidence_fabric.ingest import openshell_in as I; "
                       "events=I.ingest(sys.stdin.buffer.read(),read_at='2026-11-06T00:00:00Z',"
                       "control='DIVERGENT',subject='urn:example:packaged'); print(json.dumps(events))")
            environment = dict(os.environ, PYTHONPATH=str(Path(directory) / "src"), PYTHONDONTWRITEBYTECODE="1")
            run = subprocess.run([sys.executable, "-c", program], input=report, capture_output=True,
                                 text=True, cwd=directory, env=environment)
            self.assertEqual(run.returncode, 0, run.stderr)
            events = json.loads(run.stdout)
            self.assertEqual(events[0]["state"], "UNMEASURED")
            self.assertRegex(events[0]["method"]["code_sha256"], r"^[0-9a-f]{64}$")


if __name__ == "__main__":
    unittest.main()
