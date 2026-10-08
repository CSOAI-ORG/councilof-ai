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
        schema = PACKAGE.parents[1] / "docs/standards/osaia-safe-reverification/safe-reverification-record-v0.1.schema.json"
        (self.pack / "schema").mkdir()
        (self.pack / "schema/safe-reverification-record-v0.1.schema.json").write_bytes(schema.read_bytes())
        with mock.patch.object(verifier, "HERE", str(self.pack)), mock.patch.dict(sys.modules, {"jsonschema": None}):
            with self.assertRaises(ImportError):
                verifier.check_validate()

    def test_missing_validator_is_unknown(self):
        # A missing data schema is unavailable; pack/validate.py is never needed.
        with mock.patch.object(verifier, "HERE", str(self.pack)):
            with self.assertRaises(FileNotFoundError):
                verifier.check_validate()

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

    def known_derived_pack(self, name, count):
        pack = Path(self.tmp.name) / name
        for directory in ("records", "events", "render", "lib"):
            (pack / directory).mkdir(parents=True)
        source_records = PACKAGE.parents[1] / "docs/standards/osaia-safe-evidence-pack/records"
        for record in sorted(source_records.glob("*.safe-rv.json"))[:count]:
            (pack / "records" / record.name).write_bytes(record.read_bytes())
        spec = importlib.util.spec_from_file_location("_trusted_fixture_generator", PACKAGE / "safe_pack.py")
        generator = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(generator)
        events, index = generator.derive(str(pack / "records"))
        (pack / "events/events.jsonl").write_text("".join(json.dumps(event, ensure_ascii=False, sort_keys=True) + "\n" for event in events))
        (pack / "events/event-ids.json").write_text(json.dumps({"records": index}))
        for relative, body in generator.renders(events).items():
            (pack / "render" / relative).write_text(body)
        return pack

    def test_two_pack_derivations_do_not_reuse_first_pack_modules(self):
        first = self.known_derived_pack("first", 1)
        second = self.known_derived_pack("second", 2)
        with mock.patch.object(verifier, "HERE", str(first)):
            self.assertEqual(verifier.check_derived(), (True, "1 events and 5 renders re-derived byte-identical"))
        with mock.patch.object(verifier, "HERE", str(second)):
            self.assertEqual(verifier.check_derived(), (True, "2 events and 5 renders re-derived byte-identical"))

    def test_missing_derivation_library_is_unknown(self):
        with mock.patch.object(verifier, "HERE", str(self.pack)), mock.patch.object(verifier, "SOURCE_DIR", str(self.pack)):
            holds, reason = verifier.check_derived()
        self.assertIsNone(holds)
        self.assertIn("trusted reader implementation unavailable", reason)

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


class PackPathBoundary(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.pack = self.root / "pack"
        self.pack.mkdir()
        self.target = self.root / "owned-target"
        self.target.write_bytes(b"owned harmless fixture")
        self.saved_here = verifier.HERE
        self.addCleanup(setattr, verifier, "HERE", self.saved_here)
        verifier.HERE = str(self.pack)

    def manifest(self, entries):
        sums = "".join(hashlib.sha256(body).hexdigest() + "  " + relative + "\n"
                       for relative, body in entries).encode()
        (self.pack / "SHA256SUMS").write_bytes(sums)
        (self.pack / "FREEZE.json").write_text(json.dumps({"sha256sums_sha256": hashlib.sha256(sums).hexdigest()}))

    def assert_rejected(self):
        try:
            holds, reason = verifier.check_sums()
        except (ValueError, OSError) as exc:
            holds, reason = False, str(exc)
        self.assertIs(holds, False, "unsafe manifest member was accepted")
        self.assertIn("unsafe pack", reason)

    def test_absolute_manifest_member_is_rejected(self):
        self.manifest([(str(self.target), self.target.read_bytes())])
        self.assert_rejected()

    def test_parent_manifest_member_is_rejected(self):
        self.manifest([("../owned-target", self.target.read_bytes())])
        self.assert_rejected()

    def test_duplicate_manifest_member_is_rejected(self):
        (self.pack / "member").write_bytes(b"owned")
        self.manifest([("member", b"owned"), ("member", b"owned")])
        self.assert_rejected()

    def test_file_symlink_is_rejected(self):
        (self.pack / "member").symlink_to(self.target)
        self.manifest([("member", self.target.read_bytes())])
        self.assert_rejected()

    def test_directory_symlink_is_rejected(self):
        (self.pack / "linked").symlink_to(self.root, target_is_directory=True)
        self.manifest([("linked/owned-target", self.target.read_bytes())])
        self.assert_rejected()

    def test_fifo_is_rejected_before_open(self):
        import os
        os.mkfifo(self.pack / "member")
        with self.assertRaises(ValueError):
            verifier.rd("member")
        raced = self.pack / "raced"
        raced.write_bytes(b"owned regular fixture")
        real_open = verifier.os.open
        swapped = False
        def raced_open(path, flags, *args, **kwargs):
            nonlocal swapped
            if path == "raced" and kwargs.get("dir_fd") is not None:
                self.assertTrue(flags & os.O_NONBLOCK)
                raced.unlink()
                os.mkfifo(raced)
                swapped = True
            return real_open(path, flags, *args, **kwargs)
        with mock.patch.object(verifier.os, "open", side_effect=raced_open):
            with self.assertRaises(ValueError):
                verifier.rd("raced")
        self.assertTrue(swapped, "controlled FIFO swap did not run")

    def test_fixed_freeze_read_does_not_follow_symlink(self):
        (self.pack / "FREEZE.json").symlink_to(self.target)
        with self.assertRaises(ValueError):
            verifier.rd("FREEZE.json")

    def test_fixed_did_read_does_not_follow_symlink(self):
        (self.pack / "did.json").symlink_to(self.target)
        with self.assertRaises(ValueError):
            verifier.rd("did.json")

    def test_directory_swap_cannot_redirect_enumeration(self):
        directory = self.pack / "directory"
        directory.mkdir()
        (directory / "inside").write_bytes(b"owned inside fixture")
        outside = self.root / "outside"
        outside.mkdir()
        (outside / "outside-member").write_bytes(b"owned outside fixture")
        parked = self.root / "parked"
        swapped = False
        real_open, real_scandir = verifier.os.open, verifier.os.scandir
        def swap():
            nonlocal swapped
            if not swapped:
                directory.rename(parked)
                directory.symlink_to(outside, target_is_directory=True)
                swapped = True
        def open_hook(path, *args, **kwargs):
            if path == "directory" and kwargs.get("dir_fd") is not None:
                swap()
            return real_open(path, *args, **kwargs)
        def scan_hook(path):
            if isinstance(path, (str, Path)) and Path(path) == directory:
                swap()
            return real_scandir(path)
        with mock.patch.object(verifier.os, "open", side_effect=open_hook), \
             mock.patch.object(verifier.os, "scandir", side_effect=scan_hook):
            with self.assertRaises(ValueError):
                verifier._pack_files()
        self.assertTrue(swapped, "controlled identity/symlink swap did not run")
        # Exercise the same no-follow identity qualification in an ancestor.
        ancestor = self.root / "anchor"
        selected = ancestor / "pack"
        selected.mkdir(parents=True)
        outside_anchor = self.root / "outside-anchor"
        (outside_anchor / "pack").mkdir(parents=True)
        parked_anchor = self.root / "parked-anchor"
        ancestor_swapped = False
        def ancestor_open(path, *args, **kwargs):
            nonlocal ancestor_swapped
            if (path == "anchor" and kwargs.get("dir_fd") is not None) or path == str(selected):
                if not ancestor_swapped:
                    ancestor.rename(parked_anchor)
                    ancestor.symlink_to(outside_anchor, target_is_directory=True)
                    ancestor_swapped = True
            return real_open(path, *args, **kwargs)
        with mock.patch.object(verifier, "HERE", str(selected)), \
             mock.patch.object(verifier.os, "open", side_effect=ancestor_open):
            with self.assertRaises(ValueError):
                descriptor = verifier._root()
                verifier.os.close(descriptor)
        self.assertTrue(ancestor_swapped, "controlled ancestor swap did not run")

    def test_leaf_open_symlink_swap_is_invalid_not_unavailable(self):
        import errno
        member = self.pack / "member"
        real_open = verifier.os.open
        # The first scenario performs a real, owned regular-file -> symlink swap.
        # The remaining cases exercise the narrow syscall-error classification.
        for scenario, expected_status, expected_holds in (
                ("symlink", 1, False), ("not-directory", 1, False),
                ("missing", 2, None), ("permission", 2, None)):
            if member.exists() or member.is_symlink():
                member.unlink()
            member.write_bytes(b"owned harmless fixture")
            self.manifest([("member", b"owned harmless fixture")])
            triggered = False
            def leaf_open(path, flags, *args, **kwargs):
                nonlocal triggered
                if path == "member" and kwargs.get("dir_fd") is not None:
                    triggered = True
                    if scenario == "symlink":
                        member.unlink()
                        member.symlink_to(self.target)
                    else:
                        code = {"not-directory": errno.ENOTDIR, "missing": errno.ENOENT,
                                "permission": errno.EACCES}[scenario]
                        raise OSError(code, "owned controlled leaf-open condition")
                return real_open(path, flags, *args, **kwargs)
            output = io.StringIO()
            with mock.patch.object(verifier.os, "open", side_effect=leaf_open), \
                 mock.patch.object(verifier, "check_validate", return_value=(True, "schema control holds")), \
                 mock.patch.object(verifier, "check_derived", return_value=(True, "derived control holds")), \
                 mock.patch.object(verifier, "check_signature", return_value=(None, "NOT_PRESENT")), \
                 redirect_stdout(output):
                status = verifier.main(["--offline", "--pack", str(self.pack)])
            summary = json.loads(output.getvalue().splitlines()[-1])
            print(json.dumps({"leaf_open_scenario": scenario, "triggered": triggered,
                              "status": status, "summary": summary}))
            self.assertTrue(triggered, scenario)
            self.assertEqual(status, expected_status, scenario)
            self.assertIs(summary["checks"]["sums"]["holds"], expected_holds, scenario)
            self.assertEqual(summary["state"], "INVALID" if expected_status == 1 else "UNCHECKABLE", scenario)
            self.assertIsNone(summary["issuer_authenticated"])
            if expected_holds is False:
                self.assertIn("unsafe pack member", summary["checks"]["sums"]["reason"])

    def test_checksum_approved_bytes_are_bound_for_later_checks(self):
        (self.pack / "member").write_bytes(b"approved bytes")
        self.manifest([("member", b"approved bytes")])
        self.assertIs(verifier.check_sums()[0], True)
        (self.pack / "member").write_bytes(b"replacement bytes")
        self.assertEqual(verifier.rd("member"), b"approved bytes")


class PackCodeBoundary(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.pack = self.root / "pack"
        (self.pack / "lib").mkdir(parents=True)
        (self.pack / "events").mkdir()
        (self.pack / "records").mkdir()
        (self.pack / "validate.py").write_text(
            "from pathlib import Path\n"
            "Path(__file__).resolve().parent.parent.joinpath('validate-marker').write_text('benign owned canary')\n"
            "print('OK')\n")
        (self.pack / "lib/safe_pack.py").write_text(
            "from pathlib import Path\n"
            "Path(__file__).resolve().parents[2].joinpath('lib-marker').write_text('benign owned canary')\n"
            "def derive(path): return [], []\n"
            "def renders(events): return {}\n")
        (self.pack / "lib/event.py").write_text("def validate(event): return []\n")
        (self.pack / "events/events.jsonl").write_text("")
        (self.pack / "events/event-ids.json").write_text('{"records":[]}')
        (self.pack / "SHA256SUMS").write_text("")
        (self.pack / "FREEZE.json").write_text('{"sha256sums_sha256":"confirmed mismatch"}')

    def run_reader(self):
        result = subprocess.run(
            [sys.executable, "-I", "-B", str(PACKAGE / "safe_pack_verify.py"),
             "--offline", "--pack", str(self.pack)], capture_output=True, text=True)
        self.assertEqual(result.returncode, 1, result.stderr)
        summary = json.loads(result.stdout.splitlines()[-1])
        self.assertEqual(summary["state"], "INVALID")
        self.assertFalse(summary["checks"]["sums"]["holds"])
        print(json.dumps({"owned_canary": True, "validate_marker": (self.root / "validate-marker").exists(),
                          "lib_marker": (self.root / "lib-marker").exists(), "state": summary["state"]}))
        return summary

    def test_matching_sums_never_authorize_selected_pack_code(self):
        listed = sorted(path for path in self.pack.rglob("*") if path.is_file() and path.name not in ("FREEZE.json", "SHA256SUMS"))
        sums = "".join(hashlib.sha256(path.read_bytes()).hexdigest() + "  " + path.relative_to(self.pack).as_posix() + "\n" for path in listed).encode()
        (self.pack / "SHA256SUMS").write_bytes(sums)
        (self.pack / "FREEZE.json").write_text(json.dumps({"sha256sums_sha256": hashlib.sha256(sums).hexdigest()}))
        result = subprocess.run([sys.executable, "-I", "-B", str(PACKAGE / "safe_pack_verify.py"),
                                 "--offline", "--pack", str(self.pack)], capture_output=True, text=True)
        self.assertEqual(result.returncode, 2, result.stderr)
        summary = json.loads(result.stdout.splitlines()[-1])
        self.assertEqual(summary["state"], "UNCHECKABLE")
        self.assertIs(summary["checks"]["sums"]["holds"], True)
        self.assertFalse((self.root / "validate-marker").exists())
        self.assertFalse((self.root / "lib-marker").exists())

    def test_unknown_schema_is_uncheckable_without_resolving_references(self):
        (self.pack / "schema").mkdir()
        (self.pack / "schema/safe-reverification-record-v0.1.schema.json").write_text(
            '{"$ref":"https://example.invalid/never-resolve"}')
        with mock.patch.object(verifier, "HERE", str(self.pack)), mock.patch.dict(sys.modules, {"jsonschema": None}):
            holds, reason = verifier.check_validate()
        self.assertIsNone(holds)
        self.assertIn("unsupported record schema", reason)

    def test_invalid_pack_never_executes_unknown_validate_script(self):
        self.run_reader()
        self.assertFalse((self.root / "validate-marker").exists(),
                         "default reader executed the selected pack's validate.py")

    def test_invalid_pack_never_imports_unknown_derivation_library(self):
        self.run_reader()
        self.assertFalse((self.root / "lib-marker").exists(),
                         "default reader imported the selected pack's lib/safe_pack.py")


if __name__ == "__main__":
    unittest.main(verbosity=2)
