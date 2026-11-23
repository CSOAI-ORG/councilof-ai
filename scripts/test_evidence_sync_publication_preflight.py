#!/usr/bin/env python3
"""Offline prepublication regression for the exact HF evidence-sync apply path.

Fixtures are synthetic. The test never opens a Hub connection, uses a live
credential or writes a remote artifact.
"""
from __future__ import annotations

import importlib.util
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location(
    "evidence_sync_privacy_tested", HERE / "pod-loops" / "evidence_sync.py"
)
es = importlib.util.module_from_spec(spec)
spec.loader.exec_module(es)


class PublicationPreflight(unittest.TestCase):
    def test_scans_only_exact_selected_source_files_and_rejects_outside_email(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            good = root / "clean.json"
            bad = root / "bad.json"
            good.write_text('{"kind":"synthetic","safe":true}\n')
            # Assembled at run time: no person's contact details in source.
            address = "outside-proof-" + "7315" + "@" + "imaginary-tenant-" + "9182.org"
            bad.write_text(json.dumps({"kind": "synthetic", "address": address}))
            files = {"cards/clean.json": good, "cards/bad.json": bad}
            self.assertEqual(es.publication_privacy_preflight(files, ["cards/clean.json"]), 0)
            self.assertEqual(es.publication_privacy_preflight(files, ["cards/bad.json"]), 1)

    def test_missing_bytes_are_uncheckable_not_clean(self):
        with tempfile.TemporaryDirectory() as temp:
            missing = Path(temp) / "nonexistent.json"
            self.assertEqual(
                es.publication_privacy_preflight({"cards/absent.json": missing}, ["cards/absent.json"]), 2
            )

    def test_refusal_prevents_any_remote_commit_and_writes_receipt(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            file = root / "synthetic.json"
            file.write_text('{"kind":"synthetic"}')
            manifest = root / "manifest.json"
            manifest.write_text('{"entries":[]}')
            receipt = root / "receipt.json"
            files = {"cards/synthetic.json": file}
            args = [
                "evidence_sync.py", "--apply", "--manifest", str(manifest),
                "--receipt", str(receipt),
            ]
            for verdict, expected_state in (
                (1, "PRIVACY_GATE_FINDINGS"),
                (2, "PRIVACY_GATE_UNCHECKABLE"),
            ):
                with (
                    patch.object(es, "local_files", return_value=files),
                    patch.object(es, "remote_tree", return_value={}),
                    patch.object(es, "secret_scan", return_value=[]),
                    patch.object(es, "publication_privacy_preflight", return_value=verdict),
                    patch.object(es, "commit_grouped") as remote_write,
                    patch.object(sys, "argv", args),
                    patch.dict(os.environ, {"HF_TOKEN": "synthetic-test-token"}),
                ):
                    with self.assertRaises(SystemExit) as error:
                        es.main()
                self.assertEqual(error.exception.code, 5)
                remote_write.assert_not_called()
                rec = json.loads(receipt.read_text())
                self.assertEqual(rec["state"], expected_state)
                self.assertIsNone(rec["uploaded"])

    def test_wiring_is_before_any_commit(self):
        source = (HERE / "pod-loops" / "evidence_sync.py").read_text()
        begin = source.index('privacy_code = publication_privacy_preflight(files, d)')
        write = source.index('outcomes = commit_grouped(d, files, token, a.message, plan)')
        self.assertLess(begin, write)


if __name__ == "__main__":
    unittest.main()
