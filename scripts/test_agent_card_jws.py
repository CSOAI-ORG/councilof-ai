#!/usr/bin/env python3
"""The agent card's signature: produced by one implementation, checked by another, and proven to fail.

Runs offline (python3 scripts/test_agent_card_jws.py). Needs `cryptography`.

THE PIN. The agent card is signed under did:web:csoai.org#card-attestation-2. That key was added on
2026-09-27 by the owner-approved rotation recorded in the corrections ledger as C-2026-0927-05,
because the private half of #card-attestation-1 is not held on any host that signs the card.
#card-attestation-1 stays published and is NOT revoked, since the signed card index verifies under it.
It no longer signs the agent card, though, so a card carrying it must fail here, exactly as a card
carrying a board key does. The pin is written out and never read from the card under test. A check
that takes its expected key from the thing it checks will accept whatever it is given.

What each test exists to catch:
  * spec_example        — §8.4.1 default removal reproduces the specification's own canonical string,
                          in BOTH the signer and the independent verifier
  * implementations_agree — signer and verifier canonicalise the committed card to the same bytes
  * roundtrip_and_tamper — a signature made by the signer verifies in the verifier; a one-byte edit
                          and a swapped kid both FAIL (a verifier that cannot fail proves nothing)
  * refuses_wrong_key   — a key whose public half is not the DID's #card-attestation-2 is refused,
                          and the board keys' kids are refused by name (a key is scoped by purpose)
  * key_scope           — a card validly signed under ANY other key the DID document publishes,
                          #card-attestation-1 included, verifies without the pin and FAILS with it
  * cli_pin             — the same holds on the exact CLI path the CI step runs (main(), exit codes)
  * pin_is_published    — the pinned kid is an Ed25519 key in the committed did.json's assertionMethod
  * pin_agrees          — the signer's default kid, the signing input, the CI step's --require-kid and
                          the Node test's CARD_KID name the same key. After the 27 Sep rotation the
                          signer and the Node test named #card-attestation-2 while this file and the
                          CI step still named #card-attestation-1, and the CI step failed on every run
  * committed_card      — if the served card carries signatures they verify against the committed
                          did.json under #card-attestation-2; if not, the signing input says UNSIGNED
                          and nothing else claims otherwise
  * signing_input_fresh — the committed signing input describes the card actually served
"""
from __future__ import annotations

import contextlib
import copy
import importlib.util
import io
import json
import re
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
JWS_INPUT = json.loads((ROOT / "public/interop/agent-card-jws-input.json").read_text(encoding="utf-8"))
WORKFLOW = ROOT / ".github/workflows/a2a-contract-selftest.yml"
NODE_TEST = ROOT / "functions/api/agent-card-jws.test.ts"
# The one key the agent card may be signed under (C-2026-0927-05). See THE PIN above.
KID = "did:web:csoai.org#card-attestation-2"
PREVIOUS_CARD_KID = "did:web:csoai.org#card-attestation-1"


def _ephemeral_did(sk, kid: str = KID) -> dict:
    """A synthetic DID document publishing an ephemeral key under a real kid — test-only."""
    x = signer.b64u(sk.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw))
    d = copy.deepcopy(DID)
    hits = [vm for vm in d["verificationMethod"] if vm["id"] == kid]
    assert len(hits) == 1, f"{kid} is not published exactly once in did.json"
    hits[0]["publicKeyJwk"]["x"] = x
    return d


def _raw_sign(card: dict, sk, kid: str) -> bytes:
    """A JWS made directly, NOT through the signer: the signer refuses board kids by name, and the
    question here is what the VERIFIER does with a card somebody else produced."""
    si, prot, _ = signer.signing_input(card, kid)
    out = {k: v for k, v in card.items() if k != "signatures"}
    out["signatures"] = [{"protected": signer.b64u(signer.jcs(prot)), "signature": signer.b64u(sk.sign(si))}]
    return signer.serialise(out).encode("utf-8")


def _cli(argv: list[str]) -> int:
    """scripts/verify_agent_card_jws.py's main(), as the CI step calls it, with its report swallowed."""
    with contextlib.redirect_stdout(io.StringIO()):
        return verifier.main(argv)


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


def test_key_scope() -> None:
    others = [k for k in DID["assertionMethod"] if k != KID]
    # the previous card key is the case that matters most: it is published, Ed25519 and not revoked
    assert PREVIOUS_CARD_KID in others, others
    assert "did:web:csoai.org#board-attestation-1" in others, others
    for other in others:
        sk = Ed25519PrivateKey.generate()
        did = _ephemeral_did(sk, other)
        blob = _raw_sign(CARD, sk, other)
        # control: the signature itself is good, so the refusal below is the pin's doing alone
        assert verifier.verify_card_bytes(blob, did)["state"] == "VALID", other
        res = verifier.verify_card_bytes(blob, did, KID)
        assert res["state"] == "INVALID", (other, res)
        assert res["results"][0]["why"] == f"kid {other} is not the required {KID}", res
    # and a card signed under the pinned kid by a key the DID does not publish fails against the real DID
    sk = Ed25519PrivateKey.generate()
    assert verifier.verify_card_bytes(_raw_sign(CARD, sk, KID), DID, KID)["state"] == "INVALID"


def test_cli_pin() -> None:
    if not CARD.get("signatures"):
        assert _cli(["--require-kid", KID, "--tamper-control"]) == 2      # UNSIGNED, said out loud
        return
    assert _cli(["--require-kid", KID, "--tamper-control"]) == 0          # VALID, and the tamper control failed
    for other in (k for k in DID["assertionMethod"] if k != KID):
        assert _cli(["--require-kid", other, "--tamper-control"]) == 1, other   # INVALID under any other key


def test_pin_is_published() -> None:
    assert KID in DID["assertionMethod"], f"{KID} is not in the committed did.json's assertionMethod"
    vms = [vm for vm in DID["verificationMethod"] if vm["id"] == KID]
    assert len(vms) == 1, vms
    jwk = vms[0]["publicKeyJwk"]
    assert (jwk["kty"], jwk["crv"]) == ("OKP", "Ed25519"), jwk
    assert len(verifier.b64u_dec(jwk["x"])) == 32
    assert KID not in signer.REFUSED_KIDS and KID in signer.ALLOWED_KIDS


def test_pin_agrees() -> None:
    wf = re.findall(r"--require-kid\s+'([^']+)'", WORKFLOW.read_text(encoding="utf-8"))
    node = re.findall(r'const CARD_KID = "([^"]+)";', NODE_TEST.read_text(encoding="utf-8"))
    assert wf, f"{WORKFLOW.relative_to(ROOT)} no longer pins a kid with --require-kid"
    assert len(node) == 1, f"{NODE_TEST.relative_to(ROOT)}: expected one CARD_KID, found {node}"
    pins = {
        "scripts/test_agent_card_jws.py KID": KID,
        "scripts/adapters/agent_card_jws.py KID (signer default)": signer.KID,
        "public/interop/agent-card-jws-input.json kid": JWS_INPUT["kid"],
        "functions/api/agent-card-jws.test.ts CARD_KID": node[0],
        **{f"{WORKFLOW.relative_to(ROOT)} --require-kid [{i}]": k for i, k in enumerate(wf)},
    }
    assert len(set(pins.values())) == 1, "the agent-card key is pinned differently in different places: " + json.dumps(pins, indent=2)


def test_committed_card() -> None:
    assert CARD_BYTES == ALIAS_BYTES, "the two well-known paths must serve one card"
    res = verifier.verify_card_bytes(CARD_BYTES, DID, KID)
    if CARD.get("signatures"):
        assert res["state"] == "VALID", f"the served card carries a signature that does not verify: {res}"
        t = verifier.verify_card_bytes(verifier.tamper_one_byte(CARD_BYTES), DID, KID)
        assert t["state"] == "INVALID", "tamper control passed a one-byte edit"
        assert JWS_INPUT["state"] == "SIGNED"
        # pinned to any other published key, the same served bytes fail
        for other in (k for k in DID["assertionMethod"] if k != KID):
            assert verifier.verify_card_bytes(CARD_BYTES, DID, other)["state"] == "INVALID", other
    else:
        assert res["state"] == "UNSIGNED"
        assert JWS_INPUT["state"] == "UNSIGNED" and "UNSIGNED" in JWS_INPUT["note"]


def test_signing_input_fresh() -> None:
    assert JWS_INPUT["payload_b64u"] == verifier.b64u_enc(verifier.canonical_payload(CARD))
    assert JWS_INPUT["kid"] == KID and JWS_INPUT["alg"] == "EdDSA"


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"  ok  {name}")
    print("PASS agent-card JWS: §8.4 default removal, independent verify, tamper control, key scope")
