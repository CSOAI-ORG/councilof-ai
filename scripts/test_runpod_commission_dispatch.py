#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

import generate_runpod_gspc_playlist as playlist
import runpod_commission_dispatch as dispatch


class DispatchTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.banks = self.root / "banks"
        self.manifests = self.root / "manifests"
        self.jobs = self.root / "jobs"
        self.out = self.root / "out"
        self.banks.mkdir()
        for _, filename in playlist.AXES:
            (self.banks / filename).write_text(
                json.dumps({"prompt": "one", "expected": "YES"}) + "\n" +
                json.dumps({"prompt": "two", "expected": "NO"}) + "\n",
                encoding="utf-8",
            )
        self.model = "llama3.2:3b"
        manifest = playlist.model_manifest_path(self.manifests, self.model)
        manifest.parent.mkdir(parents=True)
        manifest.write_bytes(b"model manifest")
        self.digest = hashlib.sha256(b"model manifest").hexdigest()
        self.args = argparse.Namespace(
            bank_dir=self.banks,
            workspace_root=self.root,
            model_manifest_root=self.manifests,
            jobs_dir=self.jobs,
            output_root=self.out,
            ollama_url="http://127.0.0.1:11434",
            interval_seconds=86400,
            disk_low_water_bytes=100,
            request_timeout_seconds=10,
            max_tokens=64,
        )

    def tearDown(self) -> None:
        self.temp.cleanup()

    def feed(self, records: list[dict]) -> dict:
        return {"schema": "csoai.commissions/0.1", "status": "MEASURED", "records_unreadable": 0, "commissions": records}

    def receipt(self, char: str) -> str:
        return char * 64

    def test_axis_specific_local_model_creates_one_pinned_idempotent_job(self) -> None:
        feed = self.feed([{"subject": self.model, "axis": "governance", "receipt_sha": self.receipt("a")}])
        writes, report = dispatch.build_dispatch(feed, self.args, {self.model: self.digest})
        self.assertEqual(len(writes), 1)
        self.assertEqual(report["admitted"][0]["axis"], "governance")
        self.assertEqual(report["refused"], [])
        self.assertEqual(dispatch.materialize(writes), (1, 0))
        self.assertEqual(dispatch.materialize(writes), (0, 1))
        config = json.loads(writes[0][0].read_text())
        self.assertEqual(config["expected_model_manifest_digest"], f"sha256:{self.digest}")
        self.assertEqual(config["expected_bank_sha256"], playlist.sha256_file(Path(config["bank"])))

    def test_subject_wide_dedupes_receipts_and_emits_all_model_axes(self) -> None:
        feed = self.feed([
            {"subject": self.model, "axis": None, "receipt_sha": self.receipt("a")},
            {"subject": self.model, "axis": "governance", "receipt_sha": self.receipt("b")},
        ])
        writes, report = dispatch.build_dispatch(feed, self.args, {self.model: self.digest})
        self.assertEqual(len(writes), len(playlist.AXES))
        self.assertEqual(len(report["admitted"]), len(playlist.AXES))

    def test_uninstalled_model_and_unsupported_axis_are_explicitly_refused(self) -> None:
        feed = self.feed([
            {"subject": "missing:latest", "axis": "governance", "receipt_sha": self.receipt("a")},
            {"subject": self.model, "axis": "regulation", "receipt_sha": self.receipt("b")},
        ])
        writes, report = dispatch.build_dispatch(feed, self.args, {self.model: self.digest})
        self.assertEqual(writes, [])
        self.assertEqual({row["reason"] for row in report["refused"]}, {"MODEL_NOT_INSTALLED", "UNSUPPORTED_AXIS"})

    def test_bad_feed_and_bad_receipt_fail_closed(self) -> None:
        with self.assertRaises(playlist.GenerationError):
            dispatch.build_dispatch({"status": "MEASURED"}, self.args, {})
        with self.assertRaises(playlist.GenerationError):
            dispatch.build_dispatch(
                self.feed([{"subject": self.model, "axis": "governance", "receipt_sha": "bad"}]),
                self.args,
                {self.model: self.digest},
            )


if __name__ == "__main__":
    unittest.main()
