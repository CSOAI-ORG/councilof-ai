#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""
mint_data_hash_vector.py — the vector Emek Can Doğru asked for on the CCF Profile
Last Call thread (2026-09-03): a Signed Statement with an EMPTY unprotected header
alongside the SAME statement carrying a Receipt, so that "which bytes are the
Signed Statement" is answered by bytes rather than by prose.

THE QUESTION THIS ANSWERS
  draft-ietf-scitt-receipts-ccf-profile §2.2 says data-hash is a hash over
  "the candidate Signed Statement". Under RFC 9943 §6.3 the unprotected header is
  the empty map when the statement is registered; under §7 a Receipt is added to
  that same header afterwards. Those are different bytes and therefore different
  hashes, and a verifier holding a Transparent Statement is not told whether to
  strip the Receipt before hashing. Both readings are defensible from the current
  text — which is the defect. This vector makes the choice concrete.

WHAT THIS IS NOT — and the locks it respects (see README.md "Hard locks"):
  · CSOAI is NOT a Transparency Service and does not mint Receipts.
    The Receipt slot below is an OPAQUE PLACEHOLDER, not a receipt issued by
    anyone, not verifiable, and it asserts nothing about any log. That is
    deliberate and it does not weaken the vector: the point is byte-level. ANY
    non-empty unprotected header changes the encoded bytes and hence the hash,
    so the demonstration holds whatever a real Receipt would contain.
  · Nothing here is a conformance claim, a certification, or a measurement.
  · The key is a TEST key minted from a fixed seed, published below. It protects
    nothing and must never be used for anything.

REPRODUCING
  python3 mint_data_hash_vector.py            # prints the vector, writes JSON
  Deterministic: same seed, same payload, same bytes, same digests, every run.
  Ed25519 signatures are deterministic (RFC 8032), so the whole artifact is
  byte-reproducible by anyone without coordinating with us.
"""

import hashlib
import json
import sys
from pathlib import Path

import cbor2
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

# --- test key: fixed seed, published, worthless by construction ---------------
TEST_SEED = bytes.fromhex("00" * 31 + "01")
KEY = Ed25519PrivateKey.from_private_bytes(TEST_SEED)

COSE_ALG_EDDSA = -8  # COSE alg for Ed25519
HDR_ALG, HDR_CTY, HDR_KID = 1, 3, 4
# The receipts label as used by the SCITT work. If the registry value differs,
# the vector's conclusion is UNCHANGED: any non-empty unprotected header alters
# the encoded bytes. Nothing here depends on the specific integer.
HDR_RECEIPTS = 394

PAYLOAD = b'{"subject":"csoai:interop:data-hash-vector","claim":"test"}'


def sign1(unprotected: dict) -> bytes:
    """Encode a COSE_Sign1 with the given unprotected header.

    The signature is computed over Sig_structure per RFC 9052 §4.4, which covers
    the PROTECTED header and payload only. The unprotected header is NOT signed —
    that is precisely why a Receipt can be added after registration without
    breaking the signature, and precisely why the enclosing bytes still change.
    """
    protected = cbor2.dumps({HDR_ALG: COSE_ALG_EDDSA, HDR_CTY: "application/json", HDR_KID: b"test-key-1"})
    sig_structure = cbor2.dumps(["Signature1", protected, b"", PAYLOAD])
    signature = KEY.sign(sig_structure)
    # Tag 18 = COSE_Sign1. The tag is part of the bytes a verifier receives, so it
    # is part of what gets hashed; we state that rather than leaving it implied.
    return cbor2.dumps(cbor2.CBORTag(18, [protected, unprotected, PAYLOAD, signature]))


def sha256_hex(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def main() -> int:
    # (A) The Signed Statement AS REGISTERED — unprotected header is the empty map
    #     (RFC 9943 §6.3). This is the reading Emek's candidate wording names.
    as_registered = sign1({})

    # (B) The SAME statement after a Receipt is added to the unprotected header
    #     (RFC 9943 §7) — i.e. a Transparent Statement. The placeholder below
    #     stands in for a Receipt; see the header of this file.
    receipt_placeholder = b"OPAQUE-PLACEHOLDER-NOT-A-RECEIPT"
    with_receipt = sign1({HDR_RECEIPTS: [receipt_placeholder]})

    a, b = sha256_hex(as_registered), sha256_hex(with_receipt)
    assert a != b, "vector is pointless if these collide"

    vector = {
        "schema": "csoai.ccf-profile-data-hash-vector/0.1",
        "purpose": (
            "Show that 'the candidate Signed Statement' in the CCF Profile §2.2 names two "
            "different byte sequences depending on whether the Receipt is present, so the "
            "specification must say which one data-hash is taken over."
        ),
        "not_a_transparency_service": (
            "CSOAI does not operate a Transparency Service and does not mint Receipts. The "
            "receipt slot in (B) is an opaque placeholder and asserts nothing about any log. "
            "The demonstration is byte-level: any non-empty unprotected header changes the "
            "encoded bytes, so the conclusion does not depend on the placeholder's content."
        ),
        "reproduce": "python3 mint_data_hash_vector.py — deterministic (Ed25519, fixed seed)",
        "test_key": {
            "warning": "TEST ONLY. Seed is published. Protects nothing.",
            "alg": "EdDSA (COSE alg -8)",
            "seed_hex": TEST_SEED.hex(),
            "public_key_hex": KEY.public_key().public_bytes_raw().hex(),
        },
        "hash": "SHA-256 over the full encoded COSE_Sign1 INCLUDING the CBOR tag 18",
        "signature_covers": (
            "Sig_structure per RFC 9052 §4.4 — protected header and payload only. The "
            "unprotected header is unsigned, which is why (B) verifies with the same "
            "signature as (A) while hashing differently."
        ),
        "A_signed_statement_as_registered": {
            "unprotected_header": "empty map, per RFC 9943 §6.3",
            "bytes_hex": as_registered.hex(),
            "size_bytes": len(as_registered),
            "data_hash_sha256": a,
        },
        "B_same_statement_carrying_a_receipt": {
            "unprotected_header": f"{{{HDR_RECEIPTS}: [<opaque placeholder>]}}, per RFC 9943 §7",
            "bytes_hex": with_receipt.hex(),
            "size_bytes": len(with_receipt),
            "data_hash_sha256": b,
        },
        "finding": (
            "The two digests differ. A verifier holding a Transparent Statement and following "
            "§2.2 as currently written cannot tell which of these it must reproduce. Naming (A) "
            "makes the check performable; naming (B) also makes it performable. Leaving it "
            "unstated does not."
        ),
        "position": (
            "CSOAI supports Emek Can Dogru's candidate wording, which selects (A): data-hash is "
            "HASH over the bytes of the Signed Statement as registered, with the unprotected "
            "header set to the empty map as required by RFC 9943 §6.3, and before any Receipt "
            "is added. We would equally support the other reading stated explicitly. Our only "
            "objection is to it remaining unstated."
        ),
    }

    out = Path(__file__).with_name("data-hash-vector.json")
    out.write_text(json.dumps(vector, indent=2, sort_keys=False) + "\n")

    print("A  signed statement as registered (unprotected = {})")
    print(f"   size {len(as_registered):4d} B   sha256 {a}")
    print("B  same statement carrying a Receipt (unprotected non-empty)")
    print(f"   size {len(with_receipt):4d} B   sha256 {b}")
    print(f"\ndigests differ: {a != b}")
    print(f"written: {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
