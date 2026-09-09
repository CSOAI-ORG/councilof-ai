#!/usr/bin/env python3
"""Offline checks for the trusted intake artifact to OIDC signer boundary."""
from __future__ import annotations

import argparse
import contextlib
import copy
import io
import json
import sys
import tempfile
import types
import unittest
import zipfile
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))
import runpod_signing_artifact as artifact
import sign_mill_cards as signer


class ArtifactTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.quarantine = self.root / "quarantine"
        self.quarantine.mkdir()
        self.directory = self.root / "artifact"
        (self.directory / "cards").mkdir(parents=True)
        self.allowlist = self.root / "allowlist.json"
        self.allowlist.write_text('{"banks":[]}\n')
        self.run = {"id": 42, "run_attempt": 1, "head_sha": "a" * 40,
                    "head_branch": "master", "path": artifact.WORKFLOW,
                    "repository": {"full_name": artifact.REPOSITORY},
                    "head_repository": {"full_name": artifact.REPOSITORY},
                    "workflow_id": 7, "event": "workflow_dispatch",
                    "status": "completed", "conclusion": "success"}
        self.workflow = {"id": 7, "path": artifact.WORKFLOW}
        self.output = io.StringIO()
        redirect = contextlib.redirect_stdout(self.output)
        redirect.__enter__()
        self.addCleanup(redirect.__exit__, None, None, None)

    def add_card(self, suffix="one", n=36):
        run_id = f"20260909T120000.000000Z-{suffix}"
        body = {"model": f"ollama:{suffix}:1@sha256:abc", "axis": "governance", "n": n,
                "accuracy": 0.5, "status": "UNMEASURED", "unmeasured": ["awaiting admission"],
                "compute_evidence": {"run_id": run_id}}
        candidate_raw = json.dumps({"body": body}).encode()
        receipt = {"schema": "csoai.runpod-gspc-intake-verification/0.1", "state": "VERIFIED_QUARANTINE",
                   "run_id": run_id, "axis": body["axis"], "subject": body["model"],
                   "counts": {"graded_n": n}, "accuracy": body["accuracy"],
                   "source_hashes": {"card_file_sha256": artifact.digest(candidate_raw),
                                     "card_id": artifact.digest(artifact.canonical(body)),
                                     "bank_allowlist_sha256": artifact.digest(self.allowlist.read_bytes())}}
        verified = self.quarantine / suffix
        verified.mkdir()
        (verified / "candidate.json").write_bytes(candidate_raw)
        (verified / "verification.json").write_bytes(artifact.receipt_bytes(receipt))
        card = {"body": body, "source": {"run_id": run_id, "origin": "runpod-gspc-24x7"}}
        path = self.directory / "cards" / f"unsigned-{suffix}-1-governance.json"
        path.write_bytes(artifact.receipt_bytes(card))
        return path

    def build(self):
        args = argparse.Namespace(artifact_dir=self.directory, quarantine=self.quarantine,
                                  repository=artifact.REPOSITORY,
                                  workflow_ref=f"{artifact.REPOSITORY}/{artifact.WORKFLOW}@refs/heads/master",
                                  head_sha=self.run["head_sha"], run_id=42, run_attempt=1,
                                  intake_revision="b" * 40, allowlist=self.allowlist)
        artifact.build_manifest(args)
        return json.loads((self.directory / "manifest.json").read_text())

    def validate(self):
        return artifact.validate_directory(self.directory, self.run, self.allowlist)

    def archive(self):
        path = self.root / "artifact.zip"
        with zipfile.ZipFile(path, "w") as archive:
            for source in self.directory.rglob("*"):
                if source.is_file():
                    archive.write(source, source.relative_to(self.directory))
        metadata = {"id": 123, "name": artifact.artifact_name(42, 1), "expired": False,
                    "size_in_bytes": path.stat().st_size, "digest": "sha256:" + artifact.digest(path.read_bytes()),
                    "workflow_run": {"id": 42, "head_sha": self.run["head_sha"], "head_branch": "master"}}
        return path, metadata

    def test_manifest_binds_exact_staged_files_and_receipts(self):
        self.add_card("one")
        self.add_card("two", n=12)
        manifest = self.build()
        self.assertEqual(len(manifest["files"]), 2)
        self.assertEqual(self.validate(), manifest)
        self.assertTrue(all("verification_sha256" in row for row in manifest["files"]))
        self.assertNotIn("raw_output", json.dumps(manifest))
        self.assertNotIn(str(self.quarantine), json.dumps(manifest))

    def test_manifest_refuses_card_not_equal_to_verified_candidate(self):
        path = self.add_card()
        card = json.loads(path.read_text())
        card["body"]["accuracy"] = 1
        path.write_bytes(artifact.receipt_bytes(card))
        with self.assertRaisesRegex(artifact.ArtifactError, "differs from verified candidate"):
            self.build()

    def test_manifest_refuses_unrelated_legacy_inbox_files(self):
        self.add_card()
        (self.directory / "cards" / "unsigned-legacy.json").write_text('{}')
        with self.assertRaisesRegex(artifact.ArtifactError, "extra files"):
            self.build()

    def test_trusted_successful_master_run_passes(self):
        artifact.validate_run(self.run, self.workflow, 42)
        scheduled = dict(self.run, event="schedule")
        artifact.validate_run(scheduled, self.workflow, 42)

    def test_foreign_or_failed_workflow_run_is_rejected(self):
        changes = [{"id": 43}, {"repository": {"full_name": "attacker/repo"}},
                   {"head_repository": {"full_name": "attacker/repo"}},
                   {"head_branch": "untrusted"}, {"path": ".github/workflows/other.yml"},
                   {"workflow_id": 8}, {"event": "pull_request"}, {"status": "in_progress"},
                   {"conclusion": "failure"}, {"head_sha": "bad"}, {"run_attempt": 0}]
        for change in changes:
            with self.subTest(change=change), self.assertRaises(artifact.ArtifactError):
                artifact.validate_run(dict(self.run, **change), self.workflow, 42)

    def test_wrong_workflow_metadata_is_rejected(self):
        with self.assertRaisesRegex(artifact.ArtifactError, "foreign intake workflow"):
            artifact.validate_run(self.run, {"id": 7, "path": "other.yml"}, 42)

    def test_foreign_expired_or_unbound_artifact_is_rejected(self):
        self.add_card()
        self.build()
        _, valid = self.archive()
        self.assertEqual(artifact.select_artifact({"total_count": 1, "artifacts": [valid]}, self.run), valid)
        changes = [{"name": "mill-cards-unsigned-42"}, {"name": "runpod-signing-42-2"},
                   {"expired": True}, {"digest": None}, {"size_in_bytes": 0},
                   {"workflow_run": {"id": 99, "head_sha": "a" * 40, "head_branch": "master"}}]
        for change in changes:
            with self.subTest(change=change), self.assertRaises(artifact.ArtifactError):
                artifact.select_artifact({"total_count": 1, "artifacts": [dict(valid, **change)]}, self.run)
        with self.assertRaises(artifact.ArtifactError):
            artifact.select_artifact({"total_count": 2, "artifacts": [valid]}, self.run)

    def test_modified_card_bytes_are_rejected(self):
        path = self.add_card()
        self.build()
        path.write_bytes(path.read_bytes() + b" ")
        with self.assertRaisesRegex(artifact.ArtifactError, "card bytes changed"):
            self.validate()

    def test_modified_receipt_or_body_binding_is_rejected(self):
        self.add_card()
        manifest = self.build()
        row = manifest["files"][0]
        row["verification"]["counts"]["graded_n"] = 100
        (self.directory / "manifest.json").write_bytes(artifact.receipt_bytes(manifest))
        with self.assertRaisesRegex(artifact.ArtifactError, "receipt bytes changed"):
            self.validate()
        row["verification_sha256"] = artifact.digest(artifact.receipt_bytes(row["verification"]))
        (self.directory / "manifest.json").write_bytes(artifact.receipt_bytes(manifest))
        with self.assertRaisesRegex(artifact.ArtifactError, "receipt measurement differs"):
            self.validate()

    def test_manifest_head_and_attempt_are_bound_to_api_metadata(self):
        self.add_card()
        self.build()
        for change in [{"head_sha": "c" * 40}, {"run_attempt": 2}, {"id": 43}]:
            with self.subTest(change=change), self.assertRaisesRegex(artifact.ArtifactError, "run binding"):
                artifact.validate_directory(self.directory, dict(self.run, **change), self.allowlist)

    def test_current_allowlist_change_requires_new_intake(self):
        self.add_card()
        self.build()
        self.allowlist.write_text('{"banks":["different"]}')
        with self.assertRaisesRegex(artifact.ArtifactError, "allowlist changed"):
            self.validate()

    def test_extra_and_missing_files_are_rejected(self):
        path = self.add_card()
        self.build()
        extra = self.directory / "extra.json"
        extra.write_text('{}')
        with self.assertRaisesRegex(artifact.ArtifactError, "extra files"):
            self.validate()
        extra.unlink()
        path.unlink()
        with self.assertRaisesRegex(artifact.ArtifactError, "regular file"):
            self.validate()

    def test_archive_digest_mismatch_blocks_extraction(self):
        self.add_card()
        self.build()
        archive, _ = self.archive()
        with self.assertRaisesRegex(artifact.ArtifactError, "archive digest mismatch"):
            artifact.extract_checked(archive, self.root / "extract", "sha256:" + "0" * 64)
        self.assertFalse((self.root / "extract").exists())

    def test_archive_traversal_and_extra_files_are_rejected(self):
        for index, name in enumerate(["../escape.json", "/escape.json", "secret.json", "cards\\escape.json"]):
            path = self.root / f"bad-{index}.zip"
            with zipfile.ZipFile(path, "w") as archive:
                archive.writestr(name, b"bad")
            with self.subTest(name=name), self.assertRaises(artifact.ArtifactError):
                artifact.extract_checked(path, self.root / f"extract-{index}",
                                         "sha256:" + artifact.digest(path.read_bytes()))

    def test_prepare_validates_api_archive_and_manifest_before_exposing_source(self):
        self.add_card()
        self.build()
        archive, metadata = self.archive()
        out = self.root / "approved"
        responses = [self.run, self.workflow, {"total_count": 1, "artifacts": [metadata]}]
        def command(args, **kwargs):
            if args[0] == "git":
                self.assertEqual(args, ["git", "merge-base", "--is-ancestor", "a" * 40, "origin/master"])
            else:
                self.assertEqual(args, ["gh", "api", f"repos/{artifact.REPOSITORY}/actions/artifacts/123/zip"])
                kwargs["stdout"].write(archive.read_bytes())
            return types.SimpleNamespace(returncode=0)
        with mock.patch.object(artifact, "gh_json", side_effect=responses), \
             mock.patch.object(artifact.subprocess, "run", side_effect=command):
            artifact.prepare(argparse.Namespace(run_id=42, out=out, allowlist=self.allowlist))
        self.assertEqual(len(list((out / "cards").glob("unsigned-*.json"))), 1)

    def test_explicit_signer_source_excludes_legacy_and_preserves_sample_threshold(self):
        self.add_card("one", n=36)
        self.add_card("two", n=12)
        self.build()
        legacy = self.root / "legacy"
        legacy.mkdir()
        (legacy / "unsigned-old.json").write_text(json.dumps({"body": {"model": "legacy", "axis": "safety", "n": 99}}))
        signed = self.root / "signed"
        calls = []
        with mock.patch.object(signer, "SRC", legacy), mock.patch.object(signer, "DST", signed), \
             mock.patch.object(signer, "LEDGER", signed / "SUPERSEDED.jsonl"), \
             mock.patch.object(signer, "sign_via_oidc", side_effect=lambda body: calls.append(copy.deepcopy(body)) or "test-signature"):
            self.assertEqual(signer.main(["--source-dir", str(self.directory / "cards")]), 0)
        self.assertEqual(len(calls), 2)
        self.assertTrue(all(body["model"] != "legacy" for body in calls))
        self.assertEqual({body["n"]: body["status"] for body in calls}, {36: "MEASURED", 12: "UNMEASURED"})

    def test_explicit_signer_source_requires_present_nonempty_directory(self):
        with mock.patch.object(signer, "sign_via_oidc") as signing, contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(signer.main(["--source-dir", str(self.root / "absent")]), 2)
            self.assertEqual(signer.main(["--source-dir", str(self.directory / "cards")]), 2)
        signing.assert_not_called()

    def test_default_signer_source_keeps_existing_behavior(self):
        with mock.patch.object(signer, "SRC", self.root / "absent"), contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(signer.main([]), 0)


if __name__ == "__main__":
    unittest.main()
