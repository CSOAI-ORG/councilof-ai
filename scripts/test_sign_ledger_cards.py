"""Regression tests for the OIDC ledger signer’s exact payload preimage."""
from __future__ import annotations

import hashlib
import io
import json
import sys
import tempfile
import unittest
from contextlib import redirect_stderr
from pathlib import Path
from unittest.mock import patch

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent / "harness" / "gspc-top100"))

import sign_ledger_cards as signer  # noqa: E402
from sign_financial_runs import canonical_bytes  # noqa: E402
from verify_card import canonical_js_body_bytes  # noqa: E402


class LedgerSignerPayloadDigest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        self.interop = root / "interop"
        self.interop.mkdir()
        self.compact = self.interop / "ledger-cards-compact.json"
        self.payload = {
            "kind": "csoai.auto-eat-probe/0.1",
            "as_of": "2026-11-13T00:00:00Z",
            "sample": {"live_fraction_of_probed": 1.0, "probed": 8},
        }
        self.surface = "autoeat.fixture"
        self.compact.write_text(json.dumps({self.surface: self.payload}), encoding="utf-8")
        atom = {
            "as_of": self.payload["as_of"],
            "payload": self.payload,
            "subject": "fixture subject",
            "source_urls": ["https://example.org/fixture"],
            "unmeasured": ["gspc_score"],
        }
        (self.interop / "ledger-card-autoeat-fixture-unsigned.json").write_text(
            json.dumps(atom), encoding="utf-8"
        )

    def tearDown(self):
        self.tmp.cleanup()

    def run_signer(self, response_digest):
        with (
            patch.object(signer, "COMPACT", self.compact),
            patch.object(signer, "INTEROP", self.interop),
            patch.object(signer, "sign_via_oidc_attested", return_value=("ab" * 64, response_digest)) as sign,
            patch.object(sys, "argv", ["sign_ledger_cards.py"]),
            redirect_stderr(io.StringIO()),
        ):
            result = signer.main()
        return result, sign

    def test_stores_the_digest_of_the_exact_js_preimage_for_integral_float(self):
        js_bytes = canonical_js_body_bytes(self.payload)
        js_digest = hashlib.sha256(js_bytes).hexdigest()
        python_digest = hashlib.sha256(canonical_bytes(self.payload)).hexdigest()
        self.assertNotEqual(js_digest, python_digest, "fixture must exercise 1.0 → 1 canonicalisation")

        result, sign = self.run_signer(js_digest)
        self.assertEqual(result, 0)
        sign.assert_called_once_with(self.payload)

        card = json.loads((self.interop / "ledger-card-autoeat-fixture.json").read_text())
        self.assertEqual(card["sha256"], js_digest)
        self.assertEqual(card["sig_ed25519"], "ab" * 64)
        self.assertEqual(hashlib.sha256(canonical_js_body_bytes(card["payload"])).hexdigest(), card["sha256"])

    def test_refuses_a_signer_digest_that_does_not_match_local_js_preimage(self):
        result, sign = self.run_signer("00" * 32)
        self.assertEqual(result, 1)
        sign.assert_called_once_with(self.payload)
        self.assertFalse((self.interop / "ledger-card-autoeat-fixture.json").exists())

    def test_refuses_a_malformed_signature(self):
        digest = hashlib.sha256(canonical_js_body_bytes(self.payload)).hexdigest()
        with (
            patch.object(signer, "COMPACT", self.compact),
            patch.object(signer, "INTEROP", self.interop),
            patch.object(signer, "sign_via_oidc_attested", return_value=("not-hex", digest)),
            patch.object(sys, "argv", ["sign_ledger_cards.py"]),
            redirect_stderr(io.StringIO()),
        ):
            self.assertEqual(signer.main(), 1)
        self.assertFalse((self.interop / "ledger-card-autoeat-fixture.json").exists())


if __name__ == "__main__":
    unittest.main()
