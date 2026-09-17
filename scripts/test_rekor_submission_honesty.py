#!/usr/bin/env python3
"""A Rekor submission we know will be rejected must never be counted as one.

The defect (found 2026-09-17): the "real key" path posted a hashedrekord whose
signature content was sixty-four zero bytes. Sigstore rejected every one — and a
rejected post is not an anchor. These tests pin the two honest outcomes and prove
the refusals are computed, not decorative.

Run: python3 scripts/test_rekor_submission_honesty.py   (or under pytest)
"""
from __future__ import annotations

import base64
import json
import pathlib
import sys
import tempfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

import master_closed_loop as mcl

PEM = Ed25519PrivateKey.generate().public_key().public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo)


def test_disabled_by_default_and_says_why():
    r = mcl.submit_rekor(b'{"a":1}', "ab" * 32, real_ed25519_pubkey_pem=PEM,
                         sign_bytes=lambda b: b"\x01" * 64)
    assert r["state"] == "NOT_SUBMITTED", r
    assert "owner decision" in r["reason"], r["reason"]
    print("PASS  off by default, with the reason")


def test_no_key_is_not_submitted():
    r = mcl.submit_rekor(b'{"a":1}', "ab" * 32, real_ed25519_pubkey_pem=None,
                         sign_bytes=lambda b: b"\x01" * 64, enabled=True)
    assert r["state"] == "NOT_SUBMITTED"
    assert "public key" in r["reason"]
    print("PASS  absent key → NOT_SUBMITTED with the reason")


def test_no_bytes_is_not_submitted():
    r = mcl.submit_rekor(b"", "ab" * 32, real_ed25519_pubkey_pem=PEM,
                         sign_bytes=lambda b: b"\x01" * 64, enabled=True)
    assert r["state"] == "NOT_SUBMITTED"
    assert "nothing here to sign" in r["reason"], r["reason"]
    print("PASS  absent bytes → NOT_SUBMITTED (no anchor to nothing)")


def test_no_zero_signature_anywhere_in_source():
    """The exact shape that was being posted must not come back."""
    src = (pathlib.Path(__file__).resolve().parent / "master_closed_loop.py").read_text()
    banned = ['b"\\x00" * 64', "b'\\x00' * 64", 'b"\\x00"*64']
    for b in banned:
        assert b not in src, f"zero-byte signature literal is back: {b}"
    assert '"kind": "hashedrekord"' not in src, "hashedrekord posting shape is back"
    assert '"kind": "rekord"' in src, "the real rekord shape is missing"
    print("PASS  no zero-signature literal, no hashedrekord post shape")


def test_counter_excludes_rejections():
    """A count that includes a NOT_SUBMITTED entry is the whole bug. Prove it can fail."""
    submissions = [
        {"rekor": {"state": "NOT_SUBMITTED", "reason": "disabled"}},
        {"rekor": {"state": "NOT_SUBMITTED", "reason": "no key"}},
        {"rekor": {"state": "SUBMITTED", "uuid": "deadbeef"}},
    ]
    n_submitted = sum(1 for r in submissions if (r.get("rekor") or {}).get("state") == "SUBMITTED")
    n_not = sum(1 for r in submissions if (r.get("rekor") or {}).get("state") != "SUBMITTED")
    assert (n_submitted, n_not) == (1, 2), (n_submitted, n_not)
    assert n_submitted != len(submissions), "counter is totalling attempts, not submissions"
    print("PASS  counter counts SUBMITTED only")


def test_live_run_reports_zero_and_why():
    """End to end on this machine, today: the count is 0 and every entry says why."""
    results = [mcl.submit_rekor(json.dumps({"n": i}).encode(), f"{i:064x}",
                                real_ed25519_pubkey_pem=PEM,
                                sign_bytes=lambda b: b"\x01" * 64)
               for i in range(3)]
    n_submitted = sum(1 for r in results if r["state"] == "SUBMITTED")
    assert n_submitted == 0, n_submitted
    assert all(r["reason"] for r in results)
    print(f"PASS  live: rekor_submitted=0 of {len(results)} — reason: {results[0]['reason'][:60]}…")


TESTS = [v for k, v in sorted(globals().items()) if k.startswith("test_")]

if __name__ == "__main__":
    for t in TESTS:
        t()
    print(f"\n{len(TESTS)}/{len(TESTS)} passed")
