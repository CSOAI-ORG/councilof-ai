# SPDX-License-Identifier: Apache-2.0
"""verify.py with a key generated inside the test (a TEST key; it attests nothing)."""
import base64, hashlib, json, os
import pytest
import event as E
import verify as VF

crypto = pytest.importorskip("cryptography")
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
KID = "did:web:test.invalid#board-attestation-1"


def signed_set(tmp_path):
    sk = Ed25519PrivateKey.generate()
    x = base64.urlsafe_b64encode(sk.public_key().public_bytes_raw()).decode().rstrip("=")
    did = {"id": "did:web:test.invalid", "verificationMethod": [{"id": KID, "type": "JsonWebKey2020",
           "publicKeyJwk": {"kty": "OKP", "crv": "Ed25519", "x": x}}]}
    ev_path = tmp_path / "events.jsonl"
    ev_path.write_bytes(open(os.path.join(HERE, "fixtures", "events.jsonl"), "rb").read())
    batch = E.batch_record("fixture", str(ev_path), "2026-09-30T12:00:00Z")
    braw = (json.dumps(batch, indent=1) + "\n").encode()
    payload = {"schema": "csoai.signed-artifact/0.1", "artifact": {"path": "fixture/batch.json", "sha256": hashlib.sha256(braw).hexdigest(),
               "schema": batch["schema"], "as_of": batch["as_of"]}}
    sig = sk.sign(VF.canon(payload)).hex()
    signed = {"schema": "csoai.signed-run/0.1", "payload": payload,
              "signature": {"did": KID, "alg": "Ed25519", "sig_ed25519": sig, "payload_sha256": hashlib.sha256(VF.canon(payload)).hexdigest()}}
    return braw, json.dumps(signed, indent=1).encode(), ev_path.read_bytes(), did


def test_valid(tmp_path):
    b, s, e, did = signed_set(tmp_path)
    assert VF.verify_bytes(b, s, e, did)[0] == "VALID"


@pytest.mark.parametrize("which", ["batch", "events", "signed"])
def test_one_byte_tamper_is_invalid(tmp_path, which):
    b, s, e, did = signed_set(tmp_path)
    if which == "batch":
        b = VF.flip(b)
    elif which == "events":
        e = VF.flip(e)
    else:
        sj = json.loads(s); h = sj["signature"]["sig_ed25519"]
        sj["signature"]["sig_ed25519"] = ("0" if h[0] != "0" else "1") + h[1:]
        s = json.dumps(sj).encode()
    assert VF.verify_bytes(b, s, e, did)[0] == "INVALID"


def test_unknown_key_is_unverifiable_not_valid(tmp_path):
    b, s, e, did = signed_set(tmp_path)
    did["verificationMethod"][0]["id"] = "did:web:test.invalid#other-key"
    assert VF.verify_bytes(b, s, e, did)[0] == "UNVERIFIABLE_KEY"


def test_cli_tamper_control(tmp_path, capsys):
    b, s, e, did = signed_set(tmp_path)
    for n, v in (("b.json", b), ("s.json", s), ("e.jsonl", e)):
        (tmp_path / n).write_bytes(v)
    (tmp_path / "did.json").write_text(json.dumps(did))
    rc = VF.main([str(tmp_path / "b.json"), str(tmp_path / "s.json"), str(tmp_path / "e.jsonl"), "--did", str(tmp_path / "did.json"), "--tamper-control"])
    out = json.loads(capsys.readouterr().out)
    assert rc == 0 and out["result"] == "VALID" and set(out["tamper_controls"].values()) == {"INVALID"}
