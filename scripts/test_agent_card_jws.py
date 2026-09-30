#!/usr/bin/env python3
"""The agent card's signature: produced by one implementation, checked by another, and proven to fail.

Runs offline (python3 scripts/test_agent_card_jws.py). Needs `cryptography`.

What each test exists to catch:
  * spec_example        — §8.4.1 default removal reproduces the specification's own canonical string,
                          in BOTH the signer and the independent verifier
  * implementations_agree — signer and verifier canonicalise the committed card to the same bytes
  * roundtrip_and_tamper — a signature made by the signer verifies in the verifier; a one-byte edit
                          and a swapped kid both FAIL (a verifier that cannot fail proves nothing)
  * refuses_wrong_key   — a key whose public half is not the DID's #card-attestation-1 is refused,
                          and the board key's kid is refused by name (a key is scoped by purpose)
  * committed_card      — if the served card carries signatures they verify against the committed
                          did.json under #card-attestation-1; if not, the signing input says UNSIGNED
                          and nothing else claims otherwise
  * signing_input_fresh — the committed signing input describes the card actually served
"""
from __future__ import annotations

import copy
import importlib.util
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent


def _load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


signer = _load("agent_card_jws", HERE / "adapters" / "agent_card_jws.py")
verifier = _load("verify_agent_card_jws", HERE / "verify_agent_card_jws.py")

from cryptography.hazmat.primitives import serialization  # noqa: E402
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey  # noqa: E402

CARD_BYTES = (ROOT / "public/.well-known/agent-card.json").read_bytes()
ALIAS_BYTES = (ROOT / "public/.well-known/agent.json").read_bytes()
CARD = json.loads(CARD_BYTES)
DID = json.loads((ROOT / "public/.well-known/did.json").read_text(encoding="utf-8"))
KID = "did:web:csoai.org#card-attestation-1"


def _ephemeral_did(sk) -> dict:
    """A synthetic DID document publishing an ephemeral key under the real kid — test-only."""
    x = signer.b64u(sk.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw))
    d = copy.deepcopy(DID)
    for vm in d["verificationMethod"]:
        if vm["id"] == KID:
            vm["publicKeyJwk"]["x"] = x
    return d


def test_spec_example() -> None:
    # A2A specification §8.4.1 "Example of Default Value Removal", verbatim.
    original = {"name": "Example Agent", "description": "",
                "capabilities": {"streaming": False, "pushNotifications": False, "extensions": []},
                "skills": []}
    expected = '{"capabilities":{"pushNotifications":false,"streaming":false},"description":"","name":"Example Agent","skills":[]}'
    assert signer.jcs(signer.payload_obj(original)).decode() == expected
    assert verifier.canonical_payload(original).decode() == expected


def test_implementations_agree() -> None:
    a = signer.jcs(signer.payload_obj(CARD))
    b = verifier.canonical_payload(CARD)
    assert a == b, "signer and verifier canonicalise the served card differently"
    # the removal is not vacuous on this card: extensions carry `"required": false`
    removed: list = []
    signer.payload_obj(CARD, removed)
    assert any(r.endswith(".required") for r in removed), removed


def test_roundtrip_and_tamper() -> None:
    sk = Ed25519PrivateKey.generate()
    did = _ephemeral_did(sk)
    signed = signer.sign_card(CARD, sk, KID, did)
    blob = signer.serialise(signed).encode("utf-8")
    ok = verifier.verify_card_bytes(blob, did, KID)
    assert ok["state"] == "VALID", ok
    bad = verifier.verify_card_bytes(verifier.tamper_one_byte(blob), did, KID)
    assert bad["state"] == "INVALID", bad
    # a signature is bound to its kid: the same bytes against another published key fail
    swapped = json.loads(blob)
    hdr = {"alg": "EdDSA", "kid": "did:web:csoai.org#site-release-1", "typ": "JOSE"}
    swapped["signatures"][0]["protected"] = signer.b64u(signer.jcs(hdr))
    assert verifier.verify_card_bytes(json.dumps(swapped).encode(), did)["state"] == "INVALID"
    # and the real DID does not accept the ephemeral key's signature
    assert verifier.verify_card_bytes(blob, DID, KID)["state"] == "INVALID"
    # the serialiser stays byte-compatible with the committed file (JSON.stringify(card,null,2)+"\n")
    assert signer.serialise(CARD).encode("utf-8") == CARD_BYTES


def _refused(fn) -> str:
    try:
        fn()
    except SystemExit as e:
        return str(e)
    raise AssertionError("expected a refusal")


def test_refuses_wrong_key() -> None:
    stranger = Ed25519PrivateKey.generate()
    msg = _refused(lambda: signer.sign_card(CARD, stranger, KID, DID))
    assert "not the one did.json publishes" in msg, msg
    msg = _refused(lambda: signer.sign_card(CARD, stranger, "did:web:csoai.org#board-attestation-1", DID))
    assert "scoped by purpose" in msg, msg
    msg = _refused(lambda: signer.sign_card(CARD, stranger, "did:web:csoai.org#gspc-board-22axis-2026", DID))
    assert "scoped by purpose" in msg, msg


def test_committed_card() -> None:
    assert CARD_BYTES == ALIAS_BYTES, "the two well-known paths must serve one card"
    res = verifier.verify_card_bytes(CARD_BYTES, DID, KID)
    jws_input = json.loads((ROOT / "public/interop/agent-card-jws-input.json").read_text(encoding="utf-8"))
    if CARD.get("signatures"):
        assert res["state"] == "VALID", f"the served card carries a signature that does not verify: {res}"
        t = verifier.verify_card_bytes(verifier.tamper_one_byte(CARD_BYTES), DID, KID)
        assert t["state"] == "INVALID", "tamper control passed a one-byte edit"
        assert jws_input["state"] == "SIGNED"
    else:
        assert res["state"] == "UNSIGNED"
        assert jws_input["state"] == "UNSIGNED" and "UNSIGNED" in jws_input["note"]


def test_signing_input_fresh() -> None:
    jws_input = json.loads((ROOT / "public/interop/agent-card-jws-input.json").read_text(encoding="utf-8"))
    assert jws_input["payload_b64u"] == verifier.b64u_enc(verifier.canonical_payload(CARD))
    assert jws_input["kid"] == KID and jws_input["alg"] == "EdDSA"


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"  ok  {name}")
    print("PASS agent-card JWS: §8.4 default removal, independent verify, tamper control, key scope")
