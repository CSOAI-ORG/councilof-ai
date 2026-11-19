"""Offline process/commit-path tests. No live fetches or service mutations."""
import contextlib
import copy
import errno
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import governance_watch as g

T = {"name": "page", "url": "https://example.test/", "kind": "html"}
STAMP = "20261108T081809859329Z"

class RuntimeSafety(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.out = self.root / "evidence"
        self.out.mkdir()
        self.source = self.root / "sources.json"
        self.source.write_text(json.dumps([T]))
        self.previous = {"monitor_version": "0.2.0", "normaliser_version": g.NORMALISER_VERSION,
                         "timestamp_utc": STAMP, "results": [], "new_notifications": [],
                         "findings": [], "open_review_items": [], "review_queue": []}
        self.notifications = {"timestamp_utc": STAMP, "new_findings": [], "report": STAMP + ".json"}
        (self.out / "latest.json").write_text(json.dumps(self.previous))
        (self.out / "notifications.json").write_text(json.dumps(self.notifications))
        self.latest_bytes = (self.out / "latest.json").read_bytes()
        self.notification_bytes = (self.out / "notifications.json").read_bytes()
        body = b"<main>Example public document</main>"
        self.row = {"name": "page", "url": T["url"], "status": 200,
                    "state": "VERIFIED_FETCH", "validation": "OK", "facts": {}, "issues": [],
                    "sha256": g.digest(body), "normalised_sha256": g.digest(b"Example public document"),
                    "_body": body, "_normalised": "Example public document"}
        self.network = patch.object(g, "probe", side_effect=lambda target: copy.deepcopy(self.row)).start()
        self.addCleanup(patch.stopall)
        patch("sys.argv", ["governance_watch.py", "--sources", str(self.source), "--out", str(self.out)]).start()

    def execute(self):
        stdout, stderr = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            code = g.main()
        return code, stdout.getvalue(), stderr.getvalue()

    def unchanged(self, notifications=True):
        self.assertEqual((self.out / "latest.json").read_bytes(), self.latest_bytes)
        if notifications:
            self.assertEqual((self.out / "notifications.json").read_bytes(), self.notification_bytes)

    def fail_write(self, predicate):
        original = g.atomic_write
        def write(path, data):
            if predicate(Path(path)):
                raise OSError(errno.ENOSPC, "private-path-and-token-must-not-leak")
            return original(path, data)
        return patch.object(g, "atomic_write", side_effect=write)

    def test_success_is_quiet_and_commits_consistent_pair(self):
        code, out, err = self.execute()
        self.assertEqual((code, out, err), (0, "", ""))
        latest = json.loads((self.out / "latest.json").read_text())
        notice = json.loads((self.out / "notifications.json").read_text())
        self.assertNotEqual(latest["timestamp_utc"], STAMP)
        self.assertEqual(notice["timestamp_utc"], latest["timestamp_utc"])
        self.assertEqual(notice["report"], latest["timestamp_utc"] + ".json")
        self.assertEqual(self.network.call_count, 1)

    def test_unavailable_temp_is_incomplete_before_network(self):
        with patch.object(g.tempfile, "TemporaryDirectory", side_effect=FileNotFoundError("No usable temporary directory; private path")):
            code, out, err = self.execute()
        self.assertEqual(code, 3); self.assertEqual(out, "")
        notice = json.loads(err)
        self.assertEqual(notice["run_state"], "INCOMPLETE")
        self.assertFalse(notice["collection_complete"])
        self.assertFalse(notice["origin_outage_established"])
        self.assertFalse(notice["legal_change_established"])
        self.assertNotIn("private path", err)
        self.network.assert_not_called(); self.unchanged()

    def test_output_storage_full_is_incomplete_before_network(self):
        with patch.object(g.tempfile, "mkstemp", side_effect=OSError(errno.ENOSPC, "full")):
            code, _, err = self.execute()
        self.assertEqual(code, 3)
        self.assertEqual(json.loads(err)["reason"], "LOCAL_IO_FAILURE")
        self.network.assert_not_called(); self.unchanged()

    def test_empty_scope_cannot_report_zero_checks_as_success(self):
        self.source.write_text("[]")
        code, _, err = self.execute()
        self.assertEqual(code, 3)
        self.assertEqual(json.loads(err)["reason"], "CONFIGURATION_OR_EVIDENCE_INVALID")
        self.network.assert_not_called(); self.unchanged()

    def test_invalid_scope_shape_refused(self):
        for scope in ({}, [None], [{**T, "kind": "unknown"}], [{**T, "expect": "not-a-list"}], [{**T, "url": None}]):
            self.source.write_text(json.dumps(scope))
            with self.subTest(scope=scope):
                code, _, _ = self.execute()
                self.assertEqual(code, 3); self.network.assert_not_called(); self.unchanged()

    def test_corrupt_history_not_reset(self):
        (self.out / "latest.json").write_text("not JSON")
        code, _, _ = self.execute()
        self.assertEqual(code, 3); self.network.assert_not_called()
        self.assertEqual((self.out / "latest.json").read_text(), "not JSON")

    def test_empty_existing_report_is_not_a_new_baseline(self):
        (self.out / "latest.json").write_text("{}")
        (self.out / "notifications.json").unlink()
        code, _, _ = self.execute()
        self.assertEqual(code, 3); self.network.assert_not_called()
        self.assertEqual((self.out / "latest.json").read_text(), "{}")

    def test_notification_timestamp_mismatch_refuses_new_collection(self):
        self.notifications["timestamp_utc"] = "20261109T081809859329Z"
        (self.out / "notifications.json").write_text(json.dumps(self.notifications))
        code, _, _ = self.execute()
        self.assertEqual(code, 3); self.network.assert_not_called(); self.unchanged(False)

    def test_notification_findings_mismatch_refuses_collection(self):
        self.notifications["new_findings"] = [{"type": "invented"}]
        (self.out / "notifications.json").write_text(json.dumps(self.notifications))
        code, _, _ = self.execute()
        self.assertEqual(code, 3); self.network.assert_not_called(); self.unchanged(False)

    def test_notification_without_latest_is_not_a_new_baseline(self):
        (self.out / "latest.json").unlink()
        code, _, _ = self.execute()
        self.assertEqual(code, 3); self.network.assert_not_called()
        self.assertFalse((self.out / "latest.json").exists())

    def test_bad_calendar_timestamp_refused(self):
        self.previous["timestamp_utc"] = "20261388T081809859329Z"
        (self.out / "latest.json").write_text(json.dumps(self.previous))
        code, _, _ = self.execute()
        self.assertEqual(code, 3); self.network.assert_not_called()

    def test_busy_is_explicit_not_success(self):
        with patch.object(g.fcntl, "flock", side_effect=BlockingIOError()):
            code, out, err = self.execute()
        self.assertEqual((code, out), (4, ""))
        self.assertEqual(json.loads(err)["run_state"], "SKIPPED_BUSY")
        self.network.assert_not_called(); self.unchanged()

    def test_snapshot_failure_preserves_last_success(self):
        with self.fail_write(lambda p: p.parent.name == "snapshots"):
            code, _, _ = self.execute()
        self.assertEqual(code, 3); self.unchanged()

    def test_report_failure_preserves_last_success(self):
        with self.fail_write(lambda p: p.suffix == ".json" and p.name not in ("latest.json", "notifications.json")):
            code, _, _ = self.execute()
        self.assertEqual(code, 3); self.unchanged()

    def test_checksum_failure_preserves_last_success(self):
        with self.fail_write(lambda p: p.suffix == ".sha256"):
            code, _, _ = self.execute()
        self.assertEqual(code, 3); self.unchanged()

    def test_notification_failure_does_not_promote_latest(self):
        with self.fail_write(lambda p: p.name == "notifications.json"):
            code, _, err = self.execute()
        self.assertEqual(code, 3); self.unchanged()
        self.assertNotIn("private-path", err)

    def test_interrupted_final_commit_is_detected_on_next_pass(self):
        with self.fail_write(lambda p: p.name == "latest.json"):
            code, _, _ = self.execute()
        self.assertEqual(code, 3); self.unchanged(False)
        self.assertNotEqual((self.out / "notifications.json").read_bytes(), self.notification_bytes)
        self.network.reset_mock()
        code, _, err = self.execute()
        self.assertEqual(code, 3); self.network.assert_not_called(); self.unchanged(False)
        self.assertEqual(json.loads(err)["reason"], "CONFIGURATION_OR_EVIDENCE_INVALID")

    def test_preflight_does_not_remove_existing_evidence(self):
        sentinel = self.out / "do-not-touch.json"
        sentinel.write_text("historical evidence")
        g.preflight_storage(self.out)
        self.assertEqual(sentinel.read_text(), "historical evidence")
        self.unchanged()
        self.assertEqual(list(self.out.glob(".watch-preflight-*")), [])

    def test_error_response_is_redacted_and_non_success(self):
        with patch.object(g, "run", side_effect=PermissionError("secret-token=/private/record")):
            code, out, err = self.execute()
        self.assertEqual((code, out), (3, ""))
        self.assertNotIn("secret-token", err)
        self.assertFalse(json.loads(err)["fresh_report_accepted"])

    def test_new_baseline_without_history_is_valid(self):
        (self.out / "latest.json").unlink(); (self.out / "notifications.json").unlink()
        code, _, _ = self.execute()
        self.assertEqual(code, 0)
        self.assertTrue((self.out / "latest.json").exists())

    def test_legacy_seconds_timestamp_supported(self):
        stamp = "20261108T081809Z"
        self.previous["timestamp_utc"] = stamp
        self.notifications.update(timestamp_utc=stamp, report=stamp+".json")
        (self.out/"latest.json").write_text(json.dumps(self.previous))
        (self.out/"notifications.json").write_text(json.dumps(self.notifications))
        code, _, _ = self.execute()
        self.assertEqual(code, 0)

if __name__ == "__main__":
    unittest.main()
