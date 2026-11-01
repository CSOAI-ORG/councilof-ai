import copy
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
import profile as subject

class ProfileTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.check = subject.load_module("check")
        cls.gen = subject.load_module("generate")

    def run_case(self, value):
        before = copy.deepcopy(value)
        out = subject.evaluate(value, self.check)
        self.assertEqual(value, before)
        self.assertIs(out["execution_authority"], False)
        return out

    def test_all_ten_original_cases_preserved(self):
        expected = json.loads((subject.UP / "expected.json").read_text())["cases"]
        for cid, row in expected.items():
            with self.subTest(cid=cid):
                out = self.run_case(self.check.load_case(cid))
                self.assertEqual((out["result"], out["reason"]), (row["result"], row["reason"]))

    def test_all_eleven_original_mutations_preserved(self):
        expected = json.loads((subject.UP / "expected.json").read_text())["mutations"]
        for mid, (base, _, mutate) in self.check.MUTATIONS.items():
            with self.subTest(mid=mid):
                inp = self.check.load_case(base); mutate(inp)
                out = self.run_case(inp)
                self.assertEqual((out["result"], out["reason"]), (expected[mid]["result"], expected[mid]["reason"]))

    def test_subject_mismatch_with_valid_signature(self):
        inp = self.check.load_case("C01")
        payload = dict(inp["statement"]["payload"], identifier="urn:example:subject-b")
        inp["statement"] = self.gen.timestamped(self.gen.sign(payload, "k-2026"), "2026-10-10T12:00:00Z")
        out = self.run_case(inp)
        self.assertEqual(out["upstream_result"]["result"], "pass")
        self.assertEqual(out["reason"], "SUBJECT_MISMATCH")

    def test_future_lookup(self):
        inp = self.check.load_case("C01"); inp["lookup"]["fetchedAt"] = "2026-10-12T00:00:00Z"
        self.assertEqual(self.run_case(inp)["reason"], "LOOKUP_TIME_AFTER_EVALUATION")

    def test_future_attested_signing(self):
        inp = self.check.load_case("C01")
        inp["statement"] = self.gen.timestamped(self.gen.sign(inp["statement"]["payload"], "k-2026"), "2026-10-12T00:00:00Z")
        self.assertEqual(self.run_case(inp)["reason"], "ATTESTED_TIME_AFTER_EVALUATION")

    def test_equal_lookup_boundary_passes(self):
        inp = self.check.load_case("C01"); inp["lookup"]["fetchedAt"] = inp["evaluationInstant"]
        self.assertEqual(self.run_case(inp)["result"], "pass")

    def test_equal_attested_boundary_passes(self):
        inp = self.check.load_case("C01")
        inp["statement"] = self.gen.timestamped(self.gen.sign(inp["statement"]["payload"], "k-2026"), inp["evaluationInstant"])
        self.assertEqual(self.run_case(inp)["result"], "pass")

    def test_equivalent_timezone(self):
        inp = self.check.load_case("C01"); inp["evaluationInstant"] = "2026-10-11T01:00:00+01:00"
        self.assertEqual(self.run_case(inp)["result"], "pass")

    def test_missing_and_naive_times_hold(self):
        for value in [None, "2026-10-11", "2026-10-11T00:00:00", "2026-10-11T00:00:00-00:00", "2026-99-11T00:00:00Z"]:
            with self.subTest(value=value):
                inp = self.check.load_case("C01"); inp["evaluationInstant"] = value
                self.assertEqual(self.run_case(inp)["reason"], "MALFORMED_INPUT")

    def test_missing_envelopes_hold(self):
        for key in ["policy", "statement", "lookup", "history", "evaluationInstant"]:
            inp = self.check.load_case("C01"); del inp[key]
            self.assertEqual(self.run_case(inp)["result"], "could-not-determine")

    def test_wrong_field_types_hold(self):
        for key in ["policy", "statement", "lookup", "history"]:
            for value in [None, [], "", 7, True]:
                inp = self.check.load_case("C01"); inp[key] = value
                self.assertEqual(self.run_case(inp)["result"], "could-not-determine")

    def test_unknown_algorithm_holds(self):
        inp = self.check.load_case("C01"); inp["statement"]["sig"]["alg"] = "none"
        self.assertEqual(self.run_case(inp)["reason"], "MALFORMED_INPUT")

    def test_bad_signature_is_not_hidden_by_future_lookup(self):
        inp = self.check.load_case("C01"); self.check.m01(inp)
        inp["lookup"]["fetchedAt"] = "2026-10-12T00:00:00Z"
        self.assertEqual(self.run_case(inp)["reason"], "BAD_SIGNATURE")

    def test_duplicate_keys_rejected(self):
        with self.assertRaises(subject.InvalidInput): subject.parse(b'{"a":1,"a":2}')

    def test_nonfinite_rejected(self):
        for value in [b'NaN', b'{"a":Infinity}', b'{"a":-Infinity}']:
            with self.assertRaises(subject.InvalidInput): subject.parse(value)

    def test_oversize_rejected(self):
        with self.assertRaises(subject.InvalidInput): subject.parse(b' ' * (subject.MAX_BYTES + 1))

    def test_deep_nesting_rejected(self):
        with self.assertRaises(subject.InvalidInput): subject.parse(b'{"a":' * 40 + b'0' + b'}' * 40)

    def test_wrong_top_level_rejected(self):
        for value in [b'[]', b'null', b'"text"']:
            with self.assertRaises(subject.InvalidInput): subject.parse(value)

    def test_retained_input_digest(self):
        inp = self.check.load_case("C01")
        first = self.run_case(inp)
        self.assertEqual(first, self.run_case(inp))
        inp["id"] = "changed"
        self.assertNotEqual(first["input_sha256"], self.run_case(inp)["input_sha256"])

    def test_cli_exit_codes_and_no_action_authority(self):
        for case, code in [("C01",0),("C03",1),("C08",2)]:
            raw = json.dumps(self.check.load_case(case))
            run = subprocess.run([sys.executable, str(subject.HERE/'profile.py'), '-'], input=raw, text=True, capture_output=True)
            self.assertEqual(run.returncode, code, run.stderr)
            self.assertIs(json.loads(run.stdout)["execution_authority"], False)

    def test_cli_bad_json_holds(self):
        run = subprocess.run([sys.executable, str(subject.HERE/'profile.py'), '-'], input='{', text=True, capture_output=True)
        self.assertEqual(run.returncode, 2)
        self.assertEqual(json.loads(run.stdout)["reason"], "UNREADABLE_INPUT")

    def test_cli_missing_upstream_is_integrity_error(self):
        with tempfile.TemporaryDirectory() as td:
            import shutil
            path=Path(td)/'profile.py'
            shutil.copy2(subject.HERE/'profile.py',path)
            run=subprocess.run([sys.executable,str(path),'-'],input='{}',text=True,capture_output=True)
            self.assertEqual(run.returncode,3)
            self.assertIs(json.loads(run.stderr)['execution_authority'],False)

    def test_manifest_detects_corruption(self):
        # Test the manifest with an isolated copy; never alter the pinned fixtures.
        with tempfile.TemporaryDirectory() as td:
            import shutil
            root = Path(td)
            shutil.copytree(subject.HERE/'upstream',root/'upstream')
            shutil.copy2(subject.HERE/'upstream_manifest.json',root/'upstream_manifest.json')
            target=root/'upstream/trust/key-evidence-states-v0/check.py'
            target.write_bytes(target.read_bytes()+b'\n')
            old=subject.HERE
            try:
                subject.HERE=root
                with self.assertRaises(RuntimeError):subject.verify_upstream()
            finally:subject.HERE=old

if __name__ == '__main__': unittest.main(verbosity=2)
