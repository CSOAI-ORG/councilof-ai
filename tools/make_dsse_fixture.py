#!/usr/bin/env python3
"""make_dsse_fixture.py — build a DSSE test fixture with a THROWAWAY key.

Why this exists: shape D (DSSE) has an emitter (scripts/emit_dsse.py) and a
standalone verifier in gspc-os, but ZERO published artifacts anywhere on this
estate. To exercise the shape-D path of verify_any_card.py we therefore have to
manufacture a fixture.

This fixture is NOT an estate artifact and its signature is NOT an estate signature.
The key is generated fresh here and discarded; it is not, and must never be, the
estate signing key. The fixture's only purpose is to prove the verifier's DSSE PAE
reconstruction is correct.

Writes: fixtures/dsse-fixture.json and fixtures/dsse-fixture.key.pub
"""
import base64
import hashlib
import json
import os
import sys

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization

PAYLOAD_TYPE = "application/vnd.csoai.measurement+json"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fixtures")


def canonical(o):
    return json.dumps(o, sort_keys=True, separators=(",", ":")).encode("utf-8")


def dsse_pae(t: str, p: bytes) -> bytes:
    tb = t.encode()
    return b"DSSEv1 %d %s %d %s" % (len(tb), tb, len(p), p)


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else "public/signed/cards"
    if os.path.isdir(src):
        src = os.path.join(src, sorted(os.listdir(src))[0])
    card = json.loads(open(src).read())
    # wrap the REAL body of a real published card, so the payload is genuine even
    # though the envelope and signature are synthetic.
    payload = canonical(card["body"])

    sk = Ed25519PrivateKey.generate()          # throwaway, never persisted
    pub = sk.public_key().public_bytes(serialization.Encoding.Raw,
                                       serialization.PublicFormat.Raw)
    sig = sk.sign(dsse_pae(PAYLOAD_TYPE, payload))

    env = {
        "payloadType": PAYLOAD_TYPE,
        "payload": base64.b64encode(payload).decode(),
        "signatures": [{"keyid": hashlib.sha256(pub).hexdigest(),
                        "sig": base64.b64encode(sig).decode()}],
        "_fixture_note": ("SYNTHETIC TEST FIXTURE. Throwaway key, not the estate key. "
                          "Payload is the body of real card " + card["id"] + "."),
    }
    os.makedirs(OUT, exist_ok=True)
    open(os.path.join(OUT, "dsse-fixture.json"), "w").write(json.dumps(env, indent=1))
    open(os.path.join(OUT, "dsse-fixture.key.pub"), "w").write(pub.hex() + "\n")
    print("wrote fixtures/dsse-fixture.json  (throwaway key:", pub.hex()[:16] + "...)")
    print("source card:", card["id"])


if __name__ == "__main__":
    main()
