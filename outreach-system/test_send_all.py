#!/usr/bin/env python3
"""Tests for send_all.py email parser and loader."""
from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

import send_all


class TestSendAll(unittest.TestCase):
    def test_parse_email_file_standard(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
            f.write("TO: press@monzo.com\n")
            f.write("SUBJECT: Monzo x MEOK\n")
            f.write("\n")
            f.write("Hi team,\n")
            f.write("This is the body.\n")
            path = Path(f.name)

        try:
            parsed = send_all.parse_email_file(path)
            self.assertIsNotNone(parsed)
            self.assertEqual(parsed["to"], "press@monzo.com")
            self.assertEqual(parsed["subject"], "Monzo x MEOK")
            self.assertIn("This is the body.", parsed["body"])
        finally:
            path.unlink()

    def test_parse_email_file_missing_to(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
            f.write("SUBJECT: No recipient\n")
            f.write("\n")
            f.write("Body\n")
            path = Path(f.name)

        try:
            parsed = send_all.parse_email_file(path)
            self.assertIsNone(parsed)
        finally:
            path.unlink()

    def test_discover_emails_ignores_non_txt(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            (tmp_path / "email.txt").write_text("TO: a@b.com\nSUBJECT: Test\n\nBody\n")
            (tmp_path / "not_email.md").write_text("# Not an email")

            # Override the global EMAIL_DIR temporarily
            original_dir = send_all.EMAIL_DIR
            send_all.EMAIL_DIR = tmp_path
            try:
                emails = send_all.discover_emails()
                self.assertEqual(len(emails), 1)
                self.assertEqual(emails[0]["to"], "a@b.com")
            finally:
                send_all.EMAIL_DIR = original_dir


if __name__ == "__main__":
    unittest.main()
