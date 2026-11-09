import contextlib
import hashlib
import importlib.util
import io
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

base = Path(__file__).parent
sys.path.insert(0, str(base))
spec = importlib.util.spec_from_file_location("snapshot_uploader", base / "runpod_gspc_push_to_hf.py")
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
spec.loader.exec_module(module)
import validate_runpod_intake_manifest as validator

class SnapshotControls(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(dir=base)
        self.bundle = Path(self.tmp.name) / "bundle"
        self.root = self.bundle / "gspc-24x7"
        self.run = self.root / "controlled-run"
        self.run.mkdir(parents=True)
        self.stage = Path(self.tmp.name) / "stage"
        self.stage.mkdir()
        for name in module.REQUIRED:
            (self.run / name).write_bytes(("controlled " + name).encode())
        self.manifest = self.bundle / "SHA256SUMS"
        self.write_manifest()
    def tearDown(self):
        self.tmp.cleanup()
    def write_manifest(self):
        self.manifest.write_text("".join(
            hashlib.sha256(p.read_bytes()).hexdigest() + "  " +
            p.relative_to(self.bundle).as_posix() + "\n"
            for p in sorted(self.root.rglob("*")) if p.is_file()))
    def prepare(self, manifest=True):
        return module.prepare_frozen_runs(self.root, module.complete_runs(self.root),
            self.stage, self.bundle if manifest else None)
    def test_exact_snapshot_matches_manifest(self):
        result = self.prepare()
        self.assertEqual(len(result), 1)
        for name in module.REQUIRED:
            self.assertEqual(result[0].files[name].path.read_bytes(), (self.run/name).read_bytes())
    def test_worker_change_between_validation_and_freeze_rejected(self):
        freeze = module.freeze_runs
        def changed(*args):
            (self.run / "run.json").write_bytes(b"changed worker bytes")
            return freeze(*args)
        with patch.object(module, "freeze_runs", side_effect=changed):
            with self.assertRaisesRegex(module.IntakeError, "staged file differs"):
                self.prepare()
    def test_worker_change_after_freeze_does_not_change_staged_bytes(self):
        original = (self.run / "run.json").read_bytes()
        freeze = module.freeze_runs
        def changed(*args):
            result = freeze(*args)
            (self.run / "run.json").write_bytes(b"later worker bytes")
            return result
        with patch.object(module, "freeze_runs", side_effect=changed):
            result = self.prepare()
        self.assertEqual(result[0].files["run.json"].path.read_bytes(), original)
    def test_staged_change_before_manifest_binding_rejected(self):
        freeze = module.freeze_runs
        def changed(*args):
            result = freeze(*args)
            result[0].files["run.json"].path.write_bytes(b"changed staging bytes")
            return result
        with patch.object(module, "freeze_runs", side_effect=changed):
            with self.assertRaisesRegex(module.IntakeError, "staged file differs"):
                self.prepare()
    def test_replacing_manifest_does_not_replace_frozen_digest_mapping(self):
        freeze = module.freeze_runs
        def changed(*args):
            (self.run / "run.json").write_bytes(b"replacement source")
            self.write_manifest()
            return freeze(*args)
        with patch.object(module, "freeze_runs", side_effect=changed):
            with self.assertRaisesRegex(module.IntakeError, "staged file differs"):
                self.prepare()
    def test_manifested_extra_file_cannot_be_silently_skipped(self):
        (self.root / "extra.txt").write_bytes(b"extra manifested bytes")
        self.write_manifest()
        with self.assertRaisesRegex(module.IntakeError, "staged file set differs"):
            self.prepare()
    def test_manifested_partial_run_cannot_be_silently_skipped(self):
        partial = self.root / "partial"
        partial.mkdir()
        (partial / "card-unsigned.json").write_bytes(b"partial candidate")
        self.write_manifest()
        with self.assertRaisesRegex(module.IntakeError, "staged file set differs"):
            self.prepare()
    def test_main_empty_complete_set_rejected_before_auth(self):
        (self.run / "run.json").unlink()
        self.write_manifest()
        fake_sdk = SimpleNamespace(CommitOperationAdd=object, HfApi=object)
        argv = ["uploader", "--root", str(self.root), "--manifest-root", str(self.bundle)]
        with patch.dict(sys.modules, {"huggingface_hub": fake_sdk}), \
             patch.object(sys, "argv", argv), \
             patch.object(module, "connect") as connect, \
             patch.object(module, "push_runs") as push, \
             contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(module.main(), 2)
            connect.assert_not_called()
            push.assert_not_called()
    def test_wrong_bundle_root_rejected(self):
        with self.assertRaisesRegex(module.IntakeError, "do not match"):
            module.prepare_frozen_runs(self.root, module.complete_runs(self.root),
                self.stage, Path(self.tmp.name))
    def test_legacy_mode_keeps_existing_snapshot_behavior(self):
        self.manifest.unlink()
        self.assertEqual(len(self.prepare(manifest=False)), 1)
    def test_main_failure_precedes_authentication_and_commit(self):
        freeze = module.freeze_runs
        def changed(*args):
            (self.run / "run.json").write_bytes(b"changed before auth")
            return freeze(*args)
        fake_sdk = SimpleNamespace(CommitOperationAdd=object, HfApi=object)
        argv = ["uploader", "--root", str(self.root), "--manifest-root", str(self.bundle)]
        with patch.dict(sys.modules, {"huggingface_hub": fake_sdk}), \
             patch.object(sys, "argv", argv), \
             patch.object(module, "freeze_runs", side_effect=changed), \
             patch.object(module, "connect") as connect, \
             patch.object(module, "push_runs") as push, \
             contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(module.main(), 2)
            connect.assert_not_called()
            push.assert_not_called()
    def test_reported_manifest_digest_is_the_once_read_manifest(self):
        before = self.manifest.read_bytes()
        original = validator.sha256_file
        changed = [False]
        def replace_manifest(path):
            if not changed[0]:
                self.manifest.write_text("replaced after parse")
                changed[0] = True
            return original(path)
        with patch.object(validator, "sha256_file", side_effect=replace_manifest):
            result = validator.validate(self.bundle, include_digests=True)
        self.assertEqual(result["manifest_sha256"], hashlib.sha256(before).hexdigest())

if __name__ == "__main__":
    unittest.main()
