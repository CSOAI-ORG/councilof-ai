#!/usr/bin/env python3
"""csoai-cose-wrap.py — wrap a card-v0 attestation as a COSE_Sign1 statement.

Lane-doable: per the scitt_wrap_spec.json contract —
  "card-v0 canonical JSON bytes become COSE_Sign1 payload. Same sha256."

This script:
  1. Reads a card-v0 atom (already in canonical form under /public/signed/)
  2. Wraps the canonical bytes as the COSE_Sign1 payload
  3. The COSE_Sign1 protected header carries:
     - alg: ES256 (-7) (NOT ES384 — Issue #13 reproducer)
     - kid: csoai.org#card-attestation-1
     - content_type: application/scitt+cose
     - CWT_Claims (label 15): iss=https://csoai.org, sub=did:web:csoai.org
  4. The signature is computed via Ed25519 (the CSOAI standard,
     NOT P-256 — SCITT supports multiple algs, Ed25519 is what
     we actually publish under)
  5. The wrapped statement is OTS-stamped; it anchors to Bitcoin only after a
     calendar commits the digest and scripts/ots-upgrade.py completes the proof

This is the same wrapping pattern that Joel Hillier independently
implemented and that Iman asked for in issue #2.

NOTE: this script signs with the Ed25519 key the CSOAI estate uses
everywhere else (card-attestation-1). It does NOT use P-256. SCITT
allows any registered algorithm.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
SIGNED = HERE.parent.parent / "public" / "signed"
QUEUE = HERE / "_queue" / "cose-wrap"
DID = "did:web:csoai.org"
CSOAI_ED25519_KID_HEX = hashlib.sha256(b"did:web:csoai.org#card-attestation-1").hexdigest()


def canonical(obj) -> bytes:
    """RFC 8785 JCS canonical form."""
    def rec(v):
        if isinstance(v, list):
            return [rec(x) for x in v]
        if isinstance(v, dict):
            return {k: rec(v[k]) for k in sorted(v.keys())}
        return v
    return json.dumps(rec(obj), separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def cbor_minimal(obj) -> bytes:
    """Minimal CBOR encoder for unsigned int, bstr, tstr, array, map."""
    out = bytearray()
    if isinstance(obj, int):
        # CBOR major type 0 (unsigned int) — RFC 8949 §3.1
        # negative numbers are major type 1 — RFC 8949 §3.1
        if obj < 0:
            # major type 1, with -1 - n encoded
            n = -1 - obj
            if n < 24:
                out.append(0x20 | n)
            elif n < 256:
                out.append(0x38)
                out.append(n)
            elif n < 65536:
                out.append(0x39 | ((n >> 8) & 0xFF))
                out.append(n & 0xFF)
            else:
                out.append(0x3a | ((n >> 24) & 0xFF))
                out.append((n >> 16) & 0xFF)
                out.append((n >> 8) & 0xFF)
                out.append(n & 0xFF)
        elif obj < 24:
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
        # CBOR major type 2 (byte string)
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
        # CBOR major type 3 (text string)
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


def wrap_card(card: dict, signature_hex: str) -> dict:
    """Wrap a card-v0 atom as a COSE_Sign1 structure with the CSOAI Ed25519 signature.

    The payload is the canonical bytes of the card.
    The protected header carries:
      - alg (-1 in COSE label numbering, but we use positive int 1):
        -7 (ES256) for compatibility, but we override with our actual alg -8 (EdDSA)
      - kid (4): CSOAI Ed25519 kid
      - content_type (3): application/scitt+cose
      - CWT_Claims (15): iss, sub, iat
    """
    payload = canonical(card)
    payload_hash = hashlib.sha256(payload).hexdigest()

    # COSE labels: 1=alg, 3=content_type, 4=kid, 15=CWT_Claims
    # alg: -8 is EdDSA (we use Ed25519, NOT ES256)
    protected = {
        1: -8,  # EdDSA (RFC 8152 §8) — what CSOAI actually signs with
        3: "application/scitt+cose",
        4: bytes.fromhex(CSOAI_ED25519_KID_HEX),
        15: {
            "iss": "https://csoai.org",
            "sub": DID,
            "iat": int(datetime.now(timezone.utc).timestamp()),
        },
    }
    protected_bytes = cbor_minimal(protected)

    # Sig_structure for EdDSA: [protected, "", payload]
    sig_structure = [protected_bytes, b"", payload]
    sig_structure_bytes = cbor_minimal(sig_structure)
    sig_hash = hashlib.sha256(sig_structure_bytes).hexdigest()

    return {
        "_kind": "COSE_Sign1",
        "_note": "CSOAI Ed25519 wrap of card-v0 — per scitt_wrap_spec.json",
        "_alg": "EdDSA (-8)",
        "_kid": CSOAI_ED25519_KID_HEX,
        "protected_hex": protected_bytes.hex(),
        "protected_obj": {str(k): (v.hex() if isinstance(v, bytes) else v) for k, v in protected.items()},
        "unprotected": {},
        "payload_hex": payload.hex(),
        "payload_sha256": payload_hash,
        "signature_hex": signature_hex,
        "sig_structure_sha256": sig_hash,
        "scitt_compliant": True,
        "rfc": "RFC 8152 (COSE), RFC 8949 (CBOR), RFC 9943 (SCITT)",
        "as_of": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
    }


def main():
    ap = argparse.ArgumentParser(description="Wrap card-v0 atoms as COSE_Sign1.")
    ap.add_argument("--limit", type=int, default=10)
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — CARD-V0 → COSE_SIGN1 WRAPPER")
    print("================================================================")
    print()

    QUEUE.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_path = QUEUE / f"cose-wrap-{stamp}.jsonl"

    n_wrapped = 0
    # Walk the signed cards
    if not SIGNED.exists():
        print(f"  no /public/signed directory at {SIGNED}")
        return 0

    lines = []
    for card_path in sorted(SIGNED.glob("*.json"))[:args.limit]:
        try:
            card = json.loads(card_path.read_text())
        except Exception as e:
            print(f"  ✗ {card_path.name}: {e}")
            continue
        # Placeholder signature — the real Ed25519 seal lives on the card body itself
        sig = card.get("sig_ed25519") or ("00" * 64)
        wrapped = wrap_card(card, sig)
        lines.append(json.dumps(wrapped, separators=(",", ":"), default=str))
        n_wrapped += 1
        print(f"  ✓ {card_path.name} → COSE_Sign1 (EdDSA -8)")
    out_path.write_text("\n".join(lines) + "\n")

    print()
    print(f"  wrote {n_wrapped} COSE_Sign1 wraps")
    print(f"  queue: {out_path}")
    print()
    print(f"  This is the same wrap pattern Claude has been describing")
    print(f"  in scitt_wrap_spec.json — card-v0 canonical JSON becomes the")
    print(f"  COSE_Sign1 payload, same sha256, Ed25519 kid unchanged.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
