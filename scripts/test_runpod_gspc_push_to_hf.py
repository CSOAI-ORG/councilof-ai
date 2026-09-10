#!/usr/bin/env python3
"""Offline regression tests for the additive private-intake transport."""
from __future__ import annotations

import contextlib
import importlib.util
import io
import os
import sys
import tempfile
import types
import unittest
from pathlib import Path
from unittest import mock

SPEC = importlib.util.spec_from_file_location(
    "runpod_gspc_push_to_hf", Path(__file__).with_name("runpod_gspc_push_to_hf.py")
)
assert SPEC and SPEC.loader
push = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = push
SPEC.loader.exec_module(push)


class FakeOperation:
    def __init__(self, *, path_in_repo: str, path_or_fileobj: str) -> None:
        self.path_in_repo = path_in_repo
        self.path_or_fileobj = path_or_fileobj


class FakeHub:
    def __init__(self, cache: Path, files: dict[str, bytes] | None = None) -> None:
        self.cache = cache
        self.files = dict(files or {})
        self.head = "a" * 40
        self.private = True
        self.commits: list[dict] = []
        self.downloads: list[tuple[str, str]] = []
        self.race_on_commit = False

    def repo_info(self, **kwargs):
        assert kwargs["repo_type"] == "dataset"
        assert kwargs["revision"] == "main"
        return types.SimpleNamespace(private=self.private, sha=self.head)

    def list_repo_files(self, **kwargs):
        assert kwargs["revision"] == self.head
        return list(self.files)

    def hf_hub_download(self, **kwargs):
        assert kwargs["revision"] == self.head
        key = kwargs["filename"]
        self.downloads.append((key, kwargs["revision"]))
        path = self.cache / f"download-{len(self.downloads)}"
        path.write_bytes(self.files[key])
        return str(path)

    def create_commit(self, **kwargs):
        # Model the Hub's parent_commit CAS, including a writer arriving after
        # repo_info. There is no automatic overwrite or retry on conflict.
        if self.race_on_commit:
            self.head = "f" * 40
        if kwargs["parent_commit"] != self.head:
            raise RuntimeError("parent commit changed")
        assert kwargs["revision"] == "main"
        assert kwargs["repo_type"] == "dataset"
        assert kwargs["create_pr"] is False
        addition = {}
        for operation in kwargs["operations"]:
            assert operation.path_in_repo not in self.files
            addition[operation.path_in_repo] = Path(operation.path_or_fileobj).read_bytes()
        self.files.update(addition)
        self.commits.append({"files": addition, "parent": kwargs["parent_commit"]})
        self.head = f"{len(self.commits):040x}"
        return types.SimpleNamespace(oid=self.head)


class PushTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.base = Path(self.temporary.name)
        self.root = self.base / "gspc-24x7"
        self.root.mkdir()
        self.stage = self.base / "stage"
        self.stage.mkdir()
        self.hub = FakeHub(self.base)
        self.output = io.StringIO()
        self.redirect = contextlib.redirect_stdout(self.output)
        self.redirect.__enter__()
        self.addCleanup(self.redirect.__exit__, None, None, None)

    def fixture(self, name: str = "run-1") -> dict[str, bytes]:
        directory = self.root / "runs" / name
        directory.mkdir(parents=True)
        files = {}
        for filename in push.REQUIRED:
            value = f"{name}:{filename}\n".encode()
            (directory / filename).write_bytes(value)
            files[f"gspc-24x7/runs/{name}/{filename}"] = value
        return files

    def freeze(self):
        return push.freeze_runs(self.root, push.complete_runs(self.root), self.stage)

    def execute(self, runs=None, *, dry_run=False):
        return push.push_runs(
            self.hub, push.REPO, "a" * 40, set(self.hub.files),
            self.freeze() if runs is None else runs, FakeOperation, dry_run=dry_run,
        )

    def test_new_runs_are_committed_as_one_atomic_batch(self) -> None:
        expected = self.fixture("one") | self.fixture("two")
        self.assertEqual(self.execute(), (2, 0))
        self.assertEqual(len(self.hub.commits), 1)
        self.assertEqual(self.hub.commits[0]["files"], expected)

    def test_matching_partial_is_completed_without_overwriting_existing_file(self) -> None:
        expected = self.fixture()
        existing = next(iter(expected))
        self.hub.files[existing] = expected[existing]
        self.assertEqual(self.execute(), (1, 0))
        self.assertEqual(len(self.hub.commits[0]["files"]), 2)
        self.assertNotIn(existing, self.hub.commits[0]["files"])
        self.assertEqual(self.hub.files, expected)
        self.assertEqual(self.hub.downloads, [(existing, "a" * 40)])

    def test_conflicting_partial_stops_all_runs_before_any_commit(self) -> None:
        self.fixture("a-new")
        expected = self.fixture("z-conflict")
        self.hub.files[next(iter(expected))] = b"different published bytes"
        with self.assertRaisesRegex(push.IntakeError, "upstream byte conflict"):
            self.execute()
        self.assertEqual(self.hub.commits, [])

    def test_complete_remote_run_is_verified_and_idempotent(self) -> None:
        self.hub.files = self.fixture()
        self.assertEqual(self.execute(), (0, 1))
        self.assertEqual(len(self.hub.downloads), 3)
        self.assertEqual(self.hub.commits, [])

    def test_complete_remote_run_with_changed_bytes_is_rejected(self) -> None:
        self.hub.files = self.fixture()
        self.hub.files[next(iter(self.hub.files))] += b"changed"
        with self.assertRaisesRegex(push.IntakeError, "byte conflict"):
            self.execute()
        self.assertEqual(self.hub.commits, [])

    def test_dry_run_compares_remote_bytes_but_does_not_commit(self) -> None:
        expected = self.fixture()
        key = next(iter(expected))
        self.hub.files[key] = expected[key]
        self.assertEqual(self.execute(dry_run=True), (1, 0))
        self.assertEqual(self.hub.commits, [])
        self.assertEqual(len(self.hub.downloads), 1)
        self.assertIn("WOULD COMMIT 1 complete runs / 2 new files", self.output.getvalue())

    def test_local_changes_after_freeze_do_not_change_uploaded_bytes(self) -> None:
        expected = self.fixture()
        frozen = self.freeze()
        for filename in push.REQUIRED:
            (self.root / "runs" / "run-1" / filename).write_bytes(b"subsequent worker output")
        self.execute(frozen)
        self.assertEqual(self.hub.files, expected)

    def test_file_limit_batches_without_splitting_triples_and_chains_parents(self) -> None:
        for number in range(101):
            self.fixture(f"run-{number:03d}")
        self.assertEqual(self.execute(), (101, 0))
        self.assertEqual([len(c["files"]) for c in self.hub.commits], [300, 3])
        self.assertEqual(self.hub.commits[1]["parent"], f"{1:040x}")
        for commit in self.hub.commits:
            parents = {str(Path(key).parent) for key in commit["files"]}
            self.assertEqual(len(commit["files"]), 3 * len(parents))

    def test_byte_limit_batches_without_splitting_runs(self) -> None:
        first = self.fixture("one")
        self.fixture("two")
        with mock.patch.object(push, "MAX_COMMIT_BYTES", sum(map(len, first.values()))):
            self.execute()
        self.assertEqual([len(c["files"]) for c in self.hub.commits], [3, 3])

    def test_oversized_run_fails_before_any_write(self) -> None:
        self.fixture()
        with mock.patch.object(push, "MAX_COMMIT_BYTES", 1):
            with self.assertRaisesRegex(push.IntakeError, "atomic commit byte limit"):
                self.execute()
        self.assertEqual(self.hub.commits, [])

    def test_changed_head_at_prewrite_check_stops_without_commit(self) -> None:
        self.fixture()
        self.hub.head = "f" * 40
        with self.assertRaisesRegex(push.IntakeError, "upstream changed"):
            self.execute()
        self.assertEqual(self.hub.commits, [])

    def test_writer_between_head_check_and_commit_is_rejected_by_cas(self) -> None:
        self.fixture()
        self.hub.race_on_commit = True
        with self.assertRaisesRegex(RuntimeError, "parent commit changed"):
            self.execute()
        self.assertEqual(self.hub.commits, [])

    def test_public_destination_fails_before_upload(self) -> None:
        self.fixture()
        self.hub.private = False
        with self.assertRaisesRegex(push.IntakeError, "not private"):
            self.execute()
        self.assertEqual(self.hub.commits, [])

    def test_connect_rejects_public_repo_even_with_working_credential(self) -> None:
        self.hub.private = False
        with mock.patch.object(push, "credential_sources", return_value=[("test source", "secret")]):
            with self.assertRaisesRegex(push.IntakeError, "not private"):
                push.connect(push.REPO, lambda **kwargs: self.hub)

    def test_explicit_token_file_is_only_source_even_with_other_credentials(self) -> None:
        token_file = self.base / "private-token"
        token = "hf_" + "a" * 32
        token_file.write_text(token + "\n")
        token_file.chmod(0o600)
        with mock.patch.dict(os.environ, {"HF_TOKEN": "account-wide-secret"}):
            self.assertEqual(push.credential_sources(token_file), [
                ("explicit private-intake credential file", token),
            ])
            calls = []
            def rejected(*, token):
                calls.append(token)
                raise RuntimeError("do not expose the credential " + token)
            with self.assertRaisesRegex(push.IntakeError, "repo access failed") as error:
                push.connect(push.REPO, rejected, token_file)
            self.assertEqual(calls, [token])
            self.assertNotIn(token, str(error.exception) + self.output.getvalue())

    def test_missing_or_symlink_token_never_falls_back(self) -> None:
        missing = self.base / "missing-token"
        with mock.patch.dict(os.environ, {"HF_TOKEN": "account-wide-secret"}):
            with self.assertRaisesRegex(push.IntakeError, "no fallback"):
                push.credential_sources(missing)
            target = self.base / "target-token"
            target.write_text("hf_" + "a" * 32)
            target.chmod(0o600)
            missing.symlink_to(target)
            with self.assertRaisesRegex(push.IntakeError, "no fallback"):
                push.credential_sources(missing)

    def test_publicly_readable_empty_or_malformed_token_file_is_rejected(self) -> None:
        token_file = self.base / "private-token"
        for content, mode in [("hf_" + "a" * 32, 0o644), ("", 0o600),
                              ("invalid-secret-value", 0o600), ("a" * 4097, 0o600)]:
            token_file.write_text(content)
            token_file.chmod(mode)
            with self.assertRaises(push.IntakeError) as error:
                push.credential_sources(token_file)
            if content:
                self.assertNotIn(content, str(error.exception))

    def test_connect_lists_the_pinned_revision_and_sanitizes_auth_failures(self) -> None:
        expected = self.fixture()
        self.hub.files = expected
        def api_class(*, token):
            if token == "bad-secret":
                raise RuntimeError("Authorization: Bearer bad-secret")
            return self.hub
        with mock.patch.object(push, "credential_sources", return_value=[
            ("first source", "bad-secret"), ("second source", "good-secret"),
        ]):
            api, revision, upstream = push.connect(push.REPO, api_class)
        self.assertIs(api, self.hub)
        self.assertEqual(revision, "a" * 40)
        self.assertEqual(upstream, set(expected))
        self.assertNotIn("secret", self.output.getvalue())

    def test_partial_local_bundle_is_skipped_and_symlink_is_rejected(self) -> None:
        self.fixture()
        directory = self.root / "runs" / "run-1"
        (directory / "run.json").unlink()
        self.assertEqual(push.complete_runs(self.root), [])
        outside = self.base / "unrelated"
        outside.write_bytes(b"private unrelated content")
        (directory / "run.json").symlink_to(outside)
        with self.assertRaisesRegex(push.IntakeError, "nonregular"):
            self.freeze()

    def test_main_sanitizes_sdk_failures_and_returns_nonzero(self) -> None:
        self.fixture()
        module = types.ModuleType("huggingface_hub")
        module.HfApi = object
        module.CommitOperationAdd = FakeOperation
        errors = io.StringIO()
        with mock.patch.dict(sys.modules, {"huggingface_hub": module}), \
             mock.patch.object(sys, "argv", ["push", "--root", str(self.root)]), \
             mock.patch.object(push, "connect", return_value=(self.hub, "a" * 40, set())), \
             mock.patch.object(self.hub, "create_commit", side_effect=RuntimeError("Bearer secret-token")), \
             contextlib.redirect_stderr(errors):
            self.assertEqual(push.main(), 2)
        self.assertNotIn("secret-token", errors.getvalue() + self.output.getvalue())
        self.assertIn("no automatic retry", errors.getvalue())


if __name__ == "__main__":
    unittest.main()
