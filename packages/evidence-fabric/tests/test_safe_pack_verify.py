"""Whole-pack verdict/path regressions; historical pack bytes are read only."""
import hashlib
import importlib.util
import io
import json
from contextlib import redirect_stdout
from pathlib import Path
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest import mock

PACKAGE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PACKAGE))
import safe_pack_verify as verifier
import safe_freeze_v2 as signature_helper

HELPER_SHA = "72b78809880e0ed053ddb2e35f4b598a67a25295eeb58dd6abdda41e61fd3de8"
FREEZE = b'{"schema":"csoai.safe-evidence-pack/0.1","sha256sums_sha256":"fixture"}'
CONSISTENT = "SELF_CONSISTENT_UNAUTHENTICATED_KEY"


class WholePackVerdict(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.pack = Path(self.tmp.name) / "pack"
        self.pack.mkdir()
        (self.pack / "FREEZE.json").write_bytes(FREEZE)
        self.saved_here = verifier.HERE
        self.addCleanup(setattr, verifier, "HERE", self.saved_here)

    def main_result(self, signature=None, sums=(True, "sums hold"), pack=None):
        selected = pack or self.pack
        out = io.StringIO()
        with mock.patch.object(verifier, "check_sums", return_value=sums), \
             mock.patch.object(verifier, "check_validate", return_value=(True, "schema holds")), \
             mock.patch.object(verifier, "check_derived", return_value=(True, "derivation holds")), \
             mock.patch.object(verifier, "check_signature", return_value=signature or (None, "NOT_PRESENT")), \
             mock.patch.object(verifier, "HERE", str(selected)), \
             mock.patch.object(sys, "argv", ["safe_pack_verify.py", "--offline", "--pack", str(selected)]), \
             redirect_stdout(out):
            status = verifier.main()
        output = out.getvalue()
        summary = json.loads(output.splitlines()[-1])
        self.assertNotIn("VERIFIED pack", output)
        self.assertIsNone(summary["issuer_authenticated"])
        return status, summary

    def actual_missing_signature(self, signed=False, did=False):
        if signed:
            (self.pack / "FREEZE.signed.json").write_text("{}")
        if did:
            (self.pack / "did.json").write_text("{}")
        out = io.StringIO()
        with mock.patch.object(verifier, "check_sums", return_value=(True, "sums hold")), \
             mock.patch.object(verifier, "check_validate", return_value=(True, "schema holds")), \
             mock.patch.object(verifier, "check_derived", return_value=(True, "derivation holds")), \
             mock.patch.object(verifier, "HERE", str(self.pack)), \
             mock.patch.object(sys, "argv", ["safe_pack_verify.py", "--offline", "--pack", str(self.pack)]), \
             redirect_stdout(out):
            status = verifier.main()
        summary = json.loads(out.getvalue().splitlines()[-1])
        self.assertEqual(status, 2)
        self.assertEqual(summary["state"], "UNCHECKABLE")
        self.assertIsNone(summary["signature_valid"])
        self.assertIsNone(summary["issuer_authenticated"])

    def test_missing_signature_is_not_overall_verified(self):
        self.actual_missing_signature(did=True)

    def test_missing_did_is_not_overall_verified(self):
        self.actual_missing_signature(signed=True)

    def test_both_signature_inputs_absent_is_uncheckable(self):
        self.actual_missing_signature()

    def test_supplied_key_consistency_is_not_issuer_authentication(self):
        status, summary = self.main_result((True, CONSISTENT))
        self.assertEqual(status, 2)
        self.assertEqual(summary["state"], CONSISTENT)
        self.assertIs(summary["signature_valid"], True)
        self.assertEqual(summary["checks"]["sums"]["holds"], True)

    def test_confirmed_signature_rejection_is_invalid(self):
        status, summary = self.main_result((False, "signature does not verify"))
        self.assertEqual(status, 1)
        self.assertEqual(summary["state"], "INVALID")
        self.assertIs(summary["signature_valid"], False)

    def test_unavailable_signature_dependency_is_uncheckable(self):
        status, summary = self.main_result((None, "cryptography not available"))
        self.assertEqual(status, 2)
        self.assertEqual(summary["state"], "UNCHECKABLE")
        self.assertIsNone(summary["signature_valid"])

    def test_integrity_failure_takes_precedence_over_unknown_signature(self):
        status, summary = self.main_result(sums=(False, "digest differs"))
        self.assertEqual(status, 1)
        self.assertEqual(summary["state"], "INVALID")
        self.assertFalse(summary["checks"]["sums"]["holds"])

    def test_unavailable_inputs_do_not_raise_in_final_summary(self):
        (self.pack / "FREEZE.json").unlink()
        out = io.StringIO()
        with mock.patch.object(verifier, "check_validate", return_value=(True, "schema holds")), \
             mock.patch.object(verifier, "check_derived", return_value=(True, "derivation holds")), \
             mock.patch.object(verifier, "check_signature", return_value=(None, "NOT_PRESENT")), \
             mock.patch.object(verifier, "HERE", str(self.pack)), \
             mock.patch.object(sys, "argv", ["safe_pack_verify.py", "--offline", "--pack", str(self.pack)]), \
             redirect_stdout(out):
            status = verifier.main()
        self.assertEqual(status, 2)
        summary = json.loads(out.getvalue().splitlines()[-1])
        self.assertEqual(summary["state"], "UNCHECKABLE")
        self.assertIsNone(summary["checks"]["sums"]["holds"])

    def test_malformed_freeze_do_not_raise_in_final_summary(self):
        (self.pack / "FREEZE.json").write_text("{")
        (self.pack / "SHA256SUMS").write_text("")
        out = io.StringIO()
        with mock.patch.object(verifier, "check_validate", return_value=(True, "schema holds")), \
             mock.patch.object(verifier, "check_derived", return_value=(True, "derivation holds")), \
             mock.patch.object(verifier, "check_signature", return_value=(None, "NOT_PRESENT")), \
             mock.patch.object(verifier, "HERE", str(self.pack)), \
             mock.patch.object(sys, "argv", ["safe_pack_verify.py", "--offline", "--pack", str(self.pack)]), \
             redirect_stdout(out):
            status = verifier.main()
        self.assertEqual(status, 2)
        self.assertEqual(json.loads(out.getvalue().splitlines()[-1])["state"], "UNCHECKABLE")

    def test_validator_missing_dependency_is_unknown(self):
        (self.pack / "validate.py").write_text("")
        result = SimpleNamespace(returncode=1, stdout="", stderr="ModuleNotFoundError: No module named 'jsonschema'")
        with mock.patch.object(verifier, "HERE", str(self.pack)), \
             mock.patch.object(verifier.subprocess, "run", return_value=result):
            holds, reason = verifier.check_validate()
        self.assertIsNone(holds)
        self.assertIn("dependency", reason)

    def test_missing_validator_is_unknown(self):
        with mock.patch.object(verifier, "HERE", str(self.pack)):
            holds, reason = verifier.check_validate()
        self.assertIsNone(holds)
        self.assertIn("NOT_PRESENT", reason)

    def test_selected_pack_path_is_used_by_checks(self):
        other = Path(self.tmp.name) / "other"
        other.mkdir()
        seen = []
        def sums():
            seen.append(Path(verifier.HERE))
            return True, "selected"
        out = io.StringIO()
        with mock.patch.object(verifier, "HERE", str(self.pack)), \
             mock.patch.object(verifier, "check_sums", side_effect=sums), \
             mock.patch.object(verifier, "check_validate", return_value=(True, "schema holds")), \
             mock.patch.object(verifier, "check_derived", return_value=(True, "derivation holds")), \
             mock.patch.object(verifier, "check_signature", return_value=(None, "NOT_PRESENT")), \
             mock.patch.object(sys, "argv", ["safe_pack_verify.py", "--offline", "--pack", str(other)]), \
             redirect_stdout(out):
            self.assertEqual(verifier.main(), 2)
        self.assertEqual(seen, [other])
        self.assertEqual(Path(json.loads(out.getvalue().splitlines()[-1])["pack"]), other)

    def test_signature_adapter_uses_exact_qualified_helper(self):
        raw = {"FREEZE.json": FREEZE, "FREEZE.signed.json": b"signed bytes", "did.json": b"DID bytes"}
        for name, content in raw.items():
            (self.pack / name).write_bytes(content)
        with mock.patch.object(verifier, "HERE", str(self.pack)), \
             mock.patch.object(signature_helper, "check_signature", return_value=(True, CONSISTENT)) as check:
            self.assertEqual(verifier.check_signature(), (True, CONSISTENT))
        check.assert_called_once_with(raw["FREEZE.json"], raw["FREEZE.signed.json"], raw["did.json"])

    def fake_derived_pack(self, name, count):
        pack = Path(self.tmp.name) / name
        (pack / "lib").mkdir(parents=True)
        (pack / "events").mkdir()
        (pack / "render").mkdir()
        evs = [{"event_id": name + str(i)} for i in range(count)]
        idx = [{"record_file": name}]
        (pack / "lib/safe_pack.py").write_text(
            "def derive(path): return " + repr((evs, idx)) + "\n"
            "def renders(evs): return {'fixture.txt': " + repr(name) + "}\n")
        (pack / "lib/event.py").write_text("def validate(event): return []\n")
        (pack / "events/events.jsonl").write_text("".join(json.dumps(e, ensure_ascii=False, sort_keys=True) + "\n" for e in evs))
        (pack / "events/event-ids.json").write_text(json.dumps({"records": idx}))
        (pack / "render/fixture.txt").write_text(name)
        return pack

    def test_two_pack_derivations_do_not_reuse_first_pack_modules(self):
        first = self.fake_derived_pack("first", 1)
        second = self.fake_derived_pack("second", 2)
        saved = {name: sys.modules.pop(name) for name in ("safe_pack", "event") if name in sys.modules}
        old_path = list(sys.path)
        sys.path.insert(0, str(first / "lib"))
        try:
            with mock.patch.object(verifier, "HERE", str(first)):
                self.assertEqual(verifier.check_derived(), (True, "1 events and 1 renders re-derived byte-identical"))
            with mock.patch.object(verifier, "HERE", str(second)):
                self.assertEqual(verifier.check_derived(), (True, "2 events and 1 renders re-derived byte-identical"))
        finally:
            sys.path[:] = old_path
            for name in ("safe_pack", "event"):
                sys.modules.pop(name, None)
            sys.modules.update(saved)

    def test_missing_derivation_library_is_unknown(self):
        with mock.patch.object(verifier, "HERE", str(self.pack)):
            holds, reason = verifier.check_derived()
        self.assertIsNone(holds)
        self.assertIn("ModuleNotFoundError", reason)

    def test_generator_copies_importable_exact_helper_and_sums_it(self):
        spec = importlib.util.spec_from_file_location("_safe_pack_generator", PACKAGE / "safe_pack.py")
        generator = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(generator)
        draft = Path(self.tmp.name) / "draft"
        generator.copy_lib(str(draft))
        helper = draft / "lib/safe_freeze_v2.py"
        self.assertEqual(hashlib.sha256(helper.read_bytes()).hexdigest(), HELPER_SHA)
        self.assertIn(HELPER_SHA + "  lib/safe_freeze_v2.py", generator.write_sums(str(draft)))
        code = "import sys; sys.path.insert(0, sys.argv[1]); import safe_freeze_v2; assert safe_freeze_v2.check_signature(b'{}')[0] is None"
        result = subprocess.run([sys.executable, "-I", "-B", "-c", code, str(draft / "lib")], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)


    def listed_members_result(self, members):
        lines = []
        for rel, expected_bytes, actual_bytes in members:
            lines.append(hashlib.sha256(expected_bytes).hexdigest() + "  " + rel)
            if actual_bytes is not None:
                path = self.pack / rel
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(actual_bytes)
        sums = ("\n".join(lines) + "\n").encode()
        (self.pack / "SHA256SUMS").write_bytes(sums)
        (self.pack / "FREEZE.json").write_text(json.dumps({
            "schema": "csoai.safe-evidence-pack/0.1",
            "sha256sums_sha256": hashlib.sha256(sums).hexdigest()}))
        out = io.StringIO()
        with mock.patch.object(verifier, "check_validate", return_value=(True, "schema holds")), \
             mock.patch.object(verifier, "check_derived", return_value=(True, "derivation holds")), \
             mock.patch.object(verifier, "check_signature", return_value=(None, "NOT_PRESENT")), \
             mock.patch.object(verifier, "HERE", str(self.pack)), \
             mock.patch.object(sys, "argv", ["safe_pack_verify.py", "--offline", "--pack", str(self.pack)]), \
             redirect_stdout(out):
            status = verifier.main()
        return status, json.loads(out.getvalue().splitlines()[-1])

    def test_missing_checksums_listed_member_is_uncheckable(self):
        status, summary = self.listed_members_result([("records/missing.json", b"original", None)])
        self.assertEqual(status, 2)
        self.assertEqual(summary["state"], "UNCHECKABLE")
        self.assertIsNone(summary["checks"]["sums"]["holds"])
        self.assertIn("NOT_PRESENT", summary["checks"]["sums"]["reason"])

    def test_present_checksums_member_digest_mismatch_is_invalid(self):
        status, summary = self.listed_members_result([("records/present.json", b"original", b"altered")])
        self.assertEqual(status, 1)
        self.assertEqual(summary["state"], "INVALID")
        self.assertIs(summary["checks"]["sums"]["holds"], False)
        self.assertIn("present.json", summary["checks"]["sums"]["reason"])

    def test_missing_first_cannot_mask_later_observed_digest_mismatch(self):
        status, summary = self.listed_members_result([
            ("records/a-missing.json", b"original", None),
            ("records/z-present.json", b"original", b"altered")])
        self.assertEqual(status, 1)
        self.assertEqual(summary["state"], "INVALID")
        self.assertIs(summary["checks"]["sums"]["holds"], False)
        self.assertIn("z-present.json", summary["checks"]["sums"]["reason"])

    def test_offline_flag_remains_required(self):
        with mock.patch.object(sys, "argv", ["safe_pack_verify.py"]), redirect_stdout(io.StringIO()):
            self.assertEqual(verifier.main(), 2)


if __name__ == "__main__":
    unittest.main(verbosity=2)
