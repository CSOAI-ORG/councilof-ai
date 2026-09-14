#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("fix-card-link.py")
spec = importlib.util.spec_from_file_location("fix_card_link", SCRIPT)
assert spec and spec.loader
subject = importlib.util.module_from_spec(spec)
spec.loader.exec_module(subject)


class ExactCardLinkRepair(unittest.TestCase):
    def test_replaces_the_one_malformed_url_without_duplication(self) -> None:
        source = f"before {subject.OLD} after"
        repaired = subject.repair(source)
        self.assertEqual(repaired, f"before {subject.NEW} after")
        self.assertNotIn("gspc-verifyAnyone", repaired)

    def test_refuses_absent_or_duplicated_source_text(self) -> None:
        for source in ("already clean", subject.OLD + "\n" + subject.OLD):
            with self.subTest(source=source):
                with self.assertRaises(ValueError):
                    subject.repair(source)


if __name__ == "__main__":
    unittest.main()
