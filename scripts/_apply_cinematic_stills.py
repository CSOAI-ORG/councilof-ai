#!/usr/bin/env python3
"""One-shot: fetch reserved cinematic stills, then this file is deleted."""
from __future__ import annotations

from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
DST = ROOT / "public" / "images" / "cinematic"
DST.mkdir(parents=True, exist_ok=True)

BASE = "https://huggingface.co/datasets/csoai/cinematic-world-stills/resolve/main"
NAMES = ("coliseum-plunge", "harness-plugin", "council-os-lobby")
for name in NAMES:
    url = f"{BASE}/{name}.jpg"
    with urlopen(url, timeout=60) as resp:
        raw = resp.read()
    if raw[:3] != b"\xff\xd8\xff":
        raise SystemExit(f"{name}: not a JPEG ({len(raw)} bytes)")
    out = DST / f"{name}.jpg"
    out.write_bytes(raw)
    print(f"wrote {out.relative_to(ROOT)} {len(raw)} bytes")
