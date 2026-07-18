#!/usr/bin/env python3
"""
Add type="button" to <button> tags in TSX files that don't already specify a type.
Skips tags already containing type=.
"""
import re
import sys
from pathlib import Path

ROOTS = [
    Path("/Users/nicholas/meok-ai/ui/src"),
    Path("/Users/nicholas/meok-os/mmo-shell"),
    Path("/Users/nicholas/meok-ai/town-3d/src"),
]

changed = 0
files = 0


def patch(content: str) -> tuple[str, int]:
    n = 0

    def repl(m: re.Match) -> str:
        nonlocal n
        tag = m.group(0)
        if re.search(r"\btype=", tag):
            return tag
        if not re.search(r"\bonClick=", tag):
            # Leave possible submit buttons alone
            return tag
        n += 1
        return re.sub(r"<button\b", '<button type="button"', tag, count=1)

    # Match <button ...> across newlines, non-greedy up to >
    new = re.sub(r"<button\b[^>]*?>", repl, content, flags=re.S)
    return new, n


def main() -> int:
    global changed, files
    for root in ROOTS:
        for path in root.rglob("*.tsx"):
            content = path.read_text(errors="ignore")
            new, n = patch(content)
            if n:
                path.write_text(new)
                changed += n
                files += 1
                print(f"{path}: +{n}")
    print(f"\nUpdated {files} files, added type=button to {changed} buttons")
    return 0


if __name__ == "__main__":
    sys.exit(main())
