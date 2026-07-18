"""
Offline Ed25519 verification of CSOAI-signed passports.

Verifier
--------
`verify_passport(manifest)` returns `True` iff:
  1. `manifest["alg"] == "ed25519"`
  2. `manifest["pub"]` is a valid SPKI-DER hex-encoded Ed25519 public key
  3. `manifest["sig"]` is base64-decodable and exactly 64 bytes
  4. The signature verifies against `JSON.stringify(body)` (browser canon)

Honesty register
----------------
This module does NOT verify against "trust" — it verifies against
*cryptography*. If verification passes, the body was signed by whoever
holds the matching private key. The CSOAI root server is the sole
holder; if the network trusts CSOAI, the body is trustworthy.

To go further (prove the *issuer* is trusted, not just that the signature
is valid), chain into the CSOAI SIGIL ledger. See passport_verify.py.
"""

from __future__ import annotations
import base64
import binascii
from typing import Optional

from sovereign_aiact_passport.passport_client import canonical_body_for_sig
from sovereign_aiact_passport.error_map import VerificationError, ValidationError


# ────────────────────────────────────────────────────────────────────
# Optional PyNaCl detection
# ────────────────────────────────────────────────────────────────────

try:
    from nacl.exceptions import BadSignatureError  # type: ignore  # noqa: F401
    from nacl.signing import VerifyKey  # type: ignore  # noqa: F401
    _NACL_AVAILABLE = True
except ImportError:  # pragma: no cover — handled at runtime
    BadSignatureError = Exception  # type: ignore[assignment,misc]
    VerifyKey = None  # type: ignore[assignment,misc]
    _NACL_AVAILABLE = False


# ────────────────────────────────────────────────────────────────────
# Helpers
# ────────────────────────────────────────────────────────────────────


def is_available() -> bool:
    """True iff PyNaCl is importable and verification will work."""
    return _NACL_AVAILABLE


def require_nacl() -> None:
    """Raise a friendly error if PyNaCl isn't installed."""
    if not _NACL_AVAILABLE:
        raise VerificationError(
            "PyNaCl not installed — install with `pip install PyNaCl` to enable offline verification",
            hint="the rest of the package works without verification; this only affects the ed25519_verify module",
        )


def decode_pub_spki_hex(hex_pub: str) -> bytes:
    """Decode a hex-encoded SPKI public key to DER bytes.

    Raises ValidationError on bad input.
    """
    if not isinstance(hex_pub, str):
        raise ValidationError(f"pub must be hex string, got {type(hex_pub).__name__}")
    hex_pub = hex_pub.strip()
    if not all(c in "0123456789abcdefABCDEF" for c in hex_pub):
        raise ValidationError("pub is not valid hex")
    try:
        return bytes.fromhex(hex_pub)
    except (binascii.Error, ValueError) as e:
        raise ValidationError(f"pub is not valid hex: {e}")


def decode_sig_b64(sig_b64: str) -> bytes:
    """Decode base64 signature (Ed25519 = 64 bytes)."""
    if not isinstance(sig_b64, str):
        raise VerificationError(f"sig must be base64 string, got {type(sig_b64).__name__}")
    try:
        raw = base64.b64decode(sig_b64, validate=True)
    except (binascii.Error, ValueError) as e:
        raise VerificationError(f"sig is not valid base64: {e}")
    if len(raw) != 64:
        raise VerificationError(f"sig must decode to 64 bytes (Ed25519), got {len(raw)}")
    return raw


# ────────────────────────────────────────────────────────────────────
# The verifier
# ────────────────────────────────────────────────────────────────────


def verify_passport(manifest: dict) -> bool:
    """Verify the Ed25519 signature in a CSOAI passport manifest.

    Returns True if valid, raises an exception on invalid/missing fields.
    Does NOT return False on bad sigs — distinguishing "missing field"
    from "wrong sig" matters more than the bool (callers can branch).
    """
    require_nacl()

    if not isinstance(manifest, dict):
        raise ValidationError(f"manifest must be a dict, got {type(manifest).__name__}")
    if manifest.get("alg") != "ed25519":
        raise VerificationError(f"expected alg=ed25519, got {manifest.get('alg')!r}")
    pub_hex = manifest.get("pub")
    sig_b64 = manifest.get("sig")
    body = manifest.get("body")
    if pub_hex is None:
        raise VerificationError("manifest.p is missing 'pub'")
    if sig_b64 is None:
        raise VerificationError("manifest is missing 'sig'")
    if body is None:
        raise VerificationError("manifest is missing 'body'")

    pub_der = decode_pub_spki_hex(pub_hex)
    sig_bytes = decode_sig_b64(sig_b64)
    canonical = canonical_body_for_sig(body)

    try:
        if VerifyKey is None:  # pragma: no cover
            raise VerificationError("PyNaCl VerifyKey unavailable")
        verify_key = VerifyKey(pub_der)  # type: ignore[call-overload]
        verify_key.verify(canonical, sig_bytes)
        return True
    except BadSignatureError as e:  # type: ignore[misc]
        raise VerificationError(
            "Ed25519 signature did not verify — passport has been tampered with or signed by a different key",
            cause=e,
            hint="do not trust this passport. verify against a fresh copy or contact the issuer.",
        )
    except Exception as e:
        # PyNaCl raises ValueError for malformed keys
        raise VerificationError(
            f"verification failed: {e}",
            cause=e,
        )


# ────────────────────────────────────────────────────────────────────
# Public-key fingerprint (for human inspection)
# ────────────────────────────────────────────────────────────────────


def pub_fingerprint(pub_hex: str) -> str:
    """Return the SHA-256 fingerprint of a public key as `XXXX:XXXX:...`.

    Used in receipts to show the operator which key signed the passport.
    Identity-grade — humans can compare first/last 4 chars across receipts.
    """
    import hashlib
    pub_der = decode_pub_spki_hex(pub_hex)
    digest = hashlib.sha256(pub_der).hexdigest().upper()
    return ":".join(digest[i : i + 4] for i in range(0, len(digest), 4))


# ────────────────────────────────────────────────────────────────────
# Tamper detection — for tests
# ────────────────────────────────────────────────────────────────────


def tamper_body(manifest: dict, *, change_system: Optional[str] = None) -> dict:
    """Return a tampered copy of the manifest — for testing ONLY."""
    if not isinstance(manifest, dict):
        raise ValidationError("manifest must be dict")
    bad = dict(manifest)
    if isinstance(bad.get("body"), dict):
        bad["body"] = dict(bad["body"])
        if change_system is not None:
            bad["body"]["system"] = change_system
    return bad
