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

def content_id(body_obj):
    """Card id = sha256(JCS-canonical(body)) — matches verify-card.mjs canonicalJcs(card.body).
    NOT plain json.dumps: JCS emits integral floats as integers and leaves non-ASCII literal."""
    return hashlib.sha256(jcs(body_obj).encode()).hexdigest()

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

    cfg = json.load(open(a.config))
    cfg_digest = hashlib.sha256(json.dumps(cfg, sort_keys=True, separators=(",", ":"),
                                           ensure_ascii=False).encode()).hexdigest()

    card = {
        "alg": "Ed25519",
        "preimage_rule": "jcs-rfc8785",
        "kind": "measurement",
        "body": {
            "axis": a.axis,
            "n": a.n,
            "accuracy": a.accuracy,
            "instrument": {"name": a.instrument, "version": a.instrument_version},
            "config_digest": cfg_digest,
            "rows_digest": a.rows_digest,
        },
        "doctrine": ("MEASUREMENT, not certification. 'measured with Inspect AI' is the "
                     "claim; 'Inspect-certified' would be a violation. config_digest + "
                     "rows_digest make the run reproducible and stranger-checkable."),
    }
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from cryptography.hazmat.primitives import serialization
    sk = Ed25519PrivateKey.from_private_bytes(open(a.key, "rb").read())
    pub = sk.public_key().public_bytes(serialization.Encoding.Raw,
                                       serialization.PublicFormat.Raw)
    cid = content_id(card["body"])
    card["id"] = cid
    card["pubkey"] = pub.hex()
    # Sign over the JCS-canonical BODY bytes — exactly what verify-card.mjs checks:
    # preimage = canonicalJcs(card.body); crypto.subtle.verify(Ed25519, key, sig, preimage).
    # A signature over the digest-hex would NOT verify (the distributed verifier signs the
    # body preimage). card.signature is the RAW Ed25519 bytes as hex (verifier unhexes it).
    preimage = jcs(card["body"]).encode()
    card["signature"] = sk.sign(preimage).hex()
    json.dump(card, open(a.out, "w"), indent=1, ensure_ascii=False)
    print(f"MEASUREMENT card {a.out} id={cid[:16]} instrument={a.instrument}@{a.instrument_version} "
          f"axis={a.axis} n={a.n} acc={a.accuracy}")
    print(f"config_digest={cfg_digest[:16]}")

if __name__ == "__main__":
    main()
