#!/usr/bin/env python3
"""Offline tests for scripts/census/agent_directory_census.py: every check must be able to fail.

    python3 scripts/census/test_agent_directory_census.py
"""
from __future__ import annotations

import base64
import datetime
import hashlib
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import agent_directory_census as c  # noqa: E402


def h(b: bytes) -> bytes:
    return hashlib.sha256(b).digest()


def mth(leaves: list[bytes]) -> bytes:
    if len(leaves) == 1:
        return h(b"\x00" + leaves[0])
    k = 1
    while k * 2 < len(leaves):
        k *= 2
    return h(b"\x01" + mth(leaves[:k]) + mth(leaves[k:]))


def path(m: int, leaves: list[bytes]) -> list[bytes]:
    if len(leaves) == 1:
        return []
    k = 1
    while k * 2 < len(leaves):
        k *= 2
    if m < k:
        return path(m, leaves[:k]) + [mth(leaves[k:])]
    return path(m - k, leaves[k:]) + [mth(leaves[:k])]


def e64(b: bytes) -> str:
    return base64.b64encode(b).decode()


def make_record(cid: str = "bafytestcid", signer_uri: str = c.IMPORTER_PREFIX + "import-records.yaml@refs/heads/main"):
    from cryptography import x509
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import ec, utils
    from cryptography.x509.oid import NameOID

    key = ec.generate_private_key(ec.SECP256R1())
    t0 = datetime.datetime(2026, 9, 28, tzinfo=datetime.timezone.utc)
    name = x509.Name([x509.NameAttribute(NameOID.ORGANIZATION_NAME, "test")])
    cert = (x509.CertificateBuilder().subject_name(name).issuer_name(name).public_key(key.public_key())
            .serial_number(1).not_valid_before(t0).not_valid_after(t0 + datetime.timedelta(minutes=10))
            .add_extension(x509.SubjectAlternativeName([x509.UniformResourceIdentifier(signer_uri)]), False)
            .sign(key, hashes.SHA256()))
    digest = h(cid.encode())
    sig = key.sign(digest, ec.ECDSA(utils.Prehashed(hashes.SHA256())))
    body = json.dumps({"apiVersion": "0.0.1", "kind": "hashedrekord", "spec": {
        "data": {"hash": {"algorithm": "sha256", "value": digest.hex()}},
        "signature": {"content": e64(sig)}}}, separators=(",", ":")).encode()
    leaves = [b"a", b"b", b"c", body, b"e"]
    root = mth(leaves)
    bundle = {"mediaType": "application/vnd.dev.sigstore.bundle.v0.3+json",
              "verificationMaterial": {"certificate": {"rawBytes": e64(cert.public_bytes(serialization.Encoding.DER))},
                                       "tlogEntries": [{"logIndex": "99", "integratedTime": str(int(t0.timestamp()) + 60),
                                                        "canonicalizedBody": e64(body),
                                                        "inclusionProof": {"logIndex": "3", "treeSize": "5", "rootHash": e64(root),
                                                                           "hashes": [e64(p) for p in path(3, leaves)],
                                                                           "checkpoint": {"envelope": f"log - 1\n5\n{e64(root)}\n\n"}}}]},
              "messageSignature": {"messageDigest": {"algorithm": "SHA2_256", "digest": e64(digest)}, "signature": e64(sig)}}
    raw = json.dumps(bundle).encode()
    att = {"type": "publisher-identity", "mediaType": bundle["mediaType"],
           "uri": "data:application/vnd.dev.sigstore.bundle.v0.3+json;base64," + e64(raw),
           "digest": "sha256:" + hashlib.sha256(raw).hexdigest(), "size": str(len(raw)),
           "description": "Verified signature by " + signer_uri.replace("https://", "")}
    return att, bundle


def reatt(att: dict, bundle: dict) -> dict:
    raw = json.dumps(bundle).encode()
    return dict(att, uri="data:x;base64," + e64(raw), digest="sha256:" + hashlib.sha256(raw).hexdigest(), size=str(len(raw)))


class Inclusion(unittest.TestCase):
    def test_every_leaf_of_every_small_tree(self):
        for n in range(1, 12):
            leaves = [bytes([i]) for i in range(n)]
            root = mth(leaves)
            for m in range(n):
                self.assertTrue(c.rfc6962_inclusion_ok(m, n, h(b"\x00" + leaves[m]), path(m, leaves), root), (n, m))
                self.assertFalse(c.rfc6962_inclusion_ok(m, n, h(b"\x00x" + leaves[m]), path(m, leaves), root), (n, m))


class Bundle(unittest.TestCase):
    def test_good_bundle_passes(self):
        att, _ = make_record()
        self.assertEqual(c.check_bundle(att, "bafytestcid")["state"], "OFFLINE_CHECKS_PASS")

    def test_other_cid_is_caught(self):
        att, _ = make_record()
        r = c.check_bundle(att, "bafyothercid")
        self.assertFalse(r["signs_the_cid"])
        self.assertEqual(r["state"], "OFFLINE_CHECK_FAILED")

    def test_flipped_signature_is_caught(self):
        att, b = make_record()
        sig = bytearray(base64.b64decode(b["messageSignature"]["signature"]))
        sig[-1] ^= 1
        b["messageSignature"]["signature"] = e64(bytes(sig))
        r = c.check_bundle(reatt(att, b), "bafytestcid")
        self.assertFalse(r["signature_ok"])
        self.assertFalse(r["rekor_body_consistent"])

    def test_tampered_proof_is_caught(self):
        att, b = make_record()
        hs = b["verificationMaterial"]["tlogEntries"][0]["inclusionProof"]["hashes"]
        hs[0] = e64(b"\x00" * 32)
        self.assertFalse(c.check_bundle(reatt(att, b), "bafytestcid")["inclusion_ok"])

    def test_declared_digest_mismatch_is_caught(self):
        att, _ = make_record()
        self.assertFalse(c.check_bundle(dict(att, digest="sha256:" + "0" * 64), "bafytestcid")["digest_ok"])

    def test_signer_outside_the_importer(self):
        att, _ = make_record(signer_uri="https://github.com/someone/else/.github/workflows/x.yml@refs/heads/main")
        self.assertFalse(c.check_bundle(att, "bafytestcid")["signer_is_directory_importer"])

    def test_integrated_time_outside_cert_window(self):
        att, b = make_record()
        b["verificationMaterial"]["tlogEntries"][0]["integratedTime"] = "1"
        self.assertFalse(c.check_bundle(reatt(att, b), "bafytestcid")["cert_window_ok"])


class Redaction(unittest.TestCase):
    def test_personal_identity_is_counted_not_named(self):
        self.assertEqual(c.public_signer("someone@example.com"), "individual identity (redacted)")
        self.assertEqual(c.public_signer(c.IMPORTER_PREFIX + "x.yaml@refs/heads/main"), c.IMPORTER_PREFIX + "x.yaml@refs/heads/main")
        self.assertEqual(c.public_signer(None), "none")


class Cid(unittest.TestCase):
    def test_real_shape_cid_decodes(self):
        d = c.cid_digest("baeareibxxymgjalh3msz6ggxrzaa5gjw7nq2ap3qpdnqjp4rhc2txnnrne")
        self.assertEqual(d.hex(), "37be18648167db259f18d78e400e9936fb61a03f7078db04bf9138b53bb5b169")
        self.assertIsNone(c.cid_digest("Qmnotmultibaseb"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
