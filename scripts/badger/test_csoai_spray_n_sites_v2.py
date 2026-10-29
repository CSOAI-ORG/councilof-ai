import contextlib
import importlib.util
import io
import json
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("csoai-spray-n-sites-v2.py")
SPEC = importlib.util.spec_from_file_location("csoai_spray_n_sites_v2", SCRIPT)
spray = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(spray)


class SprayDraftTests(unittest.TestCase):
    def test_generated_copy_has_no_known_stale_feature_claims(self):
        outputs = [fn() for fn in spray.SPRAY_TARGETS.values()]
        copy = json.dumps(outputs).lower()
        for stale in ("22 axes", "22 measured", "chrome mv3", "grok plugin",
                      "hermes skill", "npm csoai-gspc-mcp", "we just shipped"):
            self.assertNotIn(stale, copy)

    def test_high_risk_targets_are_not_framed_as_publishable(self):
        self.assertEqual(spray.spray_stack_overflow()["status"], "NOT_A_TARGET")
        self.assertEqual(spray.spray_github_discussion()["status"], "PAUSED_ACCOUNT_RESTRICTION")
        self.assertEqual(spray.spray_github_org_readme()["status"], "PAUSED_ACCOUNT_RESTRICTION")
        self.assertEqual(spray.spray_wikipedia_talk()["status"], "NOT_A_TARGET")

    def test_draft_bundle_is_complete_and_explicitly_not_published(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "drafts.json"
            with contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(spray.main(["--target", "youtube", "--out", str(path)]), 0)
            bundle = json.loads(path.read_text())
        self.assertEqual(bundle["mode"], "DRAFT_ONLY_NO_EXTERNAL_ACTION")
        self.assertEqual(bundle["publication"], "NOT_ATTEMPTED")
        self.assertIn("description", bundle["targets"][0])
        self.assertNotIn("description_excerpt", bundle["targets"][0])

    def test_existing_output_is_never_overwritten(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "drafts.json"
            path.write_text("keep")
            with contextlib.redirect_stdout(io.StringIO()):
                with self.assertRaises(FileExistsError):
                    spray.main(["--target", "youtube", "--out", str(path)])
            self.assertEqual(path.read_text(), "keep")

    def test_legacy_post_flag_is_rejected_before_any_write(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "must-not-exist.json"
            with contextlib.redirect_stderr(io.StringIO()):
                with self.assertRaises(SystemExit) as result:
                    spray.main(["--post", "--out", str(path)])
            self.assertEqual(result.exception.code, 2)
            self.assertFalse(path.exists())


if __name__ == "__main__":
    unittest.main()
