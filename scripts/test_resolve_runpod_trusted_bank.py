#!/usr/bin/env python3
"""Unit tests for resolve_runpod_trusted_bank.py."""
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from resolve_runpod_trusted_bank import (
    load_allowlisted_digests,
    lookup_run_trusted_bank,
    sha256_bytes,
    stage_trusted_banks,
)

REPO_ROOT = Path(__file__).resolve().parent.parent
ALLOWLIST = REPO_ROOT / "scripts" / "runpod_gspc_bank_allowlist.current.json"


class TestResolveRunpodTrustedBank(unittest.TestCase):
    def test_stage_from_repo_control_plane_banks(self) -> None:
        allowed = load_allowlisted_digests(ALLOWLIST)
        self.assertGreaterEqual(len(allowed), 14)
        with tempfile.TemporaryDirectory() as tmp:
            out_dir = Path(tmp) / "trusted-banks"
            summary = stage_trusted_banks(REPO_ROOT, ALLOWLIST, out_dir, fetch_pinned_hf=False)
            self.assertEqual(summary["staged_total"], 8)
            # Verify governance bank was staged and resolves for a synthetic run.json
            gov_sha = "b93f9808f01416737a5944fec0ab8c3eda1dbba808daf7dda33a516b0cd61997"
            self.assertIn(gov_sha, summary["staged_digests"])

            run_dir = Path(tmp) / "run-1"
            run_dir.mkdir()
            (run_dir / "run.json").write_text(
                json.dumps({"axis": "governance", "bank_sha256": gov_sha}),
                encoding="utf-8",
            )
            resolved = lookup_run_trusted_bank(run_dir, out_dir)
            self.assertIsNotNone(resolved)
            assert resolved is not None
            self.assertEqual(sha256_bytes(resolved.read_bytes()), gov_sha)

    def test_lookup_returns_none_when_bank_absent_or_tampered(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            out_dir = Path(tmp) / "trusted-banks"
            out_dir.mkdir()
            absent_sha = "ab0b40f2336e81703e3c17e9988b88a3b0d4bf3a441aa7c3c53b038a6398a434"
            run_dir = Path(tmp) / "run-2"
            run_dir.mkdir()
            (run_dir / "run.json").write_text(
                json.dumps({"axis": "machinery-conformity", "bank_sha256": absent_sha}),
                encoding="utf-8",
            )
            self.assertIsNone(lookup_run_trusted_bank(run_dir, out_dir))

            # Tampered bytes under expected filename must also be rejected
            (out_dir / f"{absent_sha}.jsonl").write_bytes(b"tampered\n")
            self.assertIsNone(lookup_run_trusted_bank(run_dir, out_dir))


if __name__ == "__main__":
    unittest.main()
