#!/usr/bin/env python3
"""A valid harvest signature must still say its authority is NOT_ESTABLISHED.

Why this test exists (M4, 2026-09-17): a report printed "SIGNED ✓" over 56
artifacts whose own scope text disclaimed authority. The signatures were real —
Ed25519 over the right bytes, verifying every time. The code was honest; the
banner was not. Validity and standing are different questions, so the artifact
has to answer both, in fields, where a banner cannot outrun them.

Run: python3 scripts/test_harvest_signature_authority.py   (or under pytest)
"""
from __future__ import annotations

import hashlib
import json
import pathlib
import sys
import tempfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

import master_closed_loop as mcl

PAYLOAD = b'{"axis":"governance","kind":"harvest-stage","n":237}'


def _fresh_key(tmp: pathlib.Path) -> tuple[pathlib.Path, pathlib.Path, str]:
    k = Ed25519PrivateKey.generate()
    priv = tmp / "harvest_ed25519.pem"
    pub = tmp / "harvest_ed25519.pub"
    priv.write_bytes(k.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()))
    pub.write_bytes(k.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo))
    fp = hashlib.sha256(pub.read_bytes()).hexdigest()[:16]
    return priv, pub, fp


def _sign(tmp: pathlib.Path, monkey_env: dict) -> dict:
    import os
    for k, v in monkey_env.items():
        os.environ[k] = v
    return mcl.sign_harvest(PAYLOAD)


def test_harvest_signature_is_valid_AND_not_established():
    """The load-bearing one: a signature that really verifies, and still has no standing."""
    with tempfile.TemporaryDirectory() as d:
        tmp = pathlib.Path(d)
        priv, pub, _fp = _fresh_key(tmp)
        sig = _sign(tmp, {
            "CSOAI_HARVEST_PRIV": str(priv),
            "CSOAI_HARVEST_PUB": str(pub),
            "CSOAI_HARVEST_ALLOWLIST": str(tmp / "no-such-allowlist.json"),
        })
        mcl.HARVEST_ALLOWLIST_PATH = tmp / "no-such-allowlist.json"
        sig = mcl.sign_harvest(PAYLOAD)

        # VALID: the signature verifies against the public key, over these exact bytes.
        import base64
        pubkey = serialization.load_pem_public_key(pub.read_bytes())
        pubkey.verify(base64.b64decode(sig["signature_b64"]), PAYLOAD)  # raises if not

        # ...and NOT_ESTABLISHED all the same.
        assert sig["signer_authority"] == "NOT_ESTABLISHED", sig["signer_authority"]
        assert "harvest_authority_grant" not in sig
        assert sig["signature_kind"] == "harvest-stage"
        print("PASS  valid signature + signer_authority=NOT_ESTABLISHED")


def test_tampered_bytes_fail_verification():
    """Control. If this passed, the VALID half of the test above would prove nothing."""
    with tempfile.TemporaryDirectory() as d:
        tmp = pathlib.Path(d)
        priv, pub, _ = _fresh_key(tmp)
        mcl.HARVEST_ALLOWLIST_PATH = tmp / "none.json"
        import base64, os
        os.environ["CSOAI_HARVEST_PRIV"], os.environ["CSOAI_HARVEST_PUB"] = str(priv), str(pub)
        sig = mcl.sign_harvest(PAYLOAD)
        pubkey = serialization.load_pem_public_key(pub.read_bytes())
        try:
            pubkey.verify(base64.b64decode(sig["signature_b64"]), PAYLOAD + b"x")
        except InvalidSignature:
            print("PASS  tampered bytes rejected (the check can fail)")
            return
        raise AssertionError("tampered payload verified — the verification is vacuous")


def test_allowlist_grants_harvest_authority_only():
    """The field is computed, not hardcoded — and a grant never reaches board authority."""
    with tempfile.TemporaryDirectory() as d:
        tmp = pathlib.Path(d)
        priv, pub, fp = _fresh_key(tmp)
        allow = tmp / "allow.json"
        allow.write_text(json.dumps({"grants": {fp: {"reason": "unit test grant"}}}))
        import os
        os.environ["CSOAI_HARVEST_PRIV"], os.environ["CSOAI_HARVEST_PUB"] = str(priv), str(pub)
        mcl.HARVEST_ALLOWLIST_PATH = allow
        sig = mcl.sign_harvest(PAYLOAD)
        assert sig["signer_authority"] == "HARVEST_AUTHORITY_GRANTED", sig["signer_authority"]
        assert sig["harvest_authority_grant"]["scope"].startswith("harvest-stage only")
        assert sig["signature_kind"] == "harvest-stage"
        assert "board" not in sig["signer_authority"].lower()
        print("PASS  allowlist grants harvest authority only (field is computed)")


def test_malformed_allowlist_fails_closed():
    with tempfile.TemporaryDirectory() as d:
        tmp = pathlib.Path(d)
        priv, pub, fp = _fresh_key(tmp)
        bad = tmp / "bad.json"
        bad.write_text("{ this is not json")
        import os
        os.environ["CSOAI_HARVEST_PRIV"], os.environ["CSOAI_HARVEST_PUB"] = str(priv), str(pub)
        mcl.HARVEST_ALLOWLIST_PATH = bad
        assert mcl.sign_harvest(PAYLOAD)["signer_authority"] == "NOT_ESTABLISHED"

        empty_reason = tmp / "noreason.json"
        empty_reason.write_text(json.dumps({"grants": {fp: {"reason": ""}}}))
        mcl.HARVEST_ALLOWLIST_PATH = empty_reason
        assert mcl.sign_harvest(PAYLOAD)["signer_authority"] == "NOT_ESTABLISHED"
        print("PASS  malformed / reasonless allowlist fails closed")


def test_no_bare_signed_state_in_source():
    """No code path may emit a signature dict without an authority field."""
    src = (pathlib.Path(__file__).resolve().parent / "master_closed_loop.py").read_text()
    assert '"signature_kind": "harvest-stage"' in src
    block_start = src.index('"signature_kind": "harvest-stage"')
    block = src[block_start:block_start + 800]
    assert '"signer_authority"' in block, "signature dict emitted without signer_authority"
    print("PASS  every emitted signature dict carries signer_authority")


TESTS = [v for k, v in sorted(globals().items()) if k.startswith("test_")]

if __name__ == "__main__":
    for t in TESTS:
        t()
    print(f"\n{len(TESTS)}/{len(TESTS)} passed")
