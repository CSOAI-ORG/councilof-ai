"""Tests for offline Ed25519 verifier.

These tests don't require PyNaCl — they cover the input validation,
the helper functions, and the available() / require_nacl() guards.
Tests that need PyNaCl are skipped when it's not installed.
"""

import base64
import pytest

from sovereign_aiact_passport import ed25519_verify as ev
from sovereign_aiact_passport.error_map import VerificationError, ValidationError


SAMPLE_PUB_HEX = (
    "302a300506032b6570032100"  # SPKI DER prefix for Ed25519 — 12 bytes
    + "00112233445566778899aabbccddeeff"
    + "000102030405060708090a0b0c0d0e0f"  # 32-byte raw Ed25519 key
)
SAMPLE_PUB_HEX = SAMPLE_PUB_HEX.lower()
SAMPLE_SIG_B64 = base64.b64encode(b"x" * 64).decode("ascii")


def _manifest(**kw):
    base = {
        "alg": "ed25519",
        "pub": SAMPLE_PUB_HEX,
        "sig": SAMPLE_SIG_B64,
        "body": {"system": "test", "score": 0.5, "tier": "limited_risk"},
    }
    base.update(kw)
    return base


# ────────────────────────────────────────────────────────────────────
# Helpers
# ────────────────────────────────────────────────────────────────────


def test_is_available_returns_bool():
    assert isinstance(ev.is_available(), bool)


def test_require_nacl_runs_without_error_if_installed():
    if not ev.is_available():
        with pytest.raises(VerificationError):
            ev.require_nacl()
        # error message must mention install command
        with pytest.raises(VerificationError) as info:
            ev.require_nacl()
        assert "PyNaCl" in str(info.value) or "nacl" in str(info.value).lower()
    else:
        # No-op when PyNaCl is available
        ev.require_nacl()


def test_decode_pub_spki_hex_valid():
    out = ev.decode_pub_spki_hex(SAMPLE_PUB_HEX)
    assert isinstance(out, bytes)
    assert out.hex() == SAMPLE_PUB_HEX.lower()


def test_decode_pub_spki_hex_rejects_non_string():
    with pytest.raises(ValidationError):
        ev.decode_pub_spki_hex(None)  # type: ignore[arg-type]


def test_decode_pub_spki_hex_rejects_invalid_hex_chars():
    with pytest.raises(ValidationError):
        ev.decode_pub_spki_hex("0123456789abcdefZYXW")  # 'Z' not hex  # type: ignore[arg-type]


def test_decode_pub_spki_hex_accepts_uppercase():
    # Should be tolerant
    out = ev.decode_pub_spki_hex(SAMPLE_PUB_HEX.upper())
    assert isinstance(out, bytes)


def test_decode_sig_b64_valid():
    out = ev.decode_sig_b64(SAMPLE_SIG_B64)
    assert isinstance(out, bytes)
    assert len(out) == 64


def test_decode_sig_b64_short_sig_rejected():
    short = base64.b64encode(b"x" * 32).decode("ascii")
    with pytest.raises(VerificationError):
        ev.decode_sig_b64(short)


def test_decode_sig_b64_long_sig_rejected():
    long = base64.b64encode(b"x" * 65).decode("ascii")
    with pytest.raises(VerificationError):
        ev.decode_sig_b64(long)


def test_decode_sig_b64_invalid_base64_rejected():
    with pytest.raises(VerificationError):
        ev.decode_sig_b64("not base64!")


# ────────────────────────────────────────────────────────────────────
# pub_fingerprint
# ────────────────────────────────────────────────────────────────────


def test_pub_fingerprint_format():
    fp = ev.pub_fingerprint(SAMPLE_PUB_HEX)
    assert isinstance(fp, str)
    # Should be 8 groups of 4 hex chars separated by ":"
    groups = fp.split(":")
    assert len(groups) == 16
    assert all(len(g) == 4 for g in groups)
    # Hex chars only, case-insensitive
    hex_chars = set("0123456789abcdefABCDEF")
    assert all(c in hex_chars for g in groups for c in g)


def test_pub_fingerprint_stable():
    fp1 = ev.pub_fingerprint(SAMPLE_PUB_HEX)
    fp2 = ev.pub_fingerprint(SAMPLE_PUB_HEX)
    assert fp1 == fp2


def test_pub_fingerprint_different_keys_differ():
    other = "302a300506032b6570032100" + "0" * 50
    fp1 = ev.pub_fingerprint(SAMPLE_PUB_HEX)
    fp2 = ev.pub_fingerprint(other)
    assert fp1 != fp2


# ────────────────────────────────────────────────────────────────────
# Tamper detection (utility)
# ────────────────────────────────────────────────────────────────────


def test_tamper_body_changes_value():
    original = _manifest()
    tampered = ev.tamper_body(original, change_system="evil")
    assert tampered != original
    assert tampered["body"]["system"] == "evil"
    assert original["body"]["system"] == "test"


def test_tamper_body_returns_copy_not_reference():
    original = _manifest()
    tampered = ev.tamper_body(original, change_system="evil")
    # Mutating tampered doesn't affect original
    tampered["body"]["system"] = "newer"
    assert original["body"]["system"] == "test"


def test_tamper_body_handles_non_dict():
    with pytest.raises(ValidationError):
        ev.tamper_body("not a dict")  # type: ignore[arg-type]


def test_tamper_body_handles_missing_body():
    manifest = {"alg": "ed25519"}  # no body
    tampered = ev.tamper_body(manifest, change_system="x")
    assert tampered == manifest  # no body → noop


# ────────────────────────────────────────────────────────────────────
# The verifier (integration tests, skip if no PyNaCl)
# ────────────────────────────────────────────────────────────────────


@pytest.mark.skipif(not ev.is_available(), reason="PyNaCl not installed")
def test_verify_round_trip_with_real_signature():
    """End-to-end: generate a keypair, sign a body, verify."""
    from nacl.signing import SigningKey
    sk = SigningKey(b"\x00" * 32)  # deterministic
    vk = sk.verify_key
    pub_hex = vk.encode().hex().lower()
    body = {"system": "test", "score": 0.5, "tier": "limited_risk"}
    canonical = ev.canonical_body_for_sig(body)
    sig = sk.sign(canonical).signature
    manifest = {
        "alg": "ed25519",
        "pub": pub_hex,
        "sig": base64.b64encode(sig).decode("ascii"),
        "body": body,
    }
    assert ev.verify_passport(manifest) is True


@pytest.mark.skipif(not ev.is_available(), reason="PyNaCl not installed")
def test_verify_rejects_tampered_body():
    from nacl.signing import SigningKey
    sk = SigningKey(b"\x00" * 32)
    vk = sk.verify_key
    pub_hex = vk.encode().hex().lower()
    body = {"system": "test", "score": 0.5, "tier": "limited_risk"}
    sig = sk.sign(ev.canonical_body_for_sig(body)).signature
    manifest = {
        "alg": "ed25519",
        "pub": pub_hex,
        "sig": base64.b64encode(sig).decode("ascii"),
        "body": {"system": "EVIL", "score": 0.5, "tier": "limited_risk"},  # tampered
    }
    with pytest.raises(VerificationError) as exc_info:
        ev.verify_passport(manifest)
    assert "tampered" in str(exc_info.value).lower() or "signature" in str(exc_info.value).lower()


@pytest.mark.skipif(not ev.is_available(), reason="PyNaCl not installed")
def test_verify_rejects_wrong_pubkey():
    from nacl.signing import SigningKey
    sk1 = SigningKey(b"\x00" * 32)
    sk2 = SigningKey(b"\xff" * 32)
    vk2 = sk2.verify_key
    body = {"system": "test", "score": 0.5}
    sig = sk1.sign(ev.canonical_body_for_sig(body)).signature
    manifest = {
        "alg": "ed25519",
        "pub": vk2.encode().hex().lower(),  # different key
        "sig": base64.b64encode(sig).decode("ascii"),
        "body": body,
    }
    with pytest.raises(VerificationError):
        ev.verify_passport(manifest)


# ────────────────────────────────────────────────────────────────────
# Input validation (no PyNaCl needed)
# ────────────────────────────────────────────────────────────────────


def test_verify_rejects_wrong_alg():
    with pytest.raises(VerificationError) as exc_info:
        ev.verify_passport(_manifest(alg="rsa2048"))
    assert "ed25519" in str(exc_info.value)


def test_verify_rejects_missing_pub():
    m = _manifest()
    m.pop("pub")
    with pytest.raises(VerificationError):
        ev.verify_passport(m)


def test_verify_rejects_missing_sig():
    m = _manifest()
    m.pop("sig")
    with pytest.raises(VerificationError):
        ev.verify_passport(m)


def test_verify_rejects_missing_body():
    m = _manifest()
    m.pop("body")
    with pytest.raises(VerificationError):
        ev.verify_passport(m)


def test_verify_rejects_non_dict_manifest():
    with pytest.raises(ValidationError):
        ev.verify_passport("not a dict")  # type: ignore[arg-type]


def test_verify_rejects_malformed_pub():
    m = _manifest(pub="not hex")
    with pytest.raises(ValidationError):
        ev.verify_passport(m)
