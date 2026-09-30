"""The agent-card signer: the new card key signs, a tampered card fails, the board key is refused.

Run: python3 -m pytest scripts/adapters/test_agent_card_jws.py -q

Every key here is EPHEMERAL (generated in-process). No real private key is read. The verifier is
scripts/verify_agent_card_jws.py — a separate implementation that shares no code with the signer.
"""
from __future__ import annotations

import base64
import importlib.util
import json
import sys
from pathlib import Path

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "adapters"))
import agent_card_jws as signer  # noqa: E402

_spec = importlib.util.spec_from_file_location("verify_agent_card_jws", ROOT / "scripts" / "verify_agent_card_jws.py")
verifier = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(verifier)

CARD2 = "did:web:csoai.org#card-attestation-2"
BOARD = "did:web:csoai.org#board-attestation-1"


def _x(sk: Ed25519PrivateKey) -> str:
    raw = sk.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _did(pairs: dict[str, Ed25519PrivateKey]) -> dict:
    """A DID document shaped like the published one, carrying ephemeral public keys."""
    vms = [{"id": kid, "type": "JsonWebKey2020", "controller": "did:web:csoai.org",
            "publicKeyJwk": {"kty": "OKP", "crv": "Ed25519", "x": _x(sk), "use": "sig"}}
           for kid, sk in pairs.items()]
    return {"id": "did:web:csoai.org", "verificationMethod": vms, "assertionMethod": list(pairs)}


@pytest.fixture(scope="module")
def card() -> dict:
    c = json.loads((ROOT / "public" / ".well-known" / "agent-card.json").read_text(encoding="utf-8"))
    return {k: v for k, v in c.items() if k != "signatures"}


def test_card_attestation_2_is_allowed_by_fragment_and_board_keys_stay_refused():
    assert CARD2 in signer.ALLOWED_KIDS
    assert BOARD in signer.REFUSED_KIDS and BOARD not in signer.ALLOWED_KIDS
    assert not (set(signer.ALLOWED_KIDS) & set(signer.REFUSED_KIDS))


def test_new_card_key_signature_verifies_independently(card):
    sk = Ed25519PrivateKey.generate()
    did = _did({CARD2: sk})
    signed = signer.sign_card(card, sk, CARD2, did)
    blob = signer.serialise(signed).encode("utf-8")
    res = verifier.verify_card_bytes(blob, did, require_kid=CARD2)
    assert res["state"] == "VALID", res
    hdr = json.loads(verifier.b64u_dec(signed["signatures"][0]["protected"]))
    assert hdr == {"alg": "EdDSA", "kid": CARD2, "typ": "JOSE"}


def test_tampered_card_fails(card):
    sk = Ed25519PrivateKey.generate()
    did = _did({CARD2: sk})
    blob = signer.serialise(signer.sign_card(card, sk, CARD2, did)).encode("utf-8")
    assert verifier.verify_card_bytes(verifier.tamper_one_byte(blob), did)["state"] == "INVALID"
    # and a semantic edit to a skill fails too
    edited = json.loads(blob)
    edited["skills"][0]["name"] = edited["skills"][0]["name"] + "!"
    assert verifier.verify_card_bytes(json.dumps(edited).encode(), did)["state"] == "INVALID"


def test_signing_with_the_board_key_is_refused(card):
    sk = Ed25519PrivateKey.generate()
    did = _did({BOARD: sk})              # even when the DID publishes it and the key matches
    with pytest.raises(SystemExit, match="REFUSED: did:web:csoai.org#board-attestation-1"):
        signer.sign_card(card, sk, BOARD, did)


def test_a_key_that_is_not_the_published_card_key_is_refused(card):
    published, other = Ed25519PrivateKey.generate(), Ed25519PrivateKey.generate()
    with pytest.raises(SystemExit, match="not the one did.json publishes"):
        signer.sign_card(card, other, CARD2, _did({CARD2: published}))


def test_a_signature_under_one_card_key_does_not_verify_under_another(card):
    sk1, sk2 = Ed25519PrivateKey.generate(), Ed25519PrivateKey.generate()
    signed = signer.sign_card(card, sk2, CARD2, _did({CARD2: sk2}))
    # the same kid resolving to a different key (a swapped did.json) must fail
    assert verifier.verify_card_bytes(signer.serialise(signed).encode(), _did({CARD2: sk1}))["state"] == "INVALID"


def test_committed_card_verifies_against_committed_did_if_signed():
    blob = (ROOT / "public" / ".well-known" / "agent-card.json").read_bytes()
    did = json.loads((ROOT / "public" / ".well-known" / "did.json").read_text(encoding="utf-8"))
    res = verifier.verify_card_bytes(blob, did)
    if res["state"] == "UNSIGNED":
        pytest.skip("committed card is unsigned")
    assert res["state"] == "VALID", res
    assert all(r.get("kid") in signer.ALLOWED_KIDS for r in res["results"])
    assert verifier.verify_card_bytes(verifier.tamper_one_byte(blob), did)["state"] == "INVALID"
    alias = (ROOT / "public" / ".well-known" / "agent.json").read_bytes()
    assert alias == blob
