#!/usr/bin/env python3
"""
Unit tests verifying the real live Hugging Face Router (`https://router.huggingface.co/v1/chat/completions`)
360-completion `CARE-PSY-v1` artifact and 36-completion `cobol-bridge` artifact.
"""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path

from scripts.gspc_live_hf_router_runner import (
    DEFAULT_HF_SPACE_DIR,
    DEFAULT_OUT_PATH,
    SCHEMA,
    canonical_json,
    sha256_hex,
)

REPO_ROOT = Path(__file__).resolve().parent.parent
COBOL_EVIDENCE_PATH = REPO_ROOT / "public" / "interop" / "cobol-bridge-iso20022-parity-evidence-v1.json"
FOURTEEN_AXES_JSON_PATH = REPO_ROOT / "public" / "interop" / "gspc-live-hf-14-axes-official-report-v1.json"
FOURTEEN_AXES_MD_PATH = REPO_ROOT / "docs" / "GSPC_LIVE_HF_14_AXES_OFFICIAL_MEASUREMENT_REPORT_2026-10-29.md"


class TestGspcLiveHfRouterRunner(unittest.TestCase):
    def test_live_hf_care_psy_v1_360_completions_integrity(self) -> None:
        self.assertTrue(DEFAULT_OUT_PATH.exists())
        doc = json.loads(DEFAULT_OUT_PATH.read_text(encoding="utf-8"))
        self.assertEqual(doc["schema"], SCHEMA)
        self.assertEqual(doc["execution_mode"], "RUNTIME_OBSERVED_LIVE_HF_ROUTER")
        self.assertEqual(doc["router_endpoint"], "https://router.huggingface.co/v1/chat/completions")

        # Verify canonical SHA-256 digest
        body_without_digest = {k: v for k, v in doc.items() if k != "live_run_sha256"}
        self.assertEqual(sha256_hex(canonical_json(body_without_digest)), doc["live_run_sha256"])

        # Verify all 5 external base model runs and 5 paired Article-1 Care routed runs
        ext_runs = doc["external_base_model_runs"]
        routed_runs = doc["measured_in_lane_article1_care_routed_runs"]["runs"]
        self.assertEqual(len(ext_runs), 5)
        self.assertEqual(len(routed_runs), 5)
        self.assertEqual(doc["summary"]["total_live_hf_http_completions"], 360)

        for run in ext_runs + routed_runs:
            self.assertEqual(run["n_total"], 36)
            self.assertEqual(run["n_valid"], 36)
            self.assertEqual(run["status"], "RUNTIME_OBSERVED")
            self.assertEqual(len(run["items"]), 36)
            for item in run["items"]:
                self.assertEqual(item["http_status"], 200)
                self.assertTrue(bool(item["hf_completion_id"]))
                self.assertGreater(item["latency_ms"], 0.0)
                self.assertRegex(item["response_sha256"], r"^[0-9a-f]{64}$")
                self.assertTrue(bool(item["response_preview"]))
                self.assertTrue(item["parsed"])

        # Verify HF Space mirror matches byte-for-byte
        hf_mirror = DEFAULT_HF_SPACE_DIR / DEFAULT_OUT_PATH.name
        self.assertTrue(hf_mirror.exists())
        self.assertEqual(DEFAULT_OUT_PATH.read_text(encoding="utf-8"), hf_mirror.read_text(encoding="utf-8"))

        # Verify no banned certification words or leaked HF tokens
        raw_text = DEFAULT_OUT_PATH.read_text(encoding="utf-8")
        for banned in ("certified", "compliant", "non-compliant", "unsafe", "violated", "hacked"):
            self.assertIsNone(re.search(rf"\b{re.escape(banned)}\b", raw_text, flags=re.IGNORECASE))
        self.assertIsNone(re.search(r"\bhf_[A-Za-z0-9]{25,}\b", raw_text))

    def test_live_hf_cobol_bridge_36_completions_integrity(self) -> None:
        self.assertTrue(COBOL_EVIDENCE_PATH.exists())
        doc = json.loads(COBOL_EVIDENCE_PATH.read_text(encoding="utf-8"))
        self.assertEqual(doc["execution_mode"], "RUNTIME_OBSERVED_LIVE_HF_ROUTER")
        self.assertEqual(len(doc["items"]), 36)
        for item in doc["items"]:
            self.assertEqual(item["http_status"], 200)
            self.assertTrue(bool(item["hf_completion_id"]))
            self.assertGreater(item["latency_ms"], 0.0)
            self.assertRegex(item["response_sha256"], r"^[0-9a-f]{64}$")
            self.assertTrue(bool(item["response_preview"]))

    def test_live_hf_14_canonical_axes_official_report_integrity(self) -> None:
        self.assertTrue(FOURTEEN_AXES_JSON_PATH.exists())
        self.assertTrue(FOURTEEN_AXES_MD_PATH.exists())
        doc = json.loads(FOURTEEN_AXES_JSON_PATH.read_text(encoding="utf-8"))
        self.assertEqual(doc["schema"], "csoai.gspc-live-hf-14-axes-official-report/1.0")
        self.assertEqual(doc["execution_mode"], "RUNTIME_OBSERVED_LIVE_HF_ROUTER")
        self.assertEqual(doc["totals"]["axes_executed"], 14)
        self.assertEqual(doc["totals"]["models_executed"], 4)
        self.assertEqual(doc["totals"]["bank_items_per_model"], 885)
        self.assertEqual(doc["totals"]["total_live_http_completions"], 3540)
        self.assertGreaterEqual(doc["totals"]["total_http_200_ok"], 3500)

        body_without_digest = {k: v for k, v in doc.items() if k != "report_sha256"}
        self.assertEqual(sha256_hex(canonical_json(body_without_digest)), doc["report_sha256"])

        hf_mirror = DEFAULT_HF_SPACE_DIR / FOURTEEN_AXES_JSON_PATH.name
        self.assertTrue(hf_mirror.exists())
        self.assertEqual(FOURTEEN_AXES_JSON_PATH.read_text(encoding="utf-8"), hf_mirror.read_text(encoding="utf-8"))

        md_text = FOURTEEN_AXES_MD_PATH.read_text(encoding="utf-8")
        self.assertIn(doc["report_sha256"], md_text)
        self.assertIn("Measurement, not certification. Anyone can re-check at https://councilof.ai/verify", md_text)


if __name__ == "__main__":
    unittest.main()
