#!/usr/bin/env python3
"""Fail closed when public client-test receipts drift from their source."""

import json
import sys
from pathlib import Path


def check(root: Path) -> None:
    register = Path("council-os/client-compatibility.json")
    receipts = Path("council-os/client-compat-receipts")
    sources = [register, *sorted(p.relative_to(root) for p in (root / receipts).rglob("*.json"))]
    if len(sources) < 2:
        raise ValueError("client-test receipt sources missing")
    for relative in sources:
        source = root / relative
        public = root / "public" / relative
        if not source.is_file() or not public.is_file():
            raise ValueError(f"source or public receipt missing: {relative}")
        if source.read_bytes() != public.read_bytes():
            raise ValueError(f"public receipt differs from source: {relative}")
        json.loads(source.read_text())
    data = json.loads((root / register).read_text())
    if data.get("receipt_base_url") != "https://councilof.ai/":
        raise ValueError("client receipt links must use the Council OS public origin")
    linked = 0
    for client in data.get("clients", []):
        raw = client.get("receipt")
        if not raw:
            continue
        relative = Path(raw)
        if relative.is_absolute() or ".." in relative.parts or not relative.is_relative_to(receipts):
            raise ValueError(f"invalid client receipt path: {raw}")
        if not (root / "public" / relative).is_file():
            raise ValueError(f"linked client receipt missing: {raw}")
        linked += 1
    print(f"client receipts: {len(sources)} source/public JSON files byte-equal; {linked} linked rows present")


if __name__ == "__main__":
    try:
        check(Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd())
    except (ValueError, OSError, json.JSONDecodeError) as exc:
        print(f"client receipt gate FAILED: {exc}", file=sys.stderr)
        sys.exit(1)
