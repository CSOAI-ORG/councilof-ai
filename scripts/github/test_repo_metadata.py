"""Offline controls for scoped description writes and manifest-only licence selection."""
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("repo_metadata", Path(__file__).with_name("repo-metadata.py"))
metadata = importlib.util.module_from_spec(spec)
spec.loader.exec_module(metadata)


class DescriptionControls(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = Path(self.tmp.name) / "plan.json"
        self.rows = [dict(name=n, archived=False, description_before="old", description_after="reviewed",
                          topics_after=["unrelated-topic"], licence_add="MIT") for n in ["one", "two"]]
        self.live = {r["name"]: dict(full_name=f"CSOAI-ORG/{r['name']}", description="old", archived=False)
                     for r in self.rows}
        self.writes = []
        self.gets = {}
        self.on_read = None
        self.ignore_write = False

    def gh(self, *args, input_=None):
        self.assertEqual(args[0], "api")
        endpoint = next(a for a in args if a.startswith("repos/"))
        name = endpoint.rsplit("/", 1)[-1]
        if "PATCH" in args:
            body = json.loads(input_)
            self.assertEqual(set(body), {"description"})
            self.writes.append((name, body))
            if not self.ignore_write:
                self.live[name]["description"] = body["description"]
        else:
            self.gets[name] = self.gets.get(name, 0) + 1
            if self.on_read:
                self.on_read(name, self.gets[name])
        return json.dumps(self.live[name])

    def run_plan(self, names=None, doc=None):
        self.path.write_text(json.dumps(doc if doc is not None else {"owner": "CSOAI-ORG", "repos": self.rows}))
        with patch.object(metadata, "gh", side_effect=self.gh), contextlib.redirect_stdout(io.StringIO()):
            return metadata.apply_descriptions(str(self.path), ["one"] if names is None else names)

    def test_only_selected_description_changes_even_when_plan_contains_other_mutations(self):
        result = self.run_plan()
        self.assertEqual(result["changed"], ["one"])
        self.assertEqual(self.writes, [("one", {"description": "reviewed"})])
        self.assertEqual(self.live["two"]["description"], "old")
        self.assertNotIn("two", self.gets)

    def test_all_selected_preflight_before_any_write(self):
        self.live["two"]["description"] = "changed by another owner"
        with self.assertRaisesRegex(ValueError, "differs"):
            self.run_plan(["one", "two"])
        self.assertEqual(self.writes, [])

    def test_change_after_preflight_is_not_overwritten(self):
        def changed(name, count):
            if count == 2:
                self.live[name]["description"] = "new owner wording"
        self.on_read = changed
        with self.assertRaisesRegex(ValueError, "differs"):
            self.run_plan()
        self.assertEqual(self.writes, [])

    def test_rerun_already_current_is_read_only(self):
        self.live["one"]["description"] = "reviewed"
        self.assertEqual(self.run_plan()["already_current"], ["one"])
        self.assertEqual(self.writes, [])

    def test_live_archive_is_never_edited(self):
        self.live["one"].update(archived=True, description="other")
        self.assertEqual(self.run_plan()["skipped_archived"], ["one"])
        self.assertEqual(self.writes, [])

    def test_planned_archive_is_not_read_or_edited(self):
        self.rows[0]["archived"] = True
        self.assertEqual(self.run_plan()["skipped_archived"], ["one"])
        self.assertEqual(self.gets, {})

    def test_missing_scope_duplicate_scope_and_paths_are_rejected(self):
        for names in [[], ["one", "one"], ["one", "ONE"], ["absent"], ["../one"], ["other/one"]]:
            with self.subTest(names=names), self.assertRaises(ValueError):
                self.run_plan(names)
        self.assertEqual(self.writes, [])
        self.assertEqual(self.gets, {})

    def test_bad_owner_duplicate_rows_and_invalid_text_are_rejected_before_reads(self):
        docs = [{"owner": "other", "repos": self.rows},
                {"owner": "CSOAI-ORG", "repos": self.rows + [self.rows[0]]}]
        for text in ["", "two\nlines", "x" * 351, None]:
            docs.append({"owner": "CSOAI-ORG", "repos": [dict(self.rows[0], description_after=text)]})
        for doc in docs:
            with self.subTest(doc=doc), self.assertRaises(ValueError):
                self.run_plan(doc=doc)
        self.assertEqual(self.gets, {})

    def test_repository_identity_is_checked(self):
        self.live["one"]["full_name"] = "another-owner/one"
        with self.assertRaisesRegex(ValueError, "identity"):
            self.run_plan()
        self.assertEqual(self.writes, [])

    def test_failed_readback_stops_before_next_repository(self):
        self.ignore_write = True
        with self.assertRaisesRegex(RuntimeError, "possible write"):
            self.run_plan(["one", "two"])
        self.assertEqual(len(self.writes), 1)
        self.assertEqual(self.writes[0][0], "one")

    def test_read_failure_aborts_before_writes(self):
        def unavailable(name, count):
            if name == "two":
                raise RuntimeError("fixture unavailable")
        self.on_read = unavailable
        with self.assertRaisesRegex(RuntimeError, "unavailable"):
            self.run_plan(["one", "two"])
        self.assertEqual(self.writes, [])

    def test_absent_description_can_be_reviewed(self):
        self.rows[0]["description_before"] = None
        self.live["one"]["description"] = None
        self.assertEqual(self.run_plan()["changed"], ["one"])


class LicenceControls(unittest.TestCase):
    def test_only_explicit_supported_declarations_are_selected(self):
        for declaration, expected in [(None, None), ("", None), ("MIT", "MIT"),
                                      ("Apache-2.0", "Apache-2.0"), ("Apache 2.0", "Apache-2.0"),
                                      ("MIT OR GPL-3.0", None), ("Apache-1.1", None), ("not MIT", None)]:
            with self.subTest(declaration=declaration):
                self.assertEqual(metadata.licence_for("one", True, False, False, False, declaration), expected)

    def test_existing_third_party_archived_and_unowned_licences_are_not_replaced(self):
        for name, ours, fork, archived, existing in [("one", False, False, False, False),
                ("one", True, True, False, False), ("one", True, False, True, False),
                ("one", True, False, False, True), ("langfuse", True, False, False, False)]:
            with self.subTest(name=name, fork=fork, archived=archived, existing=existing):
                self.assertIsNone(metadata.licence_for(name, ours, fork, archived, existing, "MIT"))


if __name__ == "__main__":
    unittest.main()
