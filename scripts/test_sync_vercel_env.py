#!/usr/bin/env python3
"""Tests for sync-vercel-env.py"""
from __future__ import annotations

import importlib.util
import os
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("sync_vercel_env", "/Users/nicholas/clawd/scripts/sync-vercel-env.py")
sync_vercel_env = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync_vercel_env)


class TestSyncVercelEnv(unittest.TestCase):
    def test_targets_include_key_projects(self):
        self.assertIn("csoai-org-v2", sync_vercel_env.TARGETS)
        self.assertIn("meok", sync_vercel_env.TARGETS)
        self.assertIn("meok-attestation-api", sync_vercel_env.TARGETS)
        self.assertIn("cobolbridge-deploy", sync_vercel_env.TARGETS)

    def test_targets_require_master_api_key_for_csoai(self):
        self.assertIn("MEOK_MASTER_API_KEY", sync_vercel_env.TARGETS["csoai-org-v2"])

    def test_load_env_reads_env_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            env_path = Path(tmp) / ".env.local"
            env_path.write_text('TEST_KEY="value123"\n')
            original = sync_vercel_env.ENV_FILE
            sync_vercel_env.ENV_FILE = env_path
            try:
                env = sync_vercel_env.load_env()
                self.assertEqual(env.get("TEST_KEY"), "value123")
            finally:
                sync_vercel_env.ENV_FILE = original


if __name__ == "__main__":
    unittest.main()
