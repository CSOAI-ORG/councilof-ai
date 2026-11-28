# SPDX-License-Identifier: MIT
import importlib.util
import json
import pathlib
import subprocess
import sys
import unittest
import tempfile
from unittest.mock import patch

PATH = pathlib.Path(__file__).with_name("research-repro-check.py")
spec = importlib.util.spec_from_file_location("research_repro_check", PATH)
check = importlib.util.module_from_spec(spec)
spec.loader.exec_module(check)

def artifact(value=0.0):
    return json.dumps({"schema": "csoai.sovos-fused-readout-research/0.1",
                       "readout": [[value, 0.0, 0.0, 0.0] for _ in range(81)]}).encode()

class DiagnosticTests(unittest.TestCase):
    def test_equal_bytes(self):
        d = check.export_diagnostic(artifact(), artifact())
        self.assertEqual(d["run_sha256"], d["committed_sha256"])
        self.assertEqual(d["changed_coefficients"], 0)
        self.assertEqual(d["max_abs_coefficient_delta"], 0)

    def test_sub_tolerance_diff_still_distinct_bytes(self):
        d = check.export_diagnostic(artifact(1e-13), artifact())
        self.assertNotEqual(d["run_sha256"], d["committed_sha256"])
        self.assertEqual(d["coefficient_count"], 324)
        self.assertEqual(d["changed_coefficients"], 81)
        self.assertEqual(d["max_abs_coefficient_delta"], 1e-13)

    def test_non_numeric_and_invalid_shape_unavailable(self):
        for raw in (artifact(True), artifact(float("nan")), artifact(float("inf")), b"{}", b"invalid"):
            d = check.export_diagnostic(raw, artifact())
            self.assertEqual(d["coefficient_comparison"], "UNAVAILABLE")
            self.assertIn("run_sha256", d)

    def test_serialization_only_difference(self):
        a=artifact()
        d = check.export_diagnostic(a+b"\n", a)
        self.assertNotEqual(d["run_sha256"],d["committed_sha256"])
        self.assertEqual(d["changed_coefficients"],0)

    def test_actual_checker_keeps_byte_drift_strict(self):
        with tempfile.TemporaryDirectory() as d:
            root=pathlib.Path(d)
            (root/"recorded.json").write_bytes(artifact())
            entry={"name":"fixture","kind":"export_bytes","cwd":".",
                   "cmd":["fixture","{tmp}/export.json"],
                   "artifact":"{tmp}/export.json","committed":"recorded.json"}
            for changed in (False,True):
                def run(cmd,cwd):
                    pathlib.Path(cmd[-1]).write_bytes(artifact(1e-13 if changed else 0.0))
                    return 0,b"",b""
                with patch.object(check,"ROOT",d),patch.object(check,"run",run):
                    r=check.check(entry)
                self.assertEqual(r["status"],"DRIFT" if changed else "EXACT")
                self.assertEqual(r["detail"]["changed_coefficients"],81 if changed else 0)

    def test_overflowing_delta_unavailable(self):
        self.assertEqual(check.export_diagnostic(artifact(1e308),artifact(-1e308))["coefficient_comparison"],"UNAVAILABLE")

    def test_unknown_or_empty_selection_fails(self):
        for args in (["--only", "not_a_real_entry"], ["--only"]):
            p=subprocess.run([sys.executable, str(PATH), *args], capture_output=True)
            self.assertEqual(p.returncode,2)
            self.assertNotIn(b"all 0 entries reproduced",p.stdout)

    def test_environment_metadata_no_filepaths(self):
        d=check.numerical_environment()
        self.assertTrue(d["diagnostic_only"])
        self.assertIn("scipy",d["package_versions"])
        self.assertTrue(all("filepath" not in p for p in d["threadpools"]))
        json.dumps(d,allow_nan=False)

if __name__=="__main__":
    unittest.main()
