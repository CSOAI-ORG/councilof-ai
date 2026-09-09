#!/usr/bin/env python3
"""Offline checks for the one-shot scheduled upload boundary."""
from __future__ import annotations

import argparse
import contextlib
import fcntl
import io
import json
import subprocess
import sys
import tempfile
import types
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))
import runpod_gspc_upload_heartbeat as heartbeat


class HeartbeatTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.uploader = self.root / "uploader.py"
        self.uploader.write_text("# def private_head(\n# def freeze_runs(\n# parent_commit=revision\n")
        self.args = argparse.Namespace(state_dir=self.root / "state", uploader=self.uploader,
                                       root=self.root / "runs", interval_seconds=21600,
                                       timeout_seconds=1200, now=False, dry_run=False)
        self.output = io.StringIO()
        redirect = contextlib.redirect_stdout(self.output)
        redirect.__enter__()
        self.addCleanup(redirect.__exit__, None, None, None)

    def runner(self, command, **kwargs):
        self.assertEqual(command[0], sys.executable)
        self.assertEqual(command[1], str(self.uploader))
        self.assertIn(heartbeat.REPO, command)
        self.assertEqual(kwargs["timeout"], 1200)
        self.assertEqual(len(kwargs["pass_fds"]), 1)
        kwargs["stdout"].write("pod-push: complete runs 56 · pushed 0 · already upstream 56 · partial skipped 14\n".encode())
        return types.SimpleNamespace(returncode=0)

    def run_once(self, runner=None):
        return heartbeat.run_once(self.args, clock=mock.Mock(side_effect=[1000.0, 1001.0]),
                                  runner=runner or self.runner)

    def latest(self, dry=False):
        return json.loads((self.args.state_dir / ("dry-run-latest.json" if dry else "latest.json")).read_text())

    def test_success_records_counts_and_is_not_due_for_six_hours(self):
        self.assertEqual(self.run_once(), 0)
        receipt = self.latest()
        self.assertEqual(receipt["state"], "SUCCESS")
        self.assertEqual(receipt["next_due_epoch"], 22600.0)
        self.assertEqual(receipt["counts"], {"complete_runs": 56, "pushed_or_planned": 0,
                                           "already_upstream": 56, "partial_skipped": 14})
        self.assertEqual(len(list((self.args.state_dir / "history").glob("*.json"))), 1)
        unused = mock.Mock()
        self.assertEqual(heartbeat.run_once(self.args, clock=lambda: 2000, runner=unused), 0)
        unused.assert_not_called()

    def test_due_after_six_hours_runs_again(self):
        self.run_once()
        runner = mock.Mock(side_effect=self.runner)
        self.assertEqual(heartbeat.run_once(self.args, clock=lambda: 22601, runner=runner), 0)
        runner.assert_called_once()
        self.assertEqual(len(list((self.args.state_dir / "history").glob("*.json"))), 2)

    def test_failed_attempt_persists_failure_and_never_logs_credentials(self):
        def failed(command, **kwargs):
            kwargs["stderr"].write(b"Authorization: Bearer private-secret\n")
            return types.SimpleNamespace(returncode=2)
        self.assertEqual(self.run_once(failed), 1)
        self.assertEqual(self.latest()["state"], "FAILED")
        self.assertEqual(self.latest()["exit_code"], 2)
        receipts = "".join(p.read_text() for p in self.args.state_dir.rglob("*.json"))
        self.assertNotIn("private-secret", receipts + self.output.getvalue())
        self.assertNotIn("Authorization", receipts + self.output.getvalue())

    def test_timeout_is_recorded_and_not_reported_as_success(self):
        runner = mock.Mock(side_effect=subprocess.TimeoutExpired(["uploader"], 1200))
        self.assertEqual(self.run_once(runner), 1)
        self.assertEqual(self.latest()["state"], "TIMEOUT")
        self.assertEqual(self.latest()["exit_code"], 124)

    def test_lock_refuses_concurrent_attempts(self):
        self.args.state_dir.mkdir()
        with (self.args.state_dir / "upload.lock").open("a+") as lock:
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            runner = mock.Mock()
            self.assertEqual(self.run_once(runner), 0)
            runner.assert_not_called()
        self.assertFalse((self.args.state_dir / "latest.json").exists())

    def test_dry_run_does_not_delay_live_attempt(self):
        self.args.dry_run = True
        runner = mock.Mock(side_effect=self.runner)
        self.assertEqual(self.run_once(runner), 0)
        self.assertIn("--dry-run", runner.call_args.args[0])
        self.assertEqual(self.latest(dry=True)["dry_run"], True)
        self.assertFalse((self.args.state_dir / "latest.json").exists())
        self.args.dry_run = False
        self.assertEqual(self.run_once(), 0)

    def test_old_per_file_uploader_is_refused(self):
        self.uploader.write_text("api.upload_file()")
        runner = mock.Mock()
        with self.assertRaisesRegex(ValueError, "atomic private-intake contract"):
            self.run_once(runner)
        runner.assert_not_called()

    def test_corrupt_state_is_preserved_and_cannot_trigger_upload(self):
        self.args.state_dir.mkdir()
        latest = self.args.state_dir / "latest.json"
        latest.write_text("broken receipt")
        runner = mock.Mock()
        with self.assertRaises(json.JSONDecodeError):
            self.run_once(runner)
        runner.assert_not_called()
        self.assertEqual(latest.read_text(), "broken receipt")

    def test_unknown_stdout_is_not_promoted_to_counts(self):
        def unknown(command, **kwargs):
            kwargs["stdout"].write(b"SUCCESS 100% all signed SECRET\n")
            return types.SimpleNamespace(returncode=0)
        self.assertEqual(self.run_once(unknown), 0)
        self.assertIsNone(self.latest()["counts"])
        self.assertNotIn("SECRET", json.dumps(self.latest()) + self.output.getvalue())


if __name__ == "__main__":
    unittest.main()
