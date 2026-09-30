import contextlib
import importlib.util
import io
import sys
import unittest
from pathlib import Path
from unittest.mock import patch


SCRIPT = Path(__file__).with_name("indexnow_submit.py")
SPEC = importlib.util.spec_from_file_location("indexnow_submit", SCRIPT)
indexnow_submit = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(indexnow_submit)


class IndexNowTargetTests(unittest.TestCase):
    def test_only_extra_requires_at_least_one_url_before_network(self):
        with patch.object(sys, "argv", [str(SCRIPT), "--only-extra"]), patch.object(
            indexnow_submit, "get", side_effect=AssertionError("network must not run")
        ):
            with self.assertRaises(SystemExit) as raised:
                indexnow_submit.main()
        self.assertEqual(raised.exception.code, 2)

    def test_only_extra_uses_deduplicated_explicit_urls_without_sitemap(self):
        url = "https://councilof.ai/example/"
        out = io.StringIO()
        args = [str(SCRIPT), "--only-extra", "--extra", url, "--extra", url, "--dry-run"]
        with patch.object(sys, "argv", args), patch.object(
            indexnow_submit, "get", return_value=(200, indexnow_submit.KEY.encode())
        ), patch.object(indexnow_submit, "sitemap_urls", side_effect=AssertionError("sitemap must not run")), patch.object(
            indexnow_submit, "probe", return_value=(url, 200)
        ), contextlib.redirect_stdout(out):
            self.assertEqual(indexnow_submit.main(), 0)
        self.assertIn("[candidates] source=extra-only count=1", out.getvalue())
        self.assertIn("[dry-run] would submit 1 live URLs", out.getvalue())


if __name__ == "__main__":
    unittest.main()
