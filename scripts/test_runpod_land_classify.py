import json
import tempfile
import unittest
from pathlib import Path

from runpod_land_classify import classify, main


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
        self.assertIn("outcome=ARTIFACT_READY\ncards=2\n", gh.read_text())
        self.assertEqual(main(["--staged", str(self.root / "missing")]), 1)


if __name__ == "__main__":
    unittest.main()
