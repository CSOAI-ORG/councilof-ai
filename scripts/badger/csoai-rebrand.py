#!/usr/bin/env python3
"""csoai-rebrand.py — flip every page to the WHITE + GREEN theme.

Replaces the dark background + blue accent with:
  - White background (#ffffff)
  - Dark green accent (#16a34a — Tailwind green-600)
  - Light gray text (#374151)
  - Light card backgrounds (#f9fafb)
  - Light borders (#e5e7eb)

Processes every HTML file in public/ + public/subdomains/.
Idempotent — re-running on already-flipped pages is a no-op.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
PUBLIC = HERE.parent.parent / "public"

# Old dark theme → new white + green theme
COLOR_MAP = [
    # Old accent → new green
    (r"#2563eb", "#16a34a"),  # blue-600 → green-600
    (r"#1d4ed8", "#15803d"),  # hover blue → hover green
    (r"#3b82f6", "#22c55e"),  # blue-500 → green-500
    # Old background → white
    (r"#0a0a0a", "#ffffff"),
    (r"#0b1220", "#ffffff"),
    (r"#03060c", "#ffffff"),
    (r"#04070d", "#ffffff"),
    (r"#03110b", "#ffffff"),
    (r"#05070c", "#ffffff"),
    (r"#07110c", "#ffffff"),
    (r"#0a0f0d", "#ffffff"),
    # Old fg → dark gray
    (r"#fafafa", "#1f2937"),  # text
    (r"#171717", "#f9fafb"),  # card
    (r"#262626", "#e5e7eb"),  # border
    (r"#a3a3a3", "#6b7280"),  # muted text
]


def rebrand(path: Path) -> tuple[bool, int]:
    """Rebrand one HTML file. Returns (changed, n_changes)."""
    text = path.read_text()
    original = text
    n_changes = 0
    for old, new in COLOR_MAP:
        text = re.sub(re.escape(old), new, text, flags=re.IGNORECASE)
        # Count via a non-mutating replace to detect change
        if re.search(re.escape(old), original, flags=re.IGNORECASE):
            n_changes += 1
    if text != original:
        path.write_text(text)
        return True, n_changes
    return False, 0


def main():
    ap = argparse.ArgumentParser(description="Rebrand to white + green.")
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — REBRAND: WHITE + GREEN")
    print("  Blue accent → Green (#16a34a)")
    print("  Dark bg → White (#ffffff)")
    print("  Dark text → Dark gray (#1f2937)")
    print("================================================================")
    print()

    targets = sorted(list(PUBLIC.glob("*.html")))
    targets += sorted(list((PUBLIC / "subdomains").glob("*/index.html")))

    n_changed = 0
    n_skipped = 0
    n_total_changes = 0

    for path in targets:
        changed, n = rebrand(path)
        if changed:
            n_changed += 1
            n_total_changes += n
            print(f"  ✓ {path.relative_to(PUBLIC)} ({n} substitutions)")
        else:
            n_skipped += 1

    print()
    print(f"  rebrand files: {len(targets)}")
    print(f"  changed:       {n_changed}")
    print(f"  skipped:       {n_skipped} (already white+green)")
    print(f"  total swaps:   {n_total_changes}")
    print()
    print("  Re-run brand-gate + facts-gate + preflight to verify.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
