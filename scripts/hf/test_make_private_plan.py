#!/usr/bin/env python3
"""Offline test of HF privacy list; NEVER imports HF client or reads credentials."""
import importlib.util
import io
import os
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("hf_make_private", HERE / "make-private.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PrivacyPlanTests(unittest.TestCase):
    def setUp(self):
        self.original = (HERE / "retire-private-list.txt").read_text(encoding="utf-8")

    def plan(self, text, target=""):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "retire.txt"
            path.write_text(text, encoding="utf-8")
            return module.plan(path=path, target=target)

    def test_owned_list_has_34_entries_and_target(self):
        rows = self.plan(self.original)
        self.assertEqual(len(rows), 34)
        self.assertIn(("dataset", "index-presence"), rows)

    def test_single_dataset_scope_does_not_private_other_33(self):
        rows = self.plan(self.original, target="dataset/index-presence")
        self.assertEqual(rows, [("dataset", "index-presence")])

    def test_unknown_target_is_refused_before_client_import(self):
        with self.assertRaisesRegex(ValueError, "TARGET_NOT_ALLOWLISTED"):
            self.plan(self.original, target="dataset/not-allowlisted")

    def test_duplicate_repo_is_refused(self):
        lines = self.original.splitlines()
        lines[0] = lines[1]
        with self.assertRaisesRegex(ValueError, "DUPLICATE_PRIVATE_LIST_ROW"):
            self.plan("\n".join(lines))

    def test_missing_index_presence_is_refused(self):
        lines = self.original.splitlines()
        lines[-1] = "dataset replacement"
        with self.assertRaisesRegex(ValueError, "INDEX_PRESENCE_MISSING"):
            self.plan("\n".join(lines))

    def test_missing_entry_is_refused(self):
        with self.assertRaisesRegex(ValueError, "PRIVATE_LIST_SIZE_MISMATCH"):
            self.plan("\n".join(self.original.splitlines()[:-1]))

    def test_bad_repo_kind_is_refused(self):
        lines = self.original.splitlines()
        lines[0] = "delete gspc-signed-boards"
        with self.assertRaisesRegex(ValueError, "INVALID_PRIVATE_LIST_ROW"):
            self.plan("\n".join(lines))

    def test_bad_path_and_nonascii_name_are_refused(self):
        for name in ("../escape", "index-presence/child", "Café"):
            lines = self.original.splitlines()
            lines[-1] = f"dataset {name}"
            with self.subTest(name=name), self.assertRaisesRegex(ValueError, "INVALID_PRIVATE_LIST_ROW"):
                self.plan("\n".join(lines))

    def test_comment_and_blank_lines_are_ignored_without_increasing_size(self):
        rows = self.plan(self.original + "\n\n# approved source inventory\n")
        self.assertEqual(len(rows), 34)

    def test_http_status_diagnostic_reports_only_valid_numeric_code(self):
        # The response may contain a secret-bearing URL or text; never stringify it.
        class ToxicResponse:
            status_code = 403
            def __str__(self):
                raise AssertionError("Response details must not be printed")
        class ToxicError(Exception):
            response = ToxicResponse()
            def __str__(self):
                raise AssertionError("Exception details must not be printed")
        self.assertEqual(module.safe_http_status(ToxicError()), 403)
        self.assertIsNone(module.safe_http_status(Exception("possible sensitive data")))
        self.assertIsNone(module.safe_http_status(SimpleNamespace(response=SimpleNamespace(status_code="403"))))
        self.assertIsNone(module.safe_http_status(SimpleNamespace(response=SimpleNamespace(status_code=999))))

    def test_no_network_or_credential_import_on_plan(self):
        self.assertNotIn("huggingface_hub", module.__dict__)
        self.assertEqual(module.plan.__name__, "plan")

    def _fake_run(self, *, dry_run="true", private=True):
        updates, reads = [], []
        class FakeApi:
            def __init__(self, token):
                self.token = token
            def update_repo_settings(self, repo_id, *, repo_type, private):
                updates.append((repo_id, repo_type, private))
            def repo_info(self, repo_id, *, repo_type):
                reads.append((repo_id, repo_type))
                return SimpleNamespace(private=private)
        fake_module = SimpleNamespace(HfApi=FakeApi)
        env = {"DRY_RUN": dry_run, "HF_TARGET_ONLY": "dataset/index-presence", "HF_TOKEN": "inert-fake-token"}
        output = io.StringIO()
        with mock.patch.dict(os.environ, env, clear=True), \
             mock.patch.dict(sys.modules, {"huggingface_hub": fake_module}), \
             mock.patch.object(module, "plan", return_value=[("dataset", "index-presence")]) as selection, \
             redirect_stdout(output):
            status = module.main()
        selection.assert_called_once_with(target="dataset/index-presence")
        return status, updates, reads, output.getvalue()

    def test_dry_run_reads_only_target_without_any_visibility_write(self):
        status, updates, reads, output = self._fake_run(dry_run="true")
        self.assertEqual(status, 0)
        self.assertEqual(updates, [])
        self.assertEqual(reads, [("csoai/index-presence", "dataset")])
        self.assertIn("count=1", output)
        self.assertIn("dry_run=True", output)

    def test_live_mode_only_updates_allowlisted_target_and_reads_back(self):
        status, updates, reads, output = self._fake_run(dry_run="false", private=True)
        self.assertEqual(status, 0)
        self.assertEqual(updates, [("csoai/index-presence", "dataset", True)])
        self.assertEqual(reads, [("csoai/index-presence", "dataset")])
        self.assertIn("private=True", output)

    def test_unconfirmed_privacy_readback_fails(self):
        status, updates, reads, _ = self._fake_run(dry_run="false", private=False)
        self.assertEqual(status, 1)
        self.assertEqual(len(updates), 1)
        self.assertEqual(len(reads), 1)



if __name__ == "__main__":
    unittest.main()
