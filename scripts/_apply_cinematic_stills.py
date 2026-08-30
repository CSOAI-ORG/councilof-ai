#!/usr/bin/env python3
"""One-shot: decode reserved cinematic stills, then this file is deleted."""
from __future__ import annotations

import base64
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "scripts" / "_cinematic_b64"
DST = ROOT / "public" / "images" / "cinematic"
DST.mkdir(parents=True, exist_ok=True)

NAMES = ("coliseum-plunge", "harness-plugin", "council-os-lobby")
for name in NAMES:
    parts = sorted(SRC.glob(f"{name}.p*"))
    if not parts:
        raise SystemExit(f"{name}: no split parts")
    blob = "".join(p.read_text().strip() for p in parts)
    raw = base64.b64decode(blob.encode("ascii"), validate=True)
    if raw[:3] != b"\xff\xd8\xff":
        raise SystemExit(f"{name}: not a JPEG")
    out = DST / f"{name}.jpg"
    out.write_bytes(raw)
    print(f"wrote {out.relative_to(ROOT)} {len(raw)} bytes")
