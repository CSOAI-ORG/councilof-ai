"""Network-free regression tests for bounded HF staging fetch and fail-closed semantics."""
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

from reliable_snapshot import fetch_snapshot, is_transient, stage_snapshot


class FakeHttpError(Exception):
    def __init__(self, status):
        self.response = SimpleNamespace(status_code=status)
        super().__init__("private test URL must never be printed")


class ReliableSnapshotTests(unittest.TestCase):
    def test_transient_499_then_503_then_recovery(self):
        calls, delays = [], []

        def source(**kwargs):
            calls.append(kwargs)
            if len(calls) == 1:
                raise FakeHttpError(499)
            if len(calls) == 2:
                raise FakeHttpError(503)
            return "/tmp/valid-snapshot"

        result = fetch_snapshot(
            source, repo_id="csoai/mill-jobs-staging", token="test-token",
            sleep=delays.append,
        )
        self.assertEqual(str(result), "/tmp/valid-snapshot")
        self.assertEqual(delays, [3, 9])
        self.assertEqual(len(calls), 3)
        self.assertTrue(all(c["max_workers"] == 4 and c["etag_timeout"] == 20 for c in calls))
        self.assertTrue(all(c["token"] == "test-token" for c in calls))

    def test_persistent_499_fails_closed(self):
        calls, delays = [], []

        def fail(**kwargs):
            calls.append(kwargs)
            raise FakeHttpError(499)

        with self.assertRaises(FakeHttpError):
            fetch_snapshot(fail, repo_id="test", token="test-token", sleep=delays.append)
        self.assertEqual(len(calls), 4)
        self.assertEqual(delays, [3, 9, 27])

    def test_401_403_404_are_not_retried_or_converted_to_zero(self):
        for code in [401, 403, 404]:
            calls = []

            def fail(**kwargs):
                calls.append(1)
                raise FakeHttpError(code)

            with self.subTest(code=code), self.assertRaises(FakeHttpError):
                fetch_snapshot(fail, repo_id="private", token="test-token", sleep=lambda _: None)
            self.assertEqual(len(calls), 1)

    def test_transport_timeout_is_retryable(self):
        self.assertTrue(is_transient(TimeoutError()))
        self.assertTrue(is_transient(ConnectionError()))
        self.assertFalse(is_transient(ValueError("broken provenance")))

    def test_missing_token_refused(self):
        with self.assertRaises(ValueError):
            fetch_snapshot(lambda **_: "/tmp/unused", repo_id="test", token="")

    def test_stage_files_preserves_paths_and_filters_git_metadata(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source, destination = root / "snapshot", root / "staged"
            (source / "safety" / "shard-0-of-2").mkdir(parents=True)
            (source / ".git").mkdir()
            (source / "safety" / "shard-0-of-2" / "unsigned-a.json").write_text("card")
            (source / "safety" / "items-a.jsonl").write_text("evidence")
            (source / ".git" / "config").write_text("skip")
            (source / ".gitattributes").write_text("skip")
            self.assertEqual(stage_snapshot(source, destination), (1, 1))
            self.assertEqual((destination / "safety" / "shard-0-of-2" / "unsigned-a.json").read_text(), "card")
            self.assertFalse((destination / ".git" / "config").exists())
            self.assertFalse((destination / ".gitattributes").exists())

    def test_standard_hf_cache_blob_symlink_is_accepted(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "datasets--csoai--mill-jobs-staging"
            source = root / "snapshots" / "commit123"
            blobs = root / "blobs"
            source.mkdir(parents=True)
            blobs.mkdir(parents=True)
            (blobs / "sha256blob").write_text("card")
            (source / "unsigned-safe.json").symlink_to(blobs / "sha256blob")
            self.assertEqual(stage_snapshot(source, Path(temp) / "staged"), (1, 0))
            self.assertEqual((Path(temp) / "staged" / "unsigned-safe.json").read_text(), "card")

    def test_symlink_outside_hf_cache_refused(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "datasets--csoai--mill-jobs-staging"
            source = root / "snapshots" / "commit123"
            source.mkdir(parents=True)
            external = Path(temp) / "secret"
            external.write_text("not in cache")
            (source / "link.json").symlink_to(external)
            with self.assertRaises(ValueError):
                stage_snapshot(source, Path(temp) / "staged")


if __name__ == "__main__":
    unittest.main()
