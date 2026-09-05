#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""
mint_tag_vector.py — the THIRD axis, raised by Emek Can Doğru on 2026-09-03 after he
independently recomputed data-hash-vector.json:

    "The digests above are taken over the COSE_Sign1 including tag 18, as the artifact
     says. A Signed Statement travels with the tag or without it, and the two hash
     differently for the same reason A and B do. Whichever state the authors name, the
     sentence should also say whether the tag is inside the preimage. The vector answers
     it for the tagged form; the text has to answer it for the document."

He is right, and his own candidate §2.2 wording left it out. So this settles the tag axis
the same way the receipt axis was settled: on bytes.

WHY A SEPARATE FILE, AND NOT AN EDIT
  data-hash-vector.json has been independently fetched and recomputed by a third party
  (3243 bytes, sha256 e137d34f…c72b, confirmed 2026-09-03 12:05). Those bytes are now
  somebody else's evidence. Editing them would invalidate a verification that has already
  been performed and published on a mailing list. Published bytes are added to or
  superseded, never edited — so this ships alongside, and cites, the original.

THE RESULT
  A (tagged)   165 bytes — CBOR tag 18 present, per RFC 9052 COSE_Sign1
  C (untagged) 164 bytes — the bare 4-element array, tag stripped
  They differ by EXACTLY ONE BYTE (0xd2, the tag-18 head) and the suffix is identical —
  yet the digests share nothing. A one-byte framing choice the specification does not
  name relocates the entire hash.

  A is byte-identical to the A already published in data-hash-vector.json and verified by
  a third party. This file does not restate it as a claim; it recomputes it, so that the
  two artifacts are checkable against each other.

SAME DECLARATIONS AS THE FIRST VECTOR
  Council of AI is not a Transparency Service and mints no Receipts. The key is a test key
  whose seed is published below and protects nothing. Ed25519 is deterministic (RFC 8032),
  so this artifact is byte-reproducible by anyone.
"""

import hashlib
import json
import sys
from pathlib import Path

import cbor2
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

TEST_SEED = bytes.fromhex("00" * 31 + "01")
KEY = Ed25519PrivateKey.from_private_bytes(TEST_SEED)
HDR_ALG, HDR_CTY, HDR_KID = 1, 3, 4
COSE_SIGN1_TAG = 18
PAYLOAD = b'{"subject":"csoai:interop:data-hash-vector","claim":"test"}'

# The A digest as published and as independently confirmed. Asserted here so that a
# regression in this script fails loudly rather than quietly publishing a second,
# disagreeing artifact.
PUBLISHED_A = "8595e4a4c8b93e7b1b7b798dc302a2b7d2890021f7eff372d79b32f78867e4ac"


def sha256_hex(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def main() -> int:
    protected = cbor2.dumps({HDR_ALG: -8, HDR_CTY: "application/json", HDR_KID: b"test-key-1"})
    signature = KEY.sign(cbor2.dumps(["Signature1", protected, b"", PAYLOAD]))
    body = [protected, {}, PAYLOAD, signature]

    tagged = cbor2.dumps(cbor2.CBORTag(COSE_SIGN1_TAG, body))
    untagged = cbor2.dumps(body)

    a, c = sha256_hex(tagged), sha256_hex(untagged)
    assert a == PUBLISHED_A, "A no longer matches the published, independently-verified digest"
    assert a != c, "vector is pointless if these collide"
    assert tagged[len(tagged) - len(untagged):] == untagged, "untagged form is not the tagged suffix"

    vector = {
        "schema": "csoai.ccf-profile-tag-vector/0.1",
        "supersedes_nothing": (
            "This ADDS a third state to data-hash-vector.json (sha256 "
            "e137d34fb25246c5f9e09fe8a293ac1952a3c86d9a48a8b7ccb085c6bbffc72b), which is "
            "unchanged and remains the citable artifact for the receipt axis. That file has "
            "been independently recomputed by a third party; its bytes are not editable."
        ),
        "raised_by": (
            "Emek Can Dogru, SCITT Last Call, 2026-09-03: a Signed Statement travels with the "
            "CBOR tag or without it, and the two hash differently for the same reason the "
            "as-registered and receipt-carrying forms do. His candidate Section 2.2 wording "
            "names which STATEMENT, but not whether the tag is inside the preimage."
        ),
        "hash": "SHA-256 over the encoded COSE_Sign1, differing only in whether tag 18 is present",
        "A_tagged": {
            "framing": "CBOR tag 18 present (RFC 9052 COSE_Sign1)",
            "size_bytes": len(tagged),
            "sha256": a,
            "note": "byte-identical to A in data-hash-vector.json; recomputed here, not restated",
        },
        "C_untagged": {
            "framing": "bare 4-element array, tag stripped",
            "size_bytes": len(untagged),
            "sha256": c,
        },
        "delta": {
            "bytes_differing": len(tagged) - len(untagged),
            "the_byte": tagged[: len(tagged) - len(untagged)].hex(),
            "suffix_identical": True,
            "note": (
                "One byte — 0xd2, the tag-18 head. The remaining 164 bytes are identical. A "
                "one-byte framing choice that the specification does not name relocates the "
                "entire digest, so a verifier and an issuer can disagree while both follow the "
                "text exactly."
            ),
        },
        "finding": (
            "Naming which statement is hashed is necessary but not sufficient. Section 2.2 must "
            "also say whether the CBOR tag is inside the preimage, or two conforming "
            "implementations will compute different data-hash values over the same Signed "
            "Statement and neither will be wrong."
        ),
        "not_a_transparency_service": (
            "Council of AI does not operate a Transparency Service and mints no Receipts. "
            "Nothing here is a conformance claim."
        ),
        "test_key": {
            "warning": "TEST ONLY. Seed is published. Protects nothing.",
            "alg": "EdDSA (COSE alg -8)",
            "seed_hex": TEST_SEED.hex(),
            "public_key_hex": KEY.public_key().public_bytes_raw().hex(),
        },
        "reproduce": "python3 mint_tag_vector.py — deterministic (Ed25519, fixed seed)",
    }

    out = Path(__file__).with_name("data-hash-tag-vector.json")
    out.write_text(json.dumps(vector, indent=2) + "\n")
    print(f"A tagged   {len(tagged):4d} B  {a}")
    print(f"C untagged {len(untagged):4d} B  {c}")
    print(f"delta: {len(tagged)-len(untagged)} byte (0x{tagged[:1].hex()}), suffix identical")
    print(f"written: {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
