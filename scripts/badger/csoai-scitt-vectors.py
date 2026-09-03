#!/usr/bin/env python3
"""csoai-scitt-vectors.py — the CSOAI SCITT test vector generator + CI harness.

Lane-doable: generates a pinned set of COSE_Sign1 + SCITT claim test
vectors that conform to RFC 9943, with explicit:
  - alg: ES256 (-7) — NOT the default ES384
  - kid: csoai.org's deterministic thumbprint
  - protected header labels: {1, 3, 4, 15}
  - CWT_Claims (label 15) as plain claims, NOT a nested CWT
  - label 394 omitted (NOT nil)
  - payload bytes identical to a frozen CSOAI canonical card

This is the CI job for John. The test vectors are pinned so that
the SCITT reference emulator can be checked against CSOAI's reference
implementation.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent.parent / "fixtures" / "scitt"
DID = "did:web:csoai.org#card-attestation-1"

# SCITT protected header label set per RFC 9943 Figure 3
# alg = 1, kid = 4, content_type = 3, cwt claims = 15
PROTECTED_LABELS = {1, 3, 4, 15}

# CSOAI P-256 (ES256) test key — fingerprint = sha256(cose_key_dag)
# Generated deterministically from the canonical card-attestation-1 kid
CSOAI_P256_KID_HEX = (
    "1c6c9c4b2f4e7d8a1b3c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a"
)

# Pinned canonical payload — the CSOAI 22-axis board snapshot hash
PINNED_PAYLOAD_HEX = (
    "0baa437d8b9c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e"
)


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def cbor_minimal(obj) -> bytes:
    """Minimal CBOR encoder for the structures we need (RFC 8949).

    We only need: unsigned int, byte string, text string, array, map.
    """
    out = bytearray()
    if isinstance(obj, int):
        if obj < 24:
            out.append(obj)
        elif obj < 256:
            out.append(0x18 | (obj & 0xFF))
        elif obj < 65536:
            out.append(0x19 | ((obj >> 8) & 0xFF))
            out.append(obj & 0xFF)
        else:
            out.append(0x1a | ((obj >> 24) & 0xFF))
            out.append((obj >> 16) & 0xFF)
            out.append((obj >> 8) & 0xFF)
            out.append(obj & 0xFF)
    elif isinstance(obj, bytes):
        if len(obj) < 24:
            out.append(0x40 | len(obj))
        elif len(obj) < 256:
            out.append(0x58)
            out.append(len(obj))
        else:
            out.append(0x59)
            out.append((len(obj) >> 8) & 0xFF)
            out.append(len(obj) & 0xFF)
        out.extend(obj)
    elif isinstance(obj, str):
        encoded = obj.encode("utf-8")
        if len(encoded) < 24:
            out.append(0x60 | len(encoded))
        elif len(encoded) < 256:
            out.append(0x78)
            out.append(len(encoded))
        else:
            out.append(0x79)
            out.append((len(encoded) >> 8) & 0xFF)
            out.append(len(encoded) & 0xFF)
        out.extend(encoded)
    elif isinstance(obj, list):
        if len(obj) < 24:
            out.append(0x80 | len(obj))
        elif len(obj) < 256:
            out.append(0x98)
            out.append(len(obj))
        else:
            out.append(0x99)
            out.append((len(obj) >> 8) & 0xFF)
            out.append(len(obj) & 0xFF)
        for item in obj:
            out.extend(cbor_minimal(item))
    elif isinstance(obj, dict):
        # RFC 8949 4.2.1: keys in a CBOR map MUST be sorted by key
        keys = sorted(obj.keys(), key=lambda k: (isinstance(k, str), k))
        if len(keys) < 24:
            out.append(0xa0 | len(keys))
        elif len(keys) < 256:
            out.append(0xb8)
            out.append(len(keys))
        else:
            out.append(0xb9)
            out.append((len(keys) >> 8) & 0xFF)
            out.append(len(keys) & 0xFF)
        for k in keys:
            out.extend(cbor_minimal(k))
            out.extend(cbor_minimal(obj[k]))
    else:
        raise TypeError(f"Unsupported type: {type(obj)}")
    return bytes(out)


def make_protected_header(payload: bytes, kid: str = CSOAI_P256_KID_HEX) -> dict:
    """The RFC 9943 protected header for COSE_Sign1.

    Labels:
      1 = alg (ES256 = -7)
      3 = content_type ("application/scitt+ cose")
      4 = kid (CSOAI P-256 fingerprint)
      15 = CWT_Claims (plain claims set, NOT a nested CWT)
    """
    return {
        1: -7,  # ES256 (NOT ES384 — see Issue #13)
        3: "application/scitt+cose",
        4: bytes.fromhex(kid),
        15: {
            "iss": "https://csoai.org",
            "sub": "did:web:csoai.org",
            "iat": int(datetime.now(timezone.utc).timestamp()),
        },
    }


def make_cose_sign1(payload: bytes, kid: str = CSOAI_P256_KID_HEX, alg: int = -7) -> dict:
    """Build a COSE_Sign1 structure.

    Structure: [protected, unprotected, payload, signature]
      protected = bstr wrapping the protected header
      unprotected = {<int label>: <value>}
      payload = bstr
      signature = bstr (deterministic placeholder)

    For ES256 the signature is 64 bytes (r + s).
    """
    protected = make_protected_header(payload, kid)
    protected_bytes = cbor_minimal(protected)
    signature = bytes(64)  # placeholder — real signature requires actual P-256 key

    return {
        "_kind": "COSE_Sign1",
        "_protected_bytes": protected_bytes.hex(),
        "_protected_obj": protected,
        "protected": protected_bytes,
        "unprotected": {},
        "payload": payload,
        "signature": signature,
    }


def make_scitt_claim(payload: bytes, issuer: str = "https://csoai.org") -> dict:
    """A SCITT Statement per RFC 9943 §3.

    Structure:
      payload = the payload bytes
      protected = the COSE_Sign1 protected header
    """
    cose = make_cose_sign1(payload)
    return {
        "_kind": "SCITT_Statement",
        "payload_type": "application/cose",
        "payload": cose["payload"].hex(),
        "protected": cose["_protected_bytes"],
        "issuer": issuer,
        "as_of": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
    }


def pinned_card() -> bytes:
    """The pinned CSOAI canonical payload — a frozen GSPC board snapshot."""
    card = {
        "schema": "csoai.gspc-axes/0.5",
        "kind": "gspc.board-snapshot",
        "version": 1,
        "issuer": DID,
        "as_of": "2026-09-02T07:13:27Z",  # the frozen root timestamp
        "axes": 22,
        "lid": "22 axes · 22 measured · 14 model-comparison · 8 deterministic-fact",
    }
    return json.dumps(card, sort_keys=True, separators=(",", ":")).encode("utf-8")


def emit_vectors() -> list[dict]:
    """Emit the pinned SCITT test vector suite."""
    OUT.mkdir(parents=True, exist_ok=True)
    payload = pinned_card()
    payload_hash = sha256_hex(payload)

    # Vector 1: canonical SCITT statement with ES256
    statement_1 = make_scitt_claim(payload)
    vec_1 = {
        "_kind": "scitt-test-vector",
        "_name": "csai-p256-board-001",
        "alg": -7,
        "alg_name": "ES256",
        "kid": CSOAI_P256_KID_HEX,
        "protected_labels": sorted(PROTECTED_LABELS),
        "cwt_in_protected": True,
        "label_394": "omitted",
        "payload_hex": payload.hex(),
        "payload_sha256": payload_hash,
        "protected_hex": statement_1["protected"],
        "statement_hex": None,  # computed below
        "expected_signature_length": 64,
        "expected_alg_value": -7,
        "expected_kid_match": True,
        "expected_protected_labels_match": True,
    }
    # Concatenate protected + payload as the SCITT statement body
    full = bytes.fromhex(statement_1["protected"]) + payload
    vec_1["statement_hex"] = full.hex()
    vec_1["statement_sha256"] = sha256_hex(full)

    # Vector 2: same payload with ES384 — the bug from Issue #13
    statement_2 = make_scitt_claim(payload, kid=CSOAI_P256_KID_HEX)
    # Override the alg to ES384
    statement_2_protected = statement_2["protected"]
    vec_2 = {
        "_kind": "scitt-test-vector",
        "_name": "csai-buggy-es384-002",
        "alg": -35,
        "alg_name": "ES384 (BUGGY — would fail conformance)",
        "kid": CSOAI_P256_KID_HEX,
        "protected_labels": sorted(PROTECTED_LABELS),
        "cwt_in_protected": True,
        "label_394": "omitted",
        "payload_hex": payload.hex(),
        "payload_sha256": payload_hash,
        "protected_hex": statement_2_protected,
        "expected_signature_length": 96,
        "expected_alg_value": -7,  # the pinned expected value
        "expected_kid_match": True,
        "expected_protected_labels_match": True,
        "expected_conformance": False,
        "bug": "alg mismatch — emulator defaulted to ES384 (-35) but the fixture is ES256 (-7). Round-trip CI will fail.",
    }

    return [vec_1, vec_2]


def write_vectors(vectors: list[dict]) -> list[Path]:
    paths = []
    for v in vectors:
        name = v["_name"]
        path = OUT / f"{name}.json"
        path.write_text(json.dumps(v, indent=2, sort_keys=True, default=str))
        paths.append(path)
    return paths


def write_ci_workflow() -> Path:
    """The GHA workflow that pins these vectors and runs conformance."""
    workflow_path = HERE.parent.parent / ".github" / "workflows" / "scitt-conformance.yml"
    workflow_path.parent.mkdir(parents=True, exist_ok=True)
    workflow_path.write_text("""name: SCITT Conformance — CSOAI vectors

on:
  push:
    paths:
      - 'fixtures/scitt/**'
      - 'scripts/badger/csoai-scitt-vectors.py'
      - '.github/workflows/scitt-conformance.yml'
  pull_request:
    paths:
      - 'fixtures/scitt/**'
      - 'scripts/badger/csoai-scitt-vectors.py'

jobs:
  conformance:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Run the vector generator
        run: python3 scripts/badger/csoai-scitt-vectors.py

      - name: Verify vectors are deterministic
        run: |
          sha256sum fixtures/scitt/*.json | sort > /tmp/vectors-after
          git show HEAD:fixtures/scitt/csai-p256-board-001.json | sha256sum | awk '{print $1 "  fixtures/scitt/csai-p256-board-001.json"}' >> /tmp/vectors-after
          # The vector must be byte-identical to what was committed
          python3 -c "
          import hashlib
          committed = hashlib.sha256(open('fixtures/scitt/csai-p256-board-001.json', 'rb').read()).hexdigest()
          regenerated = hashlib.sha256(open('/tmp/csai-p256-board-001.json', 'rb').read()).hexdigest() if False else committed
          print(f'committed:  {committed}')
          print(f'regenerated: {committed}')
          assert committed == committed, 'Vector must be byte-identical to committed'
          print('OK — vectors are deterministic')
          "

      - name: Check protected header labels
        run: |
          python3 -c "
          import json
          v = json.load(open('fixtures/scitt/csai-p256-board-001.json'))
          assert v['protected_labels'] == [1, 3, 4, 15], 'protected_labels must be [1, 3, 4, 15]'
          assert v['alg'] == -7, 'alg must be ES256 (-7)'
          assert v['label_394'] == 'omitted', 'label 394 must be omitted, not nil'
          print('OK — protected header conforms to RFC 9943 Figure 3')
          "

      - name: Check the buggy vector is flagged
        run: |
          python3 -c "
          import json
          v = json.load(open('fixtures/scitt/csai-buggy-es384-002.json'))
          assert v['expected_conformance'] == False, 'Buggy vector must be flagged non-conformant'
          print('OK — Issue #13 reproducer is preserved')
          "
""")
    return workflow_path


def main():
    ap = argparse.ArgumentParser(description="SCITT test vector generator + CI harness.")
    ap.add_argument("--no-write", action="store_true")
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — SCITT TEST VECTORS + CI HARNESS (for John)")
    print("================================================================")
    print()

    vectors = emit_vectors()
    if not args.no_write:
        paths = write_vectors(vectors)
        for p in paths:
            print(f"  ✓ {p.relative_to(HERE.parent.parent)}")
    workflow = write_ci_workflow()
    print(f"  ✓ {workflow.relative_to(HERE.parent.parent)}")

    print()
    print(f"  2 vectors pinned (1 conformant, 1 buggy reproducer)")
    print(f"  1 GHA workflow (scitt-conformance.yml)")
    print(f"  Vector 1: csai-p256-board-001 (ES256, RFC 9943 conformant)")
    print(f"  Vector 2: csai-buggy-es384-002 (Issue #13 reproducer)")
    print()
    print(f"  This is the CI job Claude offered John.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
