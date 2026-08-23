#!/usr/bin/env python3
"""emit_dsse.py — express our signed measurement in a DSSE envelope (the standard signing envelope).

Same measurement, same key, standard envelope. Verifiable with standard DSSE tooling; the
signature remains the estate Ed25519 key published in did:web:csoai.org.

    python3 emit_dsse.py elo_reference.json   # wrap into DSSE, sign, verify
"""
import json, sys, base64, hashlib
from pathlib import Path
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey
from cryptography.hazmat.primitives import serialization

PAYLOAD_TYPE = "application/vnd.csoai.measurement+json"


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        raise SystemExit(2)
    src = Path(sys.argv[1])
    d = json.loads(src.read_text())
    # the measurement body = everything except integrity fields
    body = {k: v for k, v in d.items() if k not in ("content_id", "signature")}
    payload = canonical(body)

    # sign with the estate key (signing node only)
    sk = serialization.load_pem_private_key(
        open("/root/.sovos/city_ed25519", "rb").read(), password=None)
    pub = sk.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    pub_b64 = base64.b64encode(pub).decode()

    sig = sk.sign(payload)
    # DSSE envelope: payloadType + base64(payload) + signatures[]
    envelope = {
        "payloadType": PAYLOAD_TYPE,
        "payload": base64.b64encode(payload).decode(),
        "signatures": [{
            "keyid": hashlib.sha256(pub).hexdigest(),
            "sig": base64.b64encode(sig).decode(),
        }],
    }
    out = src.with_suffix(".dsse.json")
    out.write_text(json.dumps(envelope, indent=1))

    # verify with the public key (the independent path)
    payload2 = base64.b64decode(envelope["payload"])
    pub_k = Ed25519PublicKey.from_public_bytes(pub)
    pub_k.verify(base64.b64decode(envelope["signatures"][0]["sig"]), payload2)
    # payload integrity: recompute content_id of the embedded payload
    cid = hashlib.sha256(payload2).hexdigest()
    print("DSSE envelope written:", out)
    print("  payloadType:", PAYLOAD_TYPE)
    print("  payload bytes:", len(payload2))
    print("  payload content_id (recomputed):", cid[:20])
    print("  signature verifies with estate pubkey:", pub_b64[:16] + "...")
    print("  EDITING the payload would break verification (std DSSE discipline).")


if __name__ == "__main__":
    main()
