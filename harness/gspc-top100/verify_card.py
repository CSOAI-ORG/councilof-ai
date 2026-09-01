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


def did_pubkey_bytes(did_doc: dict[str, Any], did: str = "did:web:csoai.org#card-attestation-1") -> bytes:
    """Resolve Ed25519 JWK x for a DID fragment. Default mill pin is #card-attestation-1."""
    frag = did.split("#", 1)[-1] if "#" in did else "card-attestation-1"
    suffix = "#" + frag
    for vm in did_doc.get("verificationMethod") or []:
        vid = str(vm.get("id") or "")
        if vid.endswith(suffix) or vid == did:
            x = (vm.get("publicKeyJwk") or {}).get("x")
            if not x:
                raise ValueError(f"{frag} missing JWK x")
            pad = "=" * ((4 - len(x) % 4) % 4)
            return base64.urlsafe_b64decode(x + pad)
    raise ValueError(f"did document has no {suffix}")


def did_card_pubkey_bytes(did_doc: dict[str, Any]) -> bytes:
    return did_pubkey_bytes(did_doc, "did:web:csoai.org#card-attestation-1")


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
        kid = wrap.get("did") or wrap.get("did_intended") or "did:web:csoai.org#card-attestation-1"
        return "VALID", str(kid)
    except Exception as e:
        return "INVALID", type(e).__name__


def verify_signed_card_with_did_doc(blob: bytes, did_doc: dict[str, Any]) -> tuple[str, str]:
    """VALID only under the DID recorded on the card (or #card-attestation-1 if omitted)."""
    try:
        wrap = json.loads(blob)
    except Exception as e:
        return "INVALID", f"json {e}"
    did = str(wrap.get("did") or wrap.get("did_intended") or "did:web:csoai.org#card-attestation-1")
    try:
        pub = did_pubkey_bytes(did_doc, did)
    except Exception as e:
        return "UNCHECKABLE", f"did {e}"
    return verify_signed_card(blob, pub)
