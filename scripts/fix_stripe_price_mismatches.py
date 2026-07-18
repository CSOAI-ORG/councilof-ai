#!/usr/bin/env python3
"""Apply clean single-price fixes from STRIPE_LINK_PRICE_MAP to deploy HTML files.

For each clean single-price mismatch, locate the <a> tag whose href ends with the
Stripe link suffix and replace the first price-looking token inside that anchor's
text with the real charge from Stripe.
"""
import re
from pathlib import Path

ROOT = Path("/Users/nicholas/clawd")
MAP = ROOT / "revenue" / "STRIPE_LINK_PRICE_MAP_2026-06-16.md"

# Matches £1,499, £5,000, £199, £29, £1 (optional /mo or /month)
PRICE_RE = re.compile(r"£[0-9,]+(?:\s*/\s*(?:mo|month))?", re.IGNORECASE)


def parse_map(path: Path):
    fixes = []
    in_mismatches = False
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("## Verified mismatches"):
            in_mismatches = True
            continue
        if in_mismatches and line.startswith("##"):
            break
        if not in_mismatches or not line.startswith("|"):
            continue
        parts = [p.strip() for p in line.split("|")]
        parts = [p for p in parts if p]
        if len(parts) < 5 or parts[0] == "File":
            continue
        file_path, link_suffix, real_charge, shown_nearby, note = parts[:5]
        if "clean single-price fix" not in note.lower():
            continue
        fixes.append({
            "file": ROOT / file_path,
            "suffix": link_suffix.lstrip("…"),
            "real": real_charge,
            "shown": shown_nearby,
        })
    return fixes


def apply_fix(fix: dict) -> bool:
    f = fix["file"]
    if not f.exists():
        print(f"SKIP (missing): {f}")
        return False
    text = f.read_text(encoding="utf-8")
    suffix = fix["suffix"]
    if suffix not in text:
        print(f"SKIP (suffix not found): {f} {suffix}")
        return False

    real = fix["real"]
    anchor_re = re.compile(
        r'(<a\s+[^>]*href="[^"]*' + re.escape(suffix) + r'"[^>]*>)(.*?)(</a>)',
        re.IGNORECASE | re.DOTALL,
    )

    def replacer(match):
        open_tag, content, close_tag = match.groups()
        new_content, count = PRICE_RE.subn(real, content, count=1)
        if count == 0:
            return match.group(0)
        return open_tag + new_content + close_tag

    new_text, count = anchor_re.subn(replacer, text)
    if count == 0:
        print(f"SKIP (no anchor match): {f} {suffix}")
        return False
    if new_text == text:
        print(f"SKIP (price already correct or not found): {f} {suffix}")
        return False
    f.write_text(new_text, encoding="utf-8")
    print(f"FIXED: {f} {fix['shown']} -> {real}")
    return True


def main():
    fixes = parse_map(MAP)
    print(f"Found {len(fixes)} clean single-price fixes")
    applied = 0
    for fix in fixes:
        if apply_fix(fix):
            applied += 1
    print(f"\nApplied {applied}/{len(fixes)} fixes")


if __name__ == "__main__":
    main()
