#!/usr/bin/env python3
"""Composition-only synthetic controls; no Hub, credentials, upload or signing."""
from __future__ import annotations

import contextlib
import hashlib
import io
import json
import sys
import tempfile
import types
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))
import runpod_gspc_push_to_hf as push


class IntakeCompositionTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.base = Path(temporary.name)
        self.bundle = self.base / "bundle"
        self.legacy = self.bundle / "gspc-24x7"
        self.current = self.base / "current"

    def legacy_fixture(self):
        directory = self.legacy / "runs/legacy-1"
        directory.mkdir(parents=True)
        for name in push.REQUIRED:
            (directory / name).write_bytes(("synthetic legacy " + name + "\n").encode())
        self.write_manifest()
        return directory

    def write_manifest(self):
        self.bundle.mkdir(parents=True, exist_ok=True)
        self.legacy.mkdir(parents=True, exist_ok=True)
        lines = [
            hashlib.sha256(path.read_bytes()).hexdigest() + "  "
            + path.relative_to(self.bundle).as_posix() + "\n"
            for path in sorted(self.legacy.rglob("*")) if path.is_file()
        ]
        (self.bundle / "SHA256SUMS").write_text("".join(lines), encoding="utf-8")

    def current_fixture(self):
        # Deliberately incomplete held material belongs to the current snapshot,
        # not the supervised legacy manifest or any admission/signing path.
        directory = self.current / "pod-a/gspc/model-a/governance/runs/run-1"
        directory.mkdir(parents=True)
        (directory / "run.json").write_bytes(b'{"synthetic":true}\n')
        (directory / "gate.json").write_bytes(
            b'{"gate":"HOLD_FOR_REVIEW","signed":false,"writes_board":false}\n'
        )
        return directory

    def upload_args(self, *, current=True, manifest=True):
        args = ["--root", str(self.legacy)]
        if manifest:
            args += ["--manifest-root", str(self.bundle)]
        if current:
            args += ["--current-root", str(self.current)]
        return args

    def invoke(self, args, *, sdk_available=True):
        sdk = types.SimpleNamespace(CommitOperationAdd=object, HfApi=object)
        with mock.patch.dict(sys.modules, {"huggingface_hub": sdk if sdk_available else None}), \
             mock.patch.object(sys, "argv", ["uploader", *args]), \
             mock.patch.object(push, "credential_sources") as credentials, \
             contextlib.redirect_stdout(io.StringIO()), \
             contextlib.redirect_stderr(io.StringIO()):
            result = push.main()
            credentials.assert_not_called()
            return result

    def assert_manifest_refused_before_transport(self, *, current):
        with mock.patch.object(push, "connect") as connect, \
             mock.patch.object(push, "freeze_current_runs") as freeze_current, \
             mock.patch.object(push, "push_runs") as upload:
            self.assertEqual(self.invoke(self.upload_args(current=current)), 2)
            connect.assert_not_called()
            freeze_current.assert_not_called()
            upload.assert_not_called()

    def test_both_flags_prepare_legacy_before_connect_then_freeze_current(self):
        legacy_run = self.legacy_fixture()
        current_run = self.current_fixture()
        events, captured = [], {}
        prepare = push.prepare_frozen_runs
        freeze_current = push.freeze_current_runs

        def prepare_spy(*args):
            events.append("prepare_legacy")
            return prepare(*args)

        def connect_spy(*args):
            events.append("connect")
            return object(), "a" * 40, set()

        def current_spy(*args):
            events.append("freeze_current")
            return freeze_current(*args)

        def upload_spy(api, repo, revision, upstream, runs, operation_class, **kwargs):
            events.append("push")
            captured["runs"] = len(runs)
            captured["files"] = {
                f"{run.relative}/{name}": item.path.read_bytes()
                for run in runs for name, item in run.files.items()
            }
            captured["latest"] = [run.latest[0] for run in runs if run.latest is not None]
            return len(runs), 0

        with mock.patch.object(push, "prepare_frozen_runs", side_effect=prepare_spy), \
             mock.patch.object(push, "connect", side_effect=connect_spy), \
             mock.patch.object(push, "freeze_current_runs", side_effect=current_spy), \
             mock.patch.object(push, "push_runs", side_effect=upload_spy):
            self.assertEqual(self.invoke(self.upload_args()), 0)
        self.assertEqual(events, ["prepare_legacy", "connect", "freeze_current", "push"])
        self.assertEqual(captured["runs"], 2)
        legacy_files = {
            key: raw for key, raw in captured["files"].items()
            if key.startswith("gspc-24x7/")
        }
        self.assertEqual(legacy_files, {
            f"gspc-24x7/runs/legacy-1/{name}": (legacy_run / name).read_bytes()
            for name in push.REQUIRED
        })
        current_files = {
            key: raw for key, raw in captured["files"].items()
            if key.startswith("current-runs/snapshots/")
        }
        self.assertEqual({Path(key).name for key in current_files},
                         {"run.json", "gate.json", "source.json"})
        self.assertEqual(next(raw for key, raw in current_files.items()
                              if key.endswith("/gate.json")),
                         (current_run / "gate.json").read_bytes())
        self.assertEqual(len(captured["latest"]), 1)

    def test_corrupt_manifest_cannot_authenticate_or_collect_current(self):
        legacy_run = self.legacy_fixture()
        self.current_fixture()
        (legacy_run / "run.json").write_bytes(b"changed after manifest\n")
        self.assert_manifest_refused_before_transport(current=True)

    def test_manifested_partial_cannot_be_rescued_by_current_root(self):
        legacy_run = self.legacy_fixture()
        self.current_fixture()
        (legacy_run / "items.jsonl").unlink()
        self.write_manifest()
        self.assert_manifest_refused_before_transport(current=True)

    def test_empty_manifest_without_current_root_cannot_return_success(self):
        self.write_manifest()
        self.assert_manifest_refused_before_transport(current=False)

    def test_empty_manifest_with_current_root_cannot_return_success(self):
        self.write_manifest()
        self.current_fixture()
        self.assert_manifest_refused_before_transport(current=True)

    def test_current_only_missing_legacy_root_keeps_head_before_snapshot(self):
        self.current_fixture()
        self.assertFalse(self.legacy.exists())
        events = []
        prepare = push.prepare_frozen_runs
        freeze_current = push.freeze_current_runs

        def prepare_spy(*args):
            events.append("prepare_legacy")
            result = prepare(*args)
            self.assertEqual(result, [])
            return result

        def connect_spy(*args):
            events.append("connect")
            return object(), "b" * 40, set()

        def current_spy(*args):
            events.append("freeze_current")
            return freeze_current(*args)

        def upload_spy(api, repo, revision, upstream, runs, operation_class, **kwargs):
            events.append("push")
            self.assertEqual(len(runs), 1)
            self.assertIsNotNone(runs[0].latest)
            return 1, 0

        with mock.patch.object(push, "prepare_frozen_runs", side_effect=prepare_spy), \
             mock.patch.object(push, "connect", side_effect=connect_spy), \
             mock.patch.object(push, "freeze_current_runs", side_effect=current_spy), \
             mock.patch.object(push, "push_runs", side_effect=upload_spy):
            self.assertEqual(self.invoke(self.upload_args(manifest=False)), 0)
        self.assertEqual(events, ["prepare_legacy", "connect", "freeze_current", "push"])

    def test_offline_review_with_upload_flags_never_enters_transport(self):
        intake = self.base / "offline-intake"
        intake.mkdir()
        review = self.base / "review-out"
        args = self.upload_args() + [
            "--review-current", str(intake), "--review-out", str(review),
        ]
        with mock.patch.object(push, "prepare_frozen_runs") as prepare, \
             mock.patch.object(push, "connect") as connect, \
             mock.patch.object(push, "freeze_current_runs") as freeze_current, \
             mock.patch.object(push, "push_runs") as upload:
            self.assertEqual(self.invoke(args, sdk_available=False), 0)
            prepare.assert_not_called()
            connect.assert_not_called()
            freeze_current.assert_not_called()
            upload.assert_not_called()
        receipt = json.loads((review / "decisions.json").read_bytes())
        self.assertEqual(receipt["state"], "REVIEWED_TRANSPORT_ONLY")
        self.assertEqual(receipt["signing_staging"],
                         "BLOCKED_OWNER_PRODUCER_HOLD_INTEGRATION")
        self.assertEqual(receipt["counts"]["latest_snapshots"], 0)
        self.assertEqual(receipt["decisions"], [])


if __name__ == "__main__":
    unittest.main()
