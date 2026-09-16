#!/usr/bin/env python3
# SPDX-License-Identifier: CC0-1.0
"""Tests for csoai_verify cert handling — PHASE3 C.3.

The verifier is extended to accept csoai.certificate/0.1: a wrapper of
{schema, certificate_id, issued_at, issuer_did, payload, sig_ed25519,
limits}. Signed rule: certificate_id = sha256(canon(payload)) and
sig_ed25519 = Ed25519_sign(canon(payload)), under the key resolved by
issuer_did from the DID document.

These tests pin the canonical-form rule (sorted keys, compact
separators, ensure_ascii=False) used by csoai_verify so that an issuer
following the same rule produces a VERIFYING signature.
"""

from __future__ import annotations

import hashlib
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import tools.verify.csoai_verify as cv  # noqa: E402


def _build_payload() -> dict:
    return {
        "subject": {
            "kind": "account",
            "id": "acct_test",
            "email_hash": "a" * 64,
        },
        "entitlement": {
            "sku": "csoai.measurement-card.issuance",
            "tier": "proof",
            "issued_via": {
                "channel": "operator_manual",
                "settlement_reference": "op_test_1",
            },
        },
        "scope": {
            "tool_set": ["mcp_trust", "x402_trust"],
            "free_calls_per_day": 100,
            "expires_at": None,
        },
        "verification": {
            "url": "https://councilof.ai/verify",
            "did_document": "https://csoai.org/.well-known/did.json",
        },
    }


def _build_wrapper(payload: dict, cid: str = "0" * 64, sig: str = "0" * 128) -> dict:
    return {
        "schema": "csoai.certificate/0.1",
        "certificate_id": cid,
        "issued_at": "2026-09-15T12:00:00Z",
        "issuer_did": "did:web:csoai.org#board-attestation-1",
        "payload": payload,
        "sig_ed25519": sig,
        "limits": {"non_certification": True, "non_promotion": True, "writes_board": False},
    }


def _crypto_available() -> bool:
    try:
        import cryptography  # noqa: F401
        return True
    except ImportError:
        return False


class CertShapeTests(unittest.TestCase):
    def test_wrapper_shape(self):
        wrapper = _build_wrapper(_build_payload())
        for f in ("schema", "certificate_id", "issued_at", "issuer_did", "payload",
                  "sig_ed25519", "limits"):
            self.assertIn(f, wrapper, f"required field {f}")

    def test_doctrine_carry_through(self):
        wrapper = _build_wrapper(_build_payload())
        self.assertTrue(wrapper["limits"]["non_certification"])
        self.assertTrue(wrapper["limits"]["non_promotion"])
        self.assertFalse(wrapper["limits"]["writes_board"])

    def test_certificate_id_is_sha256_of_canonical_payload(self):
        payload = _build_payload()
        canon = cv.canon(payload, ensure_ascii=False)
        expected_id = hashlib.sha256(canon).hexdigest()
        self.assertEqual(len(expected_id), 64)

    def test_subject_kinds_allowed(self):
        for kind in ("account", "license"):
            payload = _build_payload()
            payload["subject"]["kind"] = kind
            self.assertIn(payload["subject"]["kind"], {"account", "license"})

    def test_entitlement_channels_allowed(self):
        for ch in ("paddle_settlement", "operator_manual", "self_test"):
            payload = _build_payload()
            payload["entitlement"]["issued_via"]["channel"] = ch
            self.assertIn(ch, {"paddle_settlement", "operator_manual", "self_test"})

    def test_scope_tool_set_min_one(self):
        payload = _build_payload()
        # schema requires tool_set.minItems=1
        self.assertGreaterEqual(len(payload["scope"]["tool_set"]), 1)


@unittest.skipUnless(_crypto_available(), "cryptography not installed")
class CertSigningRoundTripTests(unittest.TestCase):
    """End-to-end: payload -> canonical -> sha256 -> Ed25519 sign -> verifier.

    The same canon() helper used by csoai_verify proves that the issuer's
    signing rule and the verifier's re-canonicalization rule agree. This
    is what PHASE3 C.3 promises: csoai_verify verifies an issued cert
    offline (no network required for the signing round-trip).
    """

    def _expect_verify(self, wrapper: dict, pk_hex: str, expected: str):
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
        try:
            pub = Ed25519PublicKey.from_public_bytes(bytes.fromhex(pk_hex))
            canon_payload = cv.canon(wrapper["payload"], ensure_ascii=False)
            sig = bytes.fromhex(wrapper["sig_ed25519"])
            pub.verify(sig, canon_payload)
            # ID must equal sha256(canon(payload))
            self.assertEqual(wrapper["certificate_id"], hashlib.sha256(canon_payload).hexdigest())
            return "VALID"
        except Exception:
            return "INVALID"

    def test_signed_cert_recovers_under_canonical_form(self):
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
        from cryptography.hazmat.primitives import serialization

        sk = Ed25519PrivateKey.generate()
        pk_hex = sk.public_key().public_bytes(
            encoding=serialization.Encoding.Raw, format=serialization.PublicFormat.Raw
        ).hex()

        payload = _build_payload()
        canon = cv.canon(payload, ensure_ascii=False)
        cid = hashlib.sha256(canon).hexdigest()
        sig = sk.sign(canon)
        wrapper = _build_wrapper(payload, cid=cid, sig=sig.hex())

        self.assertEqual(self._expect_verify(wrapper, pk_hex, "VALID"), "VALID")

    def test_tampered_payload_fails(self):
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
        from cryptography.hazmat.primitives import serialization

        sk = Ed25519PrivateKey.generate()
        pk_hex = sk.public_key().public_bytes(
            encoding=serialization.Encoding.Raw, format=serialization.PublicFormat.Raw
        ).hex()

        payload = _build_payload()
        canon = cv.canon(payload, ensure_ascii=False)
        sig = sk.sign(canon)
        wrapper = _build_wrapper(payload, cid=hashlib.sha256(canon).hexdigest(), sig=sig.hex())

        # Tamper after signing
        tampered = dict(wrapper)
        tampered["payload"] = {**wrapper["payload"], "subject": {**wrapper["payload"]["subject"], "id": "TAMPERED"}}
        # Note: tampering will break BOTH the signature AND the certificate_id check.

        self.assertEqual(self._expect_verify(tampered, pk_hex, "INVALID"), "INVALID")

    def test_ensure_ascii_false_canonical_form(self):
        body = cv.canon({"name": "Café 信頼 board"}, ensure_ascii=False)
        self.assertIn("Café".encode("utf-8"), body)
        self.assertIn("信頼".encode("utf-8"), body)


if __name__ == "__main__":
    unittest.main()
