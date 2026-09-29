#!/usr/bin/env python3
"""Tests for scripts/layer0/verify_layer0_records.py and seal_layer0_record.py. Offline; no network.

    python3 scripts/layer0/test_layer0_records.py
"""
from __future__ import annotations

import base64
import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent))

import verify_layer0_records as v  # noqa: E402
import seal_layer0_record as s  # noqa: E402

CEREMONY = REPO / "public/interop/layer0-ceremony-2026-09-03.json"


def throwaway_did(tmp: Path, kid: str):
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from cryptography.hazmat.primitives import serialization
    key = Ed25519PrivateKey.generate()
    raw = key.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    doc = {"id": "did:web:csoai.org", "verificationMethod": [{
        "id": kid, "publicKeyJwk": {"kty": "OKP", "crv": "Ed25519",
                                    "x": base64.urlsafe_b64encode(raw).rstrip(b"=").decode()}}]}
    p = tmp / "did.json"
    p.write_text(json.dumps(doc))
    return key, doc, str(p)


class DeclaredState(unittest.TestCase):
    def test_seal_state_unmeasured_is_declared(self):
        self.assertEqual(v.declares_unsigned("public/x.json", {"seal": {"state": "UNMEASURED"}}), "seal.state=UNMEASURED")

    def test_signed_seal_is_not_a_declaration(self):
        self.assertIsNone(v.declares_unsigned("public/x.json", {"seal": {"state": "SIGNED"}}))

    def test_name_and_claim_boundary(self):
        self.assertTrue(v.declares_unsigned("public/a/card-unsigned.json", {}))
        self.assertTrue(v.declares_unsigned("public/x.json", {"claim_boundary": {"is_a_receipt": False}}))
        self.assertIsNone(v.declares_unsigned("public/x.json", {"content_id": "ab"}))


@unittest.skipUnless(CEREMONY.is_file() and Path(str(CEREMONY) + ".ots").is_file(), "ceremony bytes absent")
class OtsSidecar(unittest.TestCase):
    def setUp(self):
        try:
            import opentimestamps  # noqa: F401
        except ImportError:
            self.skipTest("opentimestamps library absent")

    def test_real_proof_commits_to_real_bytes(self):
        st = v.ots_state(CEREMONY.read_bytes(), Path(str(CEREMONY) + ".ots"))
        self.assertEqual(st["state"], "BITCOIN")
        self.assertTrue(st["bitcoin_heights"])

    def test_one_byte_changed_is_a_mismatch(self):
        st = v.ots_state(CEREMONY.read_bytes() + b"\n", Path(str(CEREMONY) + ".ots"))
        self.assertEqual(st["state"], "DIGEST_MISMATCH")

    def test_garbage_is_not_a_proof(self):
        with tempfile.TemporaryDirectory() as t:
            p = Path(t) / "x.ots"
            p.write_bytes(b"not a timestamp")
            self.assertEqual(v.ots_state(b"{}", p)["state"], "NOT_A_PROOF")


class Seals(unittest.TestCase):
    def _root(self, t: Path, body: bytes = b'{"as_of": "2026-09-28T00:00:00Z", "schema": "t/0"}\n'):
        rec = t / "public/interop/layer0-test.json"
        rec.parent.mkdir(parents=True)
        rec.write_bytes(body)
        return rec

    def test_rehearsal_passes_its_own_controls(self):
        with tempfile.TemporaryDirectory() as t:
            t = Path(t)
            rec = self._root(t)
            self.assertEqual(s.rehearse(t, rec, t / "out"), 0)

    def test_check_counts_a_valid_detached_seal_and_refuses_a_foreign_key(self):
        with tempfile.TemporaryDirectory() as t:
            t = Path(t)
            rec = self._root(t)
            key, doc, did_path = throwaway_did(t, "did:web:csoai.org#test-1")
            body = s.seal_body(t, rec)
            pre = s.canonical(body)
            seal = s.assemble(body, {"did": "did:web:csoai.org#test-1", "sig_ed25519": key.sign(pre).hex(),
                                     "payload_sha256": hashlib.sha256(pre).hexdigest()})
            Path(str(rec) + ".seal.json").write_text(json.dumps(seal))
            res = v.check(t, doc, did_path, live=False)
            self.assertEqual(res["tally"]["signature"], {"VERIFIES_AGAINST_DID": 1})
            # the same seal under a key outside did:web:csoai.org is INVALID, never VERIFIES
            seal["signature"]["did"] = "did:web:example.org#k"
            Path(str(rec) + ".seal.json").write_text(json.dumps(seal))
            self.assertEqual(v.verify_seal(rec.read_bytes(), Path(str(rec) + ".seal.json"), did_path)["state"], "INVALID")

    def test_edited_record_breaks_its_seal(self):
        with tempfile.TemporaryDirectory() as t:
            t = Path(t)
            rec = self._root(t)
            key, doc, did_path = throwaway_did(t, "did:web:csoai.org#test-1")
            body = s.seal_body(t, rec)
            pre = s.canonical(body)
            seal = s.assemble(body, {"did": "did:web:csoai.org#test-1", "sig_ed25519": key.sign(pre).hex(),
                                     "payload_sha256": hashlib.sha256(pre).hexdigest()})
            Path(str(rec) + ".seal.json").write_text(json.dumps(seal))
            rec.write_bytes(rec.read_bytes() + b" ")
            res = v.check(t, doc, did_path, live=False)
            self.assertEqual(res["rows"][0]["signature"]["state"], "INVALID")

    def test_unsigned_record_without_declaration_is_named(self):
        with tempfile.TemporaryDirectory() as t:
            t = Path(t)
            self._root(t, b'{"content_id": "00"}')
            _k, doc, did_path = throwaway_did(t, "did:web:csoai.org#test-1")
            res = v.check(t, doc, did_path, live=False)
            self.assertEqual(res["tally"]["signature"], {"UNSIGNED_UNDECLARED": 1})


if __name__ == "__main__":
    unittest.main(verbosity=2)
