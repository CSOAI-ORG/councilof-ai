"""Run: python3 -m unittest /Users/nicholas/clawd/_alignment/test_csoai_kaggle_refresh_guard_20260924.py"""

import importlib.util
from pathlib import Path
from tempfile import TemporaryDirectory
from types import SimpleNamespace
import unittest
from unittest import mock


FILE = Path(__file__).with_name("csoai-kaggle-refresh-guard-20260924.py")
spec = importlib.util.spec_from_file_location("kaggle_refresh_guard", FILE)
guard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)


class KagglePublicationDecision(unittest.TestCase):
    def test_same_bytes_never_create_another_version(self):
        self.assertEqual(guard.decision("a", "a", "a", 38, 38), "UNCHANGED")

    def test_ready_version_blocks_duplicate_while_default_lags(self):
        self.assertEqual(guard.decision("a", "a", "b", 38, 38), "WAITING_KAGGLE_DEFAULT")
        self.assertEqual(guard.decision("a", "a", "b", 37, 38), "WAITING_KAGGLE_POINTER")

    def test_change_is_publishable_only_after_pointer_converges(self):
        self.assertEqual(guard.decision("a", "b", "b", 38, 38), "SPRAY_REQUIRED")
        self.assertEqual(guard.decision("a", "b", "b", 37, 38), "WAITING_KAGGLE_POINTER")

    def test_missing_ready_metadata_refuses(self):
        with self.assertRaises(ValueError):
            guard.versions({"currentVersionNumber": 38, "versions": []})

    def test_low_disk_refuses_publication_before_subprocess(self):
        with TemporaryDirectory() as state:
            with mock.patch.object(guard, "committed_source", return_value="abc"), \
                 mock.patch.object(guard, "observe", return_value={
                     "decision": "SPRAY_REQUIRED", "live_board_sha256": "a",
                     "kaggle_latest_ready_version": 38}), \
                 mock.patch.object(guard.shutil, "disk_usage", return_value=SimpleNamespace(free=100)), \
                 mock.patch.object(guard.subprocess, "run") as run, \
                 mock.patch.object(guard.sys, "argv", ["guard", "--state", state]):
                self.assertEqual(guard.main(), 2)
                run.assert_not_called()
                self.assertEqual(__import__("json").loads((Path(state) / "latest.json").read_text())["decision"],
                                 "BLOCKED_LOW_DISK")

    def test_dry_run_records_change_without_publishing(self):
        with TemporaryDirectory() as state:
            with mock.patch.object(guard, "committed_source", return_value="abc"), \
                 mock.patch.object(guard, "observe", return_value={
                     "decision": "SPRAY_REQUIRED", "live_board_sha256": "a",
                     "kaggle_latest_ready_version": 38}), \
                 mock.patch.object(guard.subprocess, "run") as run, \
                 mock.patch.object(guard.sys, "argv", ["guard", "--dry-run", "--state", state]):
                self.assertEqual(guard.main(), 0)
                run.assert_not_called()
                self.assertEqual(__import__("json").loads((Path(state) / "latest.json").read_text())["decision"],
                                 "DRY_RUN_SPRAY_REQUIRED")


if __name__ == "__main__":
    unittest.main()
