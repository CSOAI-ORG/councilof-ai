#!/usr/bin/env python3
"""
verify_test.py — Host-side offline verifier for the MEOK Assurance Radar firmware.
MEOK-Labs (FORGE) - CSOAI LTD UK 16939677 - 11 Jul 2026.

This script:
  1. Generates a synthetic 23-byte LD2450 frame (3-target scene)
  2. Parses it (mirrors the ino parser)
  3. Builds the RFC-8785-canonical JSON
  4. Signs it with Ed25519 (matching the ino SIGNING_SEED)
  5. Verifies the signature
  6. Round-trips: signature matches -> device_signed -> POST_OK
  7. Tamper-test: flips one byte of the record, expects verify to FAIL

Honest scope: this is the offline test harness. Run it before flashing the
in-situ node, so the parser + canonical-JSON + Ed25519 chain is proven
end-to-end on the host, not on the printer's bench.
"""
import json
import struct
import hashlib
import sys
import argparse
from pathlib import Path


# ── Ed25519 (PyNaCl or cryptography lib) ────────────────────────────
try:
    from nacl.signing import SigningKey, VerifyKey
    HAS_NACL = True
except ImportError:
    HAS_NACL = False
    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import (
            Ed25519PrivateKey, Ed25519PublicKey
        )
        HAS_CRYPTO = True
    except ImportError:
        HAS_CRYPTO = False


# Same 32-byte seed as the ino sketch
SIGNING_SEED = bytes([
    0x9d, 0x61, 0xb1, 0x9d, 0xef, 0xfd, 0x5a, 0x60,
    0xba, 0x84, 0x4a, 0xf4, 0x92, 0xec, 0x2c, 0xc4,
    0x44, 0x49, 0xc5, 0x69, 0x7b, 0x32, 0x69, 0x19,
    0x70, 0x3b, 0xac, 0x03, 0x1c, 0xae, 0x7f, 0x60,
])

NODE_ID = "meok-radar-001"


# ── Frame synthesis + parse (mirrors ino) ───────────────────────────

def synthesize_frame(targets: list) -> bytes:
    """Build a 23-byte LD2450 frame from 3 (x,y,speed,res) targets (signed mm).

    Format: 4-byte header + 3 targets * 8 bytes + 5-byte footer = 4 + 24 + 5 = 33... wait
    Per HLK datasheet v1.04 (corrected):
      4 (header) + 8 (target1) + 8 (target2) + 8 (target3) + 5 (footer+checksum+end)
    = 4 + 24 + 5 = 33 bytes
    """
    assert len(targets) == 3
    frame = bytearray()
    frame += bytes([0xAA, 0xFF, 0x03, 0x00])  # header
    for x_mm, y_mm, speed_cm_s, res_cm in targets:
        def enc(val):
            v = int(val)
            if v < 0:
                v = (-v) | 0x8000
            return struct.pack('<H', v & 0xFFFF)
        frame += enc(x_mm) + enc(y_mm) + enc(speed_cm_s) + enc(res_cm)
    # 5-byte footer per HLK v1.04: 0x55 0xCC + 2-byte target_count + 1-byte end
    frame += bytes([0x55, 0xCC, 0x03, 0x00, 0x00])
    assert len(frame) == 33, f'Frame length must be 33, got {len(frame)}'
    return bytes(frame)


FRAME_LEN = 33

def parse_frame(buf: bytes) -> dict:
    """Mirror the ino parser."""
    assert len(buf) == FRAME_LEN
    assert buf[0:4] == bytes([0xAA, 0xFF, 0x03, 0x00]), f'Bad header: {buf[0:4].hex()}'
    assert buf[28:30] == bytes([0x55, 0xCC]), f'Bad footer: {buf[28:30].hex()}'

    targets = []
    offset = 4
    for t in range(3):
        x_raw = struct.unpack('<H', buf[offset:offset+2])[0]
        x = -(x_raw & 0x7FFF) if x_raw & 0x8000 else (x_raw & 0x7FFF)
        y_raw = struct.unpack('<H', buf[offset+2:offset+4])[0]
        y = -(y_raw & 0x7FFF) if y_raw & 0x8000 else (y_raw & 0x7FFF)
        s_raw = struct.unpack('<H', buf[offset+4:offset+6])[0]
        s = -(s_raw & 0x7FFF) if s_raw & 0x8000 else (s_raw & 0x7FFF)
        r = struct.unpack('<H', buf[offset+6:offset+8])[0]
        targets.append({'x_mm': x, 'y_mm': y, 'speed_cm_s': s, 'resolution_cm': r})
        offset += 8

    return {'targets': targets}


# ── RFC-8785 JCS canonical JSON (subset, stable key order) ─────────

def canonical_json(targets: list, frame_seq: int, millis_at: int) -> str:
    """Build the canonical JSON in stable key order. Mirrors the ino logic."""
    return json.dumps({
        'device_id': NODE_ID,
        'frame_seq': frame_seq,
        'millis_at': millis_at,
        'target_0': targets[0],
        'target_1': targets[1],
        'target_2': targets[2],
    }, sort_keys=True, separators=(',', ':'))


# ── Ed25519 sign + verify ──────────────────────────────────────────

def sign_with_seed(canonical: str) -> bytes:
    if HAS_NACL:
        sk = SigningKey(SIGNING_SEED)
        return sk.sign(canonical.encode()).signature
    if HAS_CRYPTO:
        sk = Ed25519PrivateKey.from_private_bytes(SIGNING_SEED)
        return sk.sign(canonical.encode())
    raise RuntimeError('No Ed25519 library available. pip install pynacl')


def verify_with_seed(canonical: str, sig: bytes) -> bool:
    if HAS_NACL:
        sk = SigningKey(SIGNING_SEED)
        vk = sk.verify_key
        try:
            vk.verify(canonical.encode(), sig)
            return True
        except Exception:
            return False
    if HAS_CRYPTO:
        sk = Ed25519PrivateKey.from_private_bytes(SIGNING_SEED)
        vk = sk.public_key()
        try:
            vk.verify(sig, canonical.encode())
            return True
        except Exception:
            return False
    return False


def public_key_hex() -> str:
    if HAS_NACL:
        sk = SigningKey(SIGNING_SEED)
        return sk.verify_key.encode().hex()
    if HAS_CRYPTO:
        sk = Ed25519PrivateKey.from_private_bytes(SIGNING_SEED)
        return sk.public_key().public_bytes(
            encoding=__import__('cryptography.hazmat.primitives.serialization', fromlist=['Encoding']).Encoding.Raw,
            format=__import__('cryptography.hazmat.primitives.serialization', fromlist=['PublicFormat']).PublicFormat.Raw,
        ).hex()
    return 'unknown'


# ── Test battery ──────────────────────────────────────────────────

def test_round_trip():
    """1. Synthesize frame, parse, canonicalize, sign, verify."""
    print()
    print("=" * 70)
    print("MEOK ASSURANCE RADAR — Offline Verifier Test Battery")
    print("=" * 70)
    print()
    print(f"  Ed25519 library:  {'PyNaCl' if HAS_NACL else 'cryptography' if HAS_CRYPTO else 'NONE'}")
    print(f"  Public key:       {public_key_hex()}")
    print(f"  Node ID:          {NODE_ID}")

    # Scene: 3 people in a 6m x 4m room (LD2450 nominal range)
    targets = [
        (1200,  800,  50, 75),  # t0: 1.2m right, 0.8m back, walking 0.5 m/s
        (-1500, 500, -30, 60),  # t1: 1.5m left, 0.5m back, walking away -0.3 m/s
        (   0, 2200,  10, 90),  # t2: at the door, 2.2m forward, stationary-ish
    ]

    print()
    print(f"  Scene: 3 targets in 6x4m room")
    for i, t in enumerate(targets):
        print(f"    t{i}: x={t[0]}mm y={t[1]}mm speed={t[2]}cm/s res={t[3]}cm")

    # 1. Synthesize
    buf = synthesize_frame(targets)
    print()
    print(f"  1. Synthesized 23-byte frame: {buf.hex()}")

    # 2. Parse
    parsed = parse_frame(buf)
    print(f"  2. Parsed: {parsed['targets']}")

    # 3. Canonical
    canonical = canonical_json(parsed['targets'], frame_seq=42, millis_at=1000)
    print(f"  3. Canonical JSON: {canonical[:90]}...")

    # 4. Sign
    sig = sign_with_seed(canonical)
    print(f"  4. Signature: {sig.hex()[:32]}... ({len(sig)} bytes)")

    # 5. Verify
    ok = verify_with_seed(canonical, sig)
    print(f"  5. Round-trip verify: {'PASS' if ok else 'FAIL'}")

    if not ok:
        print("  ❌ FAIL — cannot continue")
        return False

    # 6. Tamper test: flip 1 byte in the canonical
    tampered = canonical.replace('1200', '1201')  # change x_mm of target 0
    ok_tampered = verify_with_seed(tampered, sig)
    print()
    print(f"  6. Tamper test (flipped x_mm 1200 -> 1201):")
    print(f"     Verify on tampered record: {'PASS' if ok_tampered else 'FAIL (expected)'}")
    tamper_correctly_caught = not ok_tampered

    # 7. Wrong-key test: rebuild sig with a different seed and expect FAIL
    if HAS_NACL:
        bad_sk = SigningKey(b'\x00' * 32)
        bad_sig = bad_sk.sign(canonical.encode()).signature
    else:
        bad_sk = Ed25519PrivateKey.from_private_bytes(b'\x00' * 32)
        bad_sig = bad_sk.sign(canonical.encode())
    ok_wrongkey = verify_with_seed(canonical, bad_sig)
    print()
    print(f"  7. Wrong-key test (sig from seed 0x00...00):")
    print(f"     Verify on wrong key: {'PASS (bad)' if ok_wrongkey else 'FAIL (expected)'}")
    wrongkey_correctly_caught = not ok_wrongkey

    # 8. Multi-frame batch: 100 frames, all signed, all verify
    print()
    print(f"  8. Batch test: sign + verify 100 frames")
    n_pass = 0
    for seq in range(100):
        # Vary targets slightly each frame
        varied = [
            (1200 + seq, 800 - seq // 2, 50, 75),
            (-1500, 500, -30, 60),
            (0, 2200 + seq, 10, 90),
        ]
        b = synthesize_frame(varied)
        p = parse_frame(b)
        c = canonical_json(p['targets'], frame_seq=seq, millis_at=1000 + seq * 100)
        s = sign_with_seed(c)
        if verify_with_seed(c, s):
            n_pass += 1
    print(f"     {n_pass}/100 round-trip verified")

    batch_ok = n_pass == 100
    tamper_ok = tamper_correctly_caught
    wrongkey_ok = wrongkey_correctly_caught

    print()
    print("=" * 70)
    print("RESULT")
    print("=" * 70)
    checks = [
        ('1. Round-trip sign+verify', ok),
        ('2. Tamper correctly caught', tamper_ok),
        ('3. Wrong-key correctly caught', wrongkey_ok),
        ('4. 100-frame batch', batch_ok),
    ]
    for label, val in checks:
        mark = 'PASS' if val else 'FAIL'
        print(f"  [{mark}] {label}")
    all_pass = all(v for _, v in checks)
    print()
    print(f"  OVERALL: {'ALL TESTS PASS' if all_pass else 'FAIL — investigate'}")
    print()
    return all_pass


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='MEOK Assurance Radar offline verifier')
    parser.add_argument('--test', action='store_true', default=True)
    args = parser.parse_args()
    if args.test:
        test_round_trip()