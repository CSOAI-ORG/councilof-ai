"""Three-state verify of a GSPC signed card atom.

VALID only if sha256(canonical body)==id AND Ed25519 verifies under
did:web:csoai.org#card-attestation-1. Not a grade. Not a mill.
"""
from __future__ import annotations

import base64
import hashlib
import json
from typing import Any


def canonical_body_bytes(body: dict[str, Any]) -> bytes:
    return json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


def did_card_pubkey_bytes(did_doc: dict[str, Any]) -> bytes:
    for vm in did_doc.get("verificationMethod") or []:
        if str(vm.get("id") or "").endswith("#card-attestation-1"):
            x = (vm.get("publicKeyJwk") or {}).get("x")
            if not x:
                raise ValueError("card-attestation-1 missing JWK x")
            pad = "=" * ((4 - len(x) % 4) % 4)
            return base64.urlsafe_b64decode(x + pad)
    raise ValueError("did document has no #card-attestation-1")


def verify_signed_card(blob: bytes, did_pubkey: bytes) -> tuple[str, str]:
    """Return (VALID|INVALID|UNCHECKABLE, reason)."""
    try:
        wrap = json.loads(blob)
    except Exception as e:
        return "INVALID", f"json {e}"
    body = wrap.get("body") if isinstance(wrap.get("body"), dict) else None
    cid = wrap.get("id") or wrap.get("sha256")
    sig = wrap.get("signature") or wrap.get("sig_ed25519") or wrap.get("sig")
    if not isinstance(body, dict) or not cid:
        return "INVALID", "no body or id"
    pre = canonical_body_bytes(body)
    if hashlib.sha256(pre).hexdigest() != cid:
        return "INVALID", "sha256(canonical body) != id"
    if not sig:
        return "UNCHECKABLE", "no signature"
    try:
        sigb = bytes.fromhex(sig) if all(c in "0123456789abcdefABCDEF" for c in sig) else base64.b64decode(sig)
    except Exception as e:
        return "INVALID", f"sig parse {e}"
    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

        Ed25519PublicKey.from_public_bytes(did_pubkey).verify(sigb, pre)
        return "VALID", "did:web:csoai.org#card-attestation-1"
    except Exception as e:
        return "INVALID", type(e).__name__
