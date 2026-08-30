#!/usr/bin/env python3
"""One-shot: insert understand ticks into ToolStack and LivingStages."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def after(path: Path, needle: str, extra: str) -> None:
    text = path.read_text()
    if extra.strip() in text:
        print(f"already in {path.name}")
        return
    if needle not in text:
        raise SystemExit(f"after-needle missing in {path.name}: {needle[:90]!r}")
    path.write_text(text.replace(needle, needle + extra, 1))
    print(f"after {path.name}")


def before(path: Path, marker: str, extra: str) -> None:
    text = path.read_text()
    if extra.strip() in text:
        print(f"already in {path.name}")
        return
    if marker not in text:
        raise SystemExit(f"before-marker missing in {path.name}: {marker[:90]!r}")
    path.write_text(text.replace(marker, extra + marker, 1))
    print(f"before {path.name}")


stack = ROOT / "client/src/components/home/ToolStack.tsx"
after(
    stack,
    'import type { LobbyTabId } from "@/components/lobby/tabs";\n',
    'import HomeUnderstand from "./HomeUnderstand";\n',
)
after(
    stack,
    "  /** A standing condition or limit on the tool. Shown on the tile, never hidden. */\n  note?: string;\n",
    "  /** Short ticks a stranger can scan. Benefits, never invented counts. */\n  ticks: string[];\n",
)

print("script-head-ok")
