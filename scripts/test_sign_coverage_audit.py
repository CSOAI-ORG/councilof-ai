"""Tests for scripts/sign_coverage_audit.py — the canonicaliser and the envelope verifier.

The audit decides VALID/INVALID by recomputing the bytes POST /api/board-sign signed, which are
JSON.stringify over a key-sorted object. Two engine behaviours a Python port gets wrong silently
are pinned here against node itself when node is on PATH: integral floats print as integers, and
array-index keys ("9", "10") are emitted first in numeric order.

    uv run --python 3.12 --with cryptography --with opentimestamps --with pytest \
        python -m pytest scripts/test_sign_coverage_audit.py -q
"""
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

import pytest
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sign_coverage_audit as sca  # noqa: E402

NUMS = [0.0, -0.0, 1.0, -3.0, 0.5, 0.1, 1e-7, 1.5e-7, 0.000001, 0.0000012, 1e21, 1.2e21, 123456789012345680000.0,
        1e16, 2.5e-5, 0.7667, 1 / 3, 12345.678]
OBJ = {"b": 1, "10": 2, "9": 3, "a": 1.0, "é": "ü\n", "x": [1.0, 0.5, None, True], "01": 0}


def test_js_number_known_values():
    assert sca.js_number(1.0) == "1"
    assert sca.js_number(-0.0) == "0"
    assert sca.js_number(1e-7) == "1e-7"
    assert sca.js_number(0.000001) == "0.000001"
    assert sca.js_number(1e21) == "1e+21"
    assert sca.js_number(1e16) == "10000000000000000"


def test_canon_js_index_keys_first():
    assert sca.canon_js({"b": 1, "10": 2, "9": 3, "a": 1.0, "01": 0}) == b'{"9":3,"10":2,"01":0,"a":1,"b":1}'


@pytest.mark.skipif(not shutil.which("node"), reason="node not on PATH")
def test_matches_node_json_stringify():
    js = ("const o=JSON.parse(process.argv[1]);const rec=v=>Array.isArray(v)?v.map(rec):v&&typeof v==='object'?"
          "Object.fromEntries(Object.keys(v).sort().map(k=>[k,rec(v[k])])):v;"
          "process.stdout.write(JSON.stringify({n:JSON.parse(process.argv[2]).map(x=>JSON.stringify(x)),o:JSON.stringify(rec(o))}))")
    out = json.loads(subprocess.run(["node", "-e", js, json.dumps(OBJ), json.dumps(NUMS)],
                                    capture_output=True, text=True, check=True).stdout)
    assert [sca.js_number(x) for x in NUMS] == out["n"]
    assert sca.canon_js(OBJ).decode() == out["o"]


def _did_with(pub: bytes) -> "sca.Did":
    import base64
    x = base64.urlsafe_b64encode(pub).rstrip(b"=").decode()
    return sca.Did({"verificationMethod": [{"id": "did:web:csoai.org#board-attestation-1",
                                            "publicKeyJwk": {"kty": "OKP", "crv": "Ed25519", "x": x}}]}, "test")


def _envelope(sk, payload):
    b = sca.canon_js(payload)
    return {"payload": payload, "signature": {"did": "did:web:csoai.org#board-attestation-1", "alg": "Ed25519",
                                              "sig_ed25519": sk.sign(b).hex(),
                                              "payload_sha256": hashlib.sha256(b).hexdigest()}}


def test_envelope_valid_and_controls():
    sk = Ed25519PrivateKey.generate()
    pub = sk.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    did = _did_with(pub)
    doc = _envelope(sk, {"kind": "t", "n": 30, "acc": 1.0, "intervals": {"7": "a", "30": "b"}})
    assert sca.v_payload_envelope(doc, did)["state"] == "VALID"
    # control 1: one byte of the payload changed -> INVALID, never VALID
    assert sca.v_payload_envelope(sca.tamper(doc, "payload"), did)["state"] == "INVALID"
    # control 2: a key the DID does not publish -> UNCHECKABLE, never VALID
    other = _did_with(Ed25519PrivateKey.generate().public_key().public_bytes(
        serialization.Encoding.Raw, serialization.PublicFormat.Raw))
    assert sca.v_payload_envelope(doc, other)["state"] == "INVALID"
    doc2 = json.loads(json.dumps(doc))
    doc2["signature"]["did"] = "did:web:example.org#k"
    assert sca.v_payload_envelope(doc2, did)["state"] == "UNCHECKABLE"
