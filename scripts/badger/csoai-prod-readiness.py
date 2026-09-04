#!/usr/bin/env python3
"""Generate discovery indexes for files that actually exist.

The former runtime, growth-loop, synthesis and production-readiness manifests
were retired because they were not derived from current public evidence. This
script intentionally cannot recreate them.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(".")
WK = ROOT / "public" / ".well-known"
INTEROP = ROOT / "public" / "interop"

RETIRED_INTEROP_FILES = {
    "chat-binding.json",
    "growth-loops.json",
    "prod-readiness.json",
    "synthesis-layer.json",
}


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def main() -> None:
    print("=== DISCOVERY INDEXES — existing evidence only ===")

    doors = []
    for file_path in sorted(WK.glob("*.json")):
        try:
            document = json.loads(file_path.read_text())
            doors.append(
                {
                    "slug": file_path.stem,
                    "name": document.get("name", file_path.stem),
                    "description": document.get("description", "")[:120],
                    "url": f"https://councilof.ai/.well-known/{file_path.name}",
                }
            )
        except Exception:
            pass

    (WK / "index.json").write_text(
        json.dumps(
            {
                "schema": "csoai.well-known-index/0.1",
                "as_of": now(),
                "total_doors": len(doors),
                "doors": doors,
            },
            indent=2,
        )
    )
    print(f"  well-known doors: {len(doors)}")

    formats = []
    for file_path in sorted(INTEROP.iterdir()):
        if not file_path.is_file() or file_path.name in RETIRED_INTEROP_FILES:
            continue
        try:
            document = (
                json.loads(file_path.read_text())
                if file_path.suffix == ".json"
                else {"name": file_path.stem, "description": ""}
            )
            formats.append(
                {
                    "slug": file_path.stem,
                    "name": document.get("name", file_path.stem),
                    "kind": document.get("kind", "format"),
                    "url": f"https://councilof.ai/interop/{file_path.name}",
                }
            )
        except Exception:
            formats.append(
                {
                    "slug": file_path.stem,
                    "url": f"https://councilof.ai/interop/{file_path.name}",
                }
            )

    (INTEROP / "index.json").write_text(
        json.dumps(
            {
                "schema": "csoai.interop-index/0.1",
                "as_of": now(),
                "total_formats": len(formats),
                "formats": formats,
            },
            indent=2,
        )
    )
    print(f"  interop formats: {len(formats)}")
    print("  retired runtime manifests: not generated")


if __name__ == "__main__":
    main()
