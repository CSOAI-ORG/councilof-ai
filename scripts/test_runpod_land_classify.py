import json
import subprocess
import tempfile
import unittest
from pathlib import Path

from runpod_land_classify import classify, classify_download_error, download, main


def _mk(root: Path, cards: int, manifest_cards=None, manifest=True, manifest_text=None):
    art = root / "runpod-signing-1-1"
    (art / "cards").mkdir(parents=True)
    for i in range(cards):
        (art / "cards" / f"card-{i}.json").write_text("{}", encoding="utf-8")
    if manifest:
        if manifest_text is not None:
            (art / "manifest.json").write_text(manifest_text, encoding="utf-8")
        else:
            listed = cards if manifest_cards is None else manifest_cards
            (art / "manifest.json").write_text(json.dumps({
                "schema": "csoai.runpod-signing-artifact/0.1", "run_id": "1", "run_attempt": 1,
                "intake_revision": "abc", "head_sha": "def",
                "files": [f"cards/card-{i}.json" for i in range(listed)] + ["manifest.json"],
            }), encoding="utf-8")
    return art


class ClassifyTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.root = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def test_download_failed_when_staged_missing(self):
        self.assertEqual(classify(self.root / "nope")[0], "ARTIFACT_DOWNLOAD_FAILED")

    def test_download_failed_when_staged_empty(self):
        (self.root / "staged").mkdir()
        self.assertEqual(classify(self.root / "staged")[0], "ARTIFACT_DOWNLOAD_FAILED")

    def test_manifest_missing(self):
        _mk(self.root, cards=2, manifest=False)
        self.assertEqual(classify(self.root)[0], "MANIFEST_MISSING")

    def test_manifest_invalid_json(self):
        _mk(self.root, cards=1, manifest_text="{not json")
        self.assertEqual(classify(self.root)[0], "MANIFEST_INVALID")

    def test_manifest_files_not_a_list(self):
        _mk(self.root, cards=1, manifest_text=json.dumps({"files": "cards/card-0.json"}))
        self.assertEqual(classify(self.root)[0], "MANIFEST_INVALID")

    def test_manifest_fs_mismatch(self):
        _mk(self.root, cards=3, manifest_cards=2)
        out, n, _ = classify(self.root)
        self.assertEqual((out, n), ("MANIFEST_FS_MISMATCH", 3))

    def test_no_work_confirmed(self):
        _mk(self.root, cards=0)
        self.assertEqual(classify(self.root), ("NO_WORK_CONFIRMED", 0, classify(self.root)[2]))

    def test_artifact_ready(self):
        _mk(self.root, cards=5)
        out, n, _ = classify(self.root)
        self.assertEqual((out, n), ("ARTIFACT_READY", 5))

    def test_main_exit_codes_and_github_output(self):
        _mk(self.root, cards=2)
        gh = self.root / "gh.txt"
        self.assertEqual(main(["--staged", str(self.root), "--github-output", str(gh)]), 0)
        text = gh.read_text()
        self.assertIn("outcome=ARTIFACT_READY\ncards=2\n", text)
        self.assertIn("\nreason=2 cards", text)
        self.assertEqual(main(["--staged", str(self.root / "missing")]), 1)


# Real gh stderr captured 2026-09-14 against CSOAI-ORG/councilof-ai (gh run download):
GH_404_RUN = "error fetching artifacts: HTTP 404: Not Found (https://api.github.com/repos/CSOAI-ORG/councilof-ai/actions/runs/1/artifacts?per_page=100)"
GH_NO_MATCH = "no artifact matches any of the names or patterns provided"
GH_401 = ("error fetching artifacts: HTTP 401: Bad credentials (https://api.github.com/repos/CSOAI-ORG/councilof-ai/actions/runs/34812892553/artifacts?per_page=100)\n"
          "Try authenticating with:  gh auth login -h github.com")
GH_502 = "error fetching artifacts: HTTP 502: Bad Gateway (https://api.github.com/repos/o/r/actions/runs/9/artifacts?per_page=100)"
GH_RESET = 'Get "https://api.github.com/...": read tcp 10.1.0.4:443: read: connection reset by peer'
GH_RATE = "HTTP 403: API rate limit exceeded for installation ID 123."


class FakeGh:
    """Scripted `gh run download`: each step is (returncode, stderr, write_files)."""

    def __init__(self, steps):
        self.steps = list(steps); self.calls = 0

    def __call__(self, cmd, capture_output=True, text=True):
        rc, err, write = self.steps[min(self.calls, len(self.steps) - 1)]
        self.calls += 1
        dest = Path(cmd[cmd.index("-D") + 1])
        if write:
            _mk(dest, cards=write)
        elif rc != 0:
            (dest / "partial.bin").write_bytes(b"half")  # a failed attempt can leave debris
        return subprocess.CompletedProcess(cmd, rc, "", err)


class DownloadTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.dest = Path(self.tmp.name) / "staged"
        self.sleeps = []

    def tearDown(self):
        self.tmp.cleanup()

    def _dl(self, gh, attempts=4):
        return download("9", "o/r", self.dest, attempts=attempts, base_delay=1, runner=gh, sleep=self.sleeps.append)

    def test_error_taxonomy_on_real_gh_strings(self):
        self.assertEqual(classify_download_error(GH_401), "AUTH")
        self.assertEqual(classify_download_error(GH_404_RUN), "NOT_FOUND")
        self.assertEqual(classify_download_error(GH_NO_MATCH), "NOT_FOUND")
        self.assertEqual(classify_download_error(GH_502), "TRANSIENT")
        self.assertEqual(classify_download_error(GH_RESET), "TRANSIENT")
        self.assertEqual(classify_download_error(GH_RATE), "TRANSIENT")  # 403 rate limit is not an auth failure
        self.assertEqual(classify_download_error("something novel"), "UNKNOWN")

    def test_auth_failure_is_not_retried_and_fails(self):
        gh = FakeGh([(1, GH_401, 0)])
        out, reason, used = self._dl(gh)
        self.assertEqual((out, used, gh.calls, self.sleeps), ("ARTIFACT_DOWNLOAD_AUTH_FAILED", 1, 1, []))
        self.assertIn("Bad credentials", reason)

    def test_not_found_is_not_retried_and_never_no_work(self):
        gh = FakeGh([(1, GH_NO_MATCH, 0)])
        out, reason, used = self._dl(gh)
        self.assertEqual((out, gh.calls), ("ARTIFACT_NOT_FOUND", 1))
        self.assertIn("not proof of an empty intake", reason)

    def test_transient_then_success_retries_with_backoff_and_clears_debris(self):
        gh = FakeGh([(1, GH_502, 0), (1, GH_RESET, 0), (0, "", 3)])
        out, _, used = self._dl(gh)
        self.assertEqual((out, used, gh.calls), ("DOWNLOADED", 3, 3))
        self.assertEqual(self.sleeps, [1, 2])
        self.assertFalse((self.dest / "partial.bin").exists())
        self.assertEqual(classify(self.dest)[:2], ("ARTIFACT_READY", 3))

    def test_transient_is_bounded_then_fails(self):
        gh = FakeGh([(1, GH_502, 0)])
        out, reason, used = self._dl(gh, attempts=3)
        self.assertEqual((out, used, gh.calls, self.sleeps), ("ARTIFACT_DOWNLOAD_TRANSIENT_EXHAUSTED", 3, 3, [1, 2]))
        self.assertIn("3 attempts", reason)

    def test_unknown_error_fails_without_retry(self):
        gh = FakeGh([(1, "something novel", 0)])
        self.assertEqual(self._dl(gh)[0], "ARTIFACT_DOWNLOAD_FAILED")
        self.assertEqual(gh.calls, 1)

    def test_exit_zero_but_empty_is_a_failure(self):
        gh = FakeGh([(0, "", 0)])
        self.assertEqual(self._dl(gh)[0], "ARTIFACT_DOWNLOAD_FAILED")


class StatusRecordTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.root = Path(self.tmp.name)
        self.status = self.root / "status.json"

    def tearDown(self):
        self.tmp.cleanup()

    def _read(self):
        return json.loads(self.status.read_text())

    def test_ready_records_intake_but_not_publication_until_pr(self):
        _mk(self.root / "staged", cards=2)
        rc = main(["--staged", str(self.root / "staged"), "--intake-completed-at", "2026-09-14T07:40:00Z", "--status-json", str(self.status)])
        self.assertEqual(rc, 0)
        s = self._read()
        self.assertEqual((s["outcome"], s["last_successful_intake_at"], s["last_successful_publication_at"]),
                         ("ARTIFACT_READY", "2026-09-14T07:40:00Z", None))
        self.assertEqual(main(["--record-publication", "--status-json", str(self.status), "--pr-url", "https://github.com/o/r/pull/1"]), 0)
        s = self._read()
        self.assertIsNotNone(s["last_successful_publication_at"])
        self.assertEqual(s["last_successful_intake_at"], "2026-09-14T07:40:00Z")

    def test_no_work_records_intake_and_refuses_publication(self):
        _mk(self.root / "staged", cards=0)
        self.assertEqual(main(["--staged", str(self.root / "staged"), "--intake-completed-at", "2026-09-14T07:40:00Z", "--status-json", str(self.status)]), 0)
        self.assertEqual(self._read()["reason"][:25], "manifest confirms 0 cards")
        self.assertEqual(main(["--record-publication", "--status-json", str(self.status), "--pr-url", "u"]), 1)
        self.assertIsNone(self._read()["last_successful_publication_at"])

    def test_failure_never_records_a_successful_intake(self):
        rc = main(["--staged", str(self.root / "missing"), "--intake-completed-at", "2026-09-14T07:40:00Z", "--status-json", str(self.status)])
        self.assertEqual(rc, 1)
        s = self._read()
        self.assertEqual((s["outcome"], s["last_successful_intake_at"]), ("ARTIFACT_DOWNLOAD_FAILED", None))
        self.assertTrue(s["reason"])


if __name__ == "__main__":
    unittest.main()
