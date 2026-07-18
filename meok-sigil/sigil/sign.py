"""
SIGIL signing layer — Ed25519 asymmetric attestation for agent thoughts.
========================================================================
Turns a SIGIL thought into a VERIFIABLE attestation: signed with a private key,
verifiable by anyone holding only the PUBLIC key — no backend call, no shared
secret. This is the difference that matters for compliance evidence:

    HMAC (symmetric):  verifier needs the secret  -> "trust our server"
    Ed25519 (asymm.):  verifier needs only pubkey -> "verify it yourself, offline"

EU AI Act Art 12 (record-keeping) + Art 14 (human oversight) want exactly this:
a tamper-evident, independently-verifiable record of what an agent decided.

Honest behaviour:
  • If a private key is provided/loaded -> real Ed25519 signature.
  • If NO key is available -> returns an attestation with sig=null and
    alg="unsigned-sha256" (the digest still proves integrity-vs-tamper for the
    holder, but is NOT third-party-verifiable). It NEVER fabricates a signature
    or silently pretends to be signed.

This is the same primitive task #43 needs for meok-attestation-api; proven here
in-package so the deploy is a port, not a research problem.
"""

import base64
import json
import os

from . import parse, digest

try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import (
        Ed25519PrivateKey, Ed25519PublicKey)
    from cryptography.hazmat.primitives import serialization
    _CRYPTO = True
except Exception:  # pragma: no cover
    _CRYPTO = False

ALG = "ed25519"
KEY_ENV = "SIGIL_SIGNING_KEY"          # base64 raw 32-byte private seed
PUB_ENV = "SIGIL_PUBLIC_KEY"           # base64 raw 32-byte public key


# ---- key management --------------------------------------------------------

def generate_keypair():
    """Return (priv_b64, pub_b64) raw-32-byte keys, base64-encoded. Dev/test use."""
    if not _CRYPTO:
        raise RuntimeError("cryptography not installed; cannot generate Ed25519 keys")
    priv = Ed25519PrivateKey.generate()
    priv_raw = priv.private_bytes(
        serialization.Encoding.Raw, serialization.PrivateFormat.Raw,
        serialization.NoEncryption())
    pub_raw = priv.public_key().public_bytes(
        serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    return base64.b64encode(priv_raw).decode(), base64.b64encode(pub_raw).decode()


def _load_priv(priv_b64=None):
    b = priv_b64 or os.environ.get(KEY_ENV)
    if not b or not _CRYPTO:
        return None
    return Ed25519PrivateKey.from_private_bytes(base64.b64decode(b))


def _load_pub(pub_b64=None):
    b = pub_b64 or os.environ.get(PUB_ENV)
    if not b or not _CRYPTO:
        return None
    return Ed25519PublicKey.from_public_bytes(base64.b64decode(b))


# ---- the canonical signing payload -----------------------------------------

def _canonical(line: str, kid: str) -> bytes:
    """Deterministic bytes signed/verified. Bound to the PARSED thought (not the
    raw string) so semantically-identical thoughts sign identically, plus kid."""
    # SPACED canonical (CANONICAL.md)
    return json.dumps(
        {"thought": parse(line), "digest": digest(line), "alg": ALG, "kid": kid},
        sort_keys=True).encode()


# ---- sign / verify ---------------------------------------------------------

def sign(line: str, priv_b64=None, kid="v1"):
    """Sign a SIGIL line. Returns an attestation dict. Degrades honestly to
    unsigned if no key is available (sig=None, alg='unsigned-sha256')."""
    priv = _load_priv(priv_b64)
    base = {
        "sigil": line,
        "thought": parse(line),
        "digest": digest(line),
        "kid": kid,
    }
    if priv is None:
        base["alg"] = "unsigned-sha256"
        base["sig"] = None
        base["verifiable"] = "integrity-only (no key present)"
        return base
    sig = priv.sign(_canonical(line, kid))
    base["alg"] = ALG
    base["sig"] = base64.b64encode(sig).decode()
    base["verifiable"] = "third-party offline (Ed25519 public key)"
    return base


def verify(attestation: dict, pub_b64=None) -> bool:
    """Verify an attestation with ONLY the public key. True iff the signature is
    valid for the thought. Unsigned attestations return False (not verifiable)."""
    if attestation.get("alg") != ALG or not attestation.get("sig"):
        return False
    pub = _load_pub(pub_b64)
    if pub is None:
        return False
    try:
        canon = _canonical(attestation["sigil"], attestation.get("kid", "v1"))
        pub.verify(base64.b64decode(attestation["sig"]), canon)
        return True
    except Exception:
        return False


# ---- demo ------------------------------------------------------------------

if __name__ == "__main__":
    print("=" * 72)
    print("SIGIL signing — Ed25519 verifiable agent attestations")
    print("=" * 72)

    if not _CRYPTO:
        print("\ncryptography not installed — signing degrades to unsigned-sha256.")
        att = sign("V|jarvis|ad6d|+|0.82")
        print(json.dumps(att, indent=2))
        raise SystemExit(0)

    priv, pub = generate_keypair()
    print(f"\n[keys] generated Ed25519 keypair (dev). public key (share freely):\n  {pub}")

    line = "V|jarvis|ad6d|+|0.82"
    att = sign(line, priv_b64=priv, kid="v1")
    print("\n[sign] a signed agent thought:")
    print(json.dumps({k: (v[:40] + '…' if isinstance(v, str) and len(v) > 40 else v)
                      for k, v in att.items()}, indent=2))

    ok = verify(att, pub_b64=pub)
    print(f"\n[verify] with PUBLIC key only: {ok}  ✓  (no private key, no backend call)")

    # tamper test: flip the vote, signature must fail
    tampered = dict(att); tampered["sigil"] = "V|jarvis|ad6d|-|0.82"
    bad = verify(tampered, pub_b64=pub)
    print(f"[tamper] flip APPROVE->REJECT, re-verify: {bad}  ✗  (tamper detected)")

    # wrong key fails
    _, other_pub = generate_keypair()
    wrong = verify(att, pub_b64=other_pub)
    print(f"[wrongkey] verify with a different pubkey: {wrong}  ✗  (forgery blocked)")

    # honest degradation
    unsigned = sign(line)  # no key in env
    print(f"\n[honest] no key present -> alg={unsigned['alg']!r}, sig={unsigned['sig']}, "
          f"verifiable={unsigned['verifiable']!r}")
    print("\n  signed · tamper-evident · third-party-verifiable · degrades honestly ✓")
