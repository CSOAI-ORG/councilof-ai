#!/usr/bin/env python3
"""measurement_card.py — emit a SIGNED MEASUREMENT card (roadmap item 4).

Aligns the estate's measurement contract with the roadmap: "sign each run as a
MEASUREMENT with the config digest + instrument version in the preimage." The card binds:
  - instrument (e.g. "inspect_ai", version) — "measured with Inspect AI" is fine;
    "Inspect-certified" is a doctrine violation.
  - config digest (sha256 of the run config) so the exact instrument/parameters are
    reproducible and stranger-checkable.
  - the measured rows/digest (NOT the raw model outputs; a digest keeps cards ~3KB).
  - the estate signing key (pod key or provided), signer-consistent canon.

Language rule enforced at emit time: the card is a MEASUREMENT, never a certification.

Usage:
  python3 measurement_card.py --config config.json --rows-digest <sha256> \
      --instrument inspect_ai --instrument-version 0.3.47 \
      --axis governance --n 237 --accuracy 0.7 --key <ed25519> --out card.json
"""
import argparse, base64, hashlib, json, os, sys

# The authoritative JCS (RFC 8785) canonicalizer — must match verify-card.mjs canonicalJcs
# byte-for-byte (integral floats -> int, ensure_ascii=False). Import from the repo reference.
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__))))
from jcs import canonicalize as jcs  # noqa: E402

DOCTRINE = (
    "MEASUREMENT, not certification. 'measured with Inspect AI' is the "
    "claim; 'Inspect-certified' would be a violation. config_digest + "
    "rows_digest make the run reproducible and stranger-checkable."
)


def content_id(body_obj):
    """Card id = sha256(JCS-canonical(body)) — matches verify-card.mjs canonicalJcs(card.body).
    NOT plain json.dumps: JCS emits integral floats as integers and leaves non-ASCII literal."""
    return hashlib.sha256(jcs(body_obj).encode()).hexdigest()


def config_digest(cfg):
    """sha256 of the run config under sorted-key JSON. Binds instrument parameters, not scores."""
    return hashlib.sha256(
        json.dumps(cfg, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    ).hexdigest()


def emit_card(*, cfg, rows_digest, instrument, instrument_version, axis, n, accuracy, sk):
    """Sign a MEASUREMENT card with a caller-supplied Ed25519 key (throwaway keys in tests).

    Never an estate signature unless the caller passes the estate key. The card is a
    measurement credential, not a certificate.
    """
    from cryptography.hazmat.primitives import serialization

    body = {
        "axis": axis,
        "n": n,
        "accuracy": accuracy,
        "instrument": {"name": instrument, "version": instrument_version},
        "config_digest": config_digest(cfg),
        "rows_digest": rows_digest,
    }
    pub = sk.public_key().public_bytes(
        serialization.Encoding.Raw, serialization.PublicFormat.Raw
    )
    card = {
        "alg": "Ed25519",
        "preimage_rule": "jcs-rfc8785",
        "kind": "measurement",
        "body": body,
        "doctrine": DOCTRINE,
        "id": content_id(body),
        "pubkey": pub.hex(),
        "signature": sk.sign(jcs(body).encode()).hex(),
    }
    return card


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True, help="run config JSON (instrument params)")
    ap.add_argument("--rows-digest", required=True, help="sha256 over the measured rows")
    ap.add_argument("--instrument", default="inspect_ai")
    ap.add_argument("--instrument-version", default="0.3.47")
    ap.add_argument("--axis", required=True)
    ap.add_argument("--n", type=int, required=True)
    ap.add_argument("--accuracy", type=float, required=True)
    ap.add_argument("--key", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

    cfg = json.load(open(a.config))
    sk = Ed25519PrivateKey.from_private_bytes(open(a.key, "rb").read())
    card = emit_card(
        cfg=cfg,
        rows_digest=a.rows_digest,
        instrument=a.instrument,
        instrument_version=a.instrument_version,
        axis=a.axis,
        n=a.n,
        accuracy=a.accuracy,
        sk=sk,
    )
    json.dump(card, open(a.out, "w"), indent=1, ensure_ascii=False)
    print(
        f"MEASUREMENT card {a.out} id={card['id'][:16]} instrument={a.instrument}@{a.instrument_version} "
        f"axis={a.axis} n={a.n} acc={a.accuracy}"
    )
    print(f"config_digest={card['body']['config_digest'][:16]}")

if __name__ == "__main__":
    main()
