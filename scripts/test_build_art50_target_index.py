#!/usr/bin/env python3
"""Contract tests for the source-timed Article 50 projection."""

from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path

_SPEC = importlib.util.spec_from_file_location(
    "build_art50_target_index",
    Path(__file__).with_name("build_art50_target_index.py"),
)
module = importlib.util.module_from_spec(_SPEC)
assert _SPEC.loader is not None
_SPEC.loader.exec_module(module)


class Art50TargetIndexTests(unittest.TestCase):
    def setUp(self) -> None:
        self.feed = {
            "as_of": "2026-09-05T09:06:18Z",
            "last_run": {"run_at": "2026-09-05T09:00:00Z"},
            "n_targets": 2,
            "targets": [
                {
                    "id": "example/art50_marking",
                    "provider_name": "Example",
                    "surface": "art50_marking",
                    "url": "https://example.test/marking",
                    "state": "OK",
                    "norm_sha256": "a" * 64,
                },
                {"id": "example/terms", "state": "UNCHECKABLE"},
            ],
        }

    def test_source_time_and_derived_time_are_separate(self) -> None:
        result = module.build_index(self.feed, derived_at="2026-09-12T10:00:00Z")
        self.assertEqual(result["as_of"], self.feed["as_of"])
        self.assertEqual(result["source_as_of"], self.feed["as_of"])
        self.assertEqual(result["derived_at"], "2026-09-12T10:00:00Z")

    def test_derived_time_only_does_not_rewrite(self) -> None:
        first = module.build_index(self.feed, derived_at="2026-09-12T10:00:00Z")
        second = module.build_index(self.feed, derived_at="2026-09-12T11:00:00Z")
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "index.json"
            self.assertTrue(module.write_if_changed(path, first))
            before = path.read_bytes()
            self.assertFalse(module.write_if_changed(path, second))
            self.assertEqual(path.read_bytes(), before)

    def test_source_change_rewrites(self) -> None:
        first = module.build_index(self.feed, derived_at="2026-09-12T10:00:00Z")
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "index.json"
            self.assertTrue(module.write_if_changed(path, first))
            self.feed["as_of"] = "2026-09-05T10:06:18Z"
            second = module.build_index(self.feed, derived_at="2026-09-12T11:00:00Z")
            self.assertTrue(module.write_if_changed(path, second))

    def test_missing_source_time_fails_closed(self) -> None:
        with self.assertRaises(ValueError):
            module.build_index({"targets": []}, derived_at="2026-09-12T10:00:00Z")

    def test_last_run_time_is_the_documented_fallback(self) -> None:
        del self.feed["as_of"]
        result = module.build_index(self.feed, derived_at="2026-09-12T10:00:00Z")
        self.assertEqual(result["source_as_of"], self.feed["last_run"]["run_at"])

    def test_workflow_dispatches_required_gate_with_linked_bot_identity(self) -> None:
        workflow = (
            Path(__file__).resolve().parents[1]
            / ".github/workflows/art50-target-index.yml"
        ).read_text(encoding="utf-8")
        self.assertIn("actions: write", workflow)
        self.assertIn("41898282+github-actions[bot]@users.noreply.github.com", workflow)
        self.assertIn('gh workflow run pr-gates.yml --ref "${branch}"', workflow)


if __name__ == "__main__":
    unittest.main()
