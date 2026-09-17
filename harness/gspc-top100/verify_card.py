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
    """Historical Python compact canonical bytes used by signed card atoms."""
    return json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


def canonical_js_body_bytes(body: dict[str, Any]) -> bytes:
    """Match the JavaScript edge signer's sorted compact JSON bytes."""
    def emit(value: Any) -> bytes:
        if value is None:
            return b"null"
        if value is True:
            return b"true"
        if value is False:
            return b"false"
        if isinstance(value, str):
            return json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        if isinstance(value, int):
            return str(value).encode("ascii")
        if isinstance(value, float):
            if value != value or value in (float("inf"), float("-inf")):
                raise ValueError("legacy JS canonical form rejects non-finite numbers")
            if value == 0 or (value.is_integer() and abs(value) < 1e21):
                return str(int(value)).encode("ascii")
            rendered = repr(value)
            if "e" in rendered.lower():
                raise ValueError("legacy JS exponent number requires a v2 JCS card")
            return rendered.encode("ascii")
        if isinstance(value, list):
            return b"[" + b",".join(emit(item) for item in value) + b"]"
        if isinstance(value, dict):
            return b"{" + b",".join(
                emit(key) + b":" + emit(value[key]) for key in sorted(value)
            ) + b"}"
        raise ValueError(f"unsupported JSON type {type(value).__name__}")

    return emit(body)


def did_pubkey_and_id(did_doc: dict[str, Any], did: str = "did:web:csoai.org#card-attestation-1") -> tuple[bytes, str]:
    """Resolve (Ed25519 key bytes, the full verification-method id we matched)."""
    # Resolve by the FULL verification-method id, never by fragment suffix alone.
    # Suffix matching let "did:web:attacker.example#board-attestation-1" resolve to
    # our own key, and the caller then printed that attacker-controlled string beside
    # "VALID". No forged signature was ever accepted, but the issuer shown was wrong.
    frag = did.split("#", 1)[-1] if "#" in did else "card-attestation-1"
    doc_id = str(did_doc.get("id") or "").rstrip("#")
    want_full = did if "#" in did else f"{doc_id}#{frag}"
    for vm in did_doc.get("verificationMethod") or []:
        vid = str(vm.get("id") or "")
        # A relative id ("#key-1") is resolved against the document's own id.
        vid_abs = f"{doc_id}{vid}" if vid.startswith("#") else vid
        if vid_abs == want_full:
            x = (vm.get("publicKeyJwk") or {}).get("x")
            if not x:
                raise ValueError(f"{frag} missing JWK x")
            pad = "=" * ((4 - len(x) % 4) % 4)
            return base64.urlsafe_b64decode(x + pad), vid_abs
    raise ValueError(f"did document has no {want_full}")


def did_pubkey_bytes(did_doc: dict[str, Any], did: str = "did:web:csoai.org#card-attestation-1") -> bytes:
    """Back-compatible: key bytes only."""
    return did_pubkey_and_id(did_doc, did)[0]


def did_card_pubkey_bytes(did_doc: dict[str, Any]) -> bytes:
    return did_pubkey_bytes(did_doc, "did:web:csoai.org#card-attestation-1")


def verify_signed_card(blob: bytes, did_pubkey: bytes, resolved_kid: str | None = None) -> tuple[str, str]:
    """Return (VALID|INVALID|UNCHECKABLE, reason).

    resolved_kid is the verification-method id the key was resolved from. When a
    caller cannot supply it, we say so rather than quoting the card's own claim.
    """
    try:
        wrap = json.loads(blob)
    except Exception as e:
        return "INVALID", f"json {e}"
    body = wrap.get("body") if isinstance(wrap.get("body"), dict) else None
    cid = wrap.get("id") or wrap.get("sha256")
    sig = wrap.get("signature") or wrap.get("sig_ed25519") or wrap.get("sig")
    if not isinstance(body, dict) or not cid:
        return "INVALID", "no body or id"
    rule = wrap.get("preimage_rule")
    pre = canonical_js_body_bytes(body) if rule == "sha256(canonical body)" else canonical_body_bytes(body)
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
        # Report the key we ACTUALLY verified against, resolved from the DID document.
        # Echoing wrap["did"] reported an unsigned, caller-controlled field as the issuer.
        return "VALID", str(resolved_kid or "key supplied directly by caller")
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
        pub, resolved_kid = did_pubkey_and_id(did_doc, did)
    except Exception as e:
        return "UNCHECKABLE", f"did {e}"
    return verify_signed_card(blob, pub, resolved_kid)
