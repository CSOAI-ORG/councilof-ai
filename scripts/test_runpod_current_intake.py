#!/usr/bin/env python3
"""Synthetic offline tests for current-run collection; no model, Hub, or signing calls."""
from __future__ import annotations

import argparse
import contextlib
import io
import json
import os
import sys
import tempfile
import types
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))
from test_runpod_gspc_push_to_hf import FakeHub, FakeOperation, push
import runpod_gspc_upload_heartbeat as heartbeat


class PointerHub(FakeHub):
    def create_commit(self, **kwargs):
        if self.race_on_commit:
            self.head = "f" * 40
        if kwargs["parent_commit"] != self.head:
            raise RuntimeError("parent commit changed")
        additions = {}
        for operation in kwargs["operations"]:
            key = operation.path_in_repo
            assert key not in self.files or key.startswith("current-runs/latest/")
            additions[key] = Path(operation.path_or_fileobj).read_bytes()
        self.files.update(additions)
        self.commits.append({"files": additions, "parent": kwargs["parent_commit"]})
        self.head = f"{len(self.commits):040x}"
        return types.SimpleNamespace(oid=self.head)


class CurrentTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.base = Path(temporary.name)
        self.root = self.base / "runs"
        self.root.mkdir()
        self.hub = PointerHub(self.base)
        self.sequence = 0
        self.output = io.StringIO()
        redirect = contextlib.redirect_stdout(self.output)
        redirect.__enter__()
        self.addCleanup(redirect.__exit__, None, None, None)

    def fixture(self, pod="fixture-pod-a", state="CARD_CANDIDATE_UNSIGNED"):
        directory = self.root / pod / "gspc/model-a/governance/runs/fixture-run-1"
        directory.mkdir(parents=True)
        run = {"run_id": directory.name, "axis": "governance", "model_transport": "model:a",
               "instrument_sha256": "a" * 64, "complete": True, "num_parallel": 1}
        (directory / "run.json").write_bytes(push.canonical_json(run))
        (directory / "items.jsonl").write_bytes(b'{"synthetic":true}\n')
        (directory / "card-unsigned.json").write_bytes(b'{"synthetic":"unsigned"}\n')
        self.gate(directory, state)
        return directory

    def gate(self, directory, state, **changes):
        gate = {"schema": "csoai.churn-gate/0.3", "run_id": directory.name, "axis": "governance",
                "model": "model:a", "instrument_sha256": "a" * 64, "complete": True,
                "num_parallel": 1, "gate": state, "stands": state == "CARD_CANDIDATE_UNSIGNED",
                "signed": False, "writes_board": False}
        gate.update(changes)
        (directory / "gate.json").write_bytes(push.canonical_json(gate))

    def freeze(self):
        self.sequence += 1
        stage = self.base / f"stage-{self.sequence}"
        stage.mkdir()
        return push.freeze_current_runs(self.root, stage)

    def execute(self, frozen=None, revision=None, upstream=None):
        return push.push_runs(self.hub, push.REPO, revision or self.hub.head,
                              set(self.hub.files) if upstream is None else upstream,
                              self.freeze() if frozen is None else frozen, FakeOperation)

    def readback(self):
        self.sequence += 1
        intake = self.base / f"intake-{self.sequence}"
        for key, value in self.hub.files.items():
            path = intake / key
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(value)
        review = self.base / f"review-{self.sequence}"
        push.review_current_runs(intake, review)
        return intake, review, json.loads((review / "decisions.json").read_bytes())["decisions"]

    def test_original_bytes_and_full_identity_are_retained_in_one_commit(self):
        directory = self.fixture()
        original = {name: (directory / name).read_bytes() for name in (*push.REQUIRED, "gate.json")}
        self.assertEqual(self.execute(), (1, 0))
        commit = self.hub.commits[0]["files"]
        pointers = [key for key in commit if key.startswith("current-runs/latest/")]
        self.assertEqual(len(pointers), 1)
        manifest = json.loads(commit[pointers[0]])
        self.assertEqual(manifest["source_relative"], directory.relative_to(self.root).as_posix())
        for name, raw in original.items():
            self.assertEqual(commit[manifest["snapshot_relative"] + "/" + name], raw)
        _, _, decisions = self.readback()
        self.assertEqual(decisions[0]["producer_state"], "CANDIDATE_UNSIGNED")
        self.assertEqual(decisions[0]["signing_staging"], "BLOCKED_OWNER_PRODUCER_HOLD_INTEGRATION")

    def test_repeat_is_zero_write_and_compares_original_bytes(self):
        self.fixture()
        self.execute()
        self.assertEqual(self.execute(), (0, 1))
        self.assertEqual(len(self.hub.commits), 1)
        self.assertGreater(len(self.hub.downloads), 3)

    def test_candidate_to_hold_replaces_pointer_retains_old_snapshot_no_fallback(self):
        directory = self.fixture()
        self.execute()
        old = dict(self.hub.files)
        self.gate(directory, "HOLD_FOR_REVIEW", human_hold=True, human_released=False)
        self.execute()
        for key, raw in old.items():
            if not key.startswith("current-runs/latest/"):
                self.assertEqual(self.hub.files[key], raw)
        _, _, decisions = self.readback()
        self.assertEqual(len(decisions), 1)
        self.assertEqual(decisions[0]["producer_state"], "HELD_OR_REJECTED")
        self.assertEqual(decisions[0]["signing_staging"], "BLOCKED_OWNER_PRODUCER_HOLD_INTEGRATION")

    def test_hold_to_released_candidate_stays_blocked_for_owner_integration(self):
        directory = self.fixture(state="HOLD_FOR_REVIEW")
        self.execute()
        (directory / "HUMAN_RELEASE.json").write_bytes(b"synthetic owner release marker\n")
        self.gate(directory, "CARD_CANDIDATE_UNSIGNED", human_hold=True, human_released=True)
        self.execute()
        _, review, decisions = self.readback()
        self.assertEqual(decisions[0]["producer_state"], "CANDIDATE_UNSIGNED")
        self.assertFalse(list(review.glob("*/HUMAN_RELEASE.json")))
        self.assertTrue(any(key.endswith("/HUMAN_RELEASE.json") for key in self.hub.files))
        self.assertEqual(decisions[0]["signing_staging"], "BLOCKED_OWNER_PRODUCER_HOLD_INTEGRATION")

    def test_review_artifact_never_leaks_source_paths_gate_notes_or_release_contents(self):
        directory = self.fixture()
        private_note = "fixture-reviewer-private-note"
        (directory / "HUMAN_RELEASE.json").write_text(private_note)
        self.gate(directory, "CARD_CANDIDATE_UNSIGNED", human_hold=True,
                  human_released=True, reviewer_note=private_note)
        self.execute()
        _, review, decisions = self.readback()
        self.assertEqual({p.name for p in review.iterdir()}, {"decisions.json"})
        raw = (review / "decisions.json").read_text()
        for secret in (private_note, "fixture-pod-a", "model-a", "fixture-run-1", "source_relative", "gate.json", "HUMAN_RELEASE"):
            self.assertNotIn(secret, raw)
        self.assertEqual(set(decisions[0]), {"source_identity_sha256", "snapshot_sha256", "producer_state", "signing_staging"})

    def test_new_missing_gate_suppresses_prior_candidate(self):
        directory = self.fixture()
        self.execute()
        (directory / "gate.json").unlink()
        self.execute()
        _, _, decisions = self.readback()
        self.assertEqual(decisions[0]["producer_state"], "MISSING_OR_INVALID_GATE")

    def test_incomplete_snapshot_still_replaces_candidate_pointer(self):
        directory = self.fixture()
        self.execute()
        (directory / "card-unsigned.json").unlink()
        self.execute()
        _, _, decisions = self.readback()
        self.assertEqual(decisions[0]["producer_state"], "INCOMPLETE")

    def test_unknown_malformed_or_mismatched_producer_gate_fails_closed(self):
        directory = self.fixture()
        cases = [{"schema": "unknown"}, {"run_id": "other-run"}, {"axis": "other-axis"},
                 {"model": "other:model"}, {"signed": True}, {"writes_board": True},
                 {"human_hold": "false"}, {"human_released": 1},
                 {"instrument_sha256": "b" * 64}, {"complete": False}, {"num_parallel": 2}]
        for changes in cases:
            with self.subTest(changes=changes):
                self.gate(directory, "CARD_CANDIDATE_UNSIGNED", **changes)
                frozen = self.freeze()[0]
                manifest = json.loads(frozen.files["source.json"].path.read_bytes())
                ok, reason, _ = push.current_gate(manifest, frozen.files["source.json"].path.parent)
                self.assertFalse(ok)
                self.assertEqual(reason, "UNRECOGNISED_OR_MISMATCHED_GATE")

    def test_variant_instrument_hash_identity_is_reviewed_without_invented_sha_field(self):
        directory = self.fixture()
        run = json.loads((directory / "run.json").read_bytes())
        run["instrument_hash"] = "sha256:" + "b" * 64
        (directory / "run.json").write_bytes(push.canonical_json(run))
        gate = json.loads((directory / "gate.json").read_bytes())
        del gate["instrument_sha256"]
        gate["instrument_hash"] = run["instrument_hash"]
        (directory / "gate.json").write_bytes(push.canonical_json(gate))
        self.execute()
        _, _, decisions = self.readback()
        self.assertEqual(decisions[0]["producer_state"], "CANDIDATE_UNSIGNED")
        self.assertEqual(decisions[0]["signing_staging"], "BLOCKED_OWNER_PRODUCER_HOLD_INTEGRATION")

    def test_unreleased_human_hold_is_never_a_candidate(self):
        directory = self.fixture()
        self.gate(directory, "CARD_CANDIDATE_UNSIGNED", human_hold=True, human_released=True)
        frozen = self.freeze()[0]
        manifest = json.loads(frozen.files["source.json"].path.read_bytes())
        self.assertEqual(push.current_gate(manifest, frozen.files["source.json"].path.parent)[:2], (False, "HUMAN_HOLD"))

    def test_same_run_id_on_different_pods_keeps_both_original_identities(self):
        self.fixture("fixture-pod-a")
        self.fixture("fixture-pod-b")
        self.execute()
        _, _, decisions = self.readback()
        self.assertEqual(len(decisions), 2)
        self.assertEqual(len({d["source_identity_sha256"] for d in decisions}), 2)

    def test_snapshot_byte_tamper_cannot_use_an_older_snapshot(self):
        directory = self.fixture()
        self.execute()
        self.gate(directory, "HOLD_FOR_REVIEW")
        self.execute()
        pointer = next(key for key in self.hub.files if key.startswith("current-runs/latest/"))
        manifest = json.loads(self.hub.files[pointer])
        self.hub.files[manifest["snapshot_relative"] + "/gate.json"] = b"tampered"
        with self.assertRaisesRegex(push.IntakeError, "byte mismatch"):
            self.readback()

    def test_pointer_path_identity_tamper_is_rejected(self):
        self.fixture()
        self.execute()
        pointer = next(key for key in self.hub.files if key.startswith("current-runs/latest/"))
        manifest = json.loads(self.hub.files[pointer])
        manifest["source_relative"] = manifest["source_relative"].replace("fixture-pod-a", "fixture-pod-b")
        self.hub.files[pointer] = push.canonical_json(manifest)
        with self.assertRaisesRegex(push.IntakeError, "identity"):
            self.readback()

    def test_corrupt_pointer_reports_failed_advisory_review_with_opaque_receipt(self):
        self.fixture()
        self.execute()
        intake, _, _ = self.readback()
        next((intake / "current-runs/latest").glob("*.json")).write_bytes(b"private-corrupt-note")
        review = self.base / "failed-review"
        with mock.patch.object(sys, "argv", ["uploader", "--review-current", str(intake), "--review-out", str(review)]), \
             contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(push.main(), 2)
        receipt = json.loads((review / "decisions.json").read_bytes())
        self.assertEqual(receipt["state"], "UNCHECKABLE")
        self.assertEqual(receipt["signing_staging"], "BLOCKED_OWNER_PRODUCER_HOLD_INTEGRATION")
        self.assertNotIn("private-corrupt-note", (review / "decisions.json").read_text())
        workflow = Path(__file__).resolve().parents[1] / ".github/workflows/runpod-intake.yml"
        advisory = workflow.read_text().split("- name: Review current-run snapshots without admitting them", 1)[1].split("- name:", 1)[0]
        self.assertIn("continue-on-error: true", advisory)

    def test_source_gate_changed_after_freeze_cannot_update_latest(self):
        directory = self.fixture()
        frozen = self.freeze()
        self.gate(directory, "HOLD_FOR_REVIEW")
        with self.assertRaisesRegex(push.IntakeError, "changed after snapshot"):
            self.execute(frozen)
        self.assertEqual(self.hub.commits, [])

    def test_delayed_older_writer_cannot_rewind_newer_pointer(self):
        directory = self.fixture()
        old_head, old_upstream = self.hub.head, set(self.hub.files)
        older = self.freeze()
        self.gate(directory, "HOLD_FOR_REVIEW")
        self.execute()
        before = dict(self.hub.files)
        with self.assertRaises(push.IntakeError):
            self.execute(older, revision=old_head, upstream=old_upstream)
        self.assertEqual(self.hub.files, before)
        self.assertEqual(len(self.hub.commits), 1)

    def test_cas_race_leaves_no_partial_snapshot_or_pointer(self):
        self.fixture()
        self.hub.race_on_commit = True
        with self.assertRaises(RuntimeError):
            self.execute()
        self.assertEqual(self.hub.files, {})

    def test_main_pins_head_before_freezing_current_source(self):
        self.fixture()
        legacy = self.base / "gspc-24x7"
        legacy.mkdir()
        events = []
        real_freeze = push.freeze_current_runs
        def connect(*args):
            events.append("connect")
            return self.hub, self.hub.head, set(self.hub.files)
        def freeze(*args):
            events.append("freeze")
            return real_freeze(*args)
        hub_module = types.SimpleNamespace(CommitOperationAdd=FakeOperation, HfApi=object)
        with mock.patch.dict(sys.modules, {"huggingface_hub": hub_module}), \
             mock.patch.object(sys, "argv", ["uploader", "--root", str(legacy), "--current-root", str(self.root)]), \
             mock.patch.object(push, "connect", side_effect=connect), \
             mock.patch.object(push, "freeze_current_runs", side_effect=freeze):
            self.assertEqual(push.main(), 0)
        self.assertEqual(events, ["connect", "freeze"])

    def test_missing_current_root_is_explicit_even_when_legacy_succeeds(self):
        legacy = self.base / "gspc-24x7"
        directory = legacy / "runs/legacy-run"
        directory.mkdir(parents=True)
        for name in push.REQUIRED:
            (directory / name).write_bytes(b"synthetic legacy bytes\n")
        hub_module = types.SimpleNamespace(CommitOperationAdd=FakeOperation, HfApi=object)
        with mock.patch.dict(sys.modules, {"huggingface_hub": hub_module}), \
             mock.patch.object(sys, "argv", ["uploader", "--root", str(legacy), "--current-root", str(self.base / "missing")]), \
             mock.patch.object(push, "connect", return_value=(self.hub, self.hub.head, set())):
            self.assertEqual(push.main(), 0)
        _, facts = heartbeat.output_facts(io.BytesIO(self.output.getvalue().encode()))
        self.assertEqual(facts["current_collection"], "UNAVAILABLE")
        self.assertEqual(facts["closed_bundles"], 1)
        self.assertNotIn("complete_runs", facts)

    def test_read_denied_current_root_is_unavailable_not_silently_empty(self):
        original = os.scandir
        def denied(path):
            if Path(path) == self.root:
                raise PermissionError("synthetic denial")
            return original(path)
        with mock.patch.object(push.os, "scandir", side_effect=denied):
            self.assertFalse(push.current_root_available(self.root))
            with self.assertRaisesRegex(push.IntakeError, "cannot be listed"):
                self.freeze()

    def test_heartbeat_retains_scope_and_transport_units(self):
        args = argparse.Namespace(state_dir=self.base / "state", uploader=Path(push.__file__),
            root=self.base / "legacy", current_root=self.base / "missing", token_file=self.base / "synthetic-token",
            interval_seconds=21600, timeout_seconds=1200, now=True, dry_run=False)
        def runner(command, **kwargs):
            self.assertIn("--current-root", command)
            kwargs["stdout"].write("current-collection: UNAVAILABLE\npod-push: closed bundles 1 · pushed 1 · already upstream 0 · partial skipped 0\n".encode())
            return types.SimpleNamespace(returncode=0)
        self.assertEqual(heartbeat.run_once(args, clock=lambda: 1000, runner=runner), 0)
        receipt = json.loads((args.state_dir / "latest.json").read_bytes())
        self.assertEqual(receipt["current_collection"], "UNAVAILABLE")
        self.assertEqual(receipt["counts"]["closed_bundles"], 1)
        self.assertNotIn("complete_runs", receipt["counts"])

    def test_legacy_layout_and_bytes_remain_unchanged(self):
        legacy = self.base / "gspc-24x7"
        directory = legacy / "runs/legacy-run"
        directory.mkdir(parents=True)
        for name in push.REQUIRED:
            (directory / name).write_bytes(b"legacy original\n")
        stage = self.base / "legacy-stage"
        stage.mkdir()
        frozen = push.freeze_runs(legacy, push.complete_runs(legacy), stage)
        self.execute(frozen)
        self.assertEqual(set(self.hub.files), {f"gspc-24x7/runs/legacy-run/{name}" for name in push.REQUIRED})
        self.assertTrue(all(raw == b"legacy original\n" for raw in self.hub.files.values()))

    def test_symlinked_source_parent_is_refused(self):
        self.fixture()
        (self.root / "fixture-pod-b").symlink_to(self.root / "fixture-pod-a", target_is_directory=True)
        with self.assertRaisesRegex(push.IntakeError, "unsafe"):
            self.freeze()


if __name__ == "__main__":
    unittest.main()
