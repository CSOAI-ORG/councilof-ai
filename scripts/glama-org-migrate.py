#!/usr/bin/env python3
"""
glama-org-migrate.py — flip CSOAI-ORG → MEOK-AI-Labs attribution across
the MCP fleet so Glama / mcp.so / Smithery list under the right org.

Run modes:
  --dry-run         : show what would change, no writes (default)
  --apply           : actually rewrite files (skips .git/config — never touch git config automatically)
  --priority-only   : limit scope to the 3 Glama-traffic MCPs (Care Membrane, Healthcare FHIR, Slack Enterprise)

What it touches (text replace only):
  - pyproject.toml       (project.urls.Repository)
  - package.json         (repository.url)
  - glama.json + glama-ready.json (repository field)
  - README.md            (markdown links)
  - server-card.json     (homepage / repository)
  - mcp-wrapper.py       (string literals only)

What it does NOT touch:
  - .git/config          (requires `gh repo create` + remote update; manual step)
  - any binary files
  - any string in our `_ARCHIVED_SEVERED_BRANDS` directory

After running with --apply:
  1. For each priority MCP, manually run `gh repo create MEOK-AI-Labs/<name> --public` (if not yet)
  2. `git -C <pkg> remote set-url origin git@github.com:MEOK-AI-Labs/<name>.git`
  3. `git -C <pkg> push -u origin main`
  4. Update Glama listing — log in to glama.ai, claim listing, set new repo URL
  5. Bump pyproject version + republish to PyPI so the new Repository URL is canonical
"""
from __future__ import annotations

import argparse
import json
import pathlib
import sys

ROOT = pathlib.Path("/Users/nicholas/clawd/mcp-marketplace")
SEVERED = ROOT.parent / "_ARCHIVED_SEVERED_BRANDS"

PRIORITY_MCPS = ["care-membrane-mcp", "healthcare-fhir-mcp", "slack-enterprise-mcp"]

REPLACEMENTS = [
    # Direct repo path swap (preserves package name)
    ("github.com/CSOAI-ORG/", "github.com/MEOK-AI-Labs/"),
    ("github.com:CSOAI-ORG/", "github.com:MEOK-AI-Labs/"),
    ("CSOAI-ORG/", "MEOK-AI-Labs/"),
    # Org name in plain text
    ("CSOAI-ORG", "MEOK-AI-Labs"),
]

TARGET_FILE_NAMES = {
    "pyproject.toml", "package.json", "glama.json", "glama-ready.json",
    "README.md", "server-card.json", "mcp-wrapper.py",
}


def _is_target_file(p: pathlib.Path) -> bool:
    if SEVERED in p.parents:
        return False
    if ".git" in p.parts:
        return False
    return p.name in TARGET_FILE_NAMES or p.name.endswith(".json") or p.name == "README.md"


def find_files(scope: list[pathlib.Path]) -> list[pathlib.Path]:
    found = []
    for s in scope:
        if not s.exists():
            continue
        for p in s.rglob("*"):
            if p.is_file() and _is_target_file(p):
                found.append(p)
    return found


def rewrite(path: pathlib.Path, dry: bool) -> tuple[bool, list[tuple[str, str]]]:
    """Return (changed, list of (old, new) substring pairs that matched)."""
    try:
        text = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, IsADirectoryError):
        return False, []
    original = text
    matched: list[tuple[str, str]] = []
    for old, new in REPLACEMENTS:
        if old in text:
            count = text.count(old)
            text = text.replace(old, new)
            matched.append((old, f"{new} (×{count})"))
    if text != original and not dry:
        path.write_text(text, encoding="utf-8")
    return text != original, matched


def main() -> int:
    p = argparse.ArgumentParser(description="Glama org migration: CSOAI-ORG → MEOK-AI-Labs")
    p.add_argument("--apply", action="store_true", help="Actually write files (default = dry-run)")
    p.add_argument("--priority-only", action="store_true", help="Only the 3 Glama-traffic MCPs")
    args = p.parse_args()

    dry = not args.apply

    if args.priority_only:
        scope = [ROOT / m for m in PRIORITY_MCPS]
    else:
        scope = [ROOT]

    files = find_files(scope)
    print(f"Scanning {len(files)} candidate files in {len(scope)} dir(s)")
    print(f"Mode: {'DRY-RUN (no writes)' if dry else 'APPLY (writing)'}")
    print()

    total_changed = 0
    total_unchanged = 0
    for f in files:
        changed, hits = rewrite(f, dry)
        if changed:
            total_changed += 1
            rel = f.relative_to(ROOT.parent) if str(f).startswith(str(ROOT.parent)) else f
            print(f"  {'[DRY]' if dry else '[OK]'} {rel}")
            for o, n in hits:
                print(f"        {o!r} → {n}")
        else:
            total_unchanged += 1

    print()
    print(f"Summary: {total_changed} files {'would be' if dry else ''} changed, {total_unchanged} untouched.")
    if dry:
        print()
        print("Run with --apply to actually rewrite. Add --priority-only to limit scope to the 3 Glama-traffic MCPs.")
    else:
        print()
        print("NEXT STEPS (manual — these need Nick's GitHub auth):")
        print("  1. Create MEOK-AI-Labs GitHub org if not already (gh org create or via UI)")
        print("  2. For each priority MCP:")
        for m in PRIORITY_MCPS:
            print(f"     gh repo create MEOK-AI-Labs/{m} --public --source=/Users/nicholas/clawd/mcp-marketplace/{m} --push")
        print("  3. Update Glama listings via dashboard at https://glama.ai/")
        print("  4. Bump pyproject version + republish to PyPI so Repository URL propagates")
    return 0


if __name__ == "__main__":
    sys.exit(main())
