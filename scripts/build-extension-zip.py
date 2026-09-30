#!/usr/bin/env python3
"""build-extension-zip.py -- the downloadable copy of the GSPC Verify MV3 extension.

Writes public/downloads/gspc-verify-<version>.zip from extensions/chrome-gspc-verify/, with the
version read from its manifest.json (never typed). Only what Chrome loads is packed: test/,
fixtures/ and scripts/ are left out, as in the README's store-upload step.

The zip is deterministic (sorted names, fixed timestamp, fixed permissions), so the committed
bytes can be rebuilt and compared: tests/test_extension_zip.py fails if they drift.

    python3 scripts/build-extension-zip.py            # write the zip
    python3 scripts/build-extension-zip.py --check    # exit 1 if the committed zip is stale
"""
from __future__ import annotations

import io
import json
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXT = ROOT / "extensions" / "chrome-gspc-verify"
OUT_DIR = ROOT / "public" / "downloads"
EXCLUDE_TOP = {"test", "fixtures", "scripts", "node_modules"}
FIXED_TIME = (2026, 1, 1, 0, 0, 0)


def version() -> str:
    return json.loads((EXT / "manifest.json").read_text())["version"]


def out_path() -> Path:
    return OUT_DIR / f"gspc-verify-{version()}.zip"


def members() -> list[Path]:
    files = []
    for p in sorted(EXT.rglob("*")):
        rel = p.relative_to(EXT)
        if not p.is_file() or rel.parts[0] in EXCLUDE_TOP or p.name.startswith("."):
            continue
        files.append(rel)
    return files


def build_bytes() -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_STORED) as z:
        for rel in members():
            info = zipfile.ZipInfo(rel.as_posix(), date_time=FIXED_TIME)
            info.external_attr = 0o644 << 16
            info.compress_type = zipfile.ZIP_STORED  # stored, not deflated: identical bytes on any zlib
            z.writestr(info, (EXT / rel).read_bytes())
    return buf.getvalue()


def main(argv: list[str]) -> int:
    data = build_bytes()
    out = out_path()
    if "--check" in argv:
        ok = out.exists() and out.read_bytes() == data
        print(("OK " if ok else "STALE ") + str(out.relative_to(ROOT)))
        return 0 if ok else 1
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out.write_bytes(data)
    print(f"wrote {out.relative_to(ROOT)} ({len(data)} bytes, {len(members())} files)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
