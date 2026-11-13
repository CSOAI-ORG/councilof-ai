#!/usr/bin/env python3
"""Promotion must turn draft claims into honest published correction notes."""
import contextlib
import importlib.util
import io
import json
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("drift-draft.py")
SPEC = importlib.util.spec_from_file_location("drift_draft", SCRIPT)
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


class PromotionTruthTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        root = Path(self.temp.name)
        self.clone = root / "clone"
        self.out = root / "out"
        self.queue = self.out / "queue"
        self.queue.mkdir(parents=True)
        self.did = "D-2026-09-22T14-04"
        self.ledger = self.clone / "functions/api/corrections.ts"
        self.ledger.parent.mkdir(parents=True)
        self.ledger.write_text("export const LEDGER = {\n  corrections: [\n  ],\n};\n")

    def seed(self, subject):
        proposed = ("PROPOSED, nothing has changed yet: supersede the stale surface. "
                    "The owner decides the remedy on promotion; this draft records the disagreement only.")
        draft = {
            "drift": {"subject": subject, "summary": "recorded disagreement", "fingerprint": "test"},
            "corrections": [{
                "id": self.did, "date": "2026-09-22", "what_changed": proposed,
                "note": ("DRAFT - owner approval required. No ledger id is assigned until "
                         "promote-draft.sh runs. Nothing here is a grade."),
            }],
        }
        (self.queue / f"{self.did}.json").write_text(json.dumps(draft))
        md = (
            f"# DRAFT correction {self.did}: recorded disagreement\n\n"
            "**Status: DRAFT - owner approval required.** Generated 2026-09-22. "
            "Not published, not merged, no ledger id.\n\n"
            "## Proposed remedy (owner decides)\n\n" + proposed + "\n\n"
            "## Reproduce\n\n```bash\n"
            f"git show abc:file.json | sha256sum   # expect {'a' * 64}\n"
            f"curl -sS 'https://councilof.ai/api/gspc' | sha256sum   # expect {'b' * 64}\n"
            "```\n"
        )
        (self.queue / f"{self.did}.md").write_text(md)
        return md

    def promote(self):
        with contextlib.redirect_stdout(io.StringIO()):
            return module.promote(self.did, self.clone, self.out)

    def test_supersession_publishes_completed_remedy_and_preserves_draft(self):
        original = self.seed("public/corrections/original.json")
        self.assertEqual(self.promote(), 0)
        notes = list((self.clone / "public/corrections").glob("*SUPERSEDES.md"))
        self.assertEqual(len(notes), 1)
        note = notes[0].read_text()
        ledger = self.ledger.read_text()
        self.assertIn("## Remedy published on ", note)
        self.assertIn("Published a dated supersession note", note)
        self.assertNotIn("PROPOSED", note)
        self.assertNotIn("owner decides", note)
        self.assertIn("curl -fsS 'https://councilof.ai/api/gspc' | sha256sum   # current response", note)
        self.assertNotIn(f"# expect {'b' * 64}", note)
        self.assertIn("historical digest", note)
        self.assertIn("Ledger id C-", ledger)
        self.assertIn("Published a dated supersession note", ledger)
        self.assertIn(notes[0].name, (self.clone / "public/corrections/SUPERSESSIONS.md").read_text())
        archived = self.clone / module.DRAFT_DIR_IN_REPO / "promoted" / f"{self.did}.md"
        self.assertEqual(archived.read_text(), original)

    def test_non_supersession_records_note_without_claiming_source_fix(self):
        self.seed("client/src/data/facts.json")
        self.assertEqual(self.promote(), 0)
        notes = list((self.clone / "public/corrections").glob("*.md"))
        self.assertEqual(len(notes), 1)
        note = notes[0].read_text()
        self.assertIn("## Status on promotion (", note)
        self.assertIn("does not verify source remediation", note)
        self.assertNotIn("PROPOSED", note)
        self.assertIn("does not verify source remediation", self.ledger.read_text())

    def test_malformed_note_aborts_before_ledger_write(self):
        self.seed("public/corrections/original.json")
        note_path = self.queue / f"{self.did}.md"
        note_path.write_text(note_path.read_text().replace("## Proposed remedy (owner decides)",
                                                          "## Missing remedy section"))
        before = self.ledger.read_text()
        self.assertEqual(self.promote(), 2)
        self.assertEqual(self.ledger.read_text(), before)
        self.assertTrue(note_path.exists())
        self.assertFalse((self.clone / "public/corrections").exists())

    def test_unknown_live_hash_command_aborts_before_ledger_write(self):
        self.seed("public/corrections/original.json")
        note_path = self.queue / f"{self.did}.md"
        note_path.write_text(note_path.read_text().replace("curl -sS", "curl --fail"))
        before = self.ledger.read_text()
        self.assertEqual(self.promote(), 2)
        self.assertEqual(self.ledger.read_text(), before)
        self.assertTrue(note_path.exists())


if __name__ == "__main__":
    unittest.main()
