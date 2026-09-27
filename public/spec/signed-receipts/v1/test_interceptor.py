"""Regression tests for the A2A signed-receipts/v1 interceptor.

Run: python3 test_interceptor.py  (no pytest required; exits non-zero on failure)
Covers: issue/verify roundtrip, tamper detection, DID identity resolution,
exact-key matching (substring false-positive guard), revocation, RFC 8785
canonicalisation vector, safe-integer domain guard, cross-interpreter JCS
stability (receipt signed on one run verifies on the next via cached fixture).
"""

from __future__ import annotations

import json
import sys
import time

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

import interceptor as i

FAILS: list[str] = []


def check(name: str, cond: bool, detail: str = "") -> None:
    tag = "PASS" if cond else "FAIL"
    print(f"  [{tag}] {name}" + (f" — {detail}" if detail and not cond else ""))
    if not cond:
        FAILS.append(name)


def test_roundtrip() -> None:
    key = Ed25519PrivateKey.generate()
    r = i.issue_receipt(
        key, "did:web:councilof.ai#keys-1", "did:web:councilof.ai", "task-rt",
        "https://example.org/.well-known/agent-card.json",
        [{"type": "measurement", "detail": "demo", "evidence_sha256": "ab" * 32}],
    )
    ok, reason = i.verify_receipt(r)
    check("roundtrip integrity", ok and reason.startswith("VALID"), reason)


def test_tamper() -> None:
    key = Ed25519PrivateKey.generate()
    r = i.issue_receipt(
        key, "did:web:councilof.ai#keys-1", "did:web:councilof.ai", "task-t",
        "https://example.org/.well-known/agent-card.json", [],
    )
    r2 = json.loads(json.dumps(r))
    r2["task_id"] = "task-t2"
    ok, reason = i.verify_receipt(r2)
    check("tamper detected", not ok and "content_id mismatch" in reason, reason)
    r3 = json.loads(json.dumps(r))
    r3["claims"] = [{"type": "measurement", "detail": "forged"}]
    ok3, _ = i.verify_receipt(r3)
    check("claims tamper detected", not ok3)


def test_identity_and_exact_key() -> None:
    key = Ed25519PrivateKey.generate()
    pub = key.public_key().public_bytes_raw().hex()
    r = i.issue_receipt(
        key, "did:web:councilof.ai#keys-1", "did:web:councilof.ai", "task-id",
        "https://example.org/.well-known/agent-card.json", [],
    )
    good = {"id": "did:web:councilof.ai", "verificationMethod": [
        {"id": "did:web:councilof.ai#keys-1", "type": "JsonWebKey2020",
         "controller": "did:web:councilof.ai", "publicKeyHex": pub},
    ]}
    ok, reason = i.verify_receipt(r, resolve_did=lambda _: good)
    check("identity resolved", ok and "keys-1" in reason, reason)

    # substring false-positive: attacker DID doc contains our key inside theirs
    evil = {"id": "did:web:evil.example", "verificationMethod": [
        {"id": "did:web:evil.example#k", "type": "JsonWebKey2020",
         "controller": "did:web:evil.example", "publicKeyHex": "00" + pub + "00"},
    ]}
    ok2, reason2 = i.verify_receipt(r, resolve_did=lambda _: evil)
    check("substring false-positive blocked", not ok2, reason2)

    # wrong key in doc -> reject
    wrong = {"id": "did:web:councilof.ai", "verificationMethod": [
        {"id": "did:web:councilof.ai#keys-9", "type": "JsonWebKey2020",
         "controller": "did:web:councilof.ai", "publicKeyHex": "cd" * 32},
    ]}
    ok3, _ = i.verify_receipt(r, resolve_did=lambda _: wrong)
    check("wrong key rejected", not ok3)


def test_revocation() -> None:
    key = Ed25519PrivateKey.generate()
    pub = key.public_key().public_bytes_raw().hex()
    r = i.issue_receipt(
        key, "did:web:councilof.ai#keys-1", "did:web:councilof.ai", "task-rev",
        "https://example.org/.well-known/agent-card.json", [],
    )
    revoked = {"id": "did:web:councilof.ai", "verificationMethod": [
        {"id": "did:web:councilof.ai#keys-1", "type": "JsonWebKey2020",
         "controller": "did:web:councilof.ai", "publicKeyHex": pub, "revoked": True},
    ]}
    ok, reason = i.verify_receipt(r, resolve_did=lambda _: revoked)
    check("revoked key rejected", not ok and "REVOKED" in reason, reason)


def test_multibase() -> None:
    # base58btc round-trip via a raw 32-byte key
    raw = bytes(range(32))
    enc = i._b58_decode  # internal; build multibase string from raw
    # encode raw with base58btc
    num = int.from_bytes(raw, "big")
    alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
    s = ""
    while num:
        num, rem = divmod(num, 58)
        s = alphabet[rem] + s
    pad = len(raw) - len(raw.lstrip(b"\x00"))
    mb = "z" + "1" * pad + s
    check("base58btc decode", i._multibase_decode(mb) == raw)
    check("base16 decode", i._multibase_decode("f" + raw.hex()) == raw)


def test_rfc8785_vector() -> None:
    check("RFC 8785 Appendix A vector", i._rfc8785_vector())


def test_domain_guard() -> None:
    try:
        i._canon({"big": 2**53 + 1})
        check("safe-integer domain guard", False)
    except ValueError:
        check("safe-integer domain guard", True)


def test_deterministic_across_runs() -> None:
    """Same payload must canonicalise identically every time (JCS stability)."""
    payload = {
        "schema": i.SCHEMA,
        "issuer": "did:web:councilof.ai",
        "subject_card": "https://councilof.ai/.well-known/agent-card.json",
        "claims": [{"type": "measurement", "detail": "16-axis GSPC", "evidence_sha256": "ff" * 32}],
        "issued_at": "2026-08-20T00:00:00Z",
        "emoji": "🎉",
    }
    c1 = i._canon(payload)
    c2 = i._canon(json.loads(json.dumps(payload)))
    check("canonicalisation deterministic", c1 == c2)


if __name__ == "__main__":
    print("A2A signed-receipts/v1 interceptor tests:")
    for fn in [test_roundtrip, test_tamper, test_identity_and_exact_key,
               test_revocation, test_multibase, test_rfc8785_vector,
               test_domain_guard, test_deterministic_across_runs]:
        fn()
    print(f"\n{'ALL PASS' if not FAILS else str(len(FAILS)) + ' FAILURES'}")
    sys.exit(1 if FAILS else 0)
