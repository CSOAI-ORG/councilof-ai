#!/usr/bin/env python3
"""Security regression tests for the ROOT ceremony helpers."""
from __future__ import annotations

import hashlib
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE))

import ed25519_from_seed
import genesis_card
import shamir_2of3


class CeremonySecurityTests(unittest.TestCase):
    def test_entropy_cli_has_fixed_floor_and_no_weak_escape(self):
        with tempfile.TemporaryDirectory() as td:
            out = Path(td) / "seed"
            result = subprocess.run(
                [sys.executable, str(HERE / "entropy_from_dice.py"), "1" * 99,
                 "--out", str(out)], capture_output=True, text=True,
            )
            self.assertEqual(result.returncode, 2)
            self.assertFalse(out.exists())
            bypass = subprocess.run(
                [sys.executable, str(HERE / "entropy_from_dice.py"), "1" * 99,
                 "--out", str(out), "--min-rolls", "1"],
                capture_output=True, text=True,
            )
            self.assertNotEqual(bypass.returncode, 0)
            self.assertFalse(out.exists())

    def _fixture(self, directory: Path):
        from cryptography.hazmat.primitives import serialization
        alpha_seed = os.urandom(32)
        beta_seed = os.urandom(32)
        alpha = ed25519_from_seed._derive(alpha_seed)
        beta = ed25519_from_seed._derive(beta_seed)
        key_path = directory / "alpha.der"
        key_path.write_bytes(alpha.private_bytes(
            serialization.Encoding.DER, serialization.PrivateFormat.PKCS8,
            serialization.NoEncryption(),
        ))
        beta_pub = beta.public_key().public_bytes(
            serialization.Encoding.Raw, serialization.PublicFormat.Raw,
        ).hex()
        cross = {
            "kind": "csoai.shamir-independent-crosscheck/1", "status": "PASS",
            "checked_at": "2026-09-12T00:00:00Z",
            "scheme": shamir_2of3.SCHEME, "share_indices": [1, 3],
            "secret_sha256": hashlib.sha256(alpha_seed).hexdigest(),
            "independent_tool": {"name": "independent-test/1", "sha256": "ab" * 32},
        }
        cross_path = directory / "cross.json"
        cross_path.write_text(json.dumps(cross))
        return key_path, beta_pub, cross_path

    def test_genesis_is_atomic_verified_and_strips_notes(self):
        with tempfile.TemporaryDirectory() as td:
            d = Path(td)
            key, beta, cross = self._fixture(d)
            out = d / "card.json"
            args = type("A", (), {
                "template": str(ROOT / "docs/operations/root-ceremony/card0-genesis.template.json"),
                "root_alpha_key": str(key), "root_beta_pubkey": beta,
                "created_at": "2026-09-12T00:00:00Z",
                "shamir_crosscheck_record": str(cross), "out": str(out),
            })()
            self.assertEqual(genesis_card.cmd_finalize(args), 0)
            card = json.loads(out.read_text())
            self.assertFalse(genesis_card._contains_note_key(card))
            genesis_card.validate_card(card, require_signature=True)
            before = out.read_bytes()
            self.assertEqual(genesis_card.cmd_finalize(args), 2)
            self.assertEqual(out.read_bytes(), before)

    def test_genesis_refuses_missing_or_wrong_crosscheck_without_output(self):
        with tempfile.TemporaryDirectory() as td:
            d = Path(td)
            key, beta, cross = self._fixture(d)
            record = json.loads(cross.read_text())
            record["secret_sha256"] = "00" * 32
            cross.write_text(json.dumps(record))
            out = d / "card.json"
            args = type("A", (), {
                "template": str(ROOT / "docs/operations/root-ceremony/card0-genesis.template.json"),
                "root_alpha_key": str(key), "root_beta_pubkey": beta,
                "created_at": "2026-09-12T00:00:00Z",
                "shamir_crosscheck_record": str(cross), "out": str(out),
            })()
            self.assertEqual(genesis_card.cmd_finalize(args), 2)
            self.assertFalse(out.exists())

    def test_combine_rejects_extra_share(self):
        shares = shamir_2of3.split_secret(os.urandom(32))
        with self.assertRaises(ValueError):
            shamir_2of3.combine_shares(shares)


if __name__ == "__main__":
    unittest.main()
