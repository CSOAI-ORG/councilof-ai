#!/usr/bin/env python3
"""
Static a11y scan for TSX files.
Checks:
  - <img> / <Image> missing alt (allows dynamic alt={...})
  - <input>, <textarea>, <select> missing label association or aria-label
  - <button> with no visible text and no aria-label
  - <a target="_blank"> missing rel
  - <button> missing type="button|submit|reset"
"""
import re
import sys
from pathlib import Path

ROOTS = [
    Path("/Users/nicholas/meok-ai/ui/src"),
    Path("/Users/nicholas/meok-os/mmo-shell"),
    Path("/Users/nicholas/meok-ai/town-3d/src"),
]

ISSUES: list[tuple[Path, int, str, str]] = []


def has_attr(tag: str, name: str) -> bool:
    return re.search(rf"\b{name}=[\"']", tag) is not None


def has_attr_any(tag: str, name: str) -> bool:
    # also accept alt={...}
    return re.search(rf"\b{name}(?:=[\"'][^\"']*[\"']|=\{{[^}}]*\}})", tag) is not None


def get_attr(tag: str, name: str) -> str | None:
    m = re.search(rf"\b{name}=[\"']([^\"']*)[\"']", tag)
    return m.group(1) if m else None


def find_element_bounds(text: str, start: int) -> tuple[int, int] | None:
    """Find the matching </tag> for an element starting at `start`. Returns (start, end)."""
    m = re.match(r"<(\w+)", text[start:])
    if not m:
        return None
    tag_name = m.group(1)
    depth = 1
    i = start + 1
    while i < len(text):
        # find next tag
        next_lt = text.find("<", i)
        if next_lt == -1:
            return None
        if text[next_lt + 1] == "/":
            close_m = re.match(rf"</{tag_name}\b", text[next_lt:])
            if close_m:
                depth -= 1
                if depth == 0:
                    close_end = text.find(">", next_lt)
                    return (start, close_end + 1 if close_end != -1 else len(text))
            i = next_lt + 2
        elif re.match(rf"<{tag_name}\b", text[next_lt:]):
            depth += 1
            i = next_lt + len(tag_name) + 1
        else:
            i = next_lt + 1
    return None


def scan_file(path: Path) -> None:
    text = path.read_text(errors="ignore")
    lines = text.splitlines()

    # img / Image without alt
    for m in re.finditer(r"<img\b[^>]*>", text):
        tag = m.group(0)
        if not has_attr_any(tag, "alt"):
            line = text[:m.start()].count("\n") + 1
            ISSUES.append((path, line, "img-missing-alt", tag[:80]))
    for m in re.finditer(r"<Image\b[^>]*>", text):
        tag = m.group(0)
        if not has_attr_any(tag, "alt"):
            line = text[:m.start()].count("\n") + 1
            ISSUES.append((path, line, "Image-missing-alt", tag[:80]))

    # inputs without label or aria-label
    for m in re.finditer(r"<(input|textarea|select)\b", text):
        tag_start = m.start()
        tag_end = text.find(">", tag_start)
        if tag_end == -1:
            continue
        # handle self-closing
        if text[tag_end - 1] == "/":
            tag = text[tag_start:tag_end + 1]
        else:
            tag = text[tag_start:text.find(">", tag_start) + 1]
        if has_attr(tag, "aria-label") or has_attr(tag, "aria-labelledby"):
            continue
        id_val = get_attr(tag, "id")
        if id_val and re.search(rf"htmlFor=\{{?\s*{re.escape(id_val)}\s*\}}?", text):
            continue
        if id_val and re.search(rf"htmlFor=[\"']{re.escape(id_val)}[\"']", text):
            continue
        line = text[:tag_start].count("\n") + 1
        ISSUES.append((path, line, f"{m.group(1)}-missing-label", tag[:80]))

    # buttons
    for m in re.finditer(r"<button\b", text):
        tag_start = m.start()
        bounds = find_element_bounds(text, tag_start)
        if not bounds:
            continue
        _, end = bounds
        full = text[tag_start:end]
        tag_close_idx = full.find(">")
        opening = full[:tag_close_idx + 1]
        content = full[tag_close_idx + 1:-len(re.search(r"</\w+>\s*$", full).group(0))]

        line = text[:tag_start].count("\n") + 1

        # missing type
        if not has_attr(opening, "type"):
            ISSUES.append((path, line, "button-missing-type", opening[:80]))

        # no label
        if not has_attr(opening, "aria-label") and not has_attr(opening, "aria-labelledby"):
            # strip JSX tags and entities; check for real text
            stripped = re.sub(r"<[^>]+>", "", content)
            stripped = re.sub(r"\{[^}]+\}", "", stripped)
            stripped = re.sub(r"&\w+;", "", stripped)
            if not stripped.strip():
                ISSUES.append((path, line, "button-no-label", opening[:80]))

    # links target blank without rel
    for m in re.finditer(r"<a\b[^>]*>", text):
        tag = m.group(0)
        if has_attr(tag, "target") and get_attr(tag, "target") == "_blank":
            if not has_attr(tag, "rel"):
                line = text[:m.start()].count("\n") + 1
                ISSUES.append((path, line, "blank-link-no-rel", tag[:80]))


def main() -> int:
    file_count = 0
    for root in ROOTS:
        for path in root.rglob("*.tsx"):
            file_count += 1
            scan_file(path)

    by_type: dict[str, int] = {}
    for _, _, kind, _ in ISSUES:
        by_type[kind] = by_type.get(kind, 0) + 1

    print(f"Scanned {file_count} TSX files")
    print(f"Found {len(ISSUES)} potential issues")
    print("\nBy category:")
    for kind, count in sorted(by_type.items(), key=lambda x: -x[1]):
        print(f"  {kind}: {count}")

    print("\nFirst 50 issues:")
    for path, line, kind, snippet in ISSUES[:50]:
        print(f"{path.relative_to(Path('/Users/nicholas'))}:{line} [{kind}] {snippet}")

    return 1 if ISSUES else 0


if __name__ == "__main__":
    sys.exit(main())
